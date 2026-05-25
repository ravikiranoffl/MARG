// --- CONFIGURATION ---
// REPLACE THIS URL with your Google Apps Script Web App URL
const GAS_WEBHOOK = "https://script.google.com/macros/s/AKfycbylBz2dufj1NrF8BWeTz3VQvOAdeyiP6nzgTg51CC8s6XOkUZ-cDaBcJHjoFNYLwunJ/exec"; 

// --- CORE STATE ---
let searchIndex = [];
let fuseEngine = null;
let currentAgent = { name: null, mobileHash: null };
let searchTimeout = null;

// --- VEDA THEME ENGINE ---
const themes = {
    "Golden Vault": { base: "#050400", grad1: "#1a1600", grad2: "#030200", accent: "#ffb703", glow: "rgba(255, 183, 3, 0.4)", textHighlight: "#ffb703" },
    "Neon Matrix": { base: "#030507", grad1: "#0a111a", grad2: "#020204", accent: "#00ffcc", glow: "rgba(0, 255, 204, 0.3)", textHighlight: "#00ffcc" },
    "Crimson Protocol": { base: "#050001", grad1: "#1c0005", grad2: "#030000", accent: "#dc143c", glow: "rgba(220, 20, 60, 0.4)", textHighlight: "#ff4d6d" },
    "Azure Nebula": { base: "#010306", grad1: "#051021", grad2: "#000103", accent: "#1e90ff", glow: "rgba(30, 144, 255, 0.4)", textHighlight: "#1e90ff" },
    "Toxic Sludge": { base: "#020501", grad1: "#091703", grad2: "#010300", accent: "#77ff00", glow: "rgba(119, 255, 0, 0.3)", textHighlight: "#77ff00" }
};

let currentTheme = localStorage.getItem('marg_theme') || "Golden Vault";

function applyTheme(themeName) {
    const t = themes[themeName]; if (!t) return;
    document.documentElement.style.setProperty('--bg-base', t.base);
    document.documentElement.style.setProperty('--bg-grad1', t.grad1);
    document.documentElement.style.setProperty('--bg-grad2', t.grad2);
    document.documentElement.style.setProperty('--accent', t.accent);
    document.documentElement.style.setProperty('--accent-glow', t.glow);
    document.documentElement.style.setProperty('--border-highlight', t.glow);
    document.documentElement.style.setProperty('--text-highlight', t.textHighlight);
    
    // Update active button state
    document.querySelectorAll('.theme-box-btn').forEach(btn => {
        if (btn.innerText === themeName.toUpperCase()) {
            btn.classList.add('active-theme');
            btn.style.borderColor = t.accent;
            btn.style.boxShadow = `0 20px 40px rgba(0,0,0,0.8), 0 0 25px ${t.glow}`;
        } else {
            btn.classList.remove('active-theme');
            btn.style.borderColor = 'transparent';
            btn.style.boxShadow = `0 10px 20px rgba(0,0,0,0.4)`;
        }
    });
    localStorage.setItem('marg_theme', themeName);
}

function initThemes() {
    const container = document.getElementById('themeButtonsContainer');
    Object.keys(themes).forEach(name => {
        const btn = document.createElement('div');
        btn.className = 'theme-box-btn';
        btn.innerText = name.toUpperCase();
        btn.style.background = `linear-gradient(135deg, ${themes[name].grad1}, ${themes[name].base})`;
        btn.onclick = () => { applyTheme(name); };
        container.appendChild(btn);
    });
    applyTheme(currentTheme);
}

// --- GHOST TYPER (Placeholder Animation) ---
const ghostQueries = [
    "Latest updates on US-Iran war...",
    "Timeline of Telangana government...",
    "Global tech embargo details 2026...",
    "Economic shifts in Southeast Asia...",
    "Search the TGCA archive..."
];
let ghostIdx = 0;
let charIdx = 0;
let isDeleting = false;
let ghostTimeout;
const searchInput = document.getElementById('searchInput');

