// --- CONFIGURATION ---
const GAS_WEBHOOK = "https://script.google.com/macros/s/AKfycbylBz2dufj1NrF8BWeTz3VQvOAdeyiP6nzgTg51CC8s6XOkUZ-cDaBcJHjoFNYLwunJ/exec"; 

// --- CORE STATE ---
let searchIndex = [];
let fuseEngine = null;
let currentAgent = { name: null, mobileHash: null };
let searchTimeout = null;

// --- VEDA THEME ENGINE (15 THEMES) ---
const themes = {
    "Golden Vault": { base: "#050400", grad1: "#1a1600", grad2: "#030200", accent: "#ffb703", glow: "rgba(255, 183, 3, 0.4)", textHighlight: "#ffb703" },
    "Neon Matrix": { base: "#030507", grad1: "#0a111a", grad2: "#020204", accent: "#00ffcc", glow: "rgba(0, 255, 204, 0.3)", textHighlight: "#00ffcc" },
    "Crimson Protocol": { base: "#050001", grad1: "#1c0005", grad2: "#030000", accent: "#dc143c", glow: "rgba(220, 20, 60, 0.4)", textHighlight: "#ff4d6d" },
    "Azure Nebula": { base: "#010306", grad1: "#051021", grad2: "#000103", accent: "#1e90ff", glow: "rgba(30, 144, 255, 0.4)", textHighlight: "#1e90ff" },
    "Toxic Sludge": { base: "#020501", grad1: "#091703", grad2: "#010300", accent: "#77ff00", glow: "rgba(119, 255, 0, 0.3)", textHighlight: "#77ff00" },
    "Phantom Silver": { base: "#040404", grad1: "#121212", grad2: "#000000", accent: "#e0e0e0", glow: "rgba(224, 224, 224, 0.3)", textHighlight: "#ffffff" },
    "Void Purple": { base: "#030005", grad1: "#100020", grad2: "#010002", accent: "#b026ff", glow: "rgba(176, 38, 255, 0.4)", textHighlight: "#d884ff" },
    "Solar Flare": { base: "#050100", grad1: "#1a0500", grad2: "#030000", accent: "#ff4500", glow: "rgba(255, 69, 0, 0.4)", textHighlight: "#ff6347" },
    "Quantum Ice": { base: "#000405", grad1: "#00121a", grad2: "#000102", accent: "#00e5ff", glow: "rgba(0, 229, 255, 0.4)", textHighlight: "#80f2ff" },
    "Cyber Pink": { base: "#040003", grad1: "#1a0014", grad2: "#020001", accent: "#ff007f", glow: "rgba(255, 0, 127, 0.4)", textHighlight: "#ff66b2" },
    "Stealth Olive": { base: "#020301", grad1: "#0a1205", grad2: "#010200", accent: "#8ebd33", glow: "rgba(142, 189, 51, 0.3)", textHighlight: "#bceb63" },
    "Midnight Gold": { base: "#010205", grad1: "#050a1a", grad2: "#000002", accent: "#ffd700", glow: "rgba(255, 215, 0, 0.3)", textHighlight: "#ffe44d" },
    "Radioactive": { base: "#010403", grad1: "#041a12", grad2: "#000201", accent: "#39ff14", glow: "rgba(57, 255, 20, 0.3)", textHighlight: "#85ff6b" },
    "Blood Moon": { base: "#050000", grad1: "#1a0000", grad2: "#020000", accent: "#8a0303", glow: "rgba(138, 3, 3, 0.5)", textHighlight: "#ff3333" },
    "Abyssal Indigo": { base: "#010105", grad1: "#05051a", grad2: "#000002", accent: "#4b0082", glow: "rgba(75, 0, 130, 0.5)", textHighlight: "#8a2be2" }
};

// Select a completely random theme on every page load
const themeNames = Object.keys(themes);
let currentTheme = themeNames[Math.floor(Math.random() * themeNames.length)];

function applyTheme(themeName) {
    const t = themes[themeName]; if (!t) return;
    document.documentElement.style.setProperty('--bg-base', t.base);
    document.documentElement.style.setProperty('--bg-grad1', t.grad1);
    document.documentElement.style.setProperty('--bg-grad2', t.grad2);
    document.documentElement.style.setProperty('--accent', t.accent);
    document.documentElement.style.setProperty('--accent-glow', t.glow);
    document.documentElement.style.setProperty('--border-highlight', t.glow);
    document.documentElement.style.setProperty('--text-highlight', t.textHighlight);
    
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
}

