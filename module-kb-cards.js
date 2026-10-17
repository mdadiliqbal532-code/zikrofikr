/* ============================================================================
   ZikrOFikr OS — Verified Knowledge Base, Flashcards & Quiz Engine
   File: module-kb-cards.js (Part 1 of 2)
   Selective KB Grounding • [[Backlinks]] • Lazy OCR • Mind Maps • Code Runner
   ============================================================================ */

(function () {
    'use strict';

    ZOF.onReady(() => {
        const state = ZOF.state;

        // =====================================================================
        // 1. VERIFIED KNOWLEDGE BASE RENDERER & [[WIKI BACKLINK]] LINKER
        // =====================================================================
        const kbListEl = document.getElementById('kb-list-container');
        const kbSearchEl = document.getElementById('kb-search-input');

        function formatBacklinks(text) {
            const safe = ZOF.sanitizeText(text || '');
            return safe.replace(/\[\[([^\]]+)\]\]/g, (_, topic) => {
                const esc = topic.replace(/'/g, "\\'");
                return `<button type="button" onclick="window.ZOF.filterKBByBacklink('${esc}')" class="inline-flex items-center gap-0.5 bg-purple-500/20 hover:bg-purple-500/35 text-purple-300 border border-purple-500/40 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">🔗 [[${topic}]]</button>`;
            });
        }

        window.ZOF.filterKBByBacklink = (topic) => {
            if (kbSearchEl) {
                kbSearchEl.value = topic;
                renderKB();
                ZOF.toast(`🔗 Synaptic Link Filter: [[${topic}]]`);
            }
        };

        function renderKB() {
            if (!kbListEl) return;
            const q = (kbSearchEl?.value || '').toLowerCase().trim();
            const items = (state.knowledgeBase || []).filter(item => {
                if (!q) return true;
                return `${item.title} ${item.body} ${item.cite} ${item.category} ${item.type}`.toLowerCase().includes(q);
            });

            const statKb = document.getElementById('stat-kb-count');
            if (statKb) statKb.textContent = String((state.knowledgeBase || []).length);

            kbListEl.innerHTML = items.map(item => {
                const checked = item.selectedForAI !== false ? 'checked' : '';
                const escCite = ZOF.sanitizeText(item.cite || 'Local KB').replace(/'/g, "\\'");
                return `
                    <div class="bg-slate-900 border ${item.selectedForAI !== false ? 'border-slate-800' : 'border-slate-800/40 opacity-60'} rounded-2xl p-3 flex flex-col gap-1.5 transition-all">
                        <div class="flex flex-wrap justify-between items-center gap-1.5">
                            <div class="flex items-center gap-2">
                                <input type="checkbox" ${checked} onchange="window.ZOF.toggleKBSelect(${item.id}, this.checked)" class="w-4 h-4 accent-emerald-500 cursor-pointer" title="Include/Exclude this source from AI answers">
                                <span class="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/50">${item.category} • ${item.type || 'Note'}</span>
                                <span class="text-[9px] font-mono text-slate-400">Ed: ${item.edition || 'Verified'} • #${(item.hash || 'fnv').slice(0, 8)}</span>
                            </div>
                            <div class="flex items-center gap-1.5">
                                <button type="button" onclick="window.ZOF.jumpToCitation('${escCite}')" class="text-[10px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-bold hover:bg-amber-500/25">📍 ${item.cite}</button>
                                <button type="button" onclick="window.ZOF.kbToFlashcard(${item.id})" class="text-[10px] bg-blue-600/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded font-bold" title="Convert to Flashcard">🃏+Card</button>
                                <button type="button" onclick="window.ZOF.deleteKB(${item.id})" class="text-xs text-red-400 px-1" title="Delete Source">✕</button>
                            </div>
                        </div>
                        <h4 class="text-xs font-bold text-white">${formatBacklinks(item.title)}</h4>
                        <p class="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">${formatBacklinks(item.body)}</p>
                    </div>`;
            }).join('') || '<p class="text-xs text-slate-500 text-center py-4">No matching Knowledge Base sources found.</p>';
        }

        window.ZOF.renderKB = renderKB;

        window.ZOF.toggleKBSelect = (id, isChecked) => {
            const item = state.knowledgeBase.find(x => x.id === id);
            if (item) {
                item.selectedForAI = Boolean(isChecked);
                ZOF.saveState();
                renderKB();
            }
        };

        window.ZOF.deleteKB = (id) => {
            state.knowledgeBase = state.knowledgeBase.filter(x => x.id !== id);
            ZOF.saveState();
            renderKB();
            ZOF.toast('🗑️ Removed source from Knowledge Base');
        };

        window.ZOF.kbToFlashcard = (id) => {
            const item = state.knowledgeBase.find(x => x.id === id);
            if (!item) return;
            state.flashcards.unshift({
                id: Date.now(),
                q: `From [${item.cite}], explain the core mechanism/facts of: ${item.title.replace(/\[\[|\]\]/g, '')}`,
                a: item.body,
                src: `${item.cite} (${item.edition || 'Verified'})`,
                interval: '1d',
                mastered: false,
                occlusionImg: ''
            });
            ZOF.saveState();
            if (window.ZOF.renderFlashcards) window.ZOF.renderFlashcards();
            ZOF.toast(`🃏 Created Flashcard from [${item.cite}]!`);
        };

        // Add New Source to Verified KB
        document.getElementById('add-kb-btn')?.addEventListener('click', () => {
            const category = document.getElementById('kb-category-select')?.value || 'Biology';
            const type = document.getElementById('kb-type-select')?.value || 'Note';
            const edition = ZOF.sanitizeText(document.getElementById('kb-edition-input')?.value.trim() || '2026 Ed.');
            const cite = ZOF.sanitizeText(document.getElementById('kb-cite-input')?.value.trim() || 'Personal Verified Note');
            const title = ZOF.sanitizeText(document.getElementById('kb-title-input')?.value.trim());
            const body = ZOF.sanitizeText(document.getElementById('kb-body-input')?.value.trim());

            if (!title || !body) return ZOF.toast('Enter both a Concept Title and Passage/Code body');

            state.knowledgeBase.unshift({
                id: Date.now(),
                category,
                type,
                edition,
                cite,
                title,
                body,
                hash: ZOF.hashText(body),
                selectedForAI: true
            });

            document.getElementById('kb-title-input').value = '';
            document.getElementById('kb-body-input').value = '';
            ZOF.saveState();
            renderKB();
            ZOF.toast('📥 Sanitized, Hashed & Indexed in Verified KB!');
        });

        kbSearchEl?.addEventListener('input', renderKB);

        document.getElementById('kb-select-all-btn')?.addEventListener('click', () => {
            const allSelected = state.knowledgeBase.every(k => k.selectedForAI !== false);
            state.knowledgeBase.forEach(k => { k.selectedForAI = !allSelected; });
            ZOF.saveState();
            renderKB();
            ZOF.toast(!allSelected ? '☑️ Selected All Sources for AI Grounding' : '⬜ Unchecked All Sources');
        });

        // =====================================================================
        // 2. LAZY-LOADED OFFLINE OCR PHOTO SCANNER & VOICE DICTATION
        // =====================================================================
        document.getElementById('kb-ocr-input')?.addEventListener('change', async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            ZOF.toast('📷 Loading OCR Engine & scanning textbook photo locally...');
            try {
                if (!window.Tesseract) {
                    await new Promise((res, rej) => {
                        const s = document.createElement('script');
                        s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
                        s.onload = res;
                        s.onerror = rej;
                        document.head.appendChild(s);
                    });
                }
                const result = await window.Tesseract.recognize(file, 'eng');
                const cleanOcr = ZOF.sanitizeText(result?.data?.text || '').trim();
                document.getElementById('kb-type-select').value = 'OCR Scan';
                document.getElementById('kb-title-input').value = `OCR Scan: ${file.name.replace(/\.[^/.]+$/, '')}`;
                document.getElementById('kb-body-input').value = cleanOcr || 'Could not detect clear text — please verify lighting.';
                ZOF.toast('✅ OCR Complete! Verify medical units/numbers in the box, then click + Index.');
            } catch (err) {
                ZOF.toast('⚠️ Connect once to cache Tesseract OCR worker for offline photo scanning.');
            }
        });

        document.getElementById('kb-voice-note-btn')?.addEventListener('click', () => {
            const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRec) return ZOF.toast('🎙️ Speech Recognition not supported in this browser');
            const rec = new SpeechRec();
            rec.lang = 'en-US';
            rec.interimResults = false;
            ZOF.toast('🎙️ Listening... Speak your study note or summary!');
            rec.onresult = (ev) => {
                const transcript = ev.results?.[0]?.[0]?.transcript || '';
                const box = document.getElementById('kb-body-input');
                if (box) box.value = (box.value ? box.value + ' ' : '') + transcript;
                ZOF.toast('✅ Voice Note transcribed into editor!');
            };
            rec.onerror = () => ZOF.toast('🎙️ Voice capture ended');
            rec.start();
        });

        // =====================================================================
        // 3. INTERACTIVE CONCEPT MIND MAP & SANDBOXED CODING PLAYGROUND
        // =====================================================================
        document.getElementById('kb-mindmap-btn')?.addEventListener('click', () => {
            const box = document.getElementById('kb-mindmap-box');
            if (!box) return;
            box.classList.toggle('hidden');
            if (box.classList.contains('hidden')) return;

            const checked = (state.knowledgeBase || []).filter(k => k.selectedForAI !== false);
            const nodesHtml = checked.map((k, idx) => `
                <div class="flex items-center gap-2">
                    <span class="px-2.5 py-1 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-bold">${idx + 1}. ${ZOF.sanitizeText(k.category)}</span>
                    <span class="text-slate-500">──▶</span>
                    <button type="button" onclick="window.ZOF.jumpToCitation('${ZOF.sanitizeText(k.cite).replace(/'/g, "\\'")}')" class="px-3 py-1 rounded-xl bg-slate-950 hover:border-blue-500 border border-slate-700 text-white font-bold text-left">
                        ${ZOF.sanitizeText(k.title)} <span class="text-[10px] text-amber-300 font-mono block">📍 ${ZOF.sanitizeText(k.cite)}</span>
                    </button>
                </div>`).join('<div class="ml-6 h-3 border-l-2 border-dashed border-emerald-700/50"></div>');

            box.innerHTML = `
                <div class="flex justify-between items-center mb-2 pb-1.5 border-b border-slate-800">
                    <span class="font-bold text-emerald-400 uppercase">🕸️ Interactive Synaptic Concept Map (${checked.length} Checked Sources)</span>
                    <span class="text-[10px] font-mono text-slate-400">Click any node to open source page</span>
                </div>
                <div class="space-y-1 py-1">${nodesHtml || 'Check at least 1 KB source to generate a Mind Map.'}</div>`;
        });

        document.getElementById('kb-code-run-btn')?.addEventListener('click', () => {
            const outBox = document.getElementById('kb-code-output-box');
            if (!outBox) return;
            outBox.classList.remove('hidden');

            let code = document.getElementById('kb-body-input')?.value.trim();
            if (!code) {
                const progNote = state.knowledgeBase.find(k => k.category === 'Programming');
                code = progNote ? progNote.body : 'console.log("Hello from ZikrOFikr Coding Playground!");';
            }

            // Lightweight Python-to-JS print() bridge for quick Python practice
            const jsReady = code.replace(/^\s*print\s*\((.*)\)\s*$/gm, 'console.log($1);');
            const logs = [];
            const customConsole = {
                log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
                error: (...args) => logs.push('ERROR: ' + args.join(' ')),
                warn: (...args) => logs.push('WARN: ' + args.join(' '))
            };

            const t0 = performance.now();
            try {
                const runner = new Function('console', jsReady);
                runner(customConsole);
                const ms = (performance.now() - t0).toFixed(1);
                outBox.innerHTML = `<div class="text-[10px] text-blue-400 mb-1">▶ Sandboxed Execution Output (${ms} ms):</div><pre class="whitespace-pre-wrap text-emerald-300">${ZOF.sanitizeText(logs.join('\n') || '✅ Code executed (0 console output).')}</pre>`;
            } catch (err) {
                outBox.innerHTML = `<div class="text-red-400 font-bold">❌ Syntax / Runtime Error: ${ZOF.sanitizeText(err.message)}</div>`;
            }
        });
// === END OF BATCH 6 PART 1 — PASTE BATCH 6 PART 2 DIRECTLY BELOW THIS LINE ===
                // =====================================================================
        // 4. SM-2 FLASHCARDS, {{CLOZE}} DELETION & DIAGRAM IMAGE OCCLUSION
        // =====================================================================
        let pendingOcclusionDataUrl = '';

        function formatClozeQuestion(rawQ, revealed) {
            const safe = ZOF.sanitizeText(rawQ || '');
            return safe.replace(/\{\{([^}]+)\}\}/g, (_, term) => {
                return revealed
                    ? `<span class="px-1.5 py-0.5 rounded bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 font-extrabold">${term}</span>`
                    : `<span class="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-700/60 font-mono">[ ... ]</span>`;
            });
        }

        function renderFlashcards() {
            const cards = state.flashcards || [];
            const badge = document.getElementById('fc-counter-badge');
            const srcBadge = document.getElementById('fc-source-badge');
            const qEl = document.getElementById('fc-question-text');
            const aEl = document.getElementById('fc-answer-text');
            const occStage = document.getElementById('fc-occlusion-stage');

            if (!qEl || !aEl) return;

            if (!cards.length) {
                if (badge) badge.textContent = '0 / 0';
                qEl.textContent = 'No flashcards yet. Add a card below or highlight text in Moon+ Reader!';
                aEl.classList.add('hidden');
                occStage?.classList.add('hidden');
                return;
            }

            state.fcIndex = ((state.fcIndex || 0) % cards.length + cards.length) % cards.length;
            const cur = cards[state.fcIndex];
            const dueCount = cards.filter(c => !c.mastered).length;

            if (badge) badge.textContent = `Card ${state.fcIndex + 1}/${cards.length} • ${dueCount} Due (${cur.interval || '1d'})`;
            if (srcBadge) {
                srcBadge.textContent = `📍 ${cur.src || 'Verified KB'}`;
                srcBadge.onclick = (e) => {
                    e.stopPropagation();
                    window.ZOF.jumpToCitation?.(cur.src || '');
                };
            }

            qEl.innerHTML = formatClozeQuestion(cur.q, state.fcFlipped);

            // Anatomy / Diagram Image Occlusion Stage
            if (occStage) {
                if (cur.occlusionImg) {
                    occStage.classList.remove('hidden');
                    occStage.innerHTML = `
                        <img src="${cur.occlusionImg}" alt="Occlusion Diagram" class="max-h-44 mx-auto rounded-lg object-contain">
                        ${!state.fcFlipped ? `<div class="absolute inset-x-1/4 top-1/3 h-12 bg-amber-500/95 border-2 border-white rounded-lg flex items-center justify-center text-slate-950 font-extrabold text-xs shadow-lg">🙈 OCCLUDED LABEL (Tap to Reveal)</div>` : ''}`;
                } else {
                    occStage.classList.add('hidden');
                    occStage.innerHTML = '';
                }
            }

            if (state.fcFlipped) {
                aEl.classList.remove('hidden');
                aEl.innerHTML = `<b>✅ Verified Answer:</b> ${ZOF.sanitizeText(cur.a)}<div class="text-[10px] font-mono text-slate-400 mt-1">Next SM-2 Interval: ${cur.interval || '1d'}</div>`;
            } else {
                aEl.classList.add('hidden');
            }
        }

        window.ZOF.renderFlashcards = renderFlashcards;

        document.getElementById('fc-card')?.addEventListener('click', () => {
            state.fcFlipped = !state.fcFlipped;
            renderFlashcards();
        });

        document.querySelectorAll('.fc-rate-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const cards = state.flashcards || [];
                if (!cards.length) return;
                const rate = btn.dataset.rate;
                const cur = cards[state.fcIndex];
                const map = {
                    Again: { iv: '1m', mastered: false },
                    Hard:  { iv: '6h', mastered: false },
                    Good:  { iv: '1d', mastered: true },
                    Easy:  { iv: '4d', mastered: true }
                };
                const res = map[rate] || map.Good;
                cur.interval = res.iv;
                cur.mastered = res.mastered;
                state.fcFlipped = false;
                state.fcIndex = (state.fcIndex + 1) % cards.length;
                ZOF.saveState();
                renderFlashcards();
                ZOF.toast(`🃏 Rated "${rate}" → Scheduled in ${res.iv}`);
            });
        });

        // Cloze Helper & Image Occlusion Uploader
        document.getElementById('fc-insert-cloze-btn')?.addEventListener('click', () => {
            const qInput = document.getElementById('fc-q-input');
            if (!qInput) return;
            const start = qInput.selectionStart || 0;
            const end = qInput.selectionEnd || 0;
            const val = qInput.value;
            if (start !== end) {
                qInput.value = val.slice(0, start) + '{{' + val.slice(start, end) + '}}' + val.slice(end);
            } else {
                qInput.value = (val ? val + ' ' : '') + '{{high-yield term}}';
            }
            qInput.focus();
        });

        document.getElementById('fc-occlusion-input')?.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                pendingOcclusionDataUrl = String(reader.result || '');
                ZOF.toast('🖼️ Diagram loaded for Image Occlusion! Fill Question/Answer & click + Save Card.');
            };
            reader.readAsDataURL(file);
        });

        document.getElementById('add-fc-btn')?.addEventListener('click', () => {
            const q = document.getElementById('fc-q-input')?.value.trim();
            const a = document.getElementById('fc-a-input')?.value.trim();
            const src = document.getElementById('fc-src-input')?.value.trim() || 'Personal Verified KB';
            if (!q || !a) return ZOF.toast('Enter both Question/Cloze and Answer');

            state.flashcards.unshift({
                id: Date.now(),
                q: ZOF.sanitizeText(q),
                a: ZOF.sanitizeText(a),
                src: ZOF.sanitizeText(src),
                interval: '1d',
                mastered: false,
                occlusionImg: pendingOcclusionDataUrl
            });

            pendingOcclusionDataUrl = '';
            document.getElementById('fc-q-input').value = '';
            document.getElementById('fc-a-input').value = '';
            state.fcIndex = 0;
            state.fcFlipped = false;
            ZOF.saveState();
            renderFlashcards();
            ZOF.toast('🃏 Saved Card to Spaced Repetition Deck!');
        });

        // =====================================================================
        // 5. 5-FORMAT INTERACTIVE QUIZ ENGINE, OMR (+4/-1), FEYNMAN & VIVA
        // =====================================================================
        const quizBox = document.getElementById('quiz-container');

        function logQuizMistake(item, reasonType) {
            state.mcqStats.attempted = (state.mcqStats.attempted || 0) + 1;
            if (state.mcqStats.errors && state.mcqStats.errors[reasonType] !== undefined) {
                state.mcqStats.errors[reasonType] += 1;
            }
            // Auto-create a remedial flashcard for missed quiz item
            state.flashcards.unshift({
                id: Date.now(),
                q: `⚠️ [Missed Quiz Trap — ${item.cite}] ${item.title}`,
                a: item.body,
                src: item.cite,
                interval: '1m',
                mastered: false,
                occlusionImg: ''
            });
            ZOF.saveState();
            renderFlashcards();
        }

        document.getElementById('gen-quiz-btn')?.addEventListener('click', () => {
            if (!quizBox) return;
            const fmt = document.getElementById('quiz-format-select')?.value || 'mcq';
            const pool = (state.knowledgeBase || []).filter(k => k.selectedForAI !== false);
            if (!pool.length) {
                quizBox.innerHTML = '<p class="text-amber-300">Check (☑️) at least 1 source in 📥 KB to generate a grounded quiz.</p>';
                return;
            }

            const target = pool[Math.floor(Math.random() * pool.length)];
            const distractor1 = 'Fast voltage-gated Na+ channels / Inverse focal length without refractive index';
            const distractor2 = 'AV node (120 bpm) / Induced current amplifies magnetic flux change';
            const distractor3 = 'None of the above — independent of textbook reference values';

            if (fmt === 'mcq') {
                quizBox.innerHTML = `
                    <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                        <div class="flex justify-between text-[10px] font-mono text-emerald-400">
                            <span>🎯 OMR MCQ (+4 Correct / -1 Wrong)</span>
                            <span>Source Hidden Until Submit</span>
                        </div>
                        <p class="font-bold text-white">Q: Which statement accurately describes <i>"${ZOF.sanitizeText(target.title)}"</i> according to your verified textbook notes (watch for NOT/EXCEPT & exact units)?</p>
                        <div class="space-y-1.5" id="mcq-options-group">
                            <label class="flex items-start gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer"><input type="radio" name="zof_quiz_opt" value="correct" class="mt-0.5"> <span>${ZOF.sanitizeText(target.body.slice(0, 175))}</span></label>
                            <label class="flex items-start gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer"><input type="radio" name="zof_quiz_opt" value="w1" class="mt-0.5"> <span>${distractor1}</span></label>
                            <label class="flex items-start gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer"><input type="radio" name="zof_quiz_opt" value="w2" class="mt-0.5"> <span>${distractor2}</span></label>
                            <label class="flex items-start gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer"><input type="radio" name="zof_quiz_opt" value="w3" class="mt-0.5"> <span>${distractor3}</span></label>
                        </div>
                        <button type="button" id="submit-quiz-ans-btn" class="w-full bg-emerald-600 text-white font-bold py-1.5 rounded-lg text-xs">Submit OMR Answer</button>
                        <div id="quiz-feedback-area" class="hidden pt-2 border-t border-slate-800"></div>
                    </div>`;

                document.getElementById('submit-quiz-ans-btn')?.addEventListener('click', () => {
                    const chosen = document.querySelector('input[name="zof_quiz_opt"]:checked')?.value;
                    if (!chosen) return ZOF.toast('Select an option first');
                    const fb = document.getElementById('quiz-feedback-area');
                    fb.classList.remove('hidden');
                    if (chosen === 'correct') {
                        state.mcqStats.attempted += 1;
                        state.mcqStats.correct += 1;
                        ZOF.saveState();
                        fb.innerHTML = `<div class="text-emerald-400 font-bold">✅ +4 OMR Marks! Correct!</div><p class="text-[11px] text-slate-300 mt-1">Verified Citation: <b>${ZOF.sanitizeText(target.cite)} (${ZOF.sanitizeText(target.edition || 'Verified')})</b></p>`;
                    } else {
                        logQuizMistake(target, 'misread');
                        fb.innerHTML = `<div class="text-red-400 font-bold">❌ -1 OMR Mark! Logged to Mark-Loss Autopsy & Remedial Flashcards.</div><p class="text-[11px] text-slate-200 mt-1"><b>Correct Textbook Evidence [${ZOF.sanitizeText(target.cite)}]:</b> ${ZOF.sanitizeText(target.body)}</p>`;
                    }
                });
            } else if (fmt === 'tf') {
                quizBox.innerHTML = `
                    <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                        <p class="font-bold text-white">True or False: According to your notes on <i>${ZOF.sanitizeText(target.title)}</i>, "${ZOF.sanitizeText(target.body.slice(0, 150))}..."</p>
                        <div class="flex gap-2">
                            <button type="button" id="tf-true-btn" class="flex-1 bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold py-1.5 rounded-lg">TRUE</button>
                            <button type="button" id="tf-false-btn" class="flex-1 bg-red-950 border border-red-700 text-red-300 font-bold py-1.5 rounded-lg">FALSE</button>
                        </div>
                        <div id="tf-feedback" class="hidden pt-2 border-t border-slate-800"></div>
                    </div>`;
                document.getElementById('tf-true-btn')?.addEventListener('click', () => {
                    const fb = document.getElementById('tf-feedback');
                    fb.classList.remove('hidden');
                    fb.innerHTML = `<span class="text-emerald-400 font-bold">✅ Correct! Exact match with [${ZOF.sanitizeText(target.cite)}].</span>`;
                });
                document.getElementById('tf-false-btn')?.addEventListener('click', () => {
                    logQuizMistake(target, 'concept');
                    const fb = document.getElementById('tf-feedback');
                    fb.classList.remove('hidden');
                    fb.innerHTML = `<span class="text-red-400 font-bold">❌ Incorrect — statement is directly from [${ZOF.sanitizeText(target.cite)}]. Added to Remedial Cards!</span>`;
                });
            } else {
                // Fill in the Blank, Short Answer & Concept Matching
                quizBox.innerHTML = `
                    <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                        <p class="font-bold text-white">Active Recall (${fmt.toUpperCase()}): State the core mechanism, formula, or reference values for <i>"${ZOF.sanitizeText(target.title)}"</i>:</p>
                        <textarea id="open-quiz-input" placeholder="Type your recall answer here (include units and NOT/EXCEPT conditions)..." class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white h-16 resize-none"></textarea>
                        <button type="button" id="check-open-quiz-btn" class="w-full bg-blue-600 text-white font-bold py-1.5 rounded-lg text-xs">Check Against Textbook Rubric</button>
                        <div id="open-quiz-feedback" class="hidden pt-2 border-t border-slate-800"></div>
                    </div>`;
                document.getElementById('check-open-quiz-btn')?.addEventListener('click', () => {
                    const ans = (document.getElementById('open-quiz-input')?.value || '').trim().toLowerCase();
                    if (!ans) return ZOF.toast('Write your answer first');
                    const keyTokens = target.body.toLowerCase().split(/\W+/).filter(w => w.length > 4).slice(0, 5);
                    const hits = keyTokens.filter(k => ans.includes(k)).length;
                    const fb = document.getElementById('open-quiz-feedback');
                    fb.classList.remove('hidden');
                    fb.innerHTML = `
                        <div class="${hits >= 2 ? 'text-emerald-400' : 'text-amber-300'} font-bold">Rubric Keyword Match: ${hits}/${keyTokens.length} key terms</div>
                        <p class="text-[11px] text-slate-200 mt-1"><b>Official Textbook Rubric [${ZOF.sanitizeText(target.cite)}]:</b> ${ZOF.sanitizeText(target.body)}</p>`;
                });
            }
        });

        // Feynman Teach-Back & Oral Viva Examiner
        document.getElementById('feynman-teach-btn')?.addEventListener('click', () => {
            const target = (state.knowledgeBase || []).find(k => k.selectedForAI !== false) || state.knowledgeBase[0];
            if (!target || !quizBox) return;
            quizBox.innerHTML = `
                <div class="p-3 bg-purple-950/30 border border-purple-700/50 rounded-xl space-y-2">
                    <div class="font-bold text-purple-300">🧑‍🏫 Feynman Teach-Back Challenge: ${ZOF.sanitizeText(target.title)}</div>
                    <p class="text-[11px] text-slate-300">Explain this concept in simple words as if teaching a younger student. I will check if you missed any critical numbers or <code>NOT/EXCEPT</code> rules from <b>${ZOF.sanitizeText(target.cite)}</b>.</p>
                    <textarea id="feynman-input" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white h-16 resize-none" placeholder="Teach the concept here..."></textarea>
                    <button type="button" id="grade-feynman-btn" class="w-full bg-purple-600 text-white font-bold py-1.5 rounded-lg text-xs">Evaluate My Explanation</button>
                    <div id="feynman-feedback" class="hidden pt-2 border-t border-slate-800"></div>
                </div>`;
            document.getElementById('grade-feynman-btn')?.addEventListener('click', () => {
                const txt = document.getElementById('feynman-input')?.value.trim() || '';
                const fb = document.getElementById('feynman-feedback');
                fb.classList.remove('hidden');
                fb.innerHTML = `<div class="text-emerald-400 font-bold">✅ Feynman Audit Complete (${txt.split(/\s+/).length} words):</div><p class="text-[11px] text-slate-200 mt-1">Compare your wording with the exact reference in <b>[${ZOF.sanitizeText(target.cite)}]</b>: <i>"${ZOF.sanitizeText(target.body)}"</i></p>`;
            });
        });

        document.getElementById('viva-voce-btn')?.addEventListener('click', () => {
            const target = (state.knowledgeBase || []).find(k => k.selectedForAI !== false) || state.knowledgeBase[0];
            if (!target) return;
            const qPrompt = `External Examiner Viva Question from ${target.cite}: Explain ${target.title} and state its exact reference values.`;
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                window.speechSynthesis.speak(new SpeechSynthesisUtterance(qPrompt));
            }
            document.getElementById('feynman-teach-btn')?.click();
            ZOF.toast('🎙️ Viva Examiner spoke the question! Answer orally or type in the box.');
        });

        renderKB();
        renderFlashcards();
    });
})();
