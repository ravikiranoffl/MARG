:root {
    /* "Golden Vault" Default Theme */
    --bg-base: #050400;
    --bg-grad1: #1a1600;
    --bg-grad2: #030200;
    --accent: #ffb703;
    --accent-glow: rgba(255, 183, 3, 0.4);
    
    --surface: rgba(15, 20, 30, 0.4);
    --surface-hover: rgba(20, 30, 45, 0.65);
    --border: rgba(255, 255, 255, 0.05);
    --border-highlight: rgba(255, 183, 3, 0.3);
    
    --text-main: #f8f9fa;
    --text-muted: #8b9bb4;
    --text-highlight: #ffb703;
    
    --stat-excellent: #00ffaa;
    --stat-warn: #ffcc00;
    --stat-dead: #ff3366;
    
    color-scheme: dark;
}

*, *::before, *::after { box-sizing: border-box; }

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--bg-base); }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: var(--accent); box-shadow: 0 0 15px var(--accent-glow); }

body {
    margin: 0; background-color: var(--bg-base);
    color: var(--text-main); font-family: 'Plus Jakarta Sans', sans-serif;
    min-height: 100vh; overflow-x: hidden; transition: background-color 1s ease;
    -webkit-font-smoothing: antialiased;
}

/* Ambient Engine */
.ambient-engine {
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1;
    background-image: linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
    background-size: 50px 50px; background-attachment: fixed;
}
.orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.5; transition: background 1s ease; pointer-events: none; }
.orb-1 { top: -10%; left: -10%; width: 50vw; height: 50vw; background: var(--bg-grad1); animation: floatOrb 20s ease-in-out infinite alternate; }
.orb-2 { bottom: -20%; right: -10%; width: 60vw; height: 60vw; background: var(--bg-grad2); animation: floatOrb 25s ease-in-out infinite alternate-reverse; }
.orb-3 { top: 40%; left: 40%; width: 30vw; height: 30vw; background: var(--accent-glow); opacity: 0.15; animation: floatOrb 15s linear infinite; }
@keyframes floatOrb { 0% { transform: translate(0, 0) scale(1); } 50% { transform: translate(5%, 10%) scale(1.1); } 100% { transform: translate(-5%, -5%) scale(0.9); } }

/* Layout & Nav */
.container { width: 100%; max-width: 1400px; margin: 0 auto; padding: 120px 3rem 4rem; transition: filter 0.4s ease; position: relative; z-index: 1; }
.container.blurred { filter: blur(10px) brightness(0.5); pointer-events: none; }

.top-nav {
    display: flex; justify-content: space-between; align-items: center;
    padding: 1rem 3rem; position: fixed; top: 0; left: 0; width: 100%;
    background: linear-gradient(180deg, rgba(5,4,0,0.95) 0%, transparent 100%);
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    z-index: 2000; border-bottom: 1px solid rgba(255,255,255,0.03);
    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
}
.brand-logo {
    font-weight: 800; letter-spacing: 6px; font-size: 1.8rem; margin: 0;
    background: linear-gradient(135deg, #ffffff 20%, var(--accent) 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-shadow: 0 0 25px var(--accent-glow);
}
.dispatch-time { font-size: 0.75rem; color: var(--text-muted); font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-top: 5px; }

/* Hamburger */
.hamburger { cursor: pointer; display: flex; flex-direction: column; gap: 5px; z-index: 2003; padding: 10px; }
.hamburger span { display: block; width: 30px; height: 2px; background-color: var(--accent); transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55); box-shadow: 0 0 10px var(--accent-glow); }
.hamburger.active span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.hamburger.active span:nth-child(2) { opacity: 0; transform: translateX(20px); }
.hamburger.active span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

/* Sidebar */
.sidebar {
    position: fixed; top: 0; right: -100%; width: min(100%, 380px); height: 100vh; 
    background: linear-gradient(270deg, rgba(5, 4, 0, 0.98) 0%, rgba(10, 8, 0, 0.9) 100%);
    backdrop-filter: blur(40px); border-left: 1px solid var(--border-highlight); box-shadow: -15px 0 60px rgba(0,0,0,0.9);
    z-index: 2002; display: flex; flex-direction: column; padding: 40px 2.5rem 2rem;
    transition: right 0.6s cubic-bezier(0.19, 1, 0.22, 1);
}
.sidebar.active { right: 0; }
.sidebar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem; }
.live-clock { font-size: 1.4rem; font-weight: 800; color: var(--accent); letter-spacing: 2px; text-shadow: 0 0 15px var(--accent-glow); font-family: 'Fira Code', monospace; }
.close-btn { font-size: 1.8rem; font-weight: 300; color: var(--text-muted); cursor: pointer; transition: all 0.4s ease; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; border: 1px solid transparent; }
.close-btn:hover { color: var(--accent); transform: rotate(90deg); border-color: var(--accent); background: rgba(255,255,255,0.05); }