function initThemes() {
    const container = document.getElementById('themeButtonsContainer');
    themeNames.forEach(name => {
        const btn = document.createElement('div');
        btn.className = 'theme-box-btn';
        btn.innerText = name.toUpperCase();
        btn.style.background = `linear-gradient(135deg, ${themes[name].grad1}, ${themes[name].base})`;
        btn.onclick = () => { applyTheme(name); };
        container.appendChild(btn);
    });
    applyTheme(currentTheme);
}

// --- GHOST TYPER ---
const ghostQueries = ["Latest updates on US-Iran war...", "Timeline of Telangana government...", "Global tech embargo details 2026...", "Search the TGCA archive..."];
let ghostIdx = 0, charIdx = 0, isDeleting = false, ghostTimeout;
const searchInput = document.getElementById('searchInput');

function ghostType() {
    if(document.activeElement === searchInput) {
        searchInput.setAttribute('placeholder', 'Enter query...');
        ghostTimeout = setTimeout(ghostType, 1000);
        return;
    }
    const currentText = ghostQueries[ghostIdx];
    
    if (isDeleting) { searchInput.setAttribute('placeholder', currentText.substring(0, charIdx - 1)); charIdx--; } 
    else { searchInput.setAttribute('placeholder', currentText.substring(0, charIdx + 1)); charIdx++; }

    let typeSpeed = isDeleting ? 30 : 100;
    if (!isDeleting && charIdx === currentText.length) { typeSpeed = 2000; isDeleting = true; } 
    else if (isDeleting && charIdx === 0) { isDeleting = false; ghostIdx = (ghostIdx + 1) % ghostQueries.length; typeSpeed = 500; }
    ghostTimeout = setTimeout(ghostType, typeSpeed);
}

// --- INITIALIZATION & INDEX LOADING ---
document.addEventListener("DOMContentLoaded", () => {
    updateClock(); setInterval(updateClock, 1000); initThemes(); ghostType(); 
    
    const savedAgent = localStorage.getItem('marg_agent');
    if (savedAgent) { currentAgent = JSON.parse(savedAgent); activateSystem(); } 
    else { document.getElementById('authModal').classList.add('active'); document.getElementById('mainContainer').classList.add('blurred'); }

    document.getElementById('authName').addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/(\w)(\w*)/g, (g0, g1, g2) => g1.toUpperCase() + g2.toLowerCase());
    });

    searchInput.addEventListener('input', (e) => executeSearch(e.target.value));
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.target.value.trim() !== '') sendTelemetry('search', e.target.value.trim());
    });

    fetch('index.json')
        .then(res => res.json())
        .then(data => {
            searchIndex = data;
            fuseEngine = new Fuse(searchIndex, {
                keys: ['title', 'date', 'search_blob'], 
                includeMatches: true,
                threshold: 0.4,          
                ignoreLocation: true,    
                ignoreFieldNorm: true,   
                minMatchCharLength: 3
            });
        }).catch(err => console.error("Index load failed."));
});

// --- AUTHENTICATION ---
async function hashMobile(mobileStr) {
    const encoder = new TextEncoder();
    const data = encoder.encode(mobileStr.trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return "AGENT_" + hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 8).toUpperCase();
}

async function authenticateAgent() {
    const name = document.getElementById('authName').value.trim();
    const mobile = document.getElementById('authMobile').value.trim();
    if (!name || !mobile) { alert("System requires both Alias and Comm-Link digits."); return; }
    const secureHash = await hashMobile(mobile);
    currentAgent = { name: name, mobileHash: secureHash };
    localStorage.setItem('marg_agent', JSON.stringify(currentAgent));
    sendTelemetry('login', '');
    document.getElementById('authModal').classList.remove('active');
    document.getElementById('mainContainer').classList.remove('blurred');
    activateSystem();
}

function activateSystem() { document.getElementById('agentGreeting').innerHTML = `LINK: <span style="color: var(--accent); font-weight:800; text-shadow: 0 0 10px var(--accent-glow);">${currentAgent.name.toUpperCase()}</span>`; }
function logoutAgent() { localStorage.removeItem('marg_agent'); location.reload(); }