function ghostType() {
    if(document.activeElement === searchInput) {
        // Pause typing animation if user clicks the input
        searchInput.setAttribute('placeholder', 'Enter query...');
        ghostTimeout = setTimeout(ghostType, 1000);
        return;
    }

    const currentText = ghostQueries[ghostIdx];
    
    if (isDeleting) {
        searchInput.setAttribute('placeholder', currentText.substring(0, charIdx - 1));
        charIdx--;
    } else {
        searchInput.setAttribute('placeholder', currentText.substring(0, charIdx + 1));
        charIdx++;
    }

    let typeSpeed = isDeleting ? 30 : 100;

    if (!isDeleting && charIdx === currentText.length) {
        typeSpeed = 2000; // Pause at end of word
        isDeleting = true;
    } else if (isDeleting && charIdx === 0) {
        isDeleting = false;
        ghostIdx = (ghostIdx + 1) % ghostQueries.length;
        typeSpeed = 500; // Pause before new word
    }

    ghostTimeout = setTimeout(ghostType, typeSpeed);
}


// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
    updateClock();
    setInterval(updateClock, 1000);
    initThemes();
    ghostType(); // Start auto-typer
    
    // Check Local Storage for Auth
    const savedAgent = localStorage.getItem('marg_agent');
    if (savedAgent) {
        currentAgent = JSON.parse(savedAgent);
        activateSystem();
    } else {
        document.getElementById('authModal').classList.add('active');
        document.getElementById('mainContainer').classList.add('blurred');
    }

    // Initialize Pascal Case formatting on Name Input
    const nameInput = document.getElementById('authName');
    nameInput.addEventListener('input', function(e) {
        let val = e.target.value;
        e.target.value = val.replace(/(\w)(\w*)/g, (g0, g1, g2) => g1.toUpperCase() + g2.toLowerCase());
    });

    // Real-time Search Listener
    searchInput.addEventListener('input', (e) => {
        executeSearch(e.target.value);
    });

    // Log Telemetry only on Enter (to avoid spamming sheets on every keystroke)
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.target.value.trim() !== '') {
            sendTelemetry('search', e.target.value.trim());
        }
    });

    // Load Search Index
    fetch('index.json')
        .then(res => res.json())
        .then(data => {
            searchIndex = data;
            fuseEngine = new Fuse(searchIndex, {
                keys: ['content', 'section', 'date'],
                includeMatches: true,
                threshold: 0.3,
                ignoreLocation: true,
                minMatchCharLength: 3
            });
        }).catch(err => console.error("Index load failed. Ensure index.json exists."));
});

