// --- CONFIGURATION ---
// REPLACE THIS URL with your Google Apps Script Web App URL
const GAS_WEBHOOK = "https://script.google.com/macros/s/AKfycbylBz2dufj1NrF8BWeTz3VQvOAdeyiP6nzgTg51CC8s6XOkUZ-cDaBcJHjoFNYLwunJ/exec"; 

// --- CORE STATE ---
let searchIndex = [];
let fuseEngine = null;
let currentAgent = { name: null, mobileHash: null };

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
    updateClock();
    setInterval(updateClock, 1000);
    
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
    const searchInput = document.getElementById('searchInput');
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

    // Generate secure client-side hash
    const secureHash = await hashMobile(mobile);
    
    currentAgent = { name: name, mobileHash: secureHash };
    localStorage.setItem('marg_agent', JSON.stringify(currentAgent));
    
    // Log login to Vault
    sendTelemetry('login', '');

    // UI Transition
    document.getElementById('authModal').classList.remove('active');
    document.getElementById('mainContainer').classList.remove('blurred');
    activateSystem();
}

function activateSystem() {
    document.getElementById('agentGreeting').innerHTML = `LINK: <span style="color: var(--accent); font-weight:800; text-shadow: 0 0 10px var(--accent-glow);">${currentAgent.name.toUpperCase()}</span>`;
}

function logoutAgent() {
    localStorage.removeItem('marg_agent');
    location.reload(); // Refresh to trigger auth modal
}

// --- SEARCH ENGINE LOGIC ---
function executeSearch(query) {
    const resultsDiv = document.getElementById('searchResults');
    
    if (!query.trim()) {
        resultsDiv.innerHTML = '';
        return;
    }

    if (!fuseEngine) {
        resultsDiv.innerHTML = '<p style="color:var(--stat-warn); grid-column:1/-1;">Neural index still loading...</p>';
        return;
    }

    const results = fuseEngine.search(query);
    
    if (results.length === 0) {
        resultsDiv.innerHTML = '<p style="color:var(--text-muted); grid-column:1/-1; text-align:center; padding: 40px; border: 1px solid var(--border); border-radius: 20px; background: rgba(0,0,0,0.5);">NO ARCHIVE MATCHES FOUND.</p>';
        return;
    }

    // Render logic with dynamic keyword highlighting
    let html = '';
    const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape regex
    const regex = new RegExp(`(${safeQuery})`, 'gi');

    results.slice(0, 15).forEach((result, index) => {
        const item = result.item;
        const highlightedContent = item.content.replace(regex, '<span class="match-highlight">$1</span>');
        const delay = index * 0.05; // Staggered animation

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
}

// --- TELEMETRY & VAULT LOGIC ---
function sendTelemetry(actionType, queryStr) {
    if(!currentAgent.name) return; // Failsafe
    
    const payload = {
        action: actionType,
        mobile: currentAgent.mobileHash, // Sending HASH, not raw mobile
        name: currentAgent.name,
        query: queryStr
    };

    // Fire and forget via no-cors mode to bypass browser blocks
    fetch(GAS_WEBHOOK, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).catch(err => console.log("Vault sync in background."));
}

function renderHistory(mode) {
    // UI Button Toggles
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
            
            // Assume format: Datetime_IST, Agent_Hash, Name, Query
            rows.forEach((row, i) => {
                if(i === 0 && row.includes('Datetime_IST')) return; // Skip header
                const cols = row.split(',');
                if(cols.length >= 4) {
                    parsedData.push({ time: cols[0], hash: cols[1], name: cols[2], query: cols.slice(3).join(',') });
                }
            });

            // Filter logic
            if(mode === 'my') {
                parsedData = parsedData.filter(d => d.hash === currentAgent.mobileHash);
            }
            
            if(parsedData.length === 0) {
                list.innerHTML = `<li style="justify-content: center; color: var(--text-muted);">No records found in this sector.</li>`;
                return;
            }

            // Reverse for chronological newest-first
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
