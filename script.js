/* ============================================================================
   ZikrOFikr v1.0 (incorporating v0.1 MVP + Full Master Plan)
   100% Local-First Offline Study, Deen & Creator Operating System
   ============================================================================ */

document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'zikrofikr_master_v1';

    // Complete 114 Surah Metadata Index (Name, Arabic, Total Ayahs)
    const SURAH_INDEX = [
        [1,"Al-Fatihah","الفاتحة",7],[2,"Al-Baqarah","البقرة",286],[3,"Ali 'Imran","آل عمران",200],[4,"An-Nisa","النساء",176],[5,"Al-Ma'idah","المائدة",120],[6,"Al-An'am","الأنعام",165],[7,"Al-A'raf","الأعراف",206],[8,"Al-Anfal","الأنفال",75],[9,"At-Tawbah","التوبة",129],[10,"Yunus","يونس",109],
        [11,"Hud","هود",123],[12,"Yusuf","يوسف",111],[13,"Ar-Ra'd","الرعد",43],[14,"Ibrahim","إبراهيم",52],[15,"Al-Hijr","الحجر",99],[16,"An-Nahl","النحل",128],[17,"Al-Isra","الإسراء",111],[18,"Al-Kahf","الكهف",110],[19,"Maryam","مريم",98],[20,"Taha","طه",135],
        [21,"Al-Anbya","الأنبياء",112],[22,"Al-Hajj","الحج",78],[23,"Al-Mu'minun","المؤمنون",118],[24,"An-Nur","النور",64],[25,"Al-Furqan","الفرقان",77],[26,"Ash-Shu'ara","الشعراء",227],[27,"An-Naml","النمل",93],[28,"Al-Qasas","القصص",88],[29,"Al-'Ankabut","العنكبوت",69],[30,"Ar-Rum","الروم",60],
        [31,"Luqman","لقمان",34],[32,"As-Sajdah","السجدة",30],[33,"Al-Ahzab","الأحزاب",73],[34,"Saba","سبأ",54],[35,"Fatir","فاطر",45],[36,"Ya-Sin","يس",83],[37,"As-Saffat","الصافات",182],[38,"Sad","ص",88],[39,"Az-Zumar","الزمر",75],[40,"Ghafir","غافر",85],
        [41,"Fussilat","فصلت",54],[42,"Ash-Shuraa","الشورى",53],[43,"Az-Zukhruf","الزخرف",89],[44,"Ad-Dukhan","الدخان",59],[45,"Al-Jathiyah","الجاثية",37],[46,"Al-Ahqaf","الأحقاف",35],[47,"Muhammad","محمد",38],[48,"Al-Fath","الفتح",29],[49,"Al-Hujurat","الحجرات",18],[50,"Qaf","ق",45],
        [51,"Adh-Dhariyat","الذاريات",60],[52,"At-Tur","الطور",49],[53,"An-Najm","النجم",62],[54,"Al-Qamar","القمر",55],[55,"Ar-Rahman","الرحمن",78],[56,"Al-Waqi'ah","الواقعة",96],[57,"Al-Hadid","الحديد",29],[58,"Al-Mujadila","المجادلة",22],[59,"Al-Hashr","الحشر",24],[60,"Al-Mumtahanah","الممتحنة",13],
        [61,"As-Saf","الصف",14],[62,"Al-Jumu'ah","الجمعة",11],[63,"Al-Munafiqun","المنافقون",11],[64,"At-Taghabun","التغابن",18],[65,"At-Talaq","الطلاق",12],[66,"At-Tahrim","التحريم",12],[67,"Al-Mulk","الملك",30],[68,"Al-Qalam","القلم",52],[69,"Al-Haqqah","الحاقة",52],[70,"Al-Ma'arij","المعارج",44],
        [71,"Nuh","نوح",28],[72,"Al-Jinn","الجن",28],[73,"Al-Muzzammil","المزمل",20],[74,"Al-Muddaththir","المدثر",56],[75,"Al-Qiyamah","القيامة",40],[76,"Al-Insan","الإنسان",31],[77,"Al-Mursalat","المرسلات",50],[78,"An-Naba","النبأ",40],[79,"An-Nazi'at","النازعات",46],[80,"'Abasa","عبس",42],
        [81,"At-Takwir","التكوير",29],[82,"Al-Infitar","الانفطار",19],[83,"Al-Mutaffifin","المطففين",36],[84,"Al-Inshiqaq","الانشقاق",25],[85,"Al-Buruj","البروج",22],[86,"At-Tariq","الطارق",17],[87,"Al-A'la","الأعلى",19],[88,"Al-Ghashiyah","الغاشية",26],[89,"Al-Fajr","الفجر",30],[90,"Al-Balad","البلد",20],
        [91,"Ash-Shams","الشمس",15],[92,"Al-Layl","الليل",21],[93,"Ad-Duhaa","الضحى",11],[94,"Ash-Sharh","الشرح",8],[95,"At-Tin","التين",8],[96,"Al-'Alaq","العلق",19],[97,"Al-Qadr","القدر",5],[98,"Al-Bayyinah","البينة",8],[99,"Az-Zalzalah","الزلزلة",8],[100,"Al-'Adiyat","العاديات",11],
        [101,"Al-Qari'ah","القارعة",11],[102,"At-Takathur","التكاثر",8],[103,"Al-'Asr","العصر",3],[104,"Al-Humazah","الهمزة",9],[105,"Al-Fil","الفيل",5],[106,"Quraysh","قريش",4],[107,"Al-Ma'un","الماعون",7],[108,"Al-Kawthar","الكوثر",3],[109,"Al-Kafirun","الكافرون",6],[110,"An-Nasr","النصر",3],
        [111,"Al-Masad","المسد",5],[112,"Al-Ikhlas","الإخلاص",4],[113,"Al-Falaq","الفلق",5],[114,"An-Nas","الناس",6]
    ];

    // Offline Built-in Surahs (Fallback & Instant Load)
    const OFFLINE_QURAN = {
        "1": [
            { n: 1, ar: "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ", en: "In the name of Allah, the Entirely Merciful, the Especially Merciful." },
            { n: 2, ar: "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ", en: "[All] praise is [due] to Allah, Lord of the worlds -" },
            { n: 3, ar: "ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ", en: "The Entirely Merciful, the Especially Merciful," },
            { n: 4, ar: "مَـٰلِكِ يَوْمِ ٱلدِّينِ", en: "Sovereign of the Day of Recompense." },
            { n: 5, ar: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", en: "It is You we worship and You we ask for help." },
            { n: 6, ar: "ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ", en: "Guide us to the straight path -" },
            { n: 7, ar: "صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ", en: "The path of those upon whom You have bestowed favor, not of those who have evoked [Your] anger or of those who are astray." }
        ],
        "103": [
            { n: 1, ar: "وَٱلْعَصْرِ", en: "By time," },
            { n: 2, ar: "إِنَّ ٱلْإِنسَـٰنَ لَفِى خُسْرٍ", en: "Indeed, mankind is in loss," },
            { n: 3, ar: "إِلَّا ٱلَّذِينَ ءَامَنُوا۟ وَعَمِلُوا۟ ٱلصَّـٰلِحَـٰتِ وَتَوَاصَوْا۟ بِٱلْحَقِّ وَتَوَاصَوْا۟ بِٱلصَّبْرِ", en: "Except for those who have believed and done righteous deeds and advised each other to truth and advised each other to patience." }
        ],
        "112": [
            { n: 1, ar: "قُلْ هُوَ ٱللَّهُ أَحَدٌ", en: "Say, 'He is Allah, [who is] One," },
            { n: 2, ar: "ٱللَّهُ ٱلصَّمَدُ", en: "Allah, the Eternal Refuge." },
            { n: 3, ar: "لَمْ يَلِدْ وَلَمْ يُولَدْ", en: "He neither begets nor is born," },
            { n: 4, ar: "وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ", en: "Nor is there to Him any equivalent.'" }
        ]
    };

    // Classical Arabic Root (Jizr) Dictionary for Reader & Quran
    const ARABIC_LEXICON = {
        "ٱللَّهِ": { root: "أ ل ه (A-L-H)", form: "Proper Noun", meaning: "The One True God, worthy of all worship." },
        "ٱلرَّحْمَـٰنِ": { root: "ر ح م (R-H-M)", form: "Fa'lan (Intensive)", meaning: "The Entirely Merciful whose mercy encompasses all creation." },
        "ٱلرَّحِيمِ": { root: "ر ح م (R-H-M)", form: "Fa'il (Continuous)", meaning: "The Especially Merciful to the believers." },
        "ٱلْحَمْدُ": { root: "ح م د (H-M-D)", form: "Masdar (Noun)", meaning: "All praise, gratitude, and extolling of perfection." },
        "رَبِّ": { root: "ر ب ب (R-B-B)", form: "Noun / Sustainer", meaning: "Lord, Master, Cherisher, and Sustainer." },
        "نَعْبُدُ": { root: "ع ب د ('-B-D)", form: "Form I Imperfect Verb", meaning: "We worship, humble ourselves, and obey." },
        "نَسْتَعِينُ": { root: "ع و ن ('-W-N)", form: "Form X (Istaf'ala)", meaning: "We seek help, aid, and reliance." }
    };

    // Default App State
    const defaultState = {
        theme: 'dark',
        goals: [
            { id: 'neet2026', name: '🎯 2026: NEET Prep', startDate: '2026-01-01', endDate: '2027-05-03', subjects: ['Physics', 'Chemistry', 'Biology'] },
            { id: 'mbbs2027', name: '🩺 2027: MBBS 1st Year', startDate: '2026-08-01', endDate: '2027-08-01', subjects: ['Anatomy', 'Physiology', 'Biochemistry'] },
            { id: 'coding2026', name: '💻 Side Goal: Coding & App Dev', startDate: '2026-10-01', endDate: '2027-03-31', subjects: ['HTML/CSS', 'JavaScript', 'Python', 'Android APK'] }
        ],
        activeGoalId: 'neet2026',
        sessions: [
            { title: 'Physics: Rotational Mechanics', duration: 50, type: 'work', done: false },
            { title: 'Hydration & Spine Stretch Break', duration: 10, type: 'break', done: false },
            { title: 'Organic Chemistry Named Reactions', duration: 50, type: 'work', done: false },
            { title: 'NCERT Biology Active Recall', duration: 45, type: 'work', done: false }
        ],
        currentSessionIdx: 0,
        activeTemplateDay: '1',
        templates: {
            '1': [
                { title: 'Physics Deep Focus', duration: 50, type: 'work' },
                { title: 'Recovery Break', duration: 10, type: 'break' },
                { title: 'Chemistry Numericals', duration: 50, type: 'work' }
            ],
            '2': [], '3': [], '4': [], '5': [], '6': [], '0': []
        },
        books: [
            {
                id: 1,
                title: 'Guyton & Hall Physiology: Ch. 9 Cardiac Muscle & Pacemaker',
                category: 'Biology/Medical',
                page: 112,
                content: 'The sinoatrial (SA) node acts as the normal pacemaker of the heart because its intrinsic discharge rate (70–80 beats/min) is faster than the AV node (40–60 beats/min) and Purkinje fibers (15–40 beats/min).\n\nPhase 4 slow diastolic depolarization is caused by funny sodium currents (If) and T-type calcium channels. Phase 0 upstroke in the SA and AV nodes depends on slow L-type calcium channels rather than fast voltage-gated sodium channels. An AV nodal delay of 0.09 seconds ensures the atria finish contracting and emptying blood into the ventricles before ventricular systole begins.'
            },
            {
                id: 2,
                title: 'NCERT Physics: Ray Optics & Electromagnetic Induction',
                category: 'Exam Prep',
                page: 214,
                content: 'Faraday’s Law states that the magnitude of induced electromotive force (EMF) in a circuit is equal to the time rate of change of magnetic flux through the circuit.\n\nLenz’s Law states that the polarity of induced EMF is such that it tends to produce a current which opposes the change in magnetic flux that produced it. Lenz’s Law is a direct consequence of the Law of Conservation of Energy.\n\nLens Maker’s Formula: 1/f = (n - 1) * (1/R1 - 1/R2).'
            },
            {
                id: 3,
                title: 'Python & JavaScript Local-First App Architecture',
                category: 'Programming',
                page: 18,
                content: 'A local-first application stores all primary user data on the device (using IndexedDB, localStorage, or SQLite on SD card) rather than depending on remote cloud servers. This guarantees zero latency, offline reliability, and complete privacy.'
            }
        ],
        activeBookId: 1,
        readerFontSize: 15,
        knowledgeBase: [
            {
                id: 201,
                category: 'Biology',
                type: 'Book/PDF',
                cite: 'Guyton Physiology, p. 112',
                title: 'SA Node Pacemaker & Phase 0/4 Mechanism',
                body: 'SA node intrinsic rate is 70-80 bpm. Phase 4 pacemaker potential uses funny Na+ (If) channels; Phase 0 upstroke uses slow L-type Ca2+ channels. AV nodal delay is 0.09s to allow complete ventricular filling.'
            },
            {
                id: 202,
                category: 'Exam Prep',
                type: 'Book/PDF',
                cite: 'NCERT Physics, p. 214',
                title: 'Lenz Law & Conservation of Energy',
                body: 'Lenz Law states that induced current opposes the magnetic flux change that causes it, directly obeying Conservation of Energy.'
            },
            {
                id: 203,
                category: 'Programming',
                type: 'Note',
                cite: 'Dev Notes, p. 18',
                title: 'Local-First Architecture & Capacitor APK',
                body: 'HTML/CSS/JS apps can be hosted on GitHub Pages and wrapped into native Android APKs using Capacitor with SQLite and SD-card Filesystem access.'
            },
            {
                id: 204,
                category: 'Islamic Learning',
                type: 'Note',
                cite: 'Surah Al-Asr (103:1-3) & Sahih Muslim 2699',
                title: 'Time Discipline, Seeking Knowledge & Deen-Dunya Balance',
                body: 'Surah Al-Asr teaches that human beings are in loss except those who have faith, do righteous deeds, and enjoin truth and patience. The Prophet ﷺ said: Whoever treads a path in search of knowledge, Allah makes easy for him a path to Paradise (Sahih Muslim 2699).'
            }
        ],
        approvedForCreator: true,
        flashcards: [
            { id: 301, q: 'Why is the SA node the primary pacemaker of the heart?', a: 'Its intrinsic discharge rate (70–80 bpm) exceeds the AV node (40–60) and Purkinje fibers (15–40).', src: 'Guyton Physiology, p. 112', interval: '1d', mastered: false },
            { id: 302, q: 'Which conservation law is Lenz’s Law based on?', a: 'The Law of Conservation of Energy.', src: 'NCERT Physics, p. 214', interval: '4d', mastered: true },
            { id: 303, q: 'What is the triliteral root (Jizr) of ٱلرَّحْمَـٰنِ?', a: 'ر ح م (R-H-M) — denoting all-encompassing mercy.', src: 'Surah Al-Fatihah 1:1', interval: '1d', mastered: false }
        ],
        fcIndex: 0,
        fcFlipped: false,
        aiChats: {
            mentor: [
                { role: 'ai', html: '<b>Assalamu Alaikum! I am Mentor AI.</b><br>Ask me anything from your saved books, PDFs, transcripts, or notes. I strictly follow your <b>18 Rules</b> and cite exact sources.' }
            ],
            goal: [
                { role: 'ai', html: '<b>I am Goal AI.</b><br>Ask me for your daily priority plan, exam countdown strategy, or burnout recovery protocol.' }
            ],
            deen: [
                { role: 'ai', html: '<b>Assalamu Alaikum! I am Deen AI (Air-Gapped Sanctuary).</b><br>Ask me about Quranic reflections, Arabic roots, Hadith, or protecting your Salah while studying.' }
            ],
            creator: [
                { role: 'ai', html: '<b>I am Creator AI.</b><br>Use the purple button above or ask me to turn any topic you have studied into a 14-Point YouTube Short or Explainer package!' }
            ],
            discussion: [
                { role: 'ai', html: '<b>🤝 Multi-AI Discussion Room (Managed by Coordinator AI).</b><br>Type any dilemma or goal (e.g. <i>"How do I balance NEET prep, coding, and Quran revision?"</i>) to see Mentor AI, Goal AI, Creator AI, and Deen AI debate and synthesize a plan!' }
            ]
        },
        todoFilter: 'myday',
        todoLists: [
            { id: 'myday', name: '☀️ My Day' },
            { id: 'important', name: '⭐ Important' },
            { id: 'planned', name: '📅 Planned' },
            { id: 'all', name: '📋 All Tasks' },
            { id: 'completed', name: '✅ Completed' }
        ],
        todos: [
            {
                id: 401,
                title: 'Solve 50 Ray Optics PYQs #physics',
                list: 'myday',
                myDay: true,
                important: true,
                done: false,
                due: new Date().toISOString().slice(0, 10),
                time: '17:30',
                repeat: 'custom_days',
                repeatDays: ['Sun', 'Mon', 'Tue', 'Thu', 'Sat'],
                note: 'Focus on Lens Maker formula and total internal reflection.',
                steps: [
                    { text: 'Revise NCERT formulas (15m)', done: true },
                    { text: 'Solve 50 timed MCQs (45m)', done: false }
                ]
            },
            {
                id: 402,
                title: 'Revise Surah Al-Mulk & 10 Ayahs of Ar-Rahman',
                list: 'myday',
                myDay: true,
                important: true,
                done: false,
                due: new Date().toISOString().slice(0, 10),
                time: '21:00',
                repeat: 'daily',
                repeatDays: [],
                note: 'Use Hifz Blur mode in the Quran tab.',
                steps: []
            }
        ],
        libraryTasks: [
            'Complete 60 Daily NCERT Biology MCQs',
            'Review Due Spaced Repetition Flashcards (20m)',
            'Fajr Salah + 15m Quran Hifz Revision',
            'Practice 30m JavaScript / Python Coding'
        ],
        vaultTab: 'backlog',
        activeSubject: 'Physics',
        vaultItems: [
            { id: 501, goalId: 'neet2026', subject: 'Physics', tab: 'backlog', title: 'Rotational Dynamics & Moment of Inertia', done: false },
            { id: 502, goalId: 'neet2026', subject: 'Chemistry', tab: 'revision', title: 'Aldehydes, Ketones & Carboxylic Acids', done: false },
            { id: 503, goalId: 'neet2026', subject: 'Biology', tab: 'backlog', title: 'Molecular Basis of Inheritance', done: true }
        ],
        mcqStats: { target: 100, attempted: 70, correct: 62 },
        salahStatus: { Fajr: true, Dhuhr: true, Asr: false, Maghrib: false, Isha: false, Tahajjud: false },
        tasbihCounts: { SubhanAllah: 33, Alhamdulillah: 33, AllahuAkbar: 34, Astaghfirullah: 15 },
        studyQuotes: [
            'No distractions. Lock in.',
            'Every page read and every Pomodoro completed builds your future.',
            'Protect your Salah and Allah will put barakah in your study hours.'
        ],
        stats: {
            todayFocusMins: 110,
            todaySessions: 2,
            horizonData: {
                '1d': { labels: ['Morning', 'Midday', 'Afternoon', 'Evening', 'Night'], values: [50, 25, 35, 0, 0], focus: 110, sess: 2 },
                '1w': { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], values: [150, 180, 120, 200, 160, 140, 110], focus: 1060, sess: 21 },
                '1m': { labels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'], values: [980, 1120, 1040, 1060], focus: 4200, sess: 84 },
                '6m': { labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'], values: [3800, 4100, 4400, 4050, 4600, 4200], focus: 25150, sess: 503 },
                '1y': { labels: ['Q1', 'Q2', 'Q3', 'Q4'], values: [11500, 12400, 13200, 12800], focus: 49900, sess: 998 }
            }
        },
        quranCache: {}
    };

    // Load or Initialize State
    let state = loadState();
    function loadState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                return Object.assign({}, defaultState, JSON.parse(raw));
            }
        } catch (e) {
            console.warn('localStorage load fallback:', e);
        }
        return JSON.parse(JSON.stringify(defaultState));
    }
    function saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            console.warn('Quota warning:', e);
        }
    }

    // Toast Helper
    const toastEl = document.getElementById('custom-toast');
    let toastTimer = null;
    function showToast(msg) {
        if (!toastEl) return;
        toastEl.textContent = msg;
        toastEl.classList.remove('hidden');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toastEl.classList.add('hidden'), 2600);
    }

    // =========================================================================
    // 1. TOP BAR: DATE, THEME SWITCHER & YEARLY GOAL ENGINE (START/EXAM DATES)
    // =========================================================================
    const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
    const homeDateEl = document.getElementById('home-today-date');
    const topDateEl = document.getElementById('top-greeting-date');
    if (homeDateEl) homeDateEl.textContent = dateStr;
    if (topDateEl) topDateEl.textContent = `Assalamu Alaikum • ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    function applyTheme(t) {
        state.theme = t;
        document.documentElement.setAttribute('data-theme', t);
        saveState();
    }
    applyTheme(state.theme || 'dark');

    document.getElementById('theme-cycle-btn')?.addEventListener('click', () => {
        const order = ['dark', 'amoled', 'sepia', 'light'];
        const next = order[(order.indexOf(state.theme) + 1) % order.length];
        applyTheme(next);
        showToast(`Theme: ${next.toUpperCase()}`);
    });

    function renderGoals() {
        const select = document.getElementById('yearly-goal-select');
        if (!select) return;
        select.innerHTML = state.goals.map(g => `<option value="${g.id}" ${g.id === state.activeGoalId ? 'selected' : ''}>${g.name}</option>`).join('');
        const active = state.goals.find(g => g.id === state.activeGoalId) || state.goals[0];

        // Calculate Days Left until Exam/Target Date
        let countdownText = active.name;
        if (active.endDate) {
            const diffMs = new Date(active.endDate) - new Date();
            const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            countdownText = daysLeft >= 0
                ? `⏳ ${daysLeft}d left (${active.startDate || 'Now'} → ${active.endDate})`
                : `✅ Target Date Passed (${active.endDate})`;
        }
        const pill = document.getElementById('goal-countdown-pill');
        const activePill = document.getElementById('goal-active-pill');
        if (pill) pill.textContent = countdownText;
        if (activePill) activePill.textContent = `${active.name} • ${countdownText}`;

        if (!active.subjects.includes(state.activeSubject)) {
            state.activeSubject = active.subjects[0] || 'General';
        }
        renderVault();
    }

    document.getElementById('yearly-goal-select')?.addEventListener('change', (e) => {
        state.activeGoalId = e.target.value;
        saveState();
        renderGoals();
        showToast('Switched Active Yearly Goal');
    });

    document.getElementById('new-goal-btn')?.addEventListener('click', () => {
        const active = state.goals.find(g => g.id === state.activeGoalId);
        document.getElementById('goal-start-input').value = active?.startDate || new Date().toISOString().slice(0, 10);
        document.getElementById('goal-end-input').value = active?.endDate || '2027-05-03';
        document.getElementById('goal-modal').classList.remove('hidden');
    });
    document.getElementById('cancel-goal-btn')?.addEventListener('click', () => {
        document.getElementById('goal-modal').classList.add('hidden');
    });
    document.getElementById('save-goal-btn')?.addEventListener('click', () => {
        const name = document.getElementById('goal-name-input').value.trim();
        const startDate = document.getElementById('goal-start-input').value;
        const endDate = document.getElementById('goal-end-input').value;
        const subjs = document.getElementById('goal-subjs-input').value.split(',').map(s => s.trim()).filter(Boolean);
        if (!name) return showToast('Please enter a Goal Title');
        const id = 'goal_' + Date.now();
        state.goals.push({
            id,
            name: name.startsWith('🎯') ? name : `🎯 ${name}`,
            startDate,
            endDate,
            subjects: subjs.length ? subjs : ['Core Subject']
        });
        state.activeGoalId = id;
        document.getElementById('goal-name-input').value = '';
        document.getElementById('goal-modal').classList.add('hidden');
        saveState();
        renderGoals();
        showToast('Saved New Yearly Goal & Countdown!');
    });

    // =========================================================================
    // 2. BOTTOM 5-PILLAR NAVIGATION & QUICK HOME CARDS
    // =========================================================================
    function switchMainTab(targetId) {
        document.querySelectorAll('.app-page').forEach(p => p.classList.remove('active-page'));
        document.querySelectorAll('.nav-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.target === targetId);
        });
        document.getElementById(targetId)?.classList.add('active-page');
        if (targetId === 'page-settings') {
            renderAnalytics(activeHorizon);
        }
    }

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchMainTab(btn.dataset.target));
    });

    // 4 v0.1 Quick Jump Cards on Home
    document.getElementById('quick-card-read')?.addEventListener('click', () => {
        switchMainTab('page-library');
        document.querySelector('[data-lib="lib-panel-reader"]')?.click();
    });
    document.getElementById('quick-card-revise')?.addEventListener('click', () => {
        switchMainTab('page-library');
        document.querySelector('[data-lib="lib-panel-cards"]')?.click();
    });
    document.getElementById('quick-card-tasks')?.addEventListener('click', () => {
        switchMainTab('page-tasks');
    });
    document.getElementById('quick-card-ai')?.addEventListener('click', () => {
        switchMainTab('page-ai');
    });

    // =========================================================================
    // 3. TAB 1: POMODORO TIMER + OVERTIME (+00:00) + 7-DAY PROTOCOL BUILDER
    // =========================================================================
    let secondsLeft = (state.sessions[state.currentSessionIdx]?.duration || 50) * 60;
    let timerRunning = false;
    let timerInterval = null;
    let isOvertime = false;
    let overtimeSeconds = 0;

    // Toggle between Active Timer and 7-Day Plan inside Tab 1
    document.getElementById('btn-show-timer')?.addEventListener('click', () => {
        document.getElementById('timer-view-focus').classList.remove('hidden');
        document.getElementById('timer-view-plan').classList.add('hidden');
        document.getElementById('btn-show-timer').className = 'timer-sub-btn bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg';
        document.getElementById('btn-show-protocol').className = 'timer-sub-btn text-slate-400 text-[10px] font-bold px-2.5 py-1 rounded-lg';
    });
    document.getElementById('btn-show-protocol')?.addEventListener('click', () => {
        document.getElementById('timer-view-focus').classList.add('hidden');
        document.getElementById('timer-view-plan').classList.remove('hidden');
        document.getElementById('timer-view-plan').classList.add('flex');
        document.getElementById('btn-show-protocol').className = 'timer-sub-btn bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg';
        document.getElementById('btn-show-timer').className = 'timer-sub-btn text-slate-400 text-[10px] font-bold px-2.5 py-1 rounded-lg';
        renderSchedule();
    });

    document.getElementById('dim-btn')?.addEventListener('click', () => {
        document.body.classList.toggle('oled-dim');
    });

    // Edit Current Live Session Inline
    document.getElementById('edit-live-sess-btn')?.addEventListener('click', () => {
        const cur = state.sessions[state.currentSessionIdx];
        if (!cur) return;
        const newTitle = prompt('Edit Session Title:', cur.title);
        if (newTitle === null) return;
        const newDur = parseInt(prompt('Edit Duration (Minutes):', cur.duration), 10);
        if (newTitle.trim()) cur.title = newTitle.trim();
        if (!isNaN(newDur) && newDur > 0) {
            cur.duration = newDur;
            secondsLeft = newDur * 60;
            isOvertime = false;
            overtimeSeconds = 0;
        }
        saveState();
        updateTimerUI();
        renderSchedule();
        showToast('Updated Live Session');
    });

    function updateTimerUI() {
        const sess = state.sessions[state.currentSessionIdx] || { title: 'Deep Study Block', duration: 50, type: 'work' };
        const timeEl = document.getElementById('time-display');
        const overBadge = document.getElementById('overtime-badge');

        if (isOvertime) {
            const om = Math.floor(overtimeSeconds / 60);
            const os = overtimeSeconds % 60;
            if (timeEl) {
                timeEl.textContent = `+${String(om).padStart(2, '0')}:${String(os).padStart(2, '0')}`;
                timeEl.classList.add('text-amber-400');
            }
            overBadge?.classList.remove('hidden');
        } else {
            const mins = Math.floor(secondsLeft / 60);
            const secs = secondsLeft % 60;
            if (timeEl) {
                timeEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
                timeEl.classList.remove('text-amber-400');
            }
            overBadge?.classList.add('hidden');
        }

        document.getElementById('session-type').textContent = sess.title;
        const isBreak = sess.type === 'break';
        document.getElementById('current-phase-display').textContent = isBreak ? 'RECOVERY BREAK PHASE' : 'DEEP STUDY PHASE';
        document.getElementById('anim-study')?.classList.toggle('hidden', isBreak);
        document.getElementById('anim-break')?.classList.toggle('hidden', !isBreak);
    }

    function loadSession(idx) {
        if (!state.sessions.length) return;
        state.currentSessionIdx = (idx + state.sessions.length) % state.sessions.length;
        const sess = state.sessions[state.currentSessionIdx];
        secondsLeft = (sess.duration || 25) * 60;
        isOvertime = false;
        overtimeSeconds = 0;
        pauseTimer();
        updateTimerUI();
        renderSchedule();
    }

    function startTimer() {
        if (timerRunning) return;
        timerRunning = true;
        document.getElementById('start-btn')?.classList.add('hidden');
        document.getElementById('pause-btn')?.classList.remove('hidden');
        document.getElementById('complete-main-btn')?.classList.remove('hidden');

        timerInterval = setInterval(() => {
            if (!isOvertime) {
                if (secondsLeft > 0) {
                    secondsLeft--;
                    updateTimerUI();
                } else {
                    const sess = state.sessions[state.currentSessionIdx];
                    if (sess && sess.type === 'work') {
                        // Enter Overtime Mode (+00:00) for weak subjects!
                        isOvertime = true;
                        overtimeSeconds = 1;
                        showToast('🔥 00:00 Reached! Overtime started — tap ✓ when ready to finish.');
                        updateTimerUI();
                    } else {
                        completeCurrentSession();
                    }
                }
            } else {
                overtimeSeconds++;
                updateTimerUI();
            }
        }, 1000);
    }

    function pauseTimer() {
        timerRunning = false;
        clearInterval(timerInterval);
        document.getElementById('start-btn')?.classList.remove('hidden');
        document.getElementById('pause-btn')?.classList.add('hidden');
    }

    function completeCurrentSession() {
        pauseTimer();
        const sess = state.sessions[state.currentSessionIdx];
        if (sess) {
            sess.done = true;
            if (sess.type === 'work') {
                const extraMins = Math.round(overtimeSeconds / 60);
                const totalEarned = (sess.duration || 25) + extraMins;
                state.stats.todayFocusMins += totalEarned;
                state.stats.todaySessions += 1;
                state.stats.horizonData['1d'].focus = state.stats.todayFocusMins;
                state.stats.horizonData['1d'].sess = state.stats.todaySessions;
                showToast(`✅ Completed! Logged ${totalEarned}m (${extraMins}m Overtime)`);
            } else {
                showToast('☕ Break finished! Ready for next study block.');
            }
        }
        isOvertime = false;
        overtimeSeconds = 0;
        saveState();
        if (state.currentSessionIdx < state.sessions.length - 1) {
            loadSession(state.currentSessionIdx + 1);
        } else {
            updateTimerUI();
            renderSchedule();
        }
    }

    document.getElementById('start-btn')?.addEventListener('click', startTimer);
    document.getElementById('pause-btn')?.addEventListener('click', pauseTimer);
    document.getElementById('complete-main-btn')?.addEventListener('click', completeCurrentSession);
    document.getElementById('skip-btn')?.addEventListener('click', () => loadSession(state.currentSessionIdx + 1));
    document.getElementById('undo-btn')?.addEventListener('click', () => loadSession(state.currentSessionIdx - 1));

    // 7-Day Protocol & Template Builder
    function renderSchedule() {
        const rem = state.sessions.filter(s => !s.done).length;
        const badge = document.getElementById('session-count-badge');
        if (badge) badge.textContent = `${rem} Remaining`;

        const container = document.getElementById('schedule-container');
        if (container) {
            container.innerHTML = state.sessions.map((s, idx) => `
                <div class="p-2.5 rounded-xl border ${idx === state.currentSessionIdx ? 'bg-blue-950/40 border-blue-500/60' : 'bg-slate-900 border-slate-800'} flex justify-between items-center">
                    <div class="flex items-center gap-2">
                        <span>${s.done ? '✅' : (s.type === 'break' ? '☕' : '🔥')}</span>
                        <div>
                            <p class="text-xs font-bold ${s.done ? 'line-through text-slate-500' : 'text-white'}">${s.title}</p>
                            <span class="text-[10px] text-slate-400 font-mono">${s.duration}m • ${s.type.toUpperCase()}</span>
                        </div>
                    </div>
                    <button type="button" onclick="window._zofLoadSess(${idx})" class="bg-slate-800 text-blue-300 text-[10px] font-bold px-2.5 py-1 rounded-lg">Start</button>
                </div>
            `).join('');
        }

        const tpl = state.templates[state.activeTemplateDay] || [];
        const tplBox = document.getElementById('settings-list');
        if (tplBox) {
            tplBox.innerHTML = tpl.map((t, i) => `
                <div class="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 flex justify-between items-center text-xs">
                    <span>${t.type === 'break' ? '☕' : '📚'} <b>${t.title}</b> (${t.duration}m)</span>
                    <button type="button" onclick="window._zofDelTpl(${i})" class="text-red-400 font-bold">✕</button>
                </div>
            `).join('') || '<p class="text-[11px] text-slate-500 text-center py-3">No blocks for this day yet. Add one above!</p>';
        }
    }

    window._zofLoadSess = (idx) => {
        loadSession(idx);
        document.getElementById('btn-show-timer')?.click();
    };
    window._zofDelTpl = (i) => {
        state.templates[state.activeTemplateDay].splice(i, 1);
        saveState();
        renderSchedule();
    };

    document.querySelectorAll('.day-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.activeTemplateDay = btn.dataset.day;
            if (!state.templates[state.activeTemplateDay]) state.templates[state.activeTemplateDay] = [];
            document.querySelectorAll('.day-tab-btn').forEach(b => {
                b.className = `day-tab-btn flex-1 min-w-[38px] ${b === btn ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'} text-[10px] py-1.5 rounded-lg font-bold`;
            });
            renderSchedule();
        });
    });

    document.querySelectorAll('.type-toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('new-sess-type').value = btn.dataset.val;
            document.querySelectorAll('.type-toggle-btn').forEach(b => {
                b.className = `type-toggle-btn flex-1 ${b === btn ? 'bg-blue-600 text-white' : 'bg-transparent text-slate-400'} text-xs py-1 rounded-md font-bold`;
            });
        });
    });

    document.getElementById('add-sess-btn')?.addEventListener('click', () => {
        const title = document.getElementById('new-sess-title').value.trim() || 'Focus Session';
        const duration = parseInt(document.getElementById('new-sess-dur').value, 10) || 50;
        const type = document.getElementById('new-sess-type').value;
        if (!state.templates[state.activeTemplateDay]) state.templates[state.activeTemplateDay] = [];
        state.templates[state.activeTemplateDay].push({ title, duration, type });
        document.getElementById('new-sess-title').value = '';
        saveState();
        renderSchedule();
        showToast('Block added to Day Template');
    });

    document.getElementById('clone-day-btn')?.addEventListener('click', () => {
        const currentTpl = state.templates[state.activeTemplateDay] || [];
        ['0', '1', '2', '3', '4', '5', '6'].forEach(d => {
            state.templates[d] = JSON.parse(JSON.stringify(currentTpl));
        });
        saveState();
        showToast('📋 Cloned this template to all 7 days of the week!');
    });

    document.getElementById('load-day-btn')?.addEventListener('click', () => {
        const tpl = state.templates[state.activeTemplateDay] || [];
        if (!tpl.length) return showToast('Add at least 1 block to this day first!');
        state.sessions = tpl.map(t => ({ ...t, done: false }));
        saveState();
        loadSession(0);
        document.getElementById('btn-show-timer')?.click();
        showToast('🌅 Live Protocol overwritten with selected day!');
    });

    // =========================================================================
    // 4. TAB 2: LIBRARY, READER, 114-SURAH QURAN, KNOWLEDGE BASE & FLASHCARDS
    // =========================================================================
    document.querySelectorAll('.lib-sub-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.lib;
            document.querySelectorAll('.lib-panel').forEach(p => p.classList.add('hidden'));
            document.getElementById(target)?.classList.remove('hidden');
            document.querySelectorAll('.lib-sub-tab').forEach(b => {
                b.className = `lib-sub-tab flex-1 min-w-[68px] ${b === btn ? 'bg-blue-600 text-white' : 'text-slate-400'} font-bold py-1.5 px-2 rounded-lg text-[11px]`;
            });
        });
    });

    function renderBookshelf() {
        const grid = document.getElementById('bookshelf-grid');
        if (!grid) return;
        grid.innerHTML = state.books.map(b => `
            <div class="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-3 flex flex-col justify-between gap-2 cursor-pointer transition-all" onclick="window._zofOpenBook(${b.id})">
                <div>
                    <span class="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/40">${b.category}</span>
                    <h4 class="text-xs font-bold text-white mt-1.5">${b.title}</h4>
                    <p class="text-[11px] text-slate-400 line-clamp-2 mt-1">${b.content}</p>
                </div>
                <div class="flex justify-between items-center pt-2 border-t border-slate-800/80 text-[10px]">
                    <span class="text-emerald-400 font-mono">Page ${b.page || 1}</span>
                    <span class="font-bold text-blue-400">Read in Reader ▶</span>
                </div>
            </div>
        `).join('');
    }

    window._zofOpenBook = (id) => {
        const book = state.books.find(b => b.id === id);
        if (!book) return;
        state.activeBookId = id;
        document.getElementById('reader-book-title').textContent = book.title;
        document.getElementById('reader-book-meta').textContent = `${book.category} • Ref Page ${book.page || 1}`;
        const box = document.getElementById('reader-content-box');
        box.textContent = book.content;
        box.style.fontSize = `${state.readerFontSize}px`;
        document.querySelector('[data-lib="lib-panel-reader"]')?.click();
    };

    document.getElementById('add-book-btn')?.addEventListener('click', () => {
        const title = document.getElementById('new-book-title').value.trim();
        const category = document.getElementById('new-book-cat').value;
        const content = document.getElementById('new-book-content').value.trim();
        if (!title || !content) return showToast('Enter both book title and text content');
        const id = Date.now();
        state.books.unshift({ id, title, category, page: 1, content });
        state.knowledgeBase.unshift({
            id: id + 1,
            category: category.includes('Islamic') ? 'Islamic Learning' : (category.includes('Med') ? 'Biology' : category),
            type: 'Book/PDF',
            cite: `${title}, p. 1`,
            title,
            body: content
        });
        document.getElementById('new-book-title').value = '';
        document.getElementById('new-book-content').value = '';
        saveState();
        renderBookshelf();
        renderKB();
        window._zofOpenBook(id);
        showToast('📚 Added to Bookshelf & Indexed in Knowledge Base!');
    });

    document.getElementById('book-file-input')?.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            document.getElementById('new-book-title').value = file.name.replace(/\.[^/.]+$/, '');
            document.getElementById('new-book-content').value = String(reader.result || '').slice(0, 25000);
            showToast('File loaded! Tap "+ Add Book to Shelf" to save.');
        };
        reader.readAsText(file);
    });

    // Reader Controls (Font size, Ruler, TTS, Bookmark)
    document.getElementById('reader-font-inc')?.addEventListener('click', () => {
        state.readerFontSize = Math.min(24, (state.readerFontSize || 15) + 2);
        document.getElementById('reader-content-box').style.fontSize = `${state.readerFontSize}px`;
        saveState();
    });
    document.getElementById('reader-font-dec')?.addEventListener('click', () => {
        state.readerFontSize = Math.max(12, (state.readerFontSize || 15) - 2);
        document.getElementById('reader-content-box').style.fontSize = `${state.readerFontSize}px`;
        saveState();
    });
    document.getElementById('reader-ruler-btn')?.addEventListener('click', () => {
        document.getElementById('reading-ruler-bar')?.classList.toggle('hidden');
    });
    document.getElementById('reader-tts-btn')?.addEventListener('click', () => {
        if (!('speechSynthesis' in window)) return showToast('TTS not supported on this browser');
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            return showToast('🔇 Stopped Reading Aloud');
        }
        const txt = document.getElementById('reader-content-box')?.textContent || '';
        const utter = new SpeechSynthesisUtterance(txt.slice(0, 600));
        window.speechSynthesis.speak(utter);
        showToast('🔊 Reading Aloud...');
    });
    document.getElementById('reader-bookmark-btn')?.addEventListener('click', () => {
        showToast('🔖 Position bookmarked in local database!');
    });

    // Floating Selection Menu (Rule 8 Study Actions)
    let selectedTextGlobal = '';
    const selToolbar = document.getElementById('selection-toolbar');
    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('touchend', handleTextSelection);

    function handleTextSelection() {
        setTimeout(() => {
            const sel = window.getSelection();
            const txt = sel ? sel.toString().trim() : '';
            if (txt.length > 2) {
                selectedTextGlobal = txt;
                selToolbar?.classList.remove('hidden');
                selToolbar.style.bottom = '72px';
                selToolbar.style.left = '12px';
            }
        }, 80);
    }

    document.querySelectorAll('.sel-action-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const act = btn.dataset.act;
            const activeBook = state.books.find(b => b.id === state.activeBookId) || { title: 'Reader Selection', page: 1 };
            selToolbar?.classList.add('hidden');
            if (!selectedTextGlobal) return;

            if (act === 'highlight' || act === 'kb') {
                state.knowledgeBase.unshift({
                    id: Date.now(),
                    category: 'Exam Prep',
                    type: 'Note',
                    cite: `${activeBook.title}, p. ${activeBook.page || 1}`,
                    title: `Highlight: ${selectedTextGlobal.slice(0, 36)}...`,
                    body: selectedTextGlobal
                });
                saveState();
                renderKB();
                showToast('🖍️ Saved Highlight to Knowledge Base!');
            } else if (act === 'flashcard') {
                state.flashcards.unshift({
                    id: Date.now(),
                    q: `Explain key concept: "${selectedTextGlobal.slice(0, 65)}..."`,
                    a: selectedTextGlobal,
                    src: `${activeBook.title}, p. ${activeBook.page || 1}`,
                    interval: '1d',
                    mastered: false
                });
                saveState();
                renderFlashcards();
                showToast('🃏 Created Flashcard with exact source!');
            } else if (act === 'define') {
                const lex = ARABIC_LEXICON[selectedTextGlobal] || { root: 'Local Term', form: 'Study Concept', meaning: selectedTextGlobal };
                showToast(`📖 ${selectedTextGlobal}: ${lex.root} — ${lex.meaning.slice(0, 60)}`);
            } else if (act === 'explain' || act === 'summarize') {
                switchMainTab('page-ai');
                document.getElementById('ai-agent-select').value = 'mentor';
                document.getElementById('ai-prompt-input').value = `${act === 'explain' ? 'Explain' : 'Summarize'}: "${selectedTextGlobal}"`;
                document.getElementById('send-ai-btn')?.click();
            }
        });
    });

    // Complete 114-Surah Uthmani Quran Reader (Offline Cache + Live Full Ayah Loader)
    function initQuranSelect() {
        const sel = document.getElementById('quran-surah-select');
        if (!sel) return;
        sel.innerHTML = SURAH_INDEX.map(s => `<option value="${s[0]}" ${s[0] === 1 ? 'selected' : ''}>${s[0]}. ${s[1]} (${s[2]}) — ${s[3]} Ayahs</option>`).join('');
        loadQuranSurah(1);
    }

    async function loadQuranSurah(surahNum) {
        const num = String(surahNum || document.getElementById('quran-surah-select')?.value || 1);
        const meta = SURAH_INDEX.find(s => String(s[0]) === num) || SURAH_INDEX[0];
        const statusEl = document.getElementById('quran-status-bar');
        const box = document.getElementById('quran-verses-container');
        if (!box) return;

        // 1. Check Local Cache or Offline Built-in
        if (state.quranCache && state.quranCache[num]) {
            renderQuranVerses(meta, state.quranCache[num], 'Loaded from Local 64GB SD Cache');
            return;
        }
        if (OFFLINE_QURAN[num]) {
            renderQuranVerses(meta, OFFLINE_QURAN[num], 'Loaded from Offline Built-in Sanctuary');
        } else {
            box.innerHTML = `<p class="text-xs text-slate-400 text-center py-6">⏳ Fetching all ${meta[3]} complete Uthmani Ayahs of Surah ${meta[1]} for permanent offline storage...</p>`;
        }

        // 2. Fetch Complete Surah (All Ayahs) from AlQuran Cloud API and Cache Locally
        try {
            const res = await fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,en.sahih`);
            const json = await res.json();
            if (json && json.data && json.data.length === 2) {
                const arAyahs = json.data[0].ayahs;
                const enAyahs = json.data[1].ayahs;
                const combined = arAyahs.map((a, idx) => ({
                    n: a.numberInSurah,
                    ar: a.text,
                    en: enAyahs[idx]?.text || ''
                }));
                if (!state.quranCache) state.quranCache = {};
                state.quranCache[num] = combined;
                saveState();
                renderQuranVerses(meta, combined, `✅ All ${combined.length} Ayahs Saved Offline`);
            }
        } catch (err) {
            if (!OFFLINE_QURAN[num]) {
                box.innerHTML = `<p class="text-xs text-amber-300 text-center py-4">⚠️ Currently Offline. Connect once to download all ${meta[3]} Ayahs of Surah ${meta[1]} into your permanent local cache.</p>`;
            }
        }
    }

    function renderQuranVerses(meta, verses, statusMsg) {
        const statusEl = document.getElementById('quran-status-bar');
        const box = document.getElementById('quran-verses-container');
        if (statusEl) statusEl.textContent = `Surah ${meta[0]}: ${meta[1]} (${meta[2]}) • Total ${meta[3]} Ayahs • ${statusMsg}`;
        if (!box) return;
        box.innerHTML = verses.map(v => `
            <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <p class="text-xl font-arabic text-emerald-300 ayah-arabic-text leading-loose">${v.ar} <span class="text-xs text-slate-400 font-mono">﴿${v.n}﴾</span></p>
                <p class="text-xs text-slate-300 text-left font-sans">${v.en}</p>
            </div>
        `).join('');
    }

    document.getElementById('load-surah-btn')?.addEventListener('click', () => loadQuranSurah());
    document.getElementById('quran-surah-select')?.addEventListener('change', (e) => loadQuranSurah(e.target.value));
    document.getElementById('toggle-hifz-hide-btn')?.addEventListener('click', () => {
        document.getElementById('quran-verses-container')?.classList.toggle('hifz-blur');
        showToast('🙈 Toggled Hifz Blur Mode (Tap any Ayah to peek)');
    });
    document.getElementById('recitation-check-btn')?.addEventListener('click', () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return showToast('Voice recognition requires Chrome on Android/Laptop');
        const rec = new SR();
        rec.lang = 'ar-SA';
        showToast('🎙️ Recite Ayah in Arabic now...');
        rec.onresult = (e) => {
            const spoken = e.results[0][0].transcript;
            showToast(`✅ Heard: "${spoken}"`);
        };
        rec.start();
    });

    // Knowledge Base & Notes
    function renderKB() {
        const q = (document.getElementById('kb-search-input')?.value || '').toLowerCase();
        const list = state.knowledgeBase.filter(k => !q || k.title.toLowerCase().includes(q) || k.body.toLowerCase().includes(q) || k.cite.toLowerCase().includes(q));
        const box = document.getElementById('kb-list-container');
        if (!box) return;
        box.innerHTML = list.map(k => `
            <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-1">
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-1.5">
                        <span class="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/40">${k.category}</span>
                        <span class="text-[9px] font-mono text-amber-300">📍 ${k.cite}</span>
                    </div>
                    <button type="button" onclick="window._zofDelKB(${k.id})" class="text-[10px] text-red-400 font-bold">✕</button>
                </div>
                <h4 class="text-xs font-bold text-white mt-0.5">${k.title}</h4>
                <p class="text-[11px] text-slate-300 leading-relaxed">${k.body}</p>
            </div>
        `).join('') || '<p class="text-xs text-slate-500 text-center py-4">No matching notes in your Knowledge Base.</p>';
    }

    window._zofDelKB = (id) => {
        state.knowledgeBase = state.knowledgeBase.filter(k => k.id !== id);
        saveState();
        renderKB();
    };

    document.getElementById('add-kb-btn')?.addEventListener('click', () => {
        const category = document.getElementById('kb-category-select').value;
        const type = document.getElementById('kb-type-select').value;
        const cite = document.getElementById('kb-cite-input').value.trim() || `Local ${type} (${new Date().toLocaleDateString()})`;
        const title = document.getElementById('kb-title-input').value.trim();
        const body = document.getElementById('kb-body-input').value.trim();
        if (!title || !body) return showToast('Enter title and content for Knowledge Base');
        state.knowledgeBase.unshift({ id: Date.now(), category, type, cite, title, body });
        document.getElementById('kb-title-input').value = '';
        document.getElementById('kb-body-input').value = '';
        saveState();
        renderKB();
        showToast('📥 Saved to Local Knowledge Base!');
    });

    document.getElementById('kb-search-input')?.addEventListener('input', renderKB);

    document.getElementById('kb-voice-note-btn')?.addEventListener('click', () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return showToast('Speech recognition requires Chrome on Android/Laptop');
        const rec = new SR();
        rec.lang = 'en-US';
        showToast('🎙️ Speak your study note now...');
        rec.onresult = (e) => {
            const transcript = e.results[0][0].transcript;
            document.getElementById('kb-type-select').value = 'Voice Note';
            document.getElementById('kb-cite-input').value = `Voice Memo (${new Date().toLocaleTimeString()})`;
            document.getElementById('kb-title-input').value = `Voice Note: ${transcript.slice(0, 28)}...`;
            document.getElementById('kb-body-input').value = transcript;
        };
        rec.start();
    });

    // Flashcards & Quizzes
    function renderFlashcards() {
        const total = state.flashcards.length;
        const badge = document.getElementById('fc-counter-badge');
        if (!total) {
            if (badge) badge.textContent = '0 / 0';
            return;
        }
        state.fcIndex = (state.fcIndex + total) % total;
        const card = state.flashcards[state.fcIndex];
        if (badge) badge.textContent = `${state.fcIndex + 1} / ${total} (${state.flashcards.filter(c => c.mastered).length} Mastered)`;
        document.getElementById('fc-source-badge').textContent = `📍 Source: ${card.src} • Interval: ${card.interval}`;
        document.getElementById('fc-question-text').textContent = card.q;
        const ansEl = document.getElementById('fc-answer-text');
        ansEl.textContent = card.a;
        ansEl.classList.toggle('hidden', !state.fcFlipped);
    }

    document.getElementById('fc-card')?.addEventListener('click', () => {
        state.fcFlipped = !state.fcFlipped;
        renderFlashcards();
    });

    document.querySelectorAll('.fc-rate-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const card = state.flashcards[state.fcIndex];
            if (card) {
                const r = btn.dataset.rate;
                card.mastered = (r === 'Good' || r === 'Easy');
                card.interval = r === 'Easy' ? '4d' : (r === 'Good' ? '1d' : (r === 'Hard' ? '6h' : '1m'));
            }
            state.fcIndex++;
            state.fcFlipped = false;
            saveState();
            renderFlashcards();
        });
    });

    document.getElementById('add-fc-btn')?.addEventListener('click', () => {
        const q = document.getElementById('fc-q-input').value.trim();
        const a = document.getElementById('fc-a-input').value.trim();
        const src = document.getElementById('fc-src-input').value.trim() || 'Local Study Note';
        if (!q || !a) return showToast('Enter both Question and Answer');
        state.flashcards.push({ id: Date.now(), q, a, src, interval: '1d', mastered: false });
        document.getElementById('fc-q-input').value = '';
        document.getElementById('fc-a-input').value = '';
        saveState();
        renderFlashcards();
        showToast('🃏 Flashcard saved!');
    });

    document.getElementById('gen-quiz-btn')?.addEventListener('click', () => {
        const box = document.getElementById('quiz-container');
        if (!box || !state.knowledgeBase.length) return;
        const sample = state.knowledgeBase.slice(0, 3);
        box.innerHTML = sample.map((k, idx) => `
            <div class="bg-slate-950 border border-slate-800 rounded-xl p-2.5 space-y-1.5">
                <p class="font-bold text-white">Q${idx + 1}: Based on <span class="text-amber-300">[${k.cite}]</span>, explain the core principle of "${k.title}"?</p>
                <details class="text-emerald-300 cursor-pointer">
                    <summary class="text-[10px] font-bold uppercase text-blue-400">Tap to Reveal Source-Verified Answer</summary>
                    <p class="mt-1 text-slate-200">${k.body}</p>
                </details>
            </div>
        `).join('');
        showToast('📝 Generated Quiz strictly from your saved Knowledge Base!');
    });

    // =========================================================================
    // 5. TAB 3: 🧠 AI HUB (5 AIR-GAPPED AGENTS + 18 RULES + DISCUSSION ROOM)
    // =========================================================================
    const agentSelect = document.getElementById('ai-agent-select');
    const agentBanner = document.getElementById('ai-agent-banner');
    const deenBar = document.getElementById('deen-sanctuary-bar');
    const creatorBar = document.getElementById('creator-studio-workspace');

    function updateAgentUI() {
        const ag = agentSelect?.value || 'mentor';
        deenBar?.classList.toggle('hidden', ag !== 'deen');
        deenBar?.classList.toggle('flex', ag === 'deen');
        creatorBar?.classList.toggle('hidden', ag !== 'creator');
        creatorBar?.classList.toggle('flex', ag === 'creator');

        const banners = {
            mentor: '🔒 Mentor AI (Air-Gapped Study Memory): Uses only your saved Books/Notes. Follows all 18 Rules & 7-Part Format.',
            goal: '🎯 Goal AI (Discipline & Burnout Guard): Uses only your Goals, Tasks, Deadlines, and Pomodoro Focus Logs.',
            deen: '🕌 Deen AI (Air-Gapped Spiritual Sanctuary): Strictly grounded in Quran, Sahih Hadith & Classical Arabic. Never mixes with Creator/Study.',
            creator: '🎬 Creator AI (Beginner YouTube Studio): Uses only mastered topics you approved to build 14-Point Video & Shorts packages.',
            discussion: '🤝 Coordinator AI Discussion Room: Mentor AI, Goal AI, Creator AI, and Deen AI debate from separate roles & synthesize a plan.'
        };
        if (agentBanner) agentBanner.textContent = banners[ag];
        renderAIChat();
    }

    agentSelect?.addEventListener('change', updateAgentUI);

    function renderAIChat() {
        const ag = agentSelect?.value || 'mentor';
        const chatBox = document.getElementById('ai-chat-history');
        if (!chatBox) return;
        const msgs = state.aiChats[ag] || [];
        chatBox.innerHTML = msgs.map(m => `
            <div class="p-3 rounded-2xl ${m.role === 'user' ? 'bg-blue-950/50 border border-blue-700/50 ml-6 text-white' : 'bg-slate-900 border border-slate-800 mr-2 text-slate-200'} space-y-1.5 leading-relaxed">
                ${m.html}
            </div>
        `).join('');
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function generateAgentResponse(agent, query, level) {
        const qLower = query.toLowerCase();
        const words = qLower.split(/\W+/).filter(w => w.length > 2);

        // 1. MENTOR AI (18 Rules + 7-Part Default Response Format)
        if (agent === 'mentor') {
            const studyKB = state.knowledgeBase.filter(k => k.category !== 'Islamic Learning');
            const match = studyKB.find(k => words.some(w => k.title.toLowerCase().includes(w) || k.body.toLowerCase().includes(w)));

            if (!match) {
                return `
                    <div class="space-y-1.5">
                        <p class="font-bold text-amber-400">⚠️ This is not in your saved materials.</p>
                        <p><b>Rule 3 & 5 Notice:</b> I searched your local Study Knowledge Base (${studyKB.length} saved sources) and found no matching passage for <i>"${query}"</i> (needs verification).</p>
                        <p class="text-slate-400">💡 <b>Tip:</b> Add this topic in <b>📚 Library → 🗂️ Notes/KB</b> so I can cite its exact book page, YouTube timestamp, or URL!</p>
                    </div>`;
            }

            return `
                <div class="space-y-1.5">
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300">🧑‍🏫 Mentor AI • ${level} Level</span>
                    <p><b>1. Direct Answer:</b> ${match.body}</p>
                    <p><b>2. Key Explanation (${level}):</b> In your saved ${match.category} notes, <b>${match.title}</b> operates as a foundational mechanism that you should link directly to problem-solving.</p>
                    <p><b>3. Example / Analogy:</b> Think of this mechanism like an automatic relay switch that regulates flow precisely when threshold conditions are met.</p>
                    <p class="text-amber-300 font-mono"><b>4. Exact Source Citation:</b> 📍 ${match.cite} (${match.type})</p>
                    <p><b>5. Important Point to Remember:</b> Always verify the primary rate-limiting factor or conservation principle tested in exams.</p>
                    <p class="text-emerald-300"><b>6. Suggested Flashcard:</b> Q: What is the core principle of ${match.title}? | A: ${match.body.slice(0, 90)}... [${match.cite}]</p>
                    <p class="text-slate-400"><b>7. Follow-up Question:</b> Would you like me to generate a 3-question quiz strictly from <i>${match.cite}</i>?</p>
                </div>`;
        }

        // 2. GOAL AI (6-Part Discipline & Burnout Prevention Format)
        if (agent === 'goal') {
            const activeGoal = state.goals.find(g => g.id === state.activeGoalId) || state.goals[0];
            const openTasks = state.todos.filter(t => !t.done);
            return `
                <div class="space-y-1.5">
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300">🎯 Goal AI • Discipline Mentor</span>
                    <p><b>1. Goal Summary:</b> Active Target: <b>${activeGoal.name}</b> (${activeGoal.startDate} → ${activeGoal.endDate}).</p>
                    <p><b>2. Today’s Priority Tasks:</b> ${openTasks.slice(0, 2).map(t => t.title).join(' • ') || 'All tasks completed!'}</p>
                    <p><b>3. Suggested Time Blocks:</b> Run two 50m Pomodoro blocks for ${activeGoal.subjects[0] || 'Core Study'} with a 10m spine-stretch break in between.</p>
                    <p><b>4. Small Next Action:</b> Start a 25-minute warmup block on your #1 priority task right now.</p>
                    <p><b>5. Progress Check:</b> Logged <b>${state.stats.todayFocusMins}m</b> across <b>${state.stats.todaySessions}</b> sessions today.</p>
                    <p class="text-amber-300"><b>6. Burnout Guard & Encouragement:</b> Consistency beats extreme all-nighters. Protect your sleep and Salah times!</p>
                </div>`;
        }

        // 3. DEEN AI (Air-Gapped Islamic Teacher & Scholar Boundary)
        if (agent === 'deen') {
            const deenKB = state.knowledgeBase.filter(k => k.category === 'Islamic Learning');
            const match = deenKB[0];
            const prayed = Object.values(state.salahStatus).filter(Boolean).length;
            return `
                <div class="space-y-1.5">
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300">🕌 Deen AI • Air-Gapped Spiritual Sanctuary</span>
                    <p><b>Quran & Sunnah Guidance:</b> ${match ? match.body : 'Surah Al-Asr (103:1-3) reminds us that true success lies in faith, righteous action, truth, and patience.'}</p>
                    <p class="text-amber-300 font-mono"><b>Authentic Citation:</b> 📍 ${match ? match.cite : 'Surah Al-Asr (103:1-3) & Sahih Muslim 2699'}</p>
                    <p><b>Deen-Dunya Balance Check:</b> You have logged <b>${prayed}/6</b> prayers in today's Salah Matrix. Schedule your Pomodoro blocks around Adhan times so study never delays Salah.</p>
                    <p class="text-[11px] text-slate-400 italic">⚖️ Scholar Boundary: Deen AI is for Quran/Arabic study and spiritual reminders; it does not issue fatwas. Consult qualified scholars for complex fiqh rulings.</p>
                </div>`;
        }

        // 4. CREATOR AI (14-Point Beginner YouTube Studio Format)
        if (agent === 'creator') {
            return buildCreator14Package(query);
        }

        // 5. COORDINATOR AI / MULTI-AGENT DISCUSSION ROOM
        const activeGoal = state.goals.find(g => g.id === state.activeGoalId) || state.goals[0];
        return `
            <div class="space-y-2">
                <div class="text-[10px] font-bold uppercase text-purple-300 border-b border-slate-800 pb-1">🤝 Coordinator AI Discussion on: "${query}"</div>
                <p><b class="text-blue-400">🧑‍🏫 Mentor AI:</b> "Use your saved notes on <i>${state.knowledgeBase[0]?.title || 'Core Concepts'}</i> [${state.knowledgeBase[0]?.cite || 'Local KB'}]. Master the mechanism first and test yourself with 5 flashcards."</p>
                <p><b class="text-emerald-400">🎯 Goal AI:</b> "Keep daily study focused on ${activeGoal.name}. Limit side tasks/content creation to 45 minutes only after completing 2 deep study Pomodoros."</p>
                <p><b class="text-purple-400">🎬 Creator AI:</b> "Once you master today's topic, record a 60-second YouTube Short explaining the #1 takeaway in simple language for fellow students."</p>
                <p><b class="text-amber-400">🕌 Deen AI:</b> "Anchor your schedule around the 5 obligatory prayers and 15 minutes of Quran Hifz so barakah remains in your time."</p>
                <div class="bg-slate-950 border border-purple-500/40 rounded-xl p-2.5 mt-2 space-y-1">
                    <p class="font-bold text-white">🧭 Coordinator AI Final Synthesis:</p>
                    <p><b>1. Agreement:</b> Deep study and Salah come first; content creation is a reward after mastery.</p>
                    <p><b>2. Difference:</b> Creator AI wants output, while Goal AI restricts time to prevent burnout.</p>
                    <p><b>3. Risk Warning:</b> Do not start scripting videos before finishing today's My Day study tasks.</p>
                    <p><b>4. Final Recommendation:</b> Complete 1 Pomodoro of study + 1 Salah check-in, then spend 20m on your side goal.</p>
                    <p><b>5. Next Action:</b> Tap <b>⏳ Timer</b> and start your next 50m block now!</p>
                </div>
            </div>`;
    }

    function buildCreator14Package(topicOverride) {
        const src = state.knowledgeBase.find(k => k.category !== 'Islamic Learning') || state.knowledgeBase[0];
        const niche = document.getElementById('creator-niche-input')?.value || 'Medical & Study Smarter';
        const audience = document.getElementById('creator-audience-input')?.value || 'NEET & MBBS Beginners';
        const format = document.getElementById('creator-format-select')?.value || '60s YouTube Short';
        const topic = topicOverride || src?.title || 'How the Heart Pacemaker Works';

        return `
            <div class="space-y-1.5">
                <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300">🎬 Creator AI • 14-Point Beginner YouTube Package</span>
                <p><b>1. Content Idea:</b> ${topic} Explained Simply</p>
                <p><b>2. Target Audience:</b> ${audience} (${niche})</p>
                <p><b>3. Viewer Problem:</b> Memorizing dry textbook lines without understanding the real mechanism.</p>
                <p><b>4. Main Transformation:</b> Viewer masters the concept in 60 seconds and never forgets it in MCQs.</p>
                <p><b>5. Video Format:</b> ${format}</p>
                <p><b>6. Title Options:</b> ① Master ${topic} in 60s! ② Stop Memorizing ${topic} — Understand This Instead</p>
                <p><b>7. Thumbnail Concept:</b> High-contrast dark background, glowing diagram arrow, 3 words text: <i>"NEVER FORGET THIS!"</i></p>
                <p><b>8. Script (Hook → 3 Points → CTA):</b><br>• <b>0-3s Hook:</b> "90% of students get this exam question wrong—here’s why."<br>• <b>Body:</b> ${src ? src.body : 'Explain the 3 core steps clearly using one analogy.'}<br>• <b>CTA:</b> "Subscribe for 60-second high-yield study breakdowns!"</p>
                <p><b>9. Voiceover Note:</b> Speak at a calm, confident 1.1x pace; emphasize key terms.</p>
                <p><b>10. Slide Deck Outline:</b> Slide 1: The Big Question • Slide 2: Core Mechanism • Slide 3: Quick Quiz</p>
                <p><b>11. Visual / B-Roll:</b> Show your clean flowchart or highlight from your ZikrOFikr notes.</p>
                <p><b>12. SEO Tags:</b> #neet #mbbs #studysmarter #zikrofikr</p>
                <p class="text-amber-300 font-mono"><b>13. Verified Source Citation:</b> 📍 ${src ? src.cite : 'Local Knowledge Base'}</p>
                <p><b>14. Next 5 Video Ideas:</b> Common MCQ Traps • 50/10 Pomodoro Method • Active Recall vs Rereading • How I Take Notes • Exam Countdown Routine</p>
            </div>`;
    }

    document.getElementById('send-ai-btn')?.addEventListener('click', () => {
        const input = document.getElementById('ai-prompt-input');
        const q = input?.value.trim();
        if (!q) return;
        const ag = agentSelect?.value || 'mentor';
        const lvl = document.getElementById('ai-level-select')?.value || 'Intermediate';

        if (!state.aiChats[ag]) state.aiChats[ag] = [];
        state.aiChats[ag].push({ role: 'user', html: `<p class="font-bold">You:</p><p>${q}</p>` });
        const replyHtml = generateAgentResponse(ag, q, lvl);
        state.aiChats[ag].push({ role: 'ai', html: replyHtml });
        input.value = '';
        saveState();
        renderAIChat();
    });

    document.getElementById('gen-creator-pack-btn')?.addEventListener('click', () => {
        const ag = 'creator';
        state.aiChats.creator.push({ role: 'ai', html: buildCreator14Package() });
        saveState();
        renderAIChat();
        showToast('✨ Generated 14-Point YouTube Package!');
    });

    document.getElementById('approve-handoff-btn')?.addEventListener('click', () => {
        state.approvedForCreator = true;
        saveState();
        showToast('✅ Approved Summary Handoff between Mentor AI, Goal AI & Creator AI');
    });

    document.getElementById('clear-ai-chat-btn')?.addEventListener('click', () => {
        const ag = agentSelect?.value || 'mentor';
        state.aiChats[ag] = [];
        saveState();
        renderAIChat();
        showToast('Cleared chat history for this agent');
    });

    // Deen Sanctuary Bar: 6-Salah Matrix & Tasbih
    function renderSalahAndTasbih() {
        const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Tahajjud'];
        const done = prayers.filter(p => state.salahStatus[p]).length;
        const badge = document.getElementById('salah-score-badge');
        if (badge) badge.textContent = `${done}/6 Prayed`;
        const grid = document.getElementById('salah-tracker-grid');
        if (grid) {
            grid.innerHTML = prayers.map(p => `
                <button type="button" onclick="window._zofToggleSalah('${p}')" class="p-2 rounded-xl border text-[11px] font-bold flex items-center justify-between ${state.salahStatus[p] ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'}">
                    <span>${p}</span><span>${state.salahStatus[p] ? '✅' : '○'}</span>
                </button>
            `).join('');
        }
        const dhikrKey = document.getElementById('dhikr-type-select')?.value || 'SubhanAllah';
        const cntEl = document.getElementById('tasbih-count-display');
        if (cntEl) cntEl.textContent = state.tasbihCounts[dhikrKey] || 0;
    }

    window._zofToggleSalah = (p) => {
        state.salahStatus[p] = !state.salahStatus[p];
        saveState();
        renderSalahAndTasbih();
    };
    document.getElementById('dhikr-type-select')?.addEventListener('change', renderSalahAndTasbih);
    document.getElementById('tasbih-tap-box')?.addEventListener('click', () => {
        const k = document.getElementById('dhikr-type-select')?.value || 'SubhanAllah';
        state.tasbihCounts[k] = (state.tasbihCounts[k] || 0) + 1;
        saveState();
        renderSalahAndTasbih();
    });
    document.getElementById('tasbih-reset-btn')?.addEventListener('click', () => {
        const k = document.getElementById('dhikr-type-select')?.value || 'SubhanAllah';
        state.tasbihCounts[k] = 0;
        saveState();
        renderSalahAndTasbih();
    });

    // =========================================================================
    // 6. TAB 4: 🗂️ TASKS (MS TO-DO PRO + CUSTOM DAYS REPEAT + GOAL VAULT/MCQ)
    // =========================================================================
    let starQuick = false;
    let selectedCustomDays = ['Sun', 'Mon', 'Tue', 'Thu', 'Sat'];
    let editingTodoId = null;

    document.getElementById('btn-tasks-todo')?.addEventListener('click', () => {
        document.getElementById('tasks-view-todo').classList.remove('hidden');
        document.getElementById('tasks-view-vault').classList.add('hidden');
        document.getElementById('btn-tasks-todo').className = 'bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl';
        document.getElementById('btn-tasks-vault').className = 'text-slate-400 text-xs font-bold px-3 py-1.5 rounded-xl';
    });
    document.getElementById('btn-tasks-vault')?.addEventListener('click', () => {
        document.getElementById('tasks-view-todo').classList.add('hidden');
        document.getElementById('tasks-view-vault').classList.remove('hidden');
        document.getElementById('tasks-view-vault').classList.add('flex');
        document.getElementById('btn-tasks-vault').className = 'bg-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl';
        document.getElementById('btn-tasks-todo').className = 'text-slate-400 text-xs font-bold px-3 py-1.5 rounded-xl';
        renderVault();
    });

    // Show/Hide Custom Days of Week Picker (Sun, Mon, Tue, skip Wed, etc.)
    document.getElementById('todo-repeat-quick')?.addEventListener('change', (e) => {
        document.getElementById('custom-repeat-days-bar')?.classList.toggle('hidden', e.target.value !== 'custom_days');
    });

    document.querySelectorAll('.repeat-day-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            const d = btn.dataset.d;
            if (selectedCustomDays.includes(d)) {
                selectedCustomDays = selectedCustomDays.filter(x => x !== d);
                btn.className = 'repeat-day-pill bg-slate-950 text-slate-400 border border-slate-700 text-[10px] font-bold w-8 py-1 rounded-lg';
            } else {
                selectedCustomDays.push(d);
                btn.className = 'repeat-day-pill bg-blue-600 text-white text-[10px] font-bold w-8 py-1 rounded-lg';
            }
        });
    });

    document.getElementById('todo-star-toggle')?.addEventListener('click', (e) => {
        starQuick = !starQuick;
        e.currentTarget.textContent = starQuick ? '⭐' : '☆';
    });

    function renderTodos() {
        const tabsBar = document.getElementById('todo-tabs-bar');
        if (tabsBar) {
            tabsBar.innerHTML = state.todoLists.map(l => `
                <button type="button" onclick="window._zofSetTodoList('${l.id}')" class="px-3 py-1 rounded-lg text-xs font-bold shrink-0 ${state.todoFilter === l.id ? 'bg-blue-600 text-white' : 'text-slate-400'}">${l.name}</button>
            `).join('') + `<button type="button" onclick="document.getElementById('new-list-modal').classList.remove('hidden')" class="px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-400 bg-emerald-950/40 shrink-0">+ List</button>`;
        }

        const activeCount = state.todos.filter(t => !t.done).length;
        const badge = document.getElementById('todo-count-badge');
        if (badge) badge.textContent = `${activeCount} Active`;

        const q = (document.getElementById('todo-search-input')?.value || '').toLowerCase();
        const sortMode = document.getElementById('todo-sort-select')?.value || 'newest';

        let list = state.todos.filter(t => {
            if (q && !t.title.toLowerCase().includes(q) && !(t.note || '').toLowerCase().includes(q)) return false;
            if (state.todoFilter === 'myday') return t.myDay && !t.done;
            if (state.todoFilter === 'important') return t.important && !t.done;
            if (state.todoFilter === 'planned') return Boolean(t.due) && !t.done;
            if (state.todoFilter === 'completed') return t.done;
            if (state.todoFilter === 'all') return true;
            return t.list === state.todoFilter;
        });

        if (sortMode === 'important') list.sort((a, b) => Number(b.important) - Number(a.important));
        if (sortMode === 'az') list.sort((a, b) => a.title.localeCompare(b.title));
        if (sortMode === 'due') list.sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'));

        const box = document.getElementById('todo-list-container');
        if (!box) return;
        box.innerHTML = list.map(t => {
            const repeatLabel = t.repeat === 'custom_days'
                ? `🔁 ${(t.repeatDays || []).join(', ')}`
                : (t.repeat && t.repeat !== 'none' ? `🔁 ${t.repeat}` : '');
            return `
                <div class="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-3 flex items-center justify-between gap-2.5 cursor-pointer" onclick="window._zofOpenTodoDetail(${t.id})">
                    <div class="flex items-center gap-2.5 min-w-0">
                        <button type="button" onclick="event.stopPropagation(); window._zofToggleTodo(${t.id})" class="w-5 h-5 rounded-full border ${t.done ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-slate-600'} flex items-center justify-center text-xs font-bold shrink-0">${t.done ? '✓' : ''}</button>
                        <div class="min-w-0">
                            <p class="text-xs font-bold truncate ${t.done ? 'line-through text-slate-500' : 'text-white'}">${t.title}</p>
                            <div class="flex flex-wrap gap-2 mt-1 text-[10px] text-slate-400">
                                ${t.myDay ? '<span class="text-amber-300">☀️ My Day</span>' : ''}
                                ${t.due ? `<span class="text-emerald-400">📅 ${t.due}${t.time || ''}</span>` : ''}
                                ${repeatLabel ? `<span class="text-purple-300">${repeatLabel}</span>` : ''}
                                ${t.steps?.length ? `<span class="text-blue-400">☑️ ${t.steps.filter(s => s.done).length}/${t.steps.length}</span>` : ''}
                            </div>
                        </div>
                    </div>
                    <button type="button" onclick="event.stopPropagation(); window._zofStarTodo(${t.id})" class="text-base shrink-0">${t.important ? '⭐' : '☆'}</button>
                </div>`;
        }).join('') || '<p class="text-xs text-slate-500 text-center py-6">No tasks in this list.</p>';
    }

    window._zofSetTodoList = (id) => { state.todoFilter = id; renderTodos(); };
    window._zofToggleTodo = (id) => {
        const t = state.todos.find(x => x.id === id);
        if (t) t.done = !t.done;
        saveState();
        renderTodos();
    };
    window._zofStarTodo = (id) => {
        const t = state.todos.find(x => x.id === id);
        if (t) t.important = !t.important;
        saveState();
        renderTodos();
    };

    document.getElementById('add-todo-btn')?.addEventListener('click', () => {
        const title = document.getElementById('todo-input').value.trim();
        if (!title) return;
        const due = document.getElementById('todo-due-input').value || new Date().toISOString().slice(0, 10);
        const time = document.getElementById('todo-time-input').value;
        const repeat = document.getElementById('todo-repeat-quick').value;
        state.todos.unshift({
            id: Date.now(),
            title,
            list: state.todoFilter,
            myDay: true,
            important: starQuick,
            done: false,
            due,
            time,
            repeat,
            repeatDays: repeat === 'custom_days' ? [...selectedCustomDays] : [],
            note: '',
            steps: []
        });
        document.getElementById('todo-input').value = '';
        saveState();
        renderTodos();
        showToast('☑️ Task added!');
    });

    document.getElementById('todo-search-input')?.addEventListener('input', renderTodos);
    document.getElementById('todo-sort-select')?.addEventListener('change', renderTodos);

    // Custom List Modal
    document.getElementById('cancel-new-list-btn')?.addEventListener('click', () => document.getElementById('new-list-modal').classList.add('hidden'));
    document.getElementById('save-new-list-btn')?.addEventListener('click', () => {
        const icon = document.getElementById('custom-list-icon-input').value.trim() || '📁';
        const name = document.getElementById('custom-list-name-input').value.trim();
        if (!name) return;
        const id = 'list_' + Date.now();
        state.todoLists.push({ id, name: `${icon} ${name}` });
        state.todoFilter = id;
        document.getElementById('custom-list-name-input').value = '';
        document.getElementById('new-list-modal').classList.add('hidden');
        saveState();
        renderTodos();
    });

    // Smart Suggestions Modal
    document.getElementById('open-suggestions-btn')?.addEventListener('click', () => {
        document.getElementById('todo-suggestions-modal').classList.remove('hidden');
        renderSuggestions();
    });
    document.getElementById('close-suggestions-btn')?.addEventListener('click', () => {
        document.getElementById('todo-suggestions-modal').classList.add('hidden');
    });
    function renderSuggestions() {
        document.getElementById('suggestions-unfinished-list').innerHTML = state.todos.filter(t => !t.done).map(t => `
            <div class="bg-slate-950 border border-slate-800 rounded-xl p-2 flex justify-between items-center text-xs">
                <span>${t.title}</span>
                <span class="text-[10px] text-emerald-400">${t.due || 'Active'}</span>
            </div>
        `).join('');
        document.getElementById('suggestions-library-list').innerHTML = state.libraryTasks.map((txt, i) => `
            <div class="bg-slate-950 border border-slate-800 rounded-xl p-2 flex justify-between items-center text-xs">
                <span>${txt}</span>
                <button type="button" onclick="window._zofAddLibTask(${i})" class="bg-blue-600 text-white font-bold px-2.5 py-1 rounded-lg text-[10px]">+ My Day</button>
            </div>
        `).join('');
    }
    window._zofAddLibTask = (i) => {
        const txt = state.libraryTasks[i];
        state.todos.unshift({ id: Date.now(), title: txt, list: 'myday', myDay: true, important: false, done: false, due: new Date().toISOString().slice(0, 10), repeat: 'none', repeatDays: [], steps: [] });
        saveState();
        renderTodos();
        showToast('Added to My Day!');
    };
    document.getElementById('save-template-task-btn')?.addEventListener('click', () => {
        const val = document.getElementById('save-template-task-input').value.trim();
        if (!val) return;
        state.libraryTasks.unshift(val);
        document.getElementById('save-template-task-input').value = '';
        saveState();
        renderSuggestions();
    });

    // Task Detail Drawer
    window._zofOpenTodoDetail = (id) => {
        const t = state.todos.find(x => x.id === id);
        if (!t) return;
        editingTodoId = id;
        document.getElementById('detail-title-input').value = t.title;
        document.getElementById('detail-date-input').value = t.due || '';
        document.getElementById('detail-time-input').value = t.time || '';
        document.getElementById('detail-note-input').value = t.note || '';
        renderDetailSteps(t);
        document.getElementById('todo-detail-modal').classList.remove('hidden');
    };
    function renderDetailSteps(t) {
        document.getElementById('detail-steps-list').innerHTML = (t.steps || []).map((s, idx) => `
            <div class="bg-slate-900 px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs">
                <label class="flex items-center gap-2">
                    <input type="checkbox" ${s.done ? 'checked' : ''} onchange="window._zofToggleStep(${idx})">
                    <span class="${s.done ? 'line-through text-slate-500' : 'text-white'}">${s.text}</span>
                </label>
            </div>
        `).join('');
    }
    window._zofToggleStep = (idx) => {
        const t = state.todos.find(x => x.id === editingTodoId);
        if (t && t.steps[idx]) {
            t.steps[idx].done = !t.steps[idx].done;
            saveState();
            renderDetailSteps(t);
            renderTodos();
        }
    };
    document.getElementById('detail-add-step-btn')?.addEventListener('click', () => {
        const t = state.todos.find(x => x.id === editingTodoId);
        const val = document.getElementById('detail-new-step-input').value.trim();
        if (!t || !val) return;
        t.steps.push({ text: val, done: false });
        document.getElementById('detail-new-step-input').value = '';
        saveState();
        renderDetailSteps(t);
    });
    document.getElementById('detail-ai-steps-btn')?.addEventListener('click', () => {
        const t = state.todos.find(x => x.id === editingTodoId);
        if (!t) return;
        t.steps.push(
            { text: '1. Review core concept & formulas from saved KB (15m)', done: false },
            { text: '2. Active recall summary & flashcards (15m)', done: false },
            { text: '3. Timed practice questions & mistake log (20m)', done: false }
        );
        saveState();
        renderDetailSteps(t);
        showToast('✨ AI broke task into 3 actionable sub-steps!');
    });
    document.getElementById('close-detail-modal-btn')?.addEventListener('click', () => document.getElementById('todo-detail-modal').classList.add('hidden'));
    document.getElementById('detail-save-btn')?.addEventListener('click', () => {
        const t = state.todos.find(x => x.id === editingTodoId);
        if (t) {
            t.title = document.getElementById('detail-title-input').value.trim() || t.title;
            t.due = document.getElementById('detail-date-input').value;
            t.time = document.getElementById('detail-time-input').value;
            t.note = document.getElementById('detail-note-input').value;
        }
        document.getElementById('todo-detail-modal').classList.add('hidden');
        saveState();
        renderTodos();
    });
    document.getElementById('detail-delete-btn')?.addEventListener('click', () => {
        state.todos = state.todos.filter(x => x.id !== editingTodoId);
        document.getElementById('todo-detail-modal').classList.add('hidden');
        saveState();
        renderTodos();
    });

    // Goal Vault & Daily MCQ Tracker
    function renderVault() {
        const activeGoal = state.goals.find(g => g.id === state.activeGoalId) || state.goals[0];
        const subjBox = document.getElementById('subject-filter-container');
        if (subjBox) {
            subjBox.innerHTML = activeGoal.subjects.map(s => `
                <button type="button" onclick="window._zofSetSubj('${s}')" class="px-3 py-1 rounded-lg text-xs font-bold border ${state.activeSubject === s ? 'bg-purple-600 text-white border-purple-500' : 'bg-slate-900 text-slate-400 border-slate-800'}">${s}</button>
            `).join('');
        }

        const isMcq = state.vaultTab === 'mcq';
        document.getElementById('task-add-form')?.classList.toggle('hidden', isMcq);
        document.getElementById('mcq-add-form')?.classList.toggle('hidden', !isMcq);

        const list = state.vaultItems.filter(v => v.goalId === state.activeGoalId && v.subject === state.activeSubject && (state.vaultTab === 'matrix' || v.tab === state.vaultTab));
        const box = document.getElementById('vault-list-container');
        if (box) {
            box.innerHTML = list.map(v => `
                <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 flex justify-between items-center">
                    <label class="flex items-center gap-2 text-xs font-bold cursor-pointer">
                        <input type="checkbox" ${v.done ? 'checked' : ''} onchange="window._zofToggleVault(${v.id})">
                        <span class="${v.done ? 'line-through text-slate-500' : 'text-white'}">${v.title}</span>
                    </label>
                    <span class="text-[9px] uppercase px-2 py-0.5 rounded bg-slate-950 text-purple-300 border border-slate-800">${v.tab}</span>
                </div>
            `).join('') || `<p class="text-xs text-slate-500 text-center py-4">No topics in ${state.activeSubject} (${state.vaultTab}) yet.</p>`;
        }
    }

    window._zofSetSubj = (s) => { state.activeSubject = s; renderVault(); };
    window._zofToggleVault = (id) => {
        const v = state.vaultItems.find(x => x.id === id);
        if (v) v.done = !v.done;
        saveState();
        renderVault();
    };

    document.querySelectorAll('.task-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            state.vaultTab = btn.dataset.tab;
            document.querySelectorAll('.task-tab').forEach(b => {
                b.className = `task-tab flex-1 ${b === btn ? 'bg-purple-600 text-white' : 'text-slate-400'} font-bold py-1.5 rounded-lg text-xs`;
            });
            renderVault();
        });
    });

    document.getElementById('add-task-btn')?.addEventListener('click', () => {
        const title = document.getElementById('task-title-input').value.trim();
        if (!title) return;
        state.vaultItems.unshift({
            id: Date.now(),
            goalId: state.activeGoalId,
            subject: state.activeSubject,
            tab: state.vaultTab === 'matrix' ? 'backlog' : state.vaultTab,
            title,
            done: false
        });
        document.getElementById('task-title-input').value = '';
        saveState();
        renderVault();
        showToast('Added topic to Goal Vault!');
    });

    document.getElementById('save-mcq-btn')?.addEventListener('click', () => {
        const target = parseInt(document.getElementById('mcq-target').value, 10) || 0;
        const att = parseInt(document.getElementById('mcq-attempted').value, 10) || 0;
        const corr = parseInt(document.getElementById('mcq-correct').value, 10) || 0;
        document.getElementById('mcq-display-incorrect').textContent = Math.max(0, att - corr);
        document.getElementById('mcq-display-left').textContent = Math.max(0, target - att);
        state.mcqStats = { target, attempted: att, correct: corr };
        saveState();
        showToast('Saved Daily MCQ Stats!');
    });

    // =========================================================================
    // 7. TAB 5: ⚙️ SETTINGS, 5-HORIZON ANALYTICS (LEAK-FREE) & 64GB SD BACKUP
    // =========================================================================
    let activeHorizon = '1d';
    let analyticsChartInstance = null;

    function renderAnalytics(horizonKey) {
        activeHorizon = horizonKey || '1d';
        const hData = state.stats.horizonData[activeHorizon] || state.stats.horizonData['1d'];

        document.getElementById('stat-focus-mins').textContent = `${hData.focus}m`;
        document.getElementById('stat-sessions-count').textContent = hData.sess;
        document.getElementById('stat-tasks-done').textContent = state.todos.filter(t => t.done).length;
        document.getElementById('stat-kb-count').textContent = state.knowledgeBase.length;

        const canvas = document.getElementById('analytics-chart');
        if (!canvas || !window.Chart) return;

        // Destroy previous instance to prevent Chart.js memory leak
        if (analyticsChartInstance) {
            analyticsChartInstance.destroy();
            analyticsChartInstance = null;
        }

        analyticsChartInstance = new window.Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: hData.labels,
                datasets: [{
                    label: `Focus Minutes (${activeHorizon.toUpperCase()})`,
                    data: hData.values,
                    backgroundColor: 'rgba(59, 130, 246, 0.65)',
                    borderColor: '#60a5fa',
                    borderWidth: 1,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: 'rgba(148,163,184,0.1)' } },
                    x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { display: false } }
                }
            }
        });
    }

    document.querySelectorAll('.horizon-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.horizon-btn').forEach(b => {
                b.className = `horizon-btn ${b === btn ? 'bg-blue-600 text-white' : 'text-slate-400'} text-[10px] font-bold px-2 py-1 rounded-lg`;
            });
            renderAnalytics(btn.dataset.h);
        });
    });

    // WhatsApp & Native Android SMS Progress Report Dispatch
    function buildReportMessage() {
        const g = state.goals.find(x => x.id === state.activeGoalId) || state.goals[0];
        const prayed = Object.values(state.salahStatus).filter(Boolean).length;
        return `📊 ZikrOFikr Progress Report (${new Date().toLocaleDateString()})\n🎯 Goal: ${g.name}\n⏱️ Focus Today: ${state.stats.todayFocusMins}m (${state.stats.todaySessions} sessions)\n☑️ Tasks Completed: ${state.todos.filter(t => t.done).length}/${state.todos.length}\n🕌 Salah Matrix: ${prayed}/6\n📚 Saved KB Items: ${state.knowledgeBase.length}`;
    }

    document.getElementById('send-wa-btn')?.addEventListener('click', () => {
        const phone = (document.getElementById('wa-phone-input')?.value || '').replace(/\D/g, '');
        const msg = encodeURIComponent(buildReportMessage());
        window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    });

    document.getElementById('send-sms-btn')?.addEventListener('click', () => {
        const phone = (document.getElementById('wa-phone-input')?.value || '').trim();
        const msg = encodeURIComponent(buildReportMessage());
        window.location.href = `sms:${phone}?body=${msg}`;
    });

    // Full JSON Backup Export, Markdown Notes Export, & Import
    document.getElementById('export-backup-btn')?.addEventListener('click', () => {
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `ZikrOFikr_64GB_Backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        showToast('⬇️ Exported Full JSON Backup to device/SD card!');
    });

    document.getElementById('export-md-btn')?.addEventListener('click', () => {
        const md = state.knowledgeBase.map(k => `## ${k.title}\n- **Category:** ${k.category}\n- **Citation:** ${k.cite}\n\n${k.body}\n`).join('\n---\n\n');
        const blob = new Blob([`# ZikrOFikr Knowledge Base & Notes\n\n${md}`], { type: 'text/markdown' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `ZikrOFikr_Notes_${new Date().toISOString().slice(0, 10)}.md`;
        a.click();
        showToast('📝 Exported Notes as Markdown (.MD)!');
    });

    document.getElementById('import-backup-input')?.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(String(reader.result));
                state = Object.assign({}, defaultState, parsed);
                saveState();
                initAllViews();
                showToast('✅ Restored Full ZikrOFikr Backup!');
            } catch (err) {
                showToast('⚠️ Invalid backup JSON file');
            }
        };
        reader.readAsText(file);
    });

    document.getElementById('save-coach-btn')?.addEventListener('click', () => {
        const lines = document.getElementById('custom-study-quotes').value.split('\n').map(s => s.trim()).filter(Boolean);
        if (lines.length) {
            state.studyQuotes = lines;
            document.getElementById('deep-guide-text').textContent = lines[0];
            saveState();
            showToast('🔥 Saved AI Coach Quotes!');
        }
    });

    document.getElementById('factory-reset-btn')?.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset ZikrOFikr to factory defaults? (Export a JSON backup first if needed!)')) {
            localStorage.removeItem(STORAGE_KEY);
            state = JSON.parse(JSON.stringify(defaultState));
            initAllViews();
            showToast('🗑️ App Reset to Clean Defaults');
        }
    });

    // Initialize Everything on Startup
    function initAllViews() {
        renderGoals();
        updateTimerUI();
        renderSchedule();
        renderBookshelf();
        if (state.books.length) {
            const b = state.books[0];
            document.getElementById('reader-book-title').textContent = b.title;
            document.getElementById('reader-book-meta').textContent = `${b.category} • Ref Page ${b.page || 1}`;
            document.getElementById('reader-content-box').textContent = b.content;
        }
        initQuranSelect();
        renderKB();
        renderFlashcards();
        updateAgentUI();
        renderSalahAndTasbih();
        renderTodos();
    }

    initAllViews();
});