// --- AUTHENTICATION & SECURITY ---
async function hashMobile(mobileStr) {
    const encoder = new TextEncoder();
    const data = encoder.encode(mobileStr.trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return "AGENT_" + hashHex.substring(0, 8).toUpperCase();
}

async function authenticateAgent() {
    const name = document.getElementById('authName').value.trim();
    const mobile = document.getElementById('authMobile').value.trim();

    if (!name || !mobile) {
        alert("System requires both Alias and Comm-Link digits to establish connection.");
        return;
    }

    const secureHash = await hashMobile(mobile);
    currentAgent = { name: name, mobileHash: secureHash };
    localStorage.setItem('marg_agent', JSON.stringify(currentAgent));
    
    sendTelemetry('login', '');

    document.getElementById('authModal').classList.remove('active');
    document.getElementById('mainContainer').classList.remove('blurred');
    activateSystem();
}

function activateSystem() {
    document.getElementById('agentGreeting').innerHTML = `LINK: <span style="color: var(--accent); font-weight:800; text-shadow: 0 0 10px var(--accent-glow);">${currentAgent.name.toUpperCase()}</span>`;
}

function logoutAgent() {
    localStorage.removeItem('marg_agent');
    location.reload(); 
}

// --- SEARCH ENGINE LOGIC (With Extraction Hype) ---
function executeSearch(query) {
    const resultsDiv = document.getElementById('searchResults');
    
    if (!query.trim()) {
        resultsDiv.innerHTML = '';
        clearTimeout(searchTimeout);
        return;
    }

    if (!fuseEngine) {
        resultsDiv.innerHTML = '<p style="color:var(--stat-warn); grid-column:1/-1;">Neural index still loading...</p>';
        return;
    }

    // 1. Show Extraction Hype (Loading Bait)
    resultsDiv.innerHTML = `
        <div class="loading-bait">
            <div class="loading-scanner"></div>
            <div class="loading-text">EXTRACTING INTELLIGENCE...</div>
        </div>
    `;

    clearTimeout(searchTimeout);

    // 2. Delay for 1.5 Seconds (Cinematic Delay), then render results
    searchTimeout = setTimeout(() => {
        const results = fuseEngine.search(query);
        
        if (results.length === 0) {
            resultsDiv.innerHTML = '<p style="color:var(--text-muted); grid-column:1/-1; text-align:center; padding: 40px; border: 1px solid var(--border); border-radius: 20px; background: rgba(0,0,0,0.5);">NO ARCHIVE MATCHES FOUND.</p>';
            return;
        }

        let html = '';
        const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
        const regex = new RegExp(`(${safeQuery})`, 'gi');

        results.slice(0, 15).forEach((result, index) => {
            const item = result.item;
            const highlightedContent = item.content.replace(regex, '<span class="match-highlight">$1</span>');
            const delay = index * 0.05; 

            html += `
                <div class="card" style="animation-delay: ${delay}s">
                    <div class="card-header">
                        <span class="card-tag">${item.section}</span>
                        <span class="timestamp">${item.date}</span>
                    </div>
                    <div class="card-body">
                        ${highlightedContent}
                    </div>
                </div>
            `;
        });
        
        resultsDiv.innerHTML = html;
    }, 1500); 
}

// --- TELEMETRY & VAULT LOGIC ---
function sendTelemetry(actionType, queryStr) {
    if(!currentAgent.name) return; 
    
    const payload = {
        action: actionType,
        mobile: currentAgent.mobileHash,
        name: currentAgent.name,
        query: queryStr
    };

    fetch(GAS_WEBHOOK, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).catch(err => console.log("Vault sync in background."));
}

function renderHistory(mode) {
    document.getElementById('btnMyHistory').classList.remove('active-theme');
    document.getElementById('btnGlobalHistory').classList.remove('active-theme');
    
    if(mode === 'my') {
        document.getElementById('btnMyHistory').classList.add('active-theme');
        document.getElementById('historyTitle').innerText = "MY INTEL LOGS";
    } else {
        document.getElementById('btnGlobalHistory').classList.add('active-theme');
        document.getElementById('historyTitle').innerText = "GLOBAL TELEMETRY";
    }

    const list = document.getElementById('historyList');
    list.innerHTML = '<li style="justify-content: center; color: var(--accent);"><span class="status-dot"></span> Decrypting Vault CSV...</li>';

    fetch('history.csv')
        .then(res => {
            if(!res.ok) throw new Error("Log file pending action runner.");
            return res.text();
        })
        .then(csvText => {
            const rows = csvText.split('\n').filter(row => row.trim() !== '');
            let parsedData = [];
            
            rows.forEach((row, i) => {
                if(i === 0 && row.includes('Datetime_IST')) return; 
                const cols = row.split(',');
                if(cols.length >= 4) {
                    parsedData.push({ time: cols[0], hash: cols[1], name: cols[2], query: cols.slice(3).join(',') });
                }
            });

            if(mode === 'my') {
                parsedData = parsedData.filter(d => d.hash === currentAgent.mobileHash);
            }
            
            if(parsedData.length === 0) {
                list.innerHTML = `<li style="justify-content: center; color: var(--text-muted);">No records found in this sector.</li>`;
                return;
            }

            parsedData.reverse();

            list.innerHTML = parsedData.slice(0, 50).map(d => `
                <li>
                    <div class="hist-meta">
                        <span>[${d.time}]</span>
                        <span class="hist-agent">${d.name}</span>
                    </div>
                    <div class="hist-query">${d.query}</div>
                </li>
            `).join('');
        })
        .catch(err => {
            list.innerHTML = `<li style="justify-content: center; color: var(--stat-warn);">No historical data written to repository yet. Await sync cycle.</li>`;
        });
}

// --- UI UTILITIES ---
function toggleMenu() {
    document.getElementById('sidebarMenu').classList.toggle('active');
    document.getElementById('hamburgerBtn').classList.toggle('active');
    document.getElementById('mainContainer').classList.toggle('blurred');
}

function switchView(viewId) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    
    document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active-menu'));
    event.currentTarget.classList.add('active-menu');

    if (document.getElementById('sidebarMenu').classList.contains('active')) toggleMenu();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateClock() {
    const clockEl = document.getElementById('liveClock');
    if (!clockEl) return;
    const now = new Date();
    const optionsTime = { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };
    clockEl.innerHTML = now.toLocaleTimeString('en-US', optionsTime);
}
