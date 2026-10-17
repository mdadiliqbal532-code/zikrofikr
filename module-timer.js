/* ============================================================================
   ZikrOFikr OS — Pomodoro, Overtime (+00:00), 3-Tier Drift Guard & 7-Day Plan
   File: module-timer.js (Complete Single-File Module)
   ============================================================================ */

(function () {
    'use strict';

    ZOF.onReady(() => {
        const state = ZOF.state;
        let timerInterval = null;
        let isRunning = false;
        let isOvertime = false;
        let remainingSecs = 50 * 60;
        let overtimeSecs = 0;

        const timeDisplay = document.getElementById('time-display');
        const sessionTypeEl = document.getElementById('session-type');
        const phaseDisplay = document.getElementById('current-phase-display');
        const overtimeBadge = document.getElementById('overtime-badge');
        const startBtn = document.getElementById('start-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const doneBtn = document.getElementById('complete-main-btn');
        const linkedBtn = document.getElementById('open-linked-study-btn');

        // =====================================================================
        // 1. OFFLINE WEB-AUDIO CHIME (ZERO EXTERNAL MP3 NEEDED)
        // =====================================================================
        function playChime(freq = 660, duration = 0.25) {
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (!AudioCtx) return;
                const ctx = new AudioCtx();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + duration);
            } catch (e) { /* Audio muted */ }
        }

        // =====================================================================
        // 2. 3-TIER STRICT PRIORITY & DRIFT GUARD ENGINE
        // =====================================================================
        function evaluateDriftGuard(AttemptingTier) {
            const lockSelect = document.getElementById('focus-lock-mode');
            const mode = lockSelect?.value || state.focusLockMode || 'gated';
            state.focusLockMode = mode;

            const pill = document.getElementById('drift-guard-pill');
            const banner = document.getElementById('strict-drift-banner');
            const bannerTxt = document.getElementById('strict-drift-text');

            const prayedCount = Object.values(state.salahStatus || {}).filter(Boolean).length;
            const priMins = state.stats?.todayPrimaryMins || 0;

            // Tier 2: 100% Main Goal Lockdown Mode
            if (mode === 'lockdown' && AttemptingTier === 'side') {
                banner?.classList.remove('hidden');
                if (bannerTxt) bannerTxt.textContent = '🔥 100% MAIN GOAL LOCKDOWN ACTIVE: Side Goals are strictly locked until you switch back to Gated/Flexible mode!';
                if (pill) { pill.textContent = '🔥 Lockdown ON'; pill.className = 'text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-700/60'; }
                return false;
            }

            // Tier 3: Strict Gated Mode (Requires >= 100m Main Goal + >= 1 Salah Checked)
            if (mode === 'gated' && AttemptingTier === 'side' && (priMins < 100 || prayedCount < 1)) {
                banner?.classList.remove('hidden');
                if (bannerTxt) bannerTxt.textContent = `🛑 STRICT DRIFT GUARD: You have ${priMins}/100m Main Goal & ${prayedCount} Salah logged today. Complete your Main Goal quota before unlocking Side Goals!`;
                if (pill) { pill.textContent = '🛑 Side Locked'; pill.className = 'text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700/60'; }
                return false;
            }

            banner?.classList.add('hidden');
            if (pill) {
                pill.textContent = mode === 'lockdown' ? '🔥 Main Lockdown' : `🛡️ Guard OK (${priMins}m Main)`;
                pill.className = 'text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-700/50 cursor-pointer';
            }
            return true;
        }

        window.ZOF.evaluateDriftGuard = evaluateDriftGuard;

        document.getElementById('focus-lock-mode')?.addEventListener('change', (e) => {
            state.focusLockMode = e.target.value;
            evaluateDriftGuard();
            ZOF.saveState();
            ZOF.toast(`🛡️ Priority Guard Mode: ${e.target.value.toUpperCase()}`);
        });

        document.getElementById('resolve-drift-btn')?.addEventListener('click', () => {
            const priIdx = (state.sessions || []).findIndex(s => s.tier === 'primary' && !s.done);
            if (priIdx >= 0) {
                state.currentSessionIdx = priIdx;
                loadCurrentSession();
            }
            document.getElementById('strict-drift-banner')?.classList.add('hidden');
            ZOF.toast('🎯 Switched to Primary Goal Session!');
        });

        // =====================================================================
        // 3. POMODORO FOCUS TIMER + OVERTIME (+00:00) ENGINE
        // =====================================================================
        function getCurrentSession() {
            const list = state.sessions || [];
            if (!list.length) {
                list.push({ title: 'Deep Study Block', duration: 50, type: 'work', tier: 'primary', done: false });
            }
            state.currentSessionIdx = Math.max(0, Math.min(list.length - 1, state.currentSessionIdx || 0));
            return list[state.currentSessionIdx];
        }

        function formatMMSS(totalSecs, prefix = '') {
            const m = Math.floor(Math.abs(totalSecs) / 60);
            const s = Math.abs(totalSecs) % 60;
            return `${prefix}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }

        function updateTimerUI() {
            const sess = getCurrentSession();
            if (!sess) return;

            if (timeDisplay) {
                timeDisplay.textContent = isOvertime ? formatMMSS(overtimeSecs, '+') : formatMMSS(remainingSecs);
            }
            if (sessionTypeEl) {
                const tierIcon = sess.tier === 'deen' ? '🕌' : (sess.tier === 'side' ? '⚡' : '🎯');
                sessionTypeEl.textContent = `${tierIcon} ${sess.title}`;
            }

            const isBreak = sess.type === 'break';
            if (phaseDisplay) {
                phaseDisplay.textContent = isBreak ? 'RECOVERY BREAK PHASE' : (sess.tier === 'deen' ? 'DEEN & HIFZ SANCTUARY' : 'DEEP STUDY PHASE');
            }
            document.getElementById('anim-study')?.classList.toggle('hidden', isBreak);
            document.getElementById('anim-break')?.classList.toggle('hidden', !isBreak);

            if (overtimeBadge) {
                overtimeBadge.classList.toggle('hidden', !isOvertime);
                if (isOvertime) overtimeBadge.textContent = `🔥 OVERTIME (${formatMMSS(overtimeSecs, '+')})`;
            }

            if (linkedBtn) {
                linkedBtn.classList.toggle('hidden', !sess.linkedType);
                linkedBtn.onclick = () => {
                    ZOF.switchTab('page-library');
                    if (sess.linkedType === 'cards') document.querySelector('[data-lib="lib-panel-cards"]')?.click();
                    else document.querySelector('[data-lib="lib-panel-reader"]')?.click();
                };
            }

            // Morning Executive Briefing Update
            const dueCards = (state.flashcards || []).filter(c => !c.mastered).length;
            const briefEl = document.getElementById('morning-briefing-line');
            if (briefEl) {
                briefEl.textContent = `🌅 Briefing: ${state.stats.todayPrimaryMins || 0}m Main Goal logged today • ${dueCards} Due Flashcards • Active: ${sess.title}`;
            }
        }

        function loadCurrentSession() {
            pauseTimer();
            const sess = getCurrentSession();
            isOvertime = false;
            overtimeSecs = 0;
            remainingSecs = (parseInt(sess?.duration, 10) || 50) * 60;
            doneBtn?.classList.add('hidden');
            updateTimerUI();
            renderSchedule();
        }

        function startTimer() {
            const sess = getCurrentSession();
            if (!evaluateDriftGuard(sess.tier || 'primary')) return;

            if (isRunning) return;
            isRunning = true;
            startBtn?.classList.add('hidden');
            pauseBtn?.classList.remove('hidden');
            doneBtn?.classList.remove('hidden');

            // Rotate motivational focus quote
            const quotes = state.studyQuotes?.length ? state.studyQuotes : ['No distractions. Lock in.'];
            const qEl = document.getElementById('deep-guide-text');
            if (qEl) qEl.textContent = quotes[Math.floor(Math.random() * quotes.length)];

            timerInterval = setInterval(() => {
                if (!isOvertime) {
                    if (remainingSecs > 0) {
                        remainingSecs--;
                    } else {
                        playChime(880, 0.35);
                        if (sess.type === 'break') {
                            completeSession();
                            return;
                        }
                        isOvertime = true;
                        overtimeSecs = 1;
                        ZOF.toast('🔥 Base Session Complete! Overtime (+00:00) Auto-Started!');
                    }
                } else {
                    overtimeSecs++;
                }
                updateTimerUI();
            }, 1000);
        }

        function pauseTimer() {
            isRunning = false;
            if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
            startBtn?.classList.remove('hidden');
            pauseBtn?.classList.add('hidden');
        }

        function completeSession() {
            pauseTimer();
            const sess = getCurrentSession();
            const baseMins = parseInt(sess.duration, 10) || 25;
            const extraMins = Math.round(overtimeSecs / 60);
            const totalLogged = sess.type === 'work' ? (baseMins + extraMins) : 0;

            sess.done = true;
            if (totalLogged > 0) {
                state.stats.todayFocusMins = (state.stats.todayFocusMins || 0) + totalLogged;
                state.stats.todaySessions = (state.stats.todaySessions || 0) + 1;
                if (sess.tier === 'side') state.stats.todaySideMins = (state.stats.todaySideMins || 0) + totalLogged;
                else if (sess.tier === 'deen') state.stats.todayDeenMins = (state.stats.todayDeenMins || 0) + totalLogged;
                else state.stats.todayPrimaryMins = (state.stats.todayPrimaryMins || 0) + totalLogged;
            }

            playChime(528, 0.3);

            // Show Full-Screen Break Overlay + 30s Brain Dump after Work Session
            if (sess.type === 'work') {
                const rulesEl = document.getElementById('break-overlay-rules');
                if (rulesEl) rulesEl.textContent = state.breakRules || '1. Hydrate. 2. Stretch spine. 3. Look 20ft away.';
                document.getElementById('break-overlay-modal')?.classList.remove('hidden');
            }

            if (state.currentSessionIdx < state.sessions.length - 1) {
                state.currentSessionIdx++;
            }
            ZOF.saveState();
            evaluateDriftGuard();
            loadCurrentSession();
            ZOF.toast(`✅ Logged ${totalLogged}m (${extraMins}m Overtime)!`);
        }

        startBtn?.addEventListener('click', startTimer);
        pauseBtn?.addEventListener('click', pauseTimer);
        doneBtn?.addEventListener('click', completeSession);
        document.getElementById('skip-btn')?.addEventListener('click', () => {
            state.currentSessionIdx = (state.currentSessionIdx + 1) % state.sessions.length;
            loadCurrentSession();
        });
        document.getElementById('undo-btn')?.addEventListener('click', () => {
            state.currentSessionIdx = Math.max(0, state.currentSessionIdx - 1);
            loadCurrentSession();
        });

        document.getElementById('dim-btn')?.addEventListener('click', () => {
            document.body.classList.toggle('oled-dim');
            ZOF.toast('🌙 Toggled OLED Battery-Saver Dim Mode');
        });

        document.getElementById('edit-live-sess-btn')?.addEventListener('click', () => {
            const sess = getCurrentSession();
            const newTitle = prompt('Edit Current Session Title:', sess.title);
            const newDur = prompt('Edit Duration (minutes):', String(sess.duration));
            if (newTitle) sess.title = newTitle.trim();
            if (newDur && !isNaN(parseInt(newDur, 10))) sess.duration = Math.max(1, parseInt(newDur, 10));
            ZOF.saveState();
            loadCurrentSession();
        });

        // Break Overlay + 30-Second Brain Dump Handlers
        document.getElementById('close-break-overlay-btn')?.addEventListener('click', () => {
            document.getElementById('break-overlay-modal')?.classList.add('hidden');
        });
        document.getElementById('save-brain-dump-btn')?.addEventListener('click', () => {
            const dump = ZOF.sanitizeText(document.getElementById('brain-dump-input')?.value.trim() || '');
            if (dump) {
                state.knowledgeBase.unshift({
                    id: Date.now(),
                    category: 'Exam Prep',
                    type: 'Note',
                    edition: '30s Recall Dump',
                    cite: `Post-Session Brain Dump (${new Date().toLocaleDateString()})`,
                    title: `30s Brain Dump: ${dump.slice(0, 36)}...`,
                    body: dump,
                    hash: ZOF.hashText(dump),
                    selectedForAI: true
                });
                document.getElementById('brain-dump-input').value = '';
                ZOF.saveState();
                if (window.ZOF.renderKB) window.ZOF.renderKB();
                ZOF.toast('🧠 Saved 30s Active Recall Brain Dump to Verified KB!');
            }
            document.getElementById('break-overlay-modal')?.classList.add('hidden');
        });

        // =====================================================================
        // 4. 7-DAY BARAKAH PROTOCOL & TEMPLATE BUILDER
        // =====================================================================
        const viewFocus = document.getElementById('timer-view-focus');
        const viewPlan = document.getElementById('timer-view-plan');
        const btnTimer = document.getElementById('btn-show-timer');
        const btnProto = document.getElementById('btn-show-protocol');

        btnTimer?.addEventListener('click', () => {
            viewFocus?.classList.remove('hidden');
            viewPlan?.classList.add('hidden');
            btnTimer.className = 'timer-sub-btn bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg';
            btnProto.className = 'timer-sub-btn text-slate-400 text-[10px] font-bold px-2.5 py-1 rounded-lg';
        });

        btnProto?.addEventListener('click', () => {
            viewFocus?.classList.add('hidden');
            viewPlan?.classList.remove('hidden');
            viewPlan?.classList.add('flex');
            btnProto.className = 'timer-sub-btn bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg';
            btnTimer.className = 'timer-sub-btn text-slate-400 text-[10px] font-bold px-2.5 py-1 rounded-lg';
            renderSchedule();
            renderTemplateBuilder();
        });

        function renderSchedule() {
            const box = document.getElementById('schedule-container');
            const badge = document.getElementById('session-count-badge');
            if (!box) return;
            const left = (state.sessions || []).filter(s => !s.done).length;
            if (badge) badge.textContent = `${left} Left`;

            box.innerHTML = (state.sessions || []).map((s, idx) => {
                const isCur = idx === state.currentSessionIdx;
                const tierBadge = s.tier === 'deen' ? '🕌 Deen' : (s.tier === 'side' ? '⚡ Side' : '🎯 Main');
                return `
                    <div onclick="window.ZOF.selectSession(${idx})" class="p-2.5 rounded-xl border ${isCur ? 'bg-blue-950/40 border-blue-500' : 'bg-slate-900 border-slate-800'} flex justify-between items-center cursor-pointer">
                        <div class="flex items-center gap-2">
                            <span class="text-xs">${s.done ? '✅' : (isCur ? '▶️' : '⏳')}</span>
                            <div>
                                <div class="text-xs font-bold ${s.done ? 'line-through text-slate-500' : 'text-white'}">${ZOF.sanitizeText(s.title)}</div>
                                <span class="text-[9px] font-mono text-emerald-400">${tierBadge} • ${s.type.toUpperCase()}</span>
                            </div>
                        </div>
                        <span class="text-xs font-mono font-bold text-slate-300">${s.duration}m</span>
                    </div>`;
            }).join('');
        }

        window.ZOF.renderSchedule = renderSchedule;
        window.ZOF.selectSession = (idx) => {
            state.currentSessionIdx = idx;
            loadCurrentSession();
            btnTimer?.click();
        };

        document.getElementById('barakah-auto-schedule-btn')?.addEventListener('click', () => {
            state.sessions = [
                { title: 'Fajr Salah + 20m Quran Hifz Sanctuary', duration: 25, type: 'work', tier: 'deen', done: false },
                { title: 'Post-Fajr Peak Block 1: Physics / Hard Concept', duration: 50, type: 'work', tier: 'primary', done: false, linkedType: 'reader' },
                { title: 'Hydration & Spine Stretch Break', duration: 10, type: 'break', tier: 'primary', done: false },
                { title: 'Post-Fajr Peak Block 2: Medical Physiology & Cards', duration: 50, type: 'work', tier: 'primary', done: false, linkedType: 'cards' },
                { title: 'Dhuhr Salah + Sunnah Qailulah Power Rest', duration: 25, type: 'break', tier: 'deen', done: false },
                { title: 'Asr Active Recall: 60 Timed OMR MCQs', duration: 45, type: 'work', tier: 'primary', done: false },
                { title: 'Evening Side-Goal Sandbox (Coding / Creator)', duration: 35, type: 'work', tier: 'side', done: false }
            ];
            state.currentSessionIdx = 0;
            ZOF.saveState();
            loadCurrentSession();
            ZOF.toast('🕌 Loaded Sunnah Barakah Schedule (Fajr Peak + Qailulah + Main Quota First)!');
        });

        document.getElementById('interleave-schedule-btn')?.addEventListener('click', () => {
            state.sessions.reverse();
            state.currentSessionIdx = 0;
            ZOF.saveState();
            renderSchedule();
            ZOF.toast('🔄 Interleaved Subject Order for Higher Retention!');
        });

        // 7-Day Template Builder
        function renderTemplateBuilder() {
            const listEl = document.getElementById('settings-list');
            if (!listEl) return;
            const day = state.activeTemplateDay || '1';
            const items = state.templates[day] || [];
            listEl.innerHTML = items.map((it, idx) => `
                <div class="flex justify-between items-center bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs">
                    <span><b>${ZOF.sanitizeText(it.title)}</b> (${it.duration}m • ${it.tier || 'primary'})</span>
                    <button type="button" onclick="window.ZOF.delTemplateItem(${idx})" class="text-red-400 font-bold">✕</button>
                </div>`).join('') || '<p class="text-[11px] text-slate-500 text-center">No blocks in this day template yet.</p>';
        }

        window.ZOF.delTemplateItem = (idx) => {
            const day = state.activeTemplateDay || '1';
            state.templates[day].splice(idx, 1);
            ZOF.saveState();
            renderTemplateBuilder();
        };

        document.querySelectorAll('.day-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                state.activeTemplateDay = btn.dataset.day;
                document.querySelectorAll('.day-tab-btn').forEach(b => {
                    b.className = `day-tab-btn flex-1 min-w-[38px] ${b === btn ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'} text-[10px] py-1.5 rounded-lg font-bold`;
                });
                renderTemplateBuilder();
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
            const title = document.getElementById('new-sess-title')?.value.trim();
            const dur = parseInt(document.getElementById('new-sess-dur')?.value, 10) || 50;
            const type = document.getElementById('new-sess-type')?.value || 'work';
            const tier = document.getElementById('new-sess-goal-tier')?.value || 'primary';
            if (!title) return ZOF.toast('Enter a session title');
            const day = state.activeTemplateDay || '1';
            if (!state.templates[day]) state.templates[day] = [];
            state.templates[day].push({ title, duration: dur, type, tier });
            document.getElementById('new-sess-title').value = '';
            ZOF.saveState();
            renderTemplateBuilder();
        });

        document.getElementById('clone-day-btn')?.addEventListener('click', () => {
            const src = state.templates[state.activeTemplateDay || '1'] || [];
            ['0', '1', '2', '3', '4', '5', '6'].forEach(d => {
                state.templates[d] = JSON.parse(JSON.stringify(src));
            });
            ZOF.saveState();
            ZOF.toast('📋 Cloned Template to All 7 Days of the Week!');
        });

        document.getElementById('load-day-btn')?.addEventListener('click', () => {
            const src = state.templates[state.activeTemplateDay || '1'] || [];
            if (!src.length) return ZOF.toast('Add at least 1 block to this day first');
            state.sessions = src.map(s => Object.assign({}, s, { done: false }));
            state.currentSessionIdx = 0;
            ZOF.saveState();
            loadCurrentSession();
            btnTimer?.click();
            ZOF.toast('🌅 Loaded Day Template into Live Protocol!');
        });

        evaluateDriftGuard();
        loadCurrentSession();
    });
})();
