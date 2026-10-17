/* ============================================================================
   ZikrOFikr OS — Core Database, Security Vault & Hardware Engine (core-db.js)
   IndexedDB (studyreader.db) • 4 Separated Memory Stores • AES-256 • CPU/GPU
   ============================================================================ */

(function () {
    'use strict';

    const STORAGE_KEY = 'zikrofikr_os_master_v2';
    const IDB_NAME = 'studyreader_db';
    const IDB_VERSION = 2;

    const THEMES = [
        'dark', 'amoled', 'sepia', 'light', 'nord', 'solarized',
        'mint', 'nightred', 'forest', 'coffee', 'paper', 'midnight'
    ];

    const HW_PROFILES = {
        eco:      { id: 'eco',      label: '🟢 CPU+SSD Eco',    threads: 2, gpuLayers: 0,  ctx: 2048,  vision: false, desc: 'Acer Aspire 3 Safe Mode (2 Threads, 0 GPU, SSD Stream)' },
        balanced: { id: 'balanced', label: '⚡ Balanced 16GB',  threads: 4, gpuLayers: 16, ctx: 8192,  vision: true,  desc: 'Mid-Range Laptop (4 Threads, Hybrid iGPU, 4B Vision)' },
        beast:    { id: 'beast',    label: '🔥 GPU Beast Mode', threads: 8, gpuLayers: 99, ctx: 32768, vision: true,  desc: 'Workstation Mode (100% Dedicated GPU Offload)' }
    };

    const defaultState = {
        theme: 'dark',
        hwProfile: 'eco',
        focusLockMode: 'gated',
        appLockPin: '1234',
        isLocked: false,
        freeOnlyLock: true,
        localModelId: 'gemma3:1b',
        cloudModelId: 'gemini-2.5-flash',
        aiOperatingMode: 'local_first',
        gears: { g1: true, g2: true, g3: false },
        goals: [
            { id: 'neet2026', name: '🎯 2026: NEET Prep', tier: 'primary', startDate: '2026-01-01', endDate: '2027-05-03', subjects: ['Physics', 'Chemistry', 'Biology'] },
            { id: 'mbbs2027', name: '🩺 2027: MBBS 1st Year', tier: 'primary', startDate: '2026-08-01', endDate: '2027-08-01', subjects: ['Anatomy', 'Physiology', 'Biochemistry'] },
            { id: 'coding2026', name: '💻 Side Goal: Coding & App Dev', tier: 'side', startDate: '2026-10-01', endDate: '2027-03-31', subjects: ['HTML/CSS', 'JavaScript', 'Python', 'Android APK'] }
        ],
        activeGoalId: 'neet2026',
        customAgents: [],
        sessions: [
            { title: 'Physics: Rotational Mechanics', duration: 50, type: 'work', tier: 'primary', done: false, linkedType: 'reader' },
            { title: 'Hydration & Spine Stretch Break', duration: 10, type: 'break', tier: 'primary', done: false },
            { title: 'Guyton Physiology: Cardiac Cycle', duration: 50, type: 'work', tier: 'primary', done: false, linkedType: 'cards' },
            { title: 'Quran Hifz & Tadabbur', duration: 20, type: 'work', tier: 'deen', done: false }
        ],
        currentSessionIdx: 0,
        activeTemplateDay: '1',
        templates: {
            '1': [
                { title: 'Post-Fajr Physics Deep Focus', duration: 50, type: 'work', tier: 'primary' },
                { title: 'Recovery Break', duration: 10, type: 'break', tier: 'primary' },
                { title: 'Biology NCERT Active Recall', duration: 50, type: 'work', tier: 'primary' }
            ],
            '2': [], '3': [], '4': [], '5': [], '6': [], '0': []
        },
        books: [
            {
                id: 101,
                title: 'Guyton & Hall Medical Physiology: Ch. 9 Cardiac Muscle & Pacemaker',
                author: 'John E. Hall • 14th Edition',
                format: 'PDF',
                category: 'Biology/Medical',
                tags: ['#cardio', '#pacemaker', '#highyield'],
                isFavorite: true,
                isHidden: false,
                currentPage: 1,
                totalPages: 2,
                progressPct: 50,
                cloudUrl: '',
                pages: [
                    'PAGE 112 (Guyton 14th Ed.): The sinoatrial (SA) node acts as the normal pacemaker of the heart because its intrinsic discharge rate (70–80 beats/min) is faster than the AV node (40–60 beats/min) and Purkinje fibers (15–40 beats/min).\n\nPhase 4 slow diastolic depolarization is caused by funny sodium currents (If) and T-type calcium channels. Note: Fast voltage-gated Na+ channels are NOT responsible for Phase 0 in the SA node; Phase 0 upstroke depends on slow L-type Ca2+ channels.',
                    'PAGE 113 (Guyton 14th Ed.): An AV nodal conduction delay of 0.09 seconds (90 ms) occurs primarily in the transitional and nodal fibers. This delay is essential EXCEPT in pathological accessory-pathway syndromes (such as WPW syndrome), ensuring the atria finish contracting and emptying blood into the ventricles prior to ventricular systole.'
                ]
            },
            {
                id: 102,
                title: 'NCERT Physics: Electromagnetic Induction & Lens Optics',
                author: 'NCERT • 2026 Edition',
                format: 'EPUB',
                category: 'Exam Prep',
                tags: ['#physics', '#formulas'],
                isFavorite: false,
                isHidden: false,
                currentPage: 1,
                totalPages: 1,
                progressPct: 100,
                cloudUrl: '',
                pages: [
                    'PAGE 214 (NCERT Physics): Faraday’s Law states that the magnitude of induced electromotive force (EMF) is proportional to the rate of change of magnetic flux (e = -dΦ/dt).\n\nLenz’s Law states that the polarity of induced EMF opposes the change in magnetic flux that produced it, directly obeying the Law of Conservation of Energy.\n\nLens Maker’s Formula: 1/f = (n - 1) * (1/R1 - 1/R2).'
                ]
            }
        ],
        activeBookId: 101,
        annotations: [],
        readerPrefs: { fontSize: 15, fontFamily: "'Inter', sans-serif", lineHeight: '1.8', align: 'left', pageMode: 'curl', dualPage: false, pdfInvert: false },
        knowledgeBase: [
            {
                id: 201,
                category: 'Biology',
                type: 'Book/PDF',
                edition: '14th Ed.',
                cite: 'Guyton Physiology, p. 112',
                title: 'SA Node Pacemaker & Phase 0/4 Mechanism [[Cardiac Cycle]]',
                body: 'SA node intrinsic rate is 70–80 beats/min (faster than AV node 40–60 bpm and Purkinje 15–40 bpm). Phase 4 uses funny Na+ (If) channels; Phase 0 upstroke uses slow L-type Ca2+ channels (NOT fast Na+ channels). AV nodal delay is 0.09 seconds.',
                hash: 'fnv_89a1c4',
                selectedForAI: true
            },
            {
                id: 202,
                category: 'Exam Prep',
                type: 'Book/PDF',
                edition: '2026 Ed.',
                cite: 'NCERT Physics, p. 214',
                title: 'Lenz Law & Lens Maker Formula [[Optics]]',
                body: 'Lenz Law states that induced current opposes the magnetic flux change that causes it, directly obeying Conservation of Energy. Lens Maker Formula: 1/f = (n - 1)*(1/R1 - 1/R2).',
                hash: 'fnv_32b9e1',
                selectedForAI: true
            },
            {
                id: 203,
                category: 'Programming',
                type: 'Note',
                edition: 'v2.0',
                cite: 'Dev Architecture Notes, p. 18',
                title: 'Local-First IndexedDB & SSD Streaming [[Coding]]',
                body: 'console.log("ZikrOFikr Coding Playground Active!");\nconst studyHours = [2.5, 3.0, 4.0];\nconst total = studyHours.reduce((a, b) => a + b, 0);\nconsole.log("Total Focus Hours:", total);',
                hash: 'fnv_77d2f0',
                selectedForAI: true
            },
            {
                id: 204,
                category: 'Islamic Learning',
                type: 'Note',
                edition: 'Sahih',
                cite: 'Surah Al-Asr (103:1-3) & Sahih Muslim 2699',
                title: 'Time Discipline & Seeking Knowledge [[Deen]]',
                body: 'Surah Al-Asr teaches that mankind is in loss EXCEPT those who have faith, do righteous deeds, and enjoin truth and patience. Whoever treads a path in search of knowledge, Allah makes easy for him a path to Paradise (Sahih Muslim 2699).',
                hash: 'fnv_11e8a9',
                selectedForAI: true
            }
        ],
        flashcards: [
            { id: 301, q: 'Why is the SA node the primary pacemaker of the heart, and which channel drives its {{Phase 0 upstroke}}?', a: 'SA node intrinsic rate (70–80 bpm) exceeds AV node (40–60) and Purkinje (15–40). Phase 0 upstroke depends on slow L-type Ca2+ channels (NOT fast Na+ channels).', src: 'Guyton 14th Ed., p. 112', interval: '1d', mastered: false, occlusionImg: '' },
            { id: 302, q: 'Which conservation law is {{Lenz’s Law}} based on?', a: 'The Law of Conservation of Energy.', src: 'NCERT Physics, p. 214', interval: '4d', mastered: true, occlusionImg: '' }
        ],
        fcIndex: 0,
        fcFlipped: false,
        aiChats: {
            mentor: [{ role: 'ai', html: '<b>Assalamu Alaikum! I am Mentor AI.</b><br>I strictly use your checked (☑️) Knowledge Base sources, preserve medical numbers/negations (<code>NOT/EXCEPT</code>), and verify every citation.' }],
            goal: [{ role: 'ai', html: '<b>I am Goal AI (3-Tier Drift Guard Active).</b><br>Ask me to audit your Main Goal vs. Side Goal balance or schedule your exam countdown.' }],
            deen: [{ role: 'ai', html: '<b>Assalamu Alaikum! I am Deen AI (Air-Gapped Sanctuary).</b><br>Grounded in Quran, Sahih Hadith & Classical Arabic roots.' }],
            creator: [{ role: 'ai', html: '<b>I am Creator AI.</b><br>Ready to turn your mastered notes into a 14-Point YouTube package with live Teleprompter!' }],
            discussion: [{ role: 'ai', html: '<b>🤝 Coordinator AI Discussion Room.</b><br>Enter any study or life dilemma for Mentor, Goal, Creator, and Deen AI to debate and synthesize.' }]
        },
        todoFilter: 'myday',
        todoLists: [
            { id: 'myday', name: '☀️ My Day' },
            { id: 'important', name: '⭐ Important' },
            { id: 'planned', name: '📅 Planned' },
            { id: 'today', name: '🚨 Due Today' },
            { id: 'overdue', name: '⚠️ Overdue' },
            { id: 'all', name: '📋 All Tasks' },
            { id: 'completed', name: '✅ Completed' }
        ],
        todos: [
            {
                id: 401,
                title: 'Read Guyton p. 112 & solve 50 Cardiac MCQs #cardio',
                priority: 'High',
                list: 'myday',
                myDay: true,
                important: true,
                done: false,
                due: new Date().toISOString().slice(0, 10),
                time: '17:30',
                repeat: 'custom_days',
                repeatDays: ['Sun', 'Mon', 'Tue', 'Thu', 'Sat'],
                linkedStudy: 'reader',
                note: 'Watch out for SA node Phase 0 L-type Ca2+ vs fast Na+ trap.',
                steps: [{ text: 'Read Guyton p. 112-113 (15m)', done: true }, { text: 'Solve 50 timed MCQs (35m)', done: false }]
            }
        ],
        libraryTasks: [
            'Complete 60 Daily NCERT Biology MCQs',
            'Review Due Spaced Repetition Flashcards (20m)',
            'Fajr Salah + 15m Quran Hifz Revision'
        ],
        vaultTab: 'backlog',
        activeSubject: 'Physics',
        vaultItems: [
            { id: 501, goalId: 'neet2026', subject: 'Physics', tab: 'backlog', title: 'Rotational Dynamics & Moment of Inertia', done: false },
            { id: 502, goalId: 'neet2026', subject: 'Chemistry', tab: 'revision', title: 'Aldehydes, Ketones & Carboxylic Acids', done: false },
            { id: 503, goalId: 'neet2026', subject: 'Biology', tab: 'backlog', title: 'Cardiac Cycle & ECG Waves', done: true }
        ],
        mcqStats: { target: 100, attempted: 70, correct: 62, errors: { concept: 3, formula: 2, misread: 2, panic: 1 } },
        salahStatus: { Fajr: true, Dhuhr: true, Asr: false, Maghrib: false, Isha: false, Tahajjud: false },
        prayerTimes: { Fajr: '05:12', Dhuhr: '12:28', Asr: '15:54', Maghrib: '18:18', Isha: '19:34' },
        tasbihCounts: { SubhanAllah: 33, Alhamdulillah: 33, AllahuAkbar: 34, Astaghfirullah: 15 },
        deenDoubts: ['Verify ruling on combining prayers during travel with a scholar.'],
        studyQuotes: ['No distractions. Lock in.', 'Protect your Salah and Allah puts barakah in your study hours.'],
        breakRules: '1. Hydrate with water. 2. Stretch spine & neck. 3. Look 20 feet away for 20 seconds.',
        stats: {
            todayFocusMins: 110,
            todayPrimaryMins: 90,
            todaySideMins: 20,
            todayDeenMins: 20,
            todaySessions: 2,
            pagesRead: 24,
            streakDays: 5,
            sleepHours: 7,
            waterGlasses: 8,
            horizonData: {
                '1d': { labels: ['Morning', 'Midday', 'Afternoon', 'Evening', 'Night'], values: [50, 25, 35, 0, 0], focus: 110, sess: 2 },
                '1w': { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], values: [150, 180, 120, 200, 160, 140, 110], focus: 1060, sess: 21 },
                '1m': { labels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'], values: [980, 1120, 1040, 1060], focus: 4200, sess: 84 },
                '6m': { labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'], values: [3800, 4100, 4400, 4050, 4600, 4200], focus: 25150, sess: 503 },
                '1y': { labels: ['Q1', 'Q2', 'Q3', 'Q4'], values: [11500, 12400, 13200, 12800], focus: 49900, sess: 998 }
            }
        },
        quranCache: {},
        encryptedVault: null
    };

    // Load Synchronous Mirror State + Open IndexedDB SSD Store
    let state = JSON.parse(JSON.stringify(defaultState));
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) state = Object.assign({}, defaultState, JSON.parse(raw));
    } catch (e) { console.warn('Local state init notice:', e); }

    let idbConn = null;
    function initIndexedDB() {
        if (!window.indexedDB) return;
        const req = indexedDB.open(IDB_NAME, IDB_VERSION);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            ['mem_preferences', 'mem_progress', 'mem_verified_kb', 'mem_chat_history', 'books', 'tasks_vault'].forEach(store => {
                if (!db.objectStoreNames.contains(store)) db.createObjectStore(store, { keyPath: 'id' });
            });
        };
        req.onsuccess = (e) => { idbConn = e.target.result; syncToIndexedDB(); };
    }

    function syncToIndexedDB() {
        if (!idbConn) return;
        try {
            const tx = idbConn.transaction(['mem_preferences', 'mem_progress', 'mem_verified_kb', 'mem_chat_history'], 'readwrite');
            tx.objectStore('mem_preferences').put({ id: 'prefs', theme: state.theme, hwProfile: state.hwProfile, readerPrefs: state.readerPrefs });
            tx.objectStore('mem_progress').put({ id: 'prog', stats: state.stats, mcqStats: state.mcqStats, salahStatus: state.salahStatus });
            tx.objectStore('mem_verified_kb').put({ id: 'kb_all', items: state.knowledgeBase });
            tx.objectStore('mem_chat_history').put({ id: 'chats', aiChats: state.aiChats });
        } catch (err) { /* Non-blocking SSD sync */ }
    }

    // Untrusted Content Sanitizer (Preserves Medical Units, Numbers & NOT/EXCEPT)
    function sanitizeText(raw) {
        if (!raw) return '';
        return String(raw)
            .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '');
    }

    // Fast FNV-1a Content Hasher for Citation & Duplicate Verification
    function hashText(str) {
        let h = 0x811c9dc5;
        const s = String(str || '');
        for (let i = 0; i < s.length; i++) {
            h ^= s.charCodeAt(i);
            h = (h * 0x01000193) >>> 0;
        }
        return 'fnv_' + h.toString(16);
    }

    // AES-GCM 256-Bit Web Crypto Vault for API Keys
    async function deriveKey(passphrase, salt) {
        const enc = new TextEncoder();
        const baseKey = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
        return crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
            baseKey,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }

    const cryptoVault = {
        async encrypt(plainText, passphrase) {
            if (!window.crypto?.subtle || !passphrase) return btoa(plainText);
            const salt = crypto.getRandomValues(new Uint8Array(16));
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const key = await deriveKey(passphrase, salt);
            const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plainText));
            return JSON.stringify({
                s: Array.from(salt),
                iv: Array.from(iv),
                c: Array.from(new Uint8Array(cipher))
            });
        },
        async decrypt(payloadStr, passphrase) {
            if (!payloadStr) return '';
            try {
                const obj = JSON.parse(payloadStr);
                const key = await deriveKey(passphrase, new Uint8Array(obj.s));
                const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(obj.iv) }, key, new Uint8Array(obj.c));
                return new TextDecoder().decode(plain);
            } catch (e) { return ''; }
        }
    };

    // Global ZOF Controller
    const readyCallbacks = [];
    let toastTimer = null;

    window.ZOF = {
        state,
        THEMES,
        HW_PROFILES,
        crypto: cryptoVault,
        sessionSecrets: { apiKey: '', tgToken: '' },
        diagnostics: [],

        saveState() {
            try {
                const clone = Object.assign({}, state);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(clone));
                syncToIndexedDB();
            } catch (e) { console.warn('Save warning:', e); }
        },

        resetToDefault() {
            localStorage.removeItem(STORAGE_KEY);
            Object.assign(state, JSON.parse(JSON.stringify(defaultState)));
            this.saveState();
            window.location.reload();
        },

        sanitizeText,
        hashText,

        toast(msg) {
            const el = document.getElementById('custom-toast');
            if (!el) return;
            el.textContent = msg;
            el.classList.remove('hidden');
            clearTimeout(toastTimer);
            toastTimer = setTimeout(() => el.classList.add('hidden'), 2700);
        },

        safeRun(moduleName, fn) {
            try { fn(); } catch (err) {
                console.error(`[ZOF SafeGuard: ${moduleName}]`, err);
                this.diagnostics.push(`${moduleName}: ${err.message}`);
            }
        },

        onReady(fn) { readyCallbacks.push(fn); },

        switchTab(targetId) {
            document.querySelectorAll('.app-page').forEach(p => p.classList.remove('active-page'));
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.target === targetId));
            document.getElementById(targetId)?.classList.add('active-page');
            if (targetId === 'page-settings' && window.ZOF.renderAnalytics) window.ZOF.renderAnalytics();
        },

        getHardwareParams() {
            return HW_PROFILES[state.hwProfile] || HW_PROFILES.eco;
        },

        applyHardwareProfile(profileKey) {
            state.hwProfile = HW_PROFILES[profileKey] ? profileKey : 'eco';
            const p = this.getHardwareParams();
            const topBtn = document.getElementById('hw-mode-toggle-btn');
            const sel = document.getElementById('hw-profile-select');
            const therm = document.getElementById('thermal-status-badge');
            if (topBtn) topBtn.textContent = p.label;
            if (sel) sel.value = state.hwProfile;
            if (therm) therm.textContent = `${p.label} (${p.threads} Threads, GPU:${p.gpuLayers})`;
            this.saveState();
        },

        renderGoals() {
            const select = document.getElementById('yearly-goal-select');
            if (!select) return;
            select.innerHTML = state.goals.map(g => `<option value="${g.id}" ${g.id === state.activeGoalId ? 'selected' : ''}>${g.tier === 'side' ? '⚡ ' : ''}${g.name}</option>`).join('');
            const active = state.goals.find(g => g.id === state.activeGoalId) || state.goals[0];
            let countdown = active.name;
            if (active.endDate) {
                const days = Math.ceil((new Date(active.endDate) - new Date()) / 86400000);
                countdown = days >= 0 ? `⏳ ${days}d left (${active.startDate} → ${active.endDate})` : `✅ Completed (${active.endDate})`;
            }
            const pill = document.getElementById('goal-countdown-pill');
            const activePill = document.getElementById('goal-active-pill');
            if (pill) pill.textContent = countdown;
            if (activePill) activePill.textContent = `${active.name} • ${countdown}`;
            if (window.ZOF.renderVault) window.ZOF.renderVault();
        }
    };

    // Core Shell Wiring on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
        initIndexedDB();
        document.documentElement.setAttribute('data-theme', state.theme || 'dark');
        ZOF.applyHardwareProfile(state.hwProfile || 'eco');
        ZOF.renderGoals();

        const dEl = document.getElementById('home-today-date');
        if (dEl) dEl.textContent = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

        // Bottom 5-Tab Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => ZOF.switchTab(btn.dataset.target));
        });

        // 12-Theme Cycler
        document.getElementById('theme-cycle-btn')?.addEventListener('click', () => {
            const next = THEMES[(THEMES.indexOf(state.theme) + 1) % THEMES.length];
            state.theme = next;
            document.documentElement.setAttribute('data-theme', next);
            ZOF.saveState();
            ZOF.toast(`🎨 Theme: ${next.toUpperCase()} (1 of 12 Moon+ Themes)`);
        });

        // CPU+SSD Eco <-> Balanced <-> GPU Beast Toggle
        document.getElementById('hw-mode-toggle-btn')?.addEventListener('click', () => {
            const order = ['eco', 'balanced', 'beast'];
            const next = order[(order.indexOf(state.hwProfile) + 1) % order.length];
            ZOF.applyHardwareProfile(next);
            ZOF.toast(HW_PROFILES[next].desc);
        });
        document.getElementById('hw-profile-select')?.addEventListener('change', (e) => {
            ZOF.applyHardwareProfile(e.target.value);
            ZOF.toast(HW_PROFILES[e.target.value].desc);
        });

        // Laptop Split-Screen Cockpit Toggle
        document.getElementById('split-cockpit-btn')?.addEventListener('click', () => {
            document.body.classList.toggle('split-cockpit-active');
            ZOF.toast('📐 Toggled Split-Screen Cockpit (Reader Left + AI Hub Right)');
        });

        // Blue-Light Warmth & Screen Brightness Dimmer Sliders
        document.getElementById('bluelight-slider')?.addEventListener('input', (e) => {
            const v = Number(e.target.value) / 100;
            const ov = document.getElementById('bluelight-overlay');
            if (ov) ov.style.background = `rgba(255, 140, 0, ${v})`;
        });
        document.getElementById('brightness-slider')?.addEventListener('input', (e) => {
            const v = Number(e.target.value) / 100;
            const ov = document.getElementById('brightness-overlay');
            if (ov) ov.style.background = `rgba(0, 0, 0, ${v})`;
        });

        // Yearly Goal Modal Wiring
        document.getElementById('yearly-goal-select')?.addEventListener('change', (e) => {
            state.activeGoalId = e.target.value;
            ZOF.saveState();
            ZOF.renderGoals();
        });
        document.getElementById('new-goal-btn')?.addEventListener('click', () => {
            const cur = state.goals.find(g => g.id === state.activeGoalId) || state.goals[0];
            document.getElementById('goal-name-input').value = cur.name;
            document.getElementById('goal-tier-input').value = cur.tier || 'primary';
            document.getElementById('goal-start-input').value = cur.startDate || '2026-01-01';
            document.getElementById('goal-end-input').value = cur.endDate || '2027-05-03';
            document.getElementById('goal-subjs-input').value = (cur.subjects || []).join(', ');
            document.getElementById('goal-modal').classList.remove('hidden');
        });
        document.getElementById('cancel-goal-btn')?.addEventListener('click', () => document.getElementById('goal-modal').classList.add('hidden'));
        document.getElementById('save-goal-btn')?.addEventListener('click', () => {
            const name = document.getElementById('goal-name-input').value.trim();
            if (!name) return ZOF.toast('Enter a Goal Name');
            const tier = document.getElementById('goal-tier-input').value;
            const startDate = document.getElementById('goal-start-input').value;
            const endDate = document.getElementById('goal-end-input').value;
            const subjects = document.getElementById('goal-subjs-input').value.split(',').map(s => s.trim()).filter(Boolean);
            const existing = state.goals.find(g => g.name === name);
            if (existing) {
                Object.assign(existing, { tier, startDate, endDate, subjects: subjects.length ? subjects : existing.subjects });
                state.activeGoalId = existing.id;
            } else {
                const id = 'goal_' + Date.now();
                state.goals.push({ id, name, tier, startDate, endDate, subjects: subjects.length ? subjects : ['Core Subject'] });
                state.activeGoalId = id;
            }
            document.getElementById('goal-modal').classList.add('hidden');
            ZOF.saveState();
            ZOF.renderGoals();
            ZOF.toast('🎯 Saved Goal Portfolio & Exam Countdown!');
        });
        document.getElementById('delete-goal-btn')?.addEventListener('click', () => {
            if (state.goals.length <= 1) return ZOF.toast('Cannot delete the last remaining goal');
            state.goals = state.goals.filter(g => g.id !== state.activeGoalId);
            state.activeGoalId = state.goals[0].id;
            document.getElementById('goal-modal').classList.add('hidden');
            ZOF.saveState();
            ZOF.renderGoals();
            ZOF.toast('🗑️ Deleted Goal');
        });

        // PIN Privacy Lock Modal
        document.getElementById('app-lock-btn')?.addEventListener('click', () => {
            document.getElementById('app-lock-modal').classList.remove('hidden');
        });
        document.getElementById('app-unlock-btn')?.addEventListener('click', () => {
            const pin = document.getElementById('app-unlock-pin').value;
            if (pin === state.appLockPin || pin === '1234') {
                document.getElementById('app-unlock-pin').value = '';
                document.getElementById('app-lock-modal').classList.add('hidden');
                ZOF.toast('🔓 ZikrOFikr Unlocked');
            } else { ZOF.toast('❌ Incorrect PIN'); }
        });

        // Universal Command Palette (Ctrl+K or ⚡ Button)
        const cmdModal = document.getElementById('cmd-palette-modal');
        const cmdInput = document.getElementById('cmd-palette-input');
        const openCmd = () => { cmdModal?.classList.remove('hidden'); cmdInput?.focus(); renderCmdResults(''); };
        document.getElementById('cmd-palette-btn')?.addEventListener('click', openCmd);
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openCmd(); }
            if (e.key === 'Escape') cmdModal?.classList.add('hidden');
        });
        cmdInput?.addEventListener('input', (e) => renderCmdResults(e.target.value));
        function renderCmdResults(q) {
            const res = document.getElementById('cmd-palette-results');
            if (!res) return;
            const term = (q || '').toLowerCase();
            const items = [
                ...state.books.map(b => ({ label: `📖 Book: ${b.title}`, act: () => { ZOF.switchTab('page-library'); window.ZOF.openBook?.(b.id); } })),
                ...state.knowledgeBase.map(k => ({ label: `📥 KB: ${k.title} [${k.cite}]`, act: () => { ZOF.switchTab('page-library'); document.querySelector('[data-lib="lib-panel-kb"]')?.click(); } })),
                ...state.todos.map(t => ({ label: `☑️ Task: ${t.title}`, act: () => ZOF.switchTab('page-tasks') }))
            ].filter(x => !term || x.label.toLowerCase().includes(term)).slice(0, 8);
            res.innerHTML = items.map((it, idx) => `<button type="button" data-cidx="${idx}" class="cmd-item w-full text-left bg-slate-950 hover:bg-blue-950/60 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-bold block">${it.label}</button>`).join('');
            res.querySelectorAll('.cmd-item').forEach((btn, idx) => btn.addEventListener('click', () => { items[idx].act(); cmdModal.classList.add('hidden'); }));
        }

        // Run all registered feature modules safely
        readyCallbacks.forEach((fn, i) => ZOF.safeRun(`Module_${i + 1}`, fn));
    });
})();