// --- SEARCH ENGINE (WITH DEEP SCAN LOGIC) ---
function executeSearch(query) {
    const resultsDiv = document.getElementById('searchResults');
    if (!query.trim()) { resultsDiv.innerHTML = ''; clearTimeout(searchTimeout); return; }
    if (!fuseEngine) { resultsDiv.innerHTML = '<p style="color:var(--stat-warn); grid-column:1/-1;">Neural index still loading...</p>'; return; }

    resultsDiv.innerHTML = `
        <div class="loading-bait">
            <div class="loading-scanner"></div>
            <div class="loading-text">EXTRACTING METADATA...</div>
        </div>
    `;

    clearTimeout(searchTimeout);
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
            const delay = index * 0.05; 
            
            let snippet = item.search_blob ? item.search_blob.substring(0, 200) + "..." : "No preview available.";
            snippet = snippet.replace(regex, '<span class="match-highlight">$1</span>');

            html += `
                <div class="card" style="animation-delay: ${delay}s">
                    <div class="card-header">
                        <span class="card-tag">ARCHIVE MATCH</span>
                        <span class="timestamp">${item.date}</span>
                    </div>
                    <div class="card-body">
                        <h3 style="margin-top:0; color:var(--accent);">${item.title}</h3>
                        <p style="opacity:0.8; font-size: 0.9rem;">${snippet}</p>
                        
                       <button class="theme-btn" style="margin-top: 15px; width: 100%; position: relative; overflow: hidden;" onclick="loadAISummary('${item.id}', this)">
                            <span style="position: relative; z-index: 2;">Summarize Intel (Local AI) &rarr;</span>
                            <div id="progress-bar-${item.id}" style="position: absolute; bottom: 0; left: 0; height: 3px; background: #fff; width: 0%; z-index: 1; transition: width 0.2s;"></div>
                       </button>
                        
                        <div id="payload-${item.id}" style="display:none; margin-top:15px; border-top:1px solid var(--border); padding-top:15px;"></div>
                    </div>
                </div>
            `;
        });
        resultsDiv.innerHTML = html;
    }, 1500); 
}

// --- GLOBAL AI CORE ---
let localAIEngine = null;

async function initLocalAI(dateId, btnElement) {
    if (localAIEngine) return localAIEngine;
    
    // Dynamically import WebLLM so we don't break the rest of your site
    const { CreateMLCEngine } = await import('https://esm.run/@mlc.ai/web-llm');
    
    // We use Llama-3.2-1B. It's smart enough for summaries and small enough for browsers (~800MB)
    const selectedModel = "Llama-3.2-1B-Instruct-q4f16_1-MLC";
    
    const progressBar = document.getElementById(`progress-bar-${dateId}`);
    
    localAIEngine = await CreateMLCEngine(selectedModel, {
        initProgressCallback: (info) => {
            // Update the button text with the download progress
            btnElement.querySelector('span').innerText = `Downloading Neural Weights... ${Math.round(info.progress * 100)}%`;
            if(progressBar) progressBar.style.width = `${info.progress * 100}%`;
        }
    });
    
    if(progressBar) progressBar.style.display = 'none';
    return localAIEngine;
}

// --- LOCAL AI SUMMARIZER ---
async function loadAISummary(dateId, btnElement) {
    const payloadDiv = document.getElementById(`payload-${dateId}`);
    
    // Toggle logic if already summarized
    if (payloadDiv.innerHTML !== "" && !payloadDiv.innerHTML.includes("Decrypting")) {
        payloadDiv.style.display = payloadDiv.style.display === "none" ? "block" : "none";
        btnElement.querySelector('span').innerText = payloadDiv.style.display === "none" ? "Summarize Index\u2192" : "\u2191 Close Summary";
        return;
    }

    const spanText = btnElement.querySelector('span');
    spanText.innerText = "Initializing AI Core...";
    
    // Show a loading state
    payloadDiv.innerHTML = `<p style="color: var(--accent); font-family: 'Fira Code', monospace; font-size: 0.9rem; animation: blink 1s infinite;">Establishing local neural link. Please wait...</p>`;
    payloadDiv.style.display = "block";

    try {
        // 1. Fetch the actual daily payload from your GitHub Pages data folder
        const res = await fetch(`data/${dateId}.json`);
        if(!res.ok) throw new Error("Data file missing");
        const data = await res.json();

        // Combine all the text from that day into one block
        let fullText = data.map(sec => `${sec.section}: ${sec.content}`).join("\n\n");

        // 2. Boot up the WebLLM Engine (Downloads on first run, instant on subsequent runs)
        const engine = await initLocalAI(dateId, btnElement);

        spanText.innerText = "Summarizing Data...";
        payloadDiv.innerHTML = `
            <div style="background: rgba(0, 243, 255, 0.05); border: 1px solid var(--accent); border-radius: 12px; padding: 1.5rem; position: relative;">
                <div style="position: absolute; top: -10px; left: 15px; background: var(--bg-base); padding: 0 10px; font-size: 0.75rem; color: var(--accent); font-weight: 800; letter-spacing: 2px;">NEURAL SUMMARY</div>
                <div id="ai-output-${dateId}" style="font-size: 0.95rem; line-height: 1.7; color: var(--text-main);"></div>
            </div>
            
            <button onclick="document.getElementById('raw-${dateId}').style.display='block'; this.style.display='none';" style="background: transparent; border: 1px solid var(--border); color: var(--text-muted); padding: 8px 15px; border-radius: 8px; margin-top: 15px; cursor: pointer; font-size: 0.8rem;">Read Raw Payload</button>
            <div id="raw-${dateId}" style="display: none; margin-top: 15px; border-top: 1px dashed var(--border); padding-top: 15px; font-size: 0.85rem; color: var(--text-muted);">
                ${data.map(sec => `<h4 style="margin-bottom:5px;">${sec.section}</h4><p>${sec.content}</p>`).join('')}
            </div>
        `;

        const outputDiv = document.getElementById(`ai-output-${dateId}`);

        // 3. Ask the AI to summarize
        const messages = [
            { role: "system", content: "You are an elite intelligence analyst. Summarize the following daily briefing in exactly 3 highly professional, concise bullet points. Focus on geopolitical, economic, and technological shifts." },
            { role: "user", content: fullText }
        ];

        // Stream the response back so it types out in real-time
        const chunks = await engine.chat.completions.create({
            messages,
            temperature: 0.5,
            stream: true, // This makes it look like it's typing!
        });

        let summaryText = "";
        for await (const chunk of chunks) {
            summaryText += chunk.choices[0]?.delta?.content || "";
            // Replace newlines with HTML breaks and markdown bullets with actual bullets
            outputDiv.innerHTML = summaryText.replace(/\n/g, "<br>").replace(/\*/g, "•");
        }

        spanText.innerText = "\u2191 Close Summary";
        btnElement.style.background = "transparent";
        btnElement.style.border = "1px solid var(--border-highlight)";

    } catch (err) {
        console.error("AI Generation Failed:", err);
        spanText.innerText = "NEURAL LINK FAILED";
        btnElement.style.background = "var(--stat-dead)";
        payloadDiv.innerHTML = `<p style="color: var(--stat-dead);">Failed to load local AI. Ensure you are on a modern desktop browser (Chrome/Edge) with hardware acceleration enabled.</p>`;
    }
}