.menu-item {
    color: var(--text-main); text-decoration: none; font-size: 1.15rem; font-weight: 700; 
    padding: 1.5rem 1rem; border-bottom: 1px solid var(--border);
    transition: all 0.4s ease; position: relative; overflow: hidden; letter-spacing: 2px; text-transform: uppercase; cursor: pointer;
}
.menu-item::before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, var(--accent-glow), transparent); transition: left 0.6s ease; z-index: -1; }
.menu-item:hover, .menu-item.active-menu { color: var(--accent); padding-left: 1.5rem; text-shadow: 0 0 20px var(--accent-glow); border-bottom-color: var(--accent); background: rgba(255,255,255,0.02); }
.menu-item:hover::before { left: 100%; }

/* Search Engine UI */
.view-section { display: none; animation: popIn 0.8s cubic-bezier(0.19, 1, 0.22, 1); width: 100%; }
.view-section.active { display: block; }
header { text-align: center; margin-bottom: 4rem; width: 100%; }
h1 { font-weight: 800; letter-spacing: 6px; font-size: 2.5rem; margin: 0; background: linear-gradient(135deg, #ffffff 20%, var(--accent) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-shadow: 0 0 30px var(--accent-glow); }
.section-sub { color: var(--text-muted); font-size: 1rem; margin-top: 1.5rem; text-transform: uppercase; letter-spacing: 4px; font-weight: 600; }

.search-container { position: relative; width: 100%; max-width: 900px; margin: 0 auto 4rem auto; }
.search-input {
    width: 100%; padding: 1.5rem 2.5rem; background: rgba(10, 8, 0, 0.6); border: 1px solid var(--border-highlight); border-radius: 50px; 
    color: var(--text-main); font-size: 1.15rem; letter-spacing: 1px; font-family: inherit;
    backdrop-filter: blur(25px); box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(255,255,255,0.02); transition: all 0.4s ease;
}
.search-input:focus { outline: none; border-color: var(--accent); background: rgba(15, 12, 0, 0.8); box-shadow: 0 0 40px var(--accent-glow), inset 0 0 15px var(--accent-glow); transform: scale(1.02); }

/* Tiles & Cards */
.data-grid { display: grid; gap: 2rem; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); width: 100%; }
.card {
    background: linear-gradient(145deg, rgba(20,18,5,0.6) 0%, rgba(5,4,0,0.8) 100%);
    border: 1px solid var(--border-highlight); border-radius: 20px; padding: 2rem;
    display: flex; flex-direction: column; backdrop-filter: blur(25px); position: relative; overflow: hidden;
    box-shadow: 0 15px 35px rgba(0,0,0,0.6), inset 0 0 15px rgba(255,255,255,0.02);
    opacity: 0; animation: tileEntrance 0.8s cubic-bezier(0.19, 1, 0.22, 1) forwards; transition: transform 0.4s ease, border-color 0.4s ease;
}
.card:hover { border-color: var(--accent); transform: translateY(-8px); box-shadow: 0 25px 50px rgba(0,0,0,0.9), 0 0 40px var(--accent-glow); z-index: 10; }
.card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border); padding-bottom: 10px; }
.card-tag { font-size: 0.75rem; color: var(--accent); text-transform: uppercase; font-weight: 800; letter-spacing: 2px; }
.timestamp { font-size: 0.85rem; color: var(--text-muted); font-weight: 600; font-family: 'Fira Code', monospace; }
.card-body { color: var(--text-main); font-size: 1rem; line-height: 1.6; word-wrap: break-word; }
.match-highlight { background: rgba(255, 183, 3, 0.2); color: var(--text-highlight); font-weight: 800; padding: 0 4px; border-radius: 4px; text-shadow: 0 0 10px var(--accent-glow); }

/* History & Telemetry */
.controls-wrapper { display: flex; justify-content: center; align-items: center; margin-bottom: 3rem; flex-wrap: wrap; }
.theme-btn {
    font-size: 0.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;
    padding: 14px 28px; border-radius: 12px; cursor: pointer; transition: all 0.4s ease; 
    color: #fff; background: linear-gradient(135deg, var(--bg-grad1), var(--bg-base));
    border: 1px solid transparent; box-shadow: 0 5px 15px rgba(0,0,0,0.4);
}
.theme-btn:hover { transform: translateY(-3px); box-shadow: 0 15px 30px rgba(0,0,0,0.6); }
.theme-btn.active-theme { border: 2px solid var(--accent); box-shadow: 0 15px 30px rgba(0,0,0,0.8), 0 0 25px var(--accent-glow); transform: scale(1.05); }

