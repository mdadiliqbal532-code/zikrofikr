/* ============================================================================
   ZikrOFikr OS — MS To-Do Pro, Goal Vault, OMR Autopsy & 5-Horizon Analytics
   File: module-tasks.js (Complete Single-File Module)
   ============================================================================ */

(function () {
    'use strict';

    ZOF.onReady(() => {
        const state = ZOF.state;
        let newTaskStarred = false;
        let activeDetailTaskId = null;
        let activeHorizon = '1w';
        let chartInstance = null;

        // =====================================================================
        // 1. SUB-VIEW SWITCHER: MS TO-DO PRO <-> GOAL VAULT & MATRIX
        // =====================================================================
        const btnTodo = document.getElementById('btn-tasks-todo');
        const btnVault = document.getElementById('btn-tasks-vault');
        const viewTodo = document.getElementById('tasks-view-todo');
        const viewVault = document.getElementById('tasks-view-vault');

        btnTodo?.addEventListener('click', () => {
            viewTodo?.classList.remove('hidden');
            viewVault?.classList.add('hidden');
            btnTodo.className = 'bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl';
            btnVault.className = 'text-slate-400 text-xs font-bold px-3 py-1.5 rounded-xl';
        });

        btnVault?.addEventListener('click', () => {
            viewTodo?.classList.add('hidden');
            viewVault?.classList.remove('hidden');
            viewVault?.classList.add('flex');
            btnVault.className = 'bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl';
            btnTodo.className = 'text-slate-400 text-xs font-bold px-3 py-1.5 rounded-xl';
            renderVault();
        });

        // =====================================================================
        // 2. MICROSOFT TO-DO PRO ENGINE (LISTS, REPEAT, LINKS & SUB-STEPS)
        // =====================================================================
        function getTodayISO() {
            return new Date().toISOString().slice(0, 10);
        }

        function renderTodoListsBar() {
            const bar = document.getElementById('todo-tabs-bar');
            if (!bar) return;
            const lists = state.todoLists || [];
            bar.innerHTML = lists.map(l => {
                const active = state.todoFilter === l.id;
                return `<button type="button" onclick="window.ZOF.setTodoFilter('${l.id}')" class="px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 ${active ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'}">${ZOF.sanitizeText(l.name)}</button>`;
            }).join('') + `<button type="button" onclick="document.getElementById('new-list-modal').classList.remove('hidden')" class="px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 bg-emerald-950 text-emerald-300 border border-emerald-700/50">+ List</button>`;
        }

        window.ZOF.setTodoFilter = (filterId) => {
            state.todoFilter = filterId;
            ZOF.saveState();
            renderTodoListsBar();
            renderTodos();
        };

        // Custom List Modal
        document.getElementById('cancel-new-list-btn')?.addEventListener('click', () => document.getElementById('new-list-modal')?.classList.add('hidden'));
        document.getElementById('save-new-list-btn')?.addEventListener('click', () => {
            const icon = document.getElementById('custom-list-icon-input')?.value.trim() || '📁';
            const name = document.getElementById('custom-list-name-input')?.value.trim();
            if (!name) return ZOF.toast('Enter a list name');
            const id = 'list_' + Date.now();
            state.todoLists.push({ id, name: `${icon} ${name}` });
            state.todoFilter = id;
            document.getElementById('custom-list-name-input').value = '';
            document.getElementById('new-list-modal')?.classList.add('hidden');
            ZOF.saveState();
            renderTodoListsBar();
            renderTodos();
        });

        // Custom Repeat Days Bar Toggle
        document.getElementById('todo-repeat-quick')?.addEventListener('change', (e) => {
            document.getElementById('custom-repeat-days-bar')?.classList.toggle('hidden', e.target.value !== 'custom_days');
        });
        document.querySelectorAll('.repeat-day-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                const active = btn.classList.contains('bg-blue-600');
                btn.className = active
                    ? 'repeat-day-pill bg-slate-950 text-slate-400 border border-slate-700 text-[10px] font-bold w-8 py-1 rounded-lg'
                    : 'repeat-day-pill bg-blue-600 text-white text-[10px] font-bold w-8 py-1 rounded-lg';
            });
        });

        document.getElementById('todo-star-toggle')?.addEventListener('click', (e) => {
            newTaskStarred = !newTaskStarred;
            e.target.textContent = newTaskStarred ? '⭐' : '☆';
        });

        function renderTodos() {
            const box = document.getElementById('todo-list-container');
            const badge = document.getElementById('todo-count-badge');
            if (!box) return;

            const today = getTodayISO();
            const q = (document.getElementById('todo-search-input')?.value || '').toLowerCase().trim();
            const sortBy = document.getElementById('todo-sort-select')?.value || 'newest';
            const filter = state.todoFilter || 'myday';

            const activeTotal = (state.todos || []).filter(t => !t.done).length;
            const doneTotal = (state.todos || []).filter(t => t.done).length;
            if (badge) badge.textContent = `${activeTotal} Active • ${doneTotal} Done`;
            const statDone = document.getElementById('stat-tasks-done');
            if (statDone) statDone.textContent = String(doneTotal);

            let items = (state.todos || []).filter(t => {
                if (q && !`${t.title} ${t.note || ''}`.toLowerCase().includes(q)) return false;
                if (filter === 'completed') return Boolean(t.done);
                if (t.done && filter !== 'all') return false;
                if (filter === 'myday') return Boolean(t.myDay);
                if (filter === 'important') return Boolean(t.important);
                if (filter === 'planned') return Boolean(t.due);
                if (filter === 'today') return t.due === today;
                if (filter === 'overdue') return Boolean(t.due && t.due < today && !t.done);
                if (filter === 'all') return true;
                return t.list === filter;
            });

            if (sortBy === 'important') items.sort((a, b) => Number(b.important) - Number(a.important));
            else if (sortBy === 'due') items.sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'));
            else if (sortBy === 'az') items.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
            else items.sort((a, b) => (b.id || 0) - (a.id || 0));

            box.innerHTML = items.map(t => {
                const isOverdue = t.due && t.due < today && !t.done;
                const stepsDone = (t.steps || []).filter(s => s.done).length;
                const stepsTotal = (t.steps || []).length;
                const repeatBadge = t.repeat && t.repeat !== 'none'
                    ? `🔁 ${t.repeat === 'custom_days' ? (t.repeatDays || []).join(',') : t.repeat}`
                    : '';

                return `
                    <div class="bg-slate-900 border ${isOverdue ? 'border-red-700/60' : 'border-slate-800'} rounded-2xl p-3 flex items-center justify-between gap-2.5">
                        <div class="flex items-start gap-2.5 min-w-0 flex-1">
                            <input type="checkbox" ${t.done ? 'checked' : ''} onchange="window.ZOF.toggleTodoDone(${t.id})" class="mt-1 w-4 h-4 accent-emerald-500 cursor-pointer">
                            <div onclick="window.ZOF.openTodoDetail(${t.id})" class="min-w-0 flex-1 cursor-pointer">
                                <div class="text-xs font-bold ${t.done ? 'line-through text-slate-500' : 'text-white'} break-words">${ZOF.sanitizeText(t.title)}</div>
                                <div class="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] font-mono">
                                    <span class="px-1.5 py-0.5 rounded bg-slate-950 text-amber-300">${t.priority || 'Medium'}</span>
                                    ${t.due ? `<span class="${isOverdue ? 'text-red-400 font-bold' : 'text-slate-400'}">📅 ${t.due}${t.time || ''}</span>` : ''}
                                    ${repeatBadge ? `<span class="text-purple-300">${repeatBadge}</span>` : ''}
                                    ${stepsTotal ? `<span class="text-emerald-400">☑️ ${stepsDone}/${stepsTotal} steps</span>` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center gap-1.5 shrink-0">
                            ${t.linkedStudy ? `<button type="button" onclick="window.ZOF.openStudyLink('${t.linkedStudy}')" class="bg-emerald-950 text-emerald-300 border border-emerald-700/50 text-[10px] font-bold px-2 py-1 rounded-lg">📖 Open</button>` : ''}
                            <button type="button" onclick="window.ZOF.toggleTodoStar(${t.id})" class="text-sm">${t.important ? '⭐' : '☆'}</button>
                        </div>
                    </div>`;
            }).join('') || '<p class="text-xs text-slate-500 text-center py-6">No tasks in this view. Add a task above or click 💡 Suggestions!</p>';
        }

        window.ZOF.renderTodos = renderTodos;

        window.ZOF.openStudyLink = (linkType) => {
            if (linkType === 'reader') { ZOF.switchTab('page-library'); document.querySelector('[data-lib="lib-panel-reader"]')?.click(); }
            else if (linkType === 'cards') { ZOF.switchTab('page-library'); document.querySelector('[data-lib="lib-panel-cards"]')?.click(); }
            else if (linkType === 'ai') { ZOF.switchTab('page-ai'); }
        };

        document.getElementById('add-todo-btn')?.addEventListener('click', () => {
            const title = document.getElementById('todo-input')?.value.trim();
            if (!title) return ZOF.toast('Enter a task title');
            const priority = document.getElementById('todo-priority-select')?.value || 'Medium';
            const due = document.getElementById('todo-due-input')?.value || getTodayISO();
            const time = document.getElementById('todo-time-input')?.value || '';
            const repeat = document.getElementById('todo-repeat-quick')?.value || 'none';
            const linkedStudy = document.getElementById('todo-link-type')?.value || '';
            const repeatDays = Array.from(document.querySelectorAll('.repeat-day-pill.bg-blue-600')).map(b => b.dataset.d);

            state.todos.unshift({
                id: Date.now(),
                title: ZOF.sanitizeText(title),
                priority,
                list: state.todoFilter,
                myDay: state.todoFilter === 'myday' || due === getTodayISO(),
                important: newTaskStarred || priority === 'High',
                done: false,
                due,
                time,
                repeat,
                repeatDays,
                linkedStudy,
                note: '',
                steps: []
            });

            document.getElementById('todo-input').value = '';
            newTaskStarred = false;
            document.getElementById('todo-star-toggle').textContent = '☆';
            ZOF.saveState();
            renderTodos();
            ZOF.toast('☑️ Added Task to MS To-Do Pro!');
        });

        window.ZOF.toggleTodoDone = (id) => {
            const t = state.todos.find(x => x.id === id);
            if (!t) return;
            t.done = !t.done;
            // Spawn next recurring instance if repeating task is completed
            if (t.done && t.repeat && t.repeat !== 'none') {
                const nextDate = new Date(t.due || getTodayISO());
                nextDate.setDate(nextDate.getDate() + (t.repeat === 'weekly' ? 7 : (t.repeat === 'monthly' ? 30 : 1)));
                state.todos.unshift(Object.assign({}, JSON.parse(JSON.stringify(t)), {
                    id: Date.now(),
                    done: false,
                    due: nextDate.toISOString().slice(0, 10)
                }));
                ZOF.toast('🔁 Completed & Scheduled Next Repeating Task!');
            }
            ZOF.saveState();
            renderTodos();
        };

        window.ZOF.toggleTodoStar = (id) => {
            const t = state.todos.find(x => x.id === id);
            if (t) { t.important = !t.important; ZOF.saveState(); renderTodos(); }
        };

        ['todo-search-input', 'todo-sort-select'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', renderTodos);
            document.getElementById(id)?.addEventListener('change', renderTodos);
        });

        // Task Detail Modal & AI Step Breaker
        window.ZOF.openTodoDetail = (id) => {
            const t = state.todos.find(x => x.id === id);
            if (!t) return;
            activeDetailTaskId = id;
            document.getElementById('detail-title-input').value = t.title;
            document.getElementById('detail-date-input').value = t.due || '';
            document.getElementById('detail-time-input').value = t.time || '';
            document.getElementById('detail-note-input').value = t.note || '';
            renderDetailSteps(t);
            document.getElementById('todo-detail-modal')?.classList.remove('hidden');
        };

        function renderDetailSteps(t) {
            const box = document.getElementById('detail-steps-list');
            if (!box) return;
            box.innerHTML = (t.steps || []).map((s, i) => `
                <div class="flex items-center justify-between bg-slate-900 px-2.5 py-1 rounded-lg text-xs">
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" ${s.done ? 'checked' : ''} onchange="window.ZOF.toggleSubStep(${i})">
                        <span class="${s.done ? 'line-through text-slate-500' : 'text-slate-200'}">${ZOF.sanitizeText(s.text)}</span>
                    </label>
                    <button type="button" onclick="window.ZOF.delSubStep(${i})" class="text-red-400">✕</button>
                </div>`).join('');
        }

        window.ZOF.toggleSubStep = (idx) => {
            const t = state.todos.find(x => x.id === activeDetailTaskId);
            if (t?.steps?.[idx]) { t.steps[idx].done = !t.steps[idx].done; ZOF.saveState(); renderDetailSteps(t); renderTodos(); }
        };
        window.ZOF.delSubStep = (idx) => {
            const t = state.todos.find(x => x.id === activeDetailTaskId);
            if (t?.steps) { t.steps.splice(idx, 1); ZOF.saveState(); renderDetailSteps(t); renderTodos(); }
        };

        document.getElementById('detail-add-step-btn')?.addEventListener('click', () => {
            const inp = document.getElementById('detail-new-step-input');
            const val = inp?.value.trim();
            const t = state.todos.find(x => x.id === activeDetailTaskId);
            if (!val || !t) return;
            if (!t.steps) t.steps = [];
            t.steps.push({ text: val, done: false });
            inp.value = '';
            ZOF.saveState();
            renderDetailSteps(t);
            renderTodos();
        });

        document.getElementById('detail-ai-steps-btn')?.addEventListener('click', () => {
            const t = state.todos.find(x => x.id === activeDetailTaskId);
            if (!t) return;
            t.steps = [
                { text: `1. Read core textbook pages & highlight formulas (15m)`, done: false },
                { text: `2. Create 5 active-recall Cloze flashcards (10m)`, done: false },
                { text: `3. Solve 25 timed OMR MCQs & log autopsy (25m)`, done: false }
            ];
            ZOF.saveState();
            renderDetailSteps(t);
            renderTodos();
            ZOF.toast('✨ AI generated 3 structured study steps!');
        });

        document.getElementById('detail-save-btn')?.addEventListener('click', () => {
            const t = state.todos.find(x => x.id === activeDetailTaskId);
            if (t) {
                t.title = document.getElementById('detail-title-input')?.value.trim() || t.title;
                t.due = document.getElementById('detail-date-input')?.value || '';
                t.time = document.getElementById('detail-time-input')?.value || '';
                t.note = document.getElementById('detail-note-input')?.value || '';
                ZOF.saveState();
                renderTodos();
            }
            document.getElementById('todo-detail-modal')?.classList.add('hidden');
        });

        document.getElementById('detail-delete-btn')?.addEventListener('click', () => {
            state.todos = state.todos.filter(x => x.id !== activeDetailTaskId);
            document.getElementById('todo-detail-modal')?.classList.add('hidden');
            ZOF.saveState();
            renderTodos();
        });
        document.getElementById('close-detail-modal-btn')?.addEventListener('click', () => document.getElementById('todo-detail-modal')?.classList.add('hidden'));

        // Smart Suggestions Modal
        document.getElementById('open-suggestions-btn')?.addEventListener('click', () => {
            const libBox = document.getElementById('suggestions-library-list');
            if (libBox) {
                libBox.innerHTML = (state.libraryTasks || []).map((txt, i) => `
                    <div class="flex justify-between items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs">
                        <span>📌 ${ZOF.sanitizeText(txt)}</span>
                        <button type="button" onclick="window.ZOF.addSuggestedTask(${i})" class="bg-blue-600 text-white font-bold px-2.5 py-1 rounded-lg text-[10px]">+ My Day</button>
                    </div>`).join('');
            }
            document.getElementById('todo-suggestions-modal')?.classList.remove('hidden');
        });
        document.getElementById('close-suggestions-btn')?.addEventListener('click', () => document.getElementById('todo-suggestions-modal')?.classList.add('hidden'));
        window.ZOF.addSuggestedTask = (idx) => {
            const txt = state.libraryTasks[idx];
            if (!txt) return;
            state.todos.unshift({ id: Date.now(), title: txt, priority: 'High', list: 'myday', myDay: true, important: true, done: false, due: getTodayISO(), repeat: 'none', repeatDays: [], steps: [] });
            ZOF.saveState();
            renderTodos();
            ZOF.toast('☀️ Added Suggestion to My Day!');
        };
        document.getElementById('save-template-task-btn')?.addEventListener('click', () => {
            const inp = document.getElementById('save-template-task-input');
            if (!inp?.value.trim()) return;
            state.libraryTasks.unshift(inp.value.trim());
            inp.value = '';
            ZOF.saveState();
            document.getElementById('open-suggestions-btn')?.click();
        });

        // =====================================================================
        // 3. GOAL VAULT, SUBJECT MATRIX & MCQ MARK-LOSS AUTOPSY
        // =====================================================================
        function renderVault() {
            const activeGoal = state.goals.find(g => g.id === state.activeGoalId) || state.goals[0];
            const subjects = activeGoal?.subjects || ['Core'];
            if (!subjects.includes(state.activeSubject)) state.activeSubject = subjects[0];

            const subjBar = document.getElementById('subject-filter-container');
            if (subjBar) {
                subjBar.innerHTML = subjects.map(s => `
                    <button type="button" onclick="window.ZOF.setVaultSubject('${s}')" class="px-3 py-1 rounded-xl text-xs font-bold ${state.activeSubject === s ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'}">${s}</button>`).join('');
            }

            const tab = state.vaultTab || 'backlog';
            document.getElementById('task-add-form')?.classList.toggle('hidden', tab === 'mcq' || tab === 'matrix');
            document.getElementById('mcq-add-form')?.classList.toggle('hidden', tab !== 'mcq');

            updateMcqDisplay();

            const box = document.getElementById('vault-list-container');
            if (!box) return;

            if (tab === 'matrix') {
                box.innerHTML = subjects.map(s => {
                    const all = (state.vaultItems || []).filter(v => v.subject === s);
                    const done = all.filter(v => v.done).length;
                    const pct = all.length ? Math.round((done / all.length) * 100) : 50;
                    return `
                        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-1.5">
                            <div class="flex justify-between text-xs font-bold"><span>📊 ${s} Mastery Matrix</span><span class="text-emerald-400 font-mono">${pct}% (${done}/${all.length} chapters)</span></div>
                            <div class="w-full bg-slate-950 h-2 rounded-full overflow-hidden"><div class="bg-gradient-to-r from-purple-500 to-emerald-400 h-full" style="width:${pct}%"></div></div>
                        </div>`;
                }).join('');
                return;
            }

            const list = (state.vaultItems || []).filter(v => v.subject === state.activeSubject && (tab === 'mcq' || v.tab === tab));
            box.innerHTML = list.map(v => `
                <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 flex justify-between items-center text-xs">
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" ${v.done ? 'checked' : ''} onchange="window.ZOF.toggleVaultItem(${v.id})" class="accent-purple-500">
                        <span class="font-bold ${v.done ? 'line-through text-slate-500' : 'text-white'}">${ZOF.sanitizeText(v.title)}</span>
                    </label>
                    <span class="text-[10px] font-mono text-purple-300">${v.subject}</span>
                </div>`).join('') || '<p class="text-xs text-slate-500 text-center py-4">No chapters logged in this tab yet.</p>';
        }

        window.ZOF.renderVault = renderVault;
        window.ZOF.setVaultSubject = (s) => { state.activeSubject = s; renderVault(); };
        window.ZOF.toggleVaultItem = (id) => {
            const it = state.vaultItems.find(x => x.id === id);
            if (it) { it.done = !it.done; ZOF.saveState(); renderVault(); }
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
            const inp = document.getElementById('task-title-input');
            if (!inp?.value.trim()) return;
            state.vaultItems.unshift({ id: Date.now(), goalId: state.activeGoalId, subject: state.activeSubject, tab: state.vaultTab, title: inp.value.trim(), done: false });
            inp.value = '';
            ZOF.saveState();
            renderVault();
        });

        function updateMcqDisplay() {
            const m = state.mcqStats || { target: 100, attempted: 70, correct: 62, errors: { concept: 3, formula: 2, misread: 2, panic: 1 } };
            const inc = Math.max(0, m.attempted - m.correct);
            const omr = (m.correct * 4) - inc;
            const left = Math.max(0, m.target - m.attempted);
            const setTxt = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = String(v); };
            setTxt('mcq-display-incorrect', inc);
            setTxt('mcq-display-omr', omr);
            setTxt('mcq-display-left', left);
            setTxt('err-concept', m.errors?.concept || 0);
            setTxt('err-formula', m.errors?.formula || 0);
            setTxt('err-misread', m.errors?.misread || 0);
            setTxt('err-panic', m.errors?.panic || 0);
        }

        document.getElementById('save-mcq-btn')?.addEventListener('click', () => {
            state.mcqStats.target = parseInt(document.getElementById('mcq-target')?.value, 10) || 100;
            state.mcqStats.attempted = parseInt(document.getElementById('mcq-attempted')?.value, 10) || 0;
            state.mcqStats.correct = parseInt(document.getElementById('mcq-correct')?.value, 10) || 0;
            ZOF.saveState();
            updateMcqDisplay();
            ZOF.toast('🎯 Updated Daily OMR Score & Mark-Loss Autopsy!');
        });

        document.querySelectorAll('.autopsy-tag-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const r = btn.dataset.reason;
                if (!state.mcqStats.errors) state.mcqStats.errors = { concept: 0, formula: 0, misread: 0, panic: 0 };
                state.mcqStats.errors[r] = (state.mcqStats.errors[r] || 0) + 1;
                ZOF.saveState();
                updateMcqDisplay();
                ZOF.toast(`Logged +1 "${r.toUpperCase()}" error for Adaptive Local AI!`);
            });
        });

        // =====================================================================
        // 4. 5-HORIZON ANALYTICS (1D-1Y) & COACH SETTINGS
        // =====================================================================
        function renderAnalytics() {
            const s = state.stats || {};
            const setTxt = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
            setTxt('stat-focus-mins', `${s.todayFocusMins || 110}m`);
            setTxt('stat-pages-read', String(s.pagesRead || 24));
            setTxt('stat-streak-days', `${s.streakDays || 5}d`);
            setTxt('stat-bio-energy', `${s.sleepHours || 7}h • ${s.waterGlasses || 8}💧`);

            const hData = s.horizonData?.[activeHorizon] || { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], values: [120, 150, 140, 180, 110] };
            const canvas = document.getElementById('analytics-chart');
            if (!canvas || !window.Chart) return;
            if (chartInstance) chartInstance.destroy();
            chartInstance = new window.Chart(canvas.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: hData.labels,
                    datasets: [{ label: `Focus Minutes (${activeHorizon.toUpperCase()})`, data: hData.values, backgroundColor: 'rgba(59, 130, 246, 0.65)', borderColor: '#3b82f6', borderWidth: 1, borderRadius: 6 }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
            });
        }

        window.ZOF.renderAnalytics = renderAnalytics;

        document.querySelectorAll('.horizon-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                activeHorizon = btn.dataset.h;
                document.querySelectorAll('.horizon-btn').forEach(b => {
                    b.className = `horizon-btn ${b === btn ? 'bg-blue-600 text-white' : 'text-slate-400'} text-[10px] font-bold px-2 py-1 rounded-lg`;
                });
                renderAnalytics();
            });
        });

        document.getElementById('save-coach-btn')?.addEventListener('click', () => {
            const q = document.getElementById('custom-study-quotes')?.value.split('\n').map(x => x.trim()).filter(Boolean);
            const r = document.getElementById('custom-break-rules')?.value.trim();
            if (q?.length) state.studyQuotes = q;
            if (r) state.breakRules = r;
            ZOF.saveState();
            ZOF.toast('💾 Saved Focus Quotes & Break Protocol Rules!');
        });

        document.getElementById('factory-reset-btn')?.addEventListener('click', () => {
            if (confirm('⚠️ Factory Reset all local ZikrOFikr data? Export a .ZIP backup first!')) {
                ZOF.resetToDefault();
            }
        });

        renderTodoListsBar();
        renderTodos();
        renderVault();
        renderAnalytics();
    });
})();