// --- TELEMETRY ---
function sendTelemetry(actionType, queryStr) {
    if(!currentAgent.name) return; 
    fetch(GAS_WEBHOOK, {
        method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionType, mobile: currentAgent.mobileHash, name: currentAgent.name, query: queryStr })
    }).catch(err => console.log("Vault sync in background."));
}

function renderHistory(mode) {
    document.getElementById('btnMyHistory').classList.remove('active-theme');
    document.getElementById('btnGlobalHistory').classList.remove('active-theme');
    
    if(mode === 'my') { document.getElementById('btnMyHistory').classList.add('active-theme'); document.getElementById('historyTitle').innerText = "MY INTEL LOGS"; } 
    else { document.getElementById('btnGlobalHistory').classList.add('active-theme'); document.getElementById('historyTitle').innerText = "GLOBAL TELEMETRY"; }

    const list = document.getElementById('historyList');
    list.innerHTML = '<li style="justify-content: center; color: var(--accent);"><span class="status-dot"></span> Decrypting Vault CSV...</li>';

    fetch('history.csv').then(res => res.text()).then(csvText => {
        const rows = csvText.split('\n').filter(row => row.trim() !== '');
        let parsedData = [];
        rows.forEach((row, i) => {
            if(i === 0 && row.includes('Datetime_IST')) return; 
            const cols = row.split(',');
            if(cols.length >= 4) parsedData.push({ time: cols[0], hash: cols[1], name: cols[2], query: cols.slice(3).join(',') });
        });
        if(mode === 'my') parsedData = parsedData.filter(d => d.hash === currentAgent.mobileHash);
        if(parsedData.length === 0) { list.innerHTML = `<li style="justify-content: center; color: var(--text-muted);">No records found.</li>`; return; }
        list.innerHTML = parsedData.reverse().slice(0, 50).map(d => `<li><div class="hist-meta"><span>[${d.time}]</span><span class="hist-agent">${d.name}</span></div><div class="hist-query">${d.query}</div></li>`).join('');
    }).catch(err => list.innerHTML = `<li style="justify-content: center; color: var(--stat-warn);">No historical data written to repository yet.</li>`);
}

// --- UI UTILITIES ---
function toggleMenu() { document.getElementById('sidebarMenu').classList.toggle('active'); document.getElementById('hamburgerBtn').classList.toggle('active'); document.getElementById('mainContainer').classList.toggle('blurred'); }
function switchView(viewId) { document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active')); document.getElementById(viewId).classList.add('active'); document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active-menu')); event.currentTarget.classList.add('active-menu'); if (document.getElementById('sidebarMenu').classList.contains('active')) toggleMenu(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function updateClock() { const clockEl = document.getElementById('liveClock'); if (!clockEl) return; clockEl.innerHTML = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