.lb-list { list-style: none; padding: 0; margin: 0; background: rgba(10,8,0,0.7); border-radius: 20px; border: 1px solid var(--border-highlight); overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.6); backdrop-filter: blur(20px); }
.lb-list li { display: flex; flex-direction: column; gap: 8px; padding: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.03); transition: all 0.3s; }
.lb-list li:hover { background: rgba(0,0,0,0.8); border-left: 4px solid var(--accent); padding-left: 2rem; box-shadow: inset 20px 0 30px -20px var(--accent-glow); }
.hist-meta { display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-muted); font-family: 'Fira Code', monospace; }
.hist-query { font-size: 1.1rem; font-weight: 600; color: var(--text-main); }
.hist-agent { color: var(--accent); font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }

/* Login Modal */
.modal-overlay {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); backdrop-filter: blur(25px);
    display: flex; justify-content: center; align-items: center; z-index: 9999; opacity: 0; pointer-events: none; transition: opacity 0.5s ease;
}
.modal-overlay.active { opacity: 1; pointer-events: auto; }
.modal-content {
    background: linear-gradient(180deg, var(--bg-grad1) 0%, var(--bg-base) 100%); border: 1px solid var(--accent); width: 100%; max-width: 500px; border-radius: 24px;
    padding: 3rem; position: relative; box-shadow: 0 30px 80px rgba(0,0,0,1), inset 0 0 40px var(--accent-glow); 
    transform: scale(0.9) translateY(30px); opacity: 0; transition: all 0.6s cubic-bezier(0.19, 1, 0.22, 1);
}
.modal-overlay.active .modal-content { transform: scale(1) translateY(0); opacity: 1; }
.modal-title { color: var(--text-main); margin-top: 0; font-size: 1.8rem; font-weight: 800; letter-spacing: 4px; text-shadow: 0 0 20px var(--accent-glow); text-align: center; }
.modal-subtitle { text-align: center; color: var(--accent); font-weight: 700; letter-spacing: 2px; font-size: 0.85rem; margin-bottom: 2.5rem; }

.input-group { margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 8px; }
.input-group label { color: var(--text-muted); font-size: 0.85rem; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
.auth-input {
    background: rgba(0,0,0,0.5); border: 1px solid var(--border); color: var(--text-main);
    padding: 15px 20px; border-radius: 12px; font-family: inherit; font-size: 1rem; font-weight: 600;
    outline: none; transition: all 0.3s ease; box-shadow: inset 0 0 10px rgba(0,0,0,0.8);
}
.auth-input:focus { border-color: var(--accent); box-shadow: 0 0 20px var(--accent-glow), inset 0 0 10px var(--accent-glow); transform: translateY(-2px); }

.export-btn {
    font-size: 1rem; font-weight: 800; letter-spacing: 3px; padding: 18px; font-family: inherit;
    background: linear-gradient(90deg, var(--bg-base), var(--bg-grad1)); border: 2px solid var(--accent);
    color: var(--accent); border-radius: 50px; cursor: pointer; text-transform: uppercase;
    box-shadow: 0 10px 30px var(--accent-glow), inset 0 0 20px var(--accent-glow); transition: all 0.4s ease;
}
.export-btn:hover { background: var(--accent); color: var(--bg-base); box-shadow: 0 20px 50px var(--accent-glow); transform: scale(1.02); text-shadow: none; }

/* Utilities */
.status-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 20px var(--accent); margin-right: 8px; animation: blink 2s infinite; }
@keyframes blink { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.3; transform: scale(1.2); } }
@keyframes popIn { from { opacity: 0; transform: translateY(20px); filter: blur(10px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }
@keyframes tileEntrance { from { opacity: 0; transform: translateY(40px) scale(0.9) rotateX(10deg); filter: blur(8px); } to { opacity: 1; transform: translateY(0) scale(1) rotateX(0deg); filter: blur(0); } }

@media (max-width: 768px) {
    .container { padding: 100px 1.5rem 2rem; }
    .top-nav { padding: 1rem 1.5rem; }
    h1 { font-size: 1.8rem; }
    .search-input { font-size: 1rem; padding: 1.2rem; }
}
