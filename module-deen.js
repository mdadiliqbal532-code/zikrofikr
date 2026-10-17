/* ============================================================================
   ZikrOFikr OS — Deen Sanctuary, 114-Surah Quran, Aladhan & Hifz Engine
   File: module-deen.js (Complete Single-File Module)
   ============================================================================ */

(function () {
    'use strict';

    ZOF.onReady(() => {
        const state = ZOF.state;

        // =====================================================================
        // 1. COMPLETE 114-SURAH INDEX & OFFLINE FALLBACK VERSES
        // =====================================================================
        const SURAH_NAMES = [
            "1. Al-Fatihah","2. Al-Baqarah","3. Ali 'Imran","4. An-Nisa","5. Al-Ma'idah","6. Al-An'am","7. Al-A'raf","8. Al-Anfal","9. At-Tawbah","10. Yunus",
            "11. Hud","12. Yusuf","13. Ar-Ra'd","14. Ibrahim","15. Al-Hijr","16. An-Nahl","17. Al-Isra","18. Al-Kahf","19. Maryam","20. Taha",
            "21. Al-Anbiya","22. Al-Hajj","23. Al-Mu'minun","24. An-Nur","25. Al-Furqan","26. Ash-Shu'ara","27. An-Naml","28. Al-Qasas","29. Al-'Ankabut","30. Ar-Rum",
            "31. Luqman","32. As-Sajdah","33. Al-Ahzab","34. Saba","35. Fatir","36. Ya-Sin","37. As-Saffat","38. Sad","39. Az-Zumar","40. Ghafir",
            "41. Fussilat","42. Ash-Shuraa","43. Az-Zukhruf","44. Ad-Dukhan","45. Al-Jathiyah","46. Al-Ahqaf","47. Muhammad","48. Al-Fath","49. Al-Hujurat","50. Qaf",
            "51. Adh-Dhariyat","52. At-Tur","53. An-Najm","54. Al-Qamar","55. Ar-Rahman","56. Al-Waqi'ah","57. Al-Hadid","58. Al-Mujadila","59. Al-Hashr","60. Al-Mumtahanah",
            "61. As-Saff","62. Al-Jumu'ah","63. Al-Munafiqun","64. At-Taghabun","65. At-Talaq","66. At-Tahrim","67. Al-Mulk","68. Al-Qalam","69. Al-Haqqah","70. Al-Ma'arij",
            "71. Nuh","72. Al-Jinn","73. Al-Muzzammil","74. Al-Muddaththir","75. Al-Qiyamah","76. Al-Insan","77. Al-Mursalat","78. An-Naba","79. An-Nazi'at","80. 'Abasa",
            "81. At-Takwir","82. Al-Infitar","83. Al-Mutaffifin","84. Al-Inshiqaq","85. Al-Buruj","86. At-Tariq","87. Al-A'la","88. Al-Ghashiyah","89. Al-Fajr","90. Al-Balad",
            "91. Ash-Shams","92. Al-Layl","93. Ad-Duhaa","94. Ash-Sharh","95. At-Tin","96. Al-'Alaq","97. Al-Qadr","98. Al-Bayyinah","99. Az-Zalzalah","100. Al-'Adiyat",
            "101. Al-Qari'ah","102. At-Takathur","103. Al-'Asr","104. Al-Humazah","105. Al-Fil","106. Quraysh","107. Al-Ma'un","108. Al-Kawthar","109. Al-Kafirun","110. An-Nasr",
            "111. Al-Masad","112. Al-Ikhlas","113. Al-Falaq","114. An-Nas"
        ];

        const OFFLINE_SURAHS = {
            1: [
                { n: 1, ar: "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ", en: "In the name of Allah, the Entirely Merciful, the Especially Merciful." },
                { n: 2, ar: "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ", en: "[All] praise is [due] to Allah, Lord of the worlds -" },
                { n: 3, ar: "ٱلرَّحْمَٰنِ ٱلرَّحِيمِ", en: "The Entirely Merciful, the Especially Merciful," },
                { n: 4, ar: "مَٰلِكِ يَوْمِ ٱلدِّينِ", en: "Sovereign of the Day of Recompense." },
                { n: 5, ar: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", en: "It is You we worship and You we ask for help." },
                { n: 6, ar: "ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ", en: "Guide us to the straight path -" },
                { n: 7, ar: "صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ", en: "The path of those upon whom You have bestowed favor, not of those who have evoked [Your] anger or of those who are astray." }
            ],
            103: [
                { n: 1, ar: "وَٱلْعَصْرِ", en: "By time," },
                { n: 2, ar: "إِنَّ ٱلْإِنسَٰنَ لَفِى خُسْرٍ", en: "Indeed, mankind is in loss," },
                { n: 3, ar: "إِلَّا ٱلَّذِينَ ءَامَنُوا۟ وَعَمِلُوا۟ ٱلصَّٰلِحَٰتِ وَتَوَاصَوْا۟ بِٱلْحَقِّ وَتَوَاصَوْا۟ بِٱلصَّبْرِ", en: "Except for those who have believed and done righteous deeds and advised each other to truth and advised each other to patience." }
            ],
            112: [
                { n: 1, ar: "قُلْ هُوَ ٱللَّهُ أَحَدٌ", en: "Say, 'He is Allah, [who is] One," },
                { n: 2, ar: "ٱللَّهُ ٱلصَّمَدُ", en: "Allah, the Eternal Refuge." },
                { n: 3, ar: "لَمْ يَلِدْ وَلَمْ يُولَدْ", en: "He neither begets nor is born," },
                { n: 4, ar: "وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ", en: "Nor is there to Him any equivalent.'" }
            ],
            113: [
                { n: 1, ar: "قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ", en: "Say, 'I seek refuge in the Lord of daybreak" },
                { n: 2, ar: "مِن شَرِّ مَا خَلَقَ", en: "From the evil of that which He created" },
                { n: 3, ar: "وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ", en: "And from the evil of darkness when it settles" },
                { n: 4, ar: "وَمِن شَرِّ ٱلنَّفَّٰثَٰتِ فِى ٱلْعُقَدِ", en: "And from the evil of the blowers in knots" },
                { n: 5, ar: "وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ", en: "And from the evil of an envier when he envies.'" }
            ],
            114: [
                { n: 1, ar: "قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ", en: "Say, 'I seek refuge in the Lord of mankind," },
                { n: 2, ar: "مَلِكِ ٱلنَّاسِ", en: "The Sovereign of mankind," },
                { n: 3, ar: "إِلَٰهِ ٱلنَّاسِ", en: "The God of mankind," },
                { n: 4, ar: "مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ", en: "From the evil of the retreating whisperer -" },
                { n: 5, ar: "ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ", en: "Who whispers [evil] into the breasts of mankind -" },
                { n: 6, ar: "مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ", en: "From among the jinn and mankind.'" }
            ]
        };

        const surahSelect = document.getElementById('quran-surah-select');
        const versesBox = document.getElementById('quran-verses-container');
        const statusBar = document.getElementById('quran-status-bar');
        let activeSurahVerses = OFFLINE_SURAHS[1];

        if (surahSelect) {
            surahSelect.innerHTML = SURAH_NAMES.map((name, i) => `<option value="${i + 1}">${name}</option>`).join('');
        }

        // =====================================================================
        // 2. CLASSICAL ARABIC ROOT (JIZR) & MORPHOLOGY DICTIONARY
        // =====================================================================
        const ARABIC_ROOT_DICT = {
            "بِسْمِ": "Root: س-م-و (S-M-W) • Noun (Ism: Name/Attribute) • Prep: Bi (With)",
            "ٱللَّهِ": "Root: أ-ل-ه (A-L-H) • Proper Name of the Creator (Allah)",
            "ٱلرَّحْمَٰنِ": "Root: ر-ح-م (R-H-M) • Intensive Pattern (Fa'laan): The Entirely Merciful",
            "ٱلرَّحِيمِ": "Root: ر-ح-م (R-H-M) • Permanent Pattern (Fa'eel): The Especially Merciful",
            "ٱلْحَمْدُ": "Root: ح-م-د (H-M-D) • Praise & Gratitude combined with love and veneration",
            "رَبِّ": "Root: ر-ب-ب (R-B-B) • Sustainer, Cherisher, Sovereign Master",
            "نَعْبُدُ": "Root: ع-ب-د ('A-B-D) • Imperfect Verb (1st Pers. Pl.): We worship / submit",
            "ٱهْدِنَا": "Root: ه-د-ي (H-D-Y) • Imperative Verb + Object: Guide us",
            "وَٱلْعَصْرِ": "Root: ع-ص-ر ('A-S-R) • Oath by Time / Afternoon",
            "ٱلصَّبْرِ": "Root: ص-ب-ر (S-B-R) • Patience, steadfastness & perseverance"
        };

        window.ZOF.lookupArabicOrTerm = (word) => {
            const clean = (word || '').trim();
            const match = ARABIC_ROOT_DICT[clean];
            if (match) {
                ZOF.toast(`📖 ${clean} → ${match}`);
                if (statusBar) statusBar.textContent = `📖 Classical Root Analysis: ${clean} → ${match}`;
            } else {
                const stripped = clean.replace(/[\u064B-\u065F\u0670]/g, '');
                const letters = stripped.split('').slice(-3).join('-');
                const info = `Estimated Triliteral Root (Jizr): [${letters}] • Tap "+ KB" in Selection Menu to save lexical note.`;
                ZOF.toast(`📖 ${clean} → ${info}`);
                if (statusBar) statusBar.textContent = `📖 Lexical Lookup (${clean}): ${info}`;
            }
        };

        function renderSurahVerses(surahNum, verses) {
            activeSurahVerses = verses;
            if (!versesBox) return;
            const sName = SURAH_NAMES[surahNum - 1] || `Surah ${surahNum}`;
            if (statusBar) statusBar.textContent = `✅ Loaded ${sName} (${verses.length} Ayahs) • Tap any Arabic word for Root (Jizr) lookup.`;

            versesBox.innerHTML = verses.map(v => {
                const wordsHtml = (v.ar || '').split(/\s+/).map(w => {
                    const esc = w.replace(/'/g, "\\'");
                    return `<span onclick="window.ZOF.lookupArabicOrTerm('${esc}')" class="quran-word">${w}</span>`;
                }).join(' ');

                return `
                    <div class="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                        <div class="flex justify-between items-center text-[10px] font-mono text-emerald-400">
                            <button type="button" onclick="window.ZOF.indexAyahToKB('${sName}', ${v.n})" class="bg-emerald-950/80 border border-emerald-700/50 px-2 py-0.5 rounded hover:bg-emerald-900">+ Save Ayah to Deen KB</button>
                            <span>Ayah ${surahNum}:${v.n}</span>
                        </div>
                        <p class="font-arabic text-xl sm:text-2xl text-white ayah-arabic-text leading-loose" dir="rtl">${wordsHtml}</p>
                        <p class="text-xs text-slate-300 text-left leading-relaxed">${ZOF.sanitizeText(v.en)}</p>
                    </div>`;
            }).join('');
        }

        window.ZOF.indexAyahToKB = (surahName, ayahNum) => {
            const v = activeSurahVerses.find(x => x.n === ayahNum);
            if (!v) return;
            state.knowledgeBase.unshift({
                id: Date.now(),
                category: 'Islamic Learning',
                type: 'Book/PDF',
                edition: 'Uthmani / Sahih Int.',
                cite: `Quran ${surahName}, Ayah ${ayahNum}`,
                title: `${surahName} (${ayahNum}) [[Quran]]`,
                body: `${v.ar}\nTranslation: ${v.en}`,
                hash: ZOF.hashText(v.ar),
                selectedForAI: true
            });
            ZOF.saveState();
            if (window.ZOF.renderKB) window.ZOF.renderKB();
            ZOF.toast(`🕋 Indexed ${surahName} Ayah ${ayahNum} in Deen Knowledge Base!`);
        };

        async function loadSurah(surahNum) {
            const num = parseInt(surahNum, 10) || 1;
            if (!state.quranCache) state.quranCache = {};
            if (state.quranCache[num]) {
                return renderSurahVerses(num, state.quranCache[num]);
            }
            if (OFFLINE_SURAHS[num]) {
                renderSurahVerses(num, OFFLINE_SURAHS[num]);
            }
            if (statusBar) statusBar.textContent = `⏳ Fetching full Uthmani Surah #${num} & caching for offline use...`;
            try {
                const res = await fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,en.sahih`);
                const json = await res.json();
                if (json?.data?.length >= 2) {
                    const arAyahs = json.data[0].ayahs || [];
                    const enAyahs = json.data[1].ayahs || [];
                    const combined = arAyahs.map((a, idx) => ({
                        n: a.numberInSurah,
                        ar: a.text,
                        en: enAyahs[idx]?.text || ''
                    }));
                    state.quranCache[num] = combined;
                    ZOF.saveState();
                    renderSurahVerses(num, combined);
                }
            } catch (err) {
                if (!OFFLINE_SURAHS[num]) {
                    renderSurahVerses(1, OFFLINE_SURAHS[1]);
                    ZOF.toast('📴 Offline Mode: Showing built-in cached Surah (Connect once to cache Surah #' + num + ')');
                }
            }
        }

        document.getElementById('load-surah-btn')?.addEventListener('click', () => loadSurah(surahSelect?.value || 1));
        surahSelect?.addEventListener('change', (e) => loadSurah(e.target.value));

        // Hifz Memorization Blur & Word-by-Word Recitation Diff Checker
        document.getElementById('toggle-hifz-hide-btn')?.addEventListener('click', () => {
            versesBox?.classList.toggle('hifz-blur');
            ZOF.toast('🙈 Toggled Hifz Memorization Blur (Tap/Hover any Ayah to peek)');
        });

        document.getElementById('recitation-check-btn')?.addEventListener('click', () => {
            const diffBox = document.getElementById('recitation-diff-box');
            if (!diffBox || !activeSurahVerses.length) return;
            const targetAyah = activeSurahVerses[0];
            const userRecite = prompt(`🎙️ Hifz Recitation Check (Ayah 1):\nType or use keyboard voice dictation to recite:\n"${targetAyah.en.slice(0, 60)}..."`, targetAyah.ar);
            if (!userRecite) return;

            const norm = (s) => s.replace(/[\u064B-\u065F\u0670]/g, '').trim();
            const expectedWords = targetAyah.ar.split(/\s+/);
            const spokenWords = userRecite.trim().split(/\s+/);

            const diffHtml = expectedWords.map((w, idx) => {
                const match = spokenWords[idx] && norm(spokenWords[idx]) === norm(w);
                return match
                    ? `<span class="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-arabic text-lg">${w}</span>`
                    : `<span class="px-1.5 py-0.5 rounded bg-red-500/25 text-red-300 border-b-2 border-red-500 font-arabic text-lg" title="Expected: ${w}">${w}</span>`;
            }).join(' ');

            diffBox.classList.remove('hidden');
            diffBox.innerHTML = `<div class="text-[10px] font-bold text-emerald-400 mb-1">🎙️ Word-by-Word Hifz Diff (Green = Matched, Red = Missed):</div><div dir="rtl" class="flex flex-wrap gap-1">${diffHtml}</div>`;
        });

        // =====================================================================
        // 3. LIVE HYDERABAD ALADHAN SYNC, 6-SALAH MATRIX & DIGITAL TASBIH
        // =====================================================================
        const SALAH_LIST = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Tahajjud'];

        function renderSalahMatrix() {
            const grid = document.getElementById('salah-tracker-grid');
            const badge = document.getElementById('salah-score-badge');
            const topGuard = document.getElementById('salah-timer-guard');

            const pt = state.prayerTimes || { Fajr: '05:12', Dhuhr: '12:28', Asr: '15:54', Maghrib: '18:18', Isha: '19:34' };
            ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].forEach(p => {
                const el = document.getElementById('p-' + p.toLowerCase());
                if (el && pt[p]) el.textContent = pt[p];
            });

            const prayedCount = SALAH_LIST.filter(p => state.salahStatus?.[p]).length;
            if (badge) badge.textContent = `${prayedCount}/6 Prayed`;
            if (topGuard) topGuard.textContent = `🕌 Salah: ${prayedCount}/6 • Fajr ${pt.Fajr}`;

            if (!grid) return;
            grid.innerHTML = SALAH_LIST.map(p => {
                const done = Boolean(state.salahStatus?.[p]);
                return `
                    <button type="button" onclick="window.ZOF.toggleSalah('${p}')" class="p-2 rounded-xl border text-center transition-all ${done ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'}">
                        <span class="text-xs block">${done ? '✅' : '🕌'}</span>
                        <span class="text-[10px] font-bold block mt-0.5">${p}</span>
                    </button>`;
            }).join('');
        }

        window.ZOF.toggleSalah = (prayer) => {
            if (!state.salahStatus) state.salahStatus = {};
            state.salahStatus[prayer] = !state.salahStatus[prayer];
            ZOF.saveState();
            renderSalahMatrix();
            if (window.ZOF.evaluateDriftGuard) window.ZOF.evaluateDriftGuard();
            ZOF.toast(`🕌 ${prayer}: ${state.salahStatus[prayer] ? 'Alhamdulillah, Marked Prayed!' : 'Unchecked'}`);
        };

        document.getElementById('sync-aladhan-btn')?.addEventListener('click', async () => {
            ZOF.toast('🔄 Syncing Hyderabad Prayer Times from Aladhan...');
            try {
                const res = await fetch('https://api.aladhan.com/v1/timingsByCity?city=Hyderabad&country=India&method=1');
                const json = await res.json();
                const t = json?.data?.timings;
                if (t) {
                    state.prayerTimes = {
                        Fajr: (t.Fajr || '05:12').slice(0, 5),
                        Dhuhr: (t.Dhuhr || '12:28').slice(0, 5),
                        Asr: (t.Asr || '15:54').slice(0, 5),
                        Maghrib: (t.Maghrib || '18:18').slice(0, 5),
                        Isha: (t.Isha || '19:34').slice(0, 5)
                    };
                    ZOF.saveState();
                    renderSalahMatrix();
                    ZOF.toast('✅ Synced Live Hyderabad Prayer Times!');
                }
            } catch (e) {
                ZOF.toast('📴 Offline: Using cached Hyderabad Prayer Timings');
            }
        });

        // Multi-Dhikr Tasbih Counter
        const dhikrSelect = document.getElementById('dhikr-type-select');
        const tasbihDisplay = document.getElementById('tasbih-count-display');

        function renderTasbih() {
            const key = dhikrSelect?.value || 'SubhanAllah';
            if (tasbihDisplay) tasbihDisplay.textContent = String(state.tasbihCounts?.[key] || 0);
        }
        dhikrSelect?.addEventListener('change', renderTasbih);
        document.getElementById('tasbih-tap-box')?.addEventListener('click', () => {
            const key = dhikrSelect?.value || 'SubhanAllah';
            if (!state.tasbihCounts) state.tasbihCounts = {};
            state.tasbihCounts[key] = (state.tasbihCounts[key] || 0) + 1;
            navigator.vibrate?.(18);
            ZOF.saveState();
            renderTasbih();
        });
        document.getElementById('tasbih-reset-btn')?.addEventListener('click', () => {
            const key = dhikrSelect?.value || 'SubhanAllah';
            state.tasbihCounts[key] = 0;
            ZOF.saveState();
            renderTasbih();
        });

        // =====================================================================
        // 4. AUTHENTIC HADITH CYCLER & ISLAMIC DOUBT TRACKER
        // =====================================================================
        const HADITH_COLLECTION = [
            '"Whoever treads a path in search of knowledge, Allah makes easy for him a path to Paradise." (Sahih Muslim 2699)',
            '"The most beloved of deeds to Allah are those that are most consistent, even if they are small." (Sahih al-Bukhari 6464)',
            '"Take advantage of five before five: your youth before your old age, your health before your sickness, your wealth before your poverty, your free time before your preoccupation, and your life before your death." (Mustadrak al-Hakim)',
            '"O Allah, I ask You for beneficial knowledge, goodly provision, and acceptable deeds." (Sunan Ibn Majah 925)'
        ];
        let hadithIdx = 0;
        document.getElementById('next-hadith-btn')?.addEventListener('click', () => {
            hadithIdx = (hadithIdx + 1) % HADITH_COLLECTION.length;
            const el = document.getElementById('hadith-daily-text');
            if (el) el.textContent = HADITH_COLLECTION[hadithIdx];
        });

        function renderDeenDoubts() {
            const list = document.getElementById('deen-doubt-list');
            if (!list) return;
            list.innerHTML = (state.deenDoubts || []).map((d, i) => `
                <div class="flex justify-between items-center bg-slate-950 border border-slate-800 rounded-lg px-2 py-1">
                    <span>❓ ${ZOF.sanitizeText(d)}</span>
                    <button type="button" onclick="window.ZOF.delDeenDoubt(${i})" class="text-emerald-400 font-bold text-[10px]">✓ Resolved</button>
                </div>`).join('');
        }
        window.ZOF.delDeenDoubt = (i) => {
            state.deenDoubts.splice(i, 1);
            ZOF.saveState();
            renderDeenDoubts();
        };
        document.getElementById('add-deen-doubt-btn')?.addEventListener('click', () => {
            const inp = document.getElementById('deen-doubt-input');
            const val = inp?.value.trim();
            if (!val) return;
            state.deenDoubts.unshift(val);
            inp.value = '';
            ZOF.saveState();
            renderDeenDoubts();
            ZOF.toast('❓ Logged Question in Deen Doubt Tracker');
        });

        loadSurah(1);
        renderSalahMatrix();
        renderTasbih();
        renderDeenDoubts();
    });
})();
