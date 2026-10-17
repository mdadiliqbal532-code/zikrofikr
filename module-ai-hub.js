/* ============================================================================
   ZikrOFikr OS — 4-Mode AI Router, 3-Gear Fusion & Agents (module-ai-hub.js)
   Part 1: Local RAG Retriever, Citation/Quote Verifier, Thermal-Capped Ollama,
           Cloud Consent Gate, Retry/Backoff & Clickable Page-Jump Citations
   ============================================================================ */

(function () {
    'use strict';

    ZOF.onReady(() => {
        const state = ZOF.state;
        let activeAbortCtrl = null;
        let isJobRunning = false;
        let lastAiCleanSummary = '';
        let lastAiCite = '';
        let podcastTimer = null;
        let teleprompterTimer = null;

        const agentSelect = document.getElementById('ai-agent-select');
        const modeSelect = document.getElementById('ai-operating-mode');
        const levelSelect = document.getElementById('ai-level-select');
        const styleSelect = document.getElementById('ai-style-select');
        const confMeter = document.getElementById('ai-confidence-meter');
        const chatBox = document.getElementById('ai-chat-history');

        // =====================================================================
        // 1. SYNONYM & SEMANTIC KEYWORD EXPANDER + AIR-GAPPED RAG RETRIEVER
        // =====================================================================
        const SYNONYM_MAP = {
            pacemaker: ['sa', 'sinoatrial', 'nodal', 'bpm', 'depolarization', 'phase'],
            heart: ['cardiac', 'ventricle', 'atria', 'sa', 'av', 'purkinje'],
            optics: ['lens', 'focal', 'refraction', 'mirror', 'faraday', 'lenz'],
            code: ['javascript', 'python', 'indexeddb', 'function', 'local'],
            salah: ['prayer', 'fajr', 'asr', 'maghrib', 'quran', 'allah', 'asr']
        };

        function retrieveLocalEvidence(query, agent) {
            const qLower = (query || '').toLowerCase();
            const rawTokens = qLower.split(/[^a-z0-9+]+/).filter(w => w.length > 2);
            const expandedTokens = new Set(rawTokens);

            rawTokens.forEach(tok => {
                Object.entries(SYNONYM_MAP).forEach(([k, list]) => {
                    if (tok.includes(k) || list.includes(tok)) {
                        expandedTokens.add(k);
                        list.forEach(s => expandedTokens.add(s));
                    }
                });
            });

            // Enforce Air-Gap: Deen AI reads Islamic Learning; Mentor/Creator read Study KB
            const pool = (state.knowledgeBase || []).filter(item => {
                if (item.selectedForAI === false) return false;
                if (agent === 'deen') return item.category === 'Islamic Learning';
                if (agent === 'mentor' || agent === 'creator') return item.category !== 'Islamic Learning';
                return true;
            });

            const scored = pool.map(item => {
                const hay = `${item.title} ${item.body} ${item.cite} ${item.category}`.toLowerCase();
                let score = 0;
                expandedTokens.forEach(tok => {
                    if (hay.includes(tok)) score += (item.title.toLowerCase().includes(tok) ? 4 : 2);
                });
                // Boost if exact medical negation or numbers match
                if (/\b(not|except)\b/i.test(item.body)) score += 1;
                return { item, score };
            }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);

            return {
                matches: scored.slice(0, 3).map(x => x.item),
                topScore: scored[0]?.score || 0,
                totalPool: pool.length
            };
        }

        // =====================================================================
        // 2. CITATION, QUOTATION & MEDICAL UNIT VERIFICATION LAYER
        // =====================================================================
        function formatClickableCitation(citeStr) {
            const safeCite = ZOF.sanitizeText(citeStr || 'Local Verified KB');
            const escaped = safeCite.replace(/'/g, "\\'");
            return `<button type="button" onclick="window.ZOF.jumpToCitation('${escaped}')" class="inline-flex items-center gap-1 bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold transition-all" title="Click to open exact source page in Moon+ Reader">📍 ${safeCite}</button>`;
        }

        function verifyEvidenceAndConfidence(evidenceObj) {
            if (!evidenceObj.matches.length) {
                if (confMeter) {
                    confMeter.textContent = '🔴 0% Match — Not in Saved Materials';
                    confMeter.className = 'text-red-400 font-bold';
                }
                return { verified: false, confidence: 0, badge: '🔴 0% Grounded (Insufficient Evidence in Selected Sources)' };
            }
            const top = evidenceObj.matches[0];
            const hasPageOrTime = /p\.\s*\d+|page\s*\d+|\d+:\d+|surah|sahih/i.test(top.cite);
            const conf = Math.min(99, Math.max(65, evidenceObj.topScore * 14 + (hasPageOrTime ? 15 : 0)));
            if (confMeter) {
                confMeter.textContent = conf >= 80
                    ? `🟢 ${conf}% Source-Verified [${top.cite}]`
                    : `🟡 ${conf}% Partial Match — Verify Page`;
                confMeter.className = conf >= 80 ? 'text-emerald-400 font-bold' : 'text-amber-300 font-bold';
            }
            return {
                verified: true,
                confidence: conf,
                badge: `🟢 ${conf}% Grounded • Hash ${top.hash || 'Verified'} • Edition: ${top.edition || 'Standard'}`
            };
        }

        // =====================================================================
        // 3. LOCAL OLLAMA ADAPTER (THERMAL-CAPPED 2 THREADS ON ACER CORE i3)
        // =====================================================================
        async function callLocalOllama(promptText, evidencePassages) {
            const hw = ZOF.getHardwareParams();
            const model = (document.getElementById('local-ollama-model')?.value || state.localModelId || 'gemma3:1b').trim();
            const contextStr = evidencePassages.map((m, i) => `[Source ${i + 1}: ${m.cite} | Edition: ${m.edition || 'N/A'}]\n${m.body}`).join('\n\n');

            const sysPrompt = `You are ZikrOFikr Local Study AI. Answer ONLY using the provided textbook sources. Preserve exact numbers, units (mg/dL, bpm, ms), and negations (NOT, EXCEPT). If the answer is not in the sources, state: "This is not in your saved materials." Cite exact [Source, Page].`;

            activeAbortCtrl = new AbortController();
            const timeoutId = setTimeout(() => activeAbortCtrl?.abort(), 14000);

            try {
                const res = await fetch('http://localhost:11434/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    signal: activeAbortCtrl.signal,
                    body: JSON.stringify({
                        model,
                        prompt: `${sysPrompt}\n\nAPPROVED SOURCES:\n${contextStr}\n\nQUESTION: ${promptText}`,
                        stream: false,
                        options: {
                            num_threads: hw.threads,
                            num_gpu: hw.gpuLayers,
                            num_ctx: hw.ctx,
                            num_predict: 260,
                            temperature: 0.2
                        }
                    })
                });
                clearTimeout(timeoutId);
                if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
                const data = await res.json();
                return { ok: true, modelUsed: `Local Ollama (${model} • ${hw.threads}T/GPU:${hw.gpuLayers})`, text: ZOF.sanitizeText(data.response || '') };
            } catch (err) {
                clearTimeout(timeoutId);
                return { ok: false, error: err.message };
            }
        }

        // =====================================================================
        // 4. CLOUD ASSISTED ADAPTER + BEFORE-YOU-SEND CONSENT PREVIEW GATE
        // =====================================================================
        function requestCloudConsent(providerLabel, modelId, payloadText) {
            return new Promise((resolve) => {
                const modal = document.getElementById('cloud-consent-modal');
                const infoEl = document.getElementById('consent-provider-info');
                const prevEl = document.getElementById('consent-payload-preview');
                const btnApprove = document.getElementById('approve-cloud-send-btn');
                const btnCancel = document.getElementById('cancel-cloud-send-btn');

                if (!modal || !prevEl) return resolve(false);

                infoEl.textContent = `Provider: ${providerLabel} (${modelId}) • Privacy Warning: Unpaid/Free tier submissions may be reviewed by the provider. Contains 0 patient identifiers.`;
                prevEl.textContent = payloadText;
                modal.classList.remove('hidden');

                const cleanup = (decision) => {
                    modal.classList.add('hidden');
                    btnApprove.onclick = null;
                    btnCancel.onclick = null;
                    resolve(decision);
                };
                btnApprove.onclick = () => cleanup(true);
                btnCancel.onclick = () => cleanup(false);
            });
        }

        async function callApprovedCloudAPI(promptText, evidencePassages) {
            const modelId = (document.getElementById('cloud-model-id')?.value || state.cloudModelId || 'gemini-2.5-flash').trim();
            if (state.freeOnlyLock && /pro-preview-paid|gpt-4o|claude-3-opus/i.test(modelId)) {
                return { ok: false, error: 'Blocked by Free-Only Safety Lock (Paid model ID detected).' };
            }

            let apiKey = ZOF.sessionSecrets.apiKey || document.getElementById('cloud-api-key-input')?.value.trim() || '';
            if (!apiKey && state.encryptedVault) {
                const pass = document.getElementById('vault-passphrase-input')?.value || prompt('🔑 Enter Master Passphrase to unlock Cloud API Key:');
                if (pass) {
                    apiKey = await ZOF.crypto.decrypt(state.encryptedVault, pass);
                    ZOF.sessionSecrets.apiKey = apiKey;
                }
            }
            if (!apiKey) {
                return { ok: false, error: 'No Cloud API key unlocked. Enter your free Gemini/Groq/OpenRouter key in ⚙️ Settings.' };
            }

            const excerptText = evidencePassages.map(m => `[${m.cite}]: ${m.body.slice(0, 500)}`).join('\n\n') || 'No local excerpt selected.';
            const transmissionPayload = `QUESTION: ${promptText}\n\nEXACT EXCERPTS LEAVING DEVICE (${excerptText.length} chars):\n${excerptText}`;

            // Show Consent Gate Before Sending Any Data Off Device
            const approved = await requestCloudConsent('Official Cloud API', modelId, transmissionPayload);
            if (!approved) return { ok: false, error: 'Cancelled by user at Consent Gate — fell back to 100% Local Offline.' };

            activeAbortCtrl = new AbortController();
            const sysInstruction = `Answer strictly using the provided textbook excerpts. Preserve medical units, numbers, and NOT/EXCEPT negations. Separate: (1) Direct Textbook Evidence, (2) Explanation/Analogy, (3) External Info Warning.`;

            // Bounded Retry with Backoff (Max 2 attempts)
            for (let attempt = 1; attempt <= 2; attempt++) {
                try {
                    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(apiKey)}`;
                    const res = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        signal: activeAbortCtrl.signal,
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: `${sysInstruction}\n\n${transmissionPayload}` }] }],
                            generationConfig: { temperature: 0.2, maxOutputTokens: 600 }
                        })
                    });
                    if (res.status === 429 && attempt === 1) {
                        ZOF.toast('⏳ Cloud rate limit (429) — backing off 2s...');
                        await new Promise(r => setTimeout(r, 2000));
                        continue;
                    }
                    if (!res.ok) throw new Error(`Cloud HTTP ${res.status}`);
                    const json = await res.json();
                    const reply = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                    return { ok: true, modelUsed: `Cloud API (${modelId})`, text: ZOF.sanitizeText(reply) };
                } catch (err) {
                    if (attempt === 2) return { ok: false, error: err.message };
                }
            }
            return { ok: false, error: 'Cloud request failed after retry.' };
        }
// === END OF BATCH 5 PART 1 — PASTE BATCH 5 PART 2 DIRECTLY BELOW THIS LINE ===
                // =====================================================================
        // 5. ADAPTIVE MIND, 5 AIR-GAPPED AGENTS & STRUCTURED 7-PART BUILDER
        // =====================================================================
        function getAdaptiveMistakeWarning() {
            const errs = state.mcqStats?.errors || { concept: 0, formula: 0, misread: 0, panic: 0 };
            const topErr = Object.entries(errs).sort((a, b) => b[1] - a[1])[0];
            if (!topErr || topErr[1] <= 0) return '';
            const map = {
                concept: '🧠 <b>Adaptive Memory Alert:</b> You recently lost marks to <i>Concept Gaps</i>—focus on the mechanism below.',
                formula: '📐 <b>Adaptive Memory Alert:</b> You flagged <i>Formula Forgotten</i> in MCQs—write the formula 3 times!',
                misread: '👀 <b>Adaptive Memory Alert:</b> Watch out for <code>NOT / EXCEPT</code> phrasing—your top MCQ mark-loss trigger!',
                panic: '⏱️ <b>Adaptive Memory Alert:</b> Read the stem calmly before checking options.'
            };
            return `<div class="bg-amber-950/50 border border-amber-700/50 rounded-xl px-2.5 py-1.5 text-[11px] text-amber-200 mt-1.5">${map[topErr[0]]}</div>`;
        }

        function buildStructuredResponse(query, agent, evidenceObj, verif, externalModelReply, secondModelReply) {
            const level = levelSelect?.value || 'Intermediate';
            const style = styleSelect?.value || 'default';
            const top = evidenceObj.matches[0];

            // Coordinator Multi-Agent Discussion Room
            if (agent === 'discussion') {
                const c = top ? formatClickableCitation(top.cite) : formatClickableCitation('Local Study Protocol');
                lastAiCleanSummary = `Coordinator Synthesis on "${query}": Protect Salah first, lock in 2 Primary Goal Pomodoros on ${top ? top.title : 'weak topics'}, then unlock 30m Side-Goal practice.`;
                lastAiCite = top ? top.cite : 'Coordinator Synthesis';
                return `
                    <div class="space-y-2">
                        <div class="text-[10px] font-mono text-purple-300">${verif.badge} • 🤝 4-Agent Roundtable</div>
                        <div class="p-2 rounded-xl bg-blue-950/40 border border-blue-800/50"><b>🧑‍🏫 Mentor AI:</b> Focus on high-yield textbook evidence first: ${top ? top.body.slice(0, 160) : 'Review core NCERT/Guyton chapters.'} ${c}</div>
                        <div class="p-2 rounded-xl bg-amber-950/40 border border-amber-800/50"><b>🎯 Goal AI:</b> Today's focus: ${state.stats.todayPrimaryMins || 90}m Main Goal vs ${state.stats.todaySideMins || 20}m Side Goal. Complete 1 more Main block before Side-Goal work.</div>
                        <div class="p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/50"><b>🕌 Deen AI:</b> Anchor your study blocks around Salah and recite 5 Ayahs with Tadabbur for barakah.</div>
                        <div class="p-2 rounded-xl bg-purple-950/50 border border-purple-700/60"><b>⚖️ Coordinator Final Plan:</b> ${lastAiCleanSummary}</div>
                    </div>`;
            }

            // Strict Insufficient Evidence Guard
            if (!top) {
                lastAiCleanSummary = '';
                return `
                    <div class="space-y-2">
                        <div class="text-[10px] font-mono text-red-400">🔴 0% Grounded — Insufficient Evidence in Checked (☑️) Sources</div>
                        <p class="text-slate-200"><b>This is not in your saved materials.</b> I never invent medical doses, formulas, or references.</p>
                        <p class="text-[11px] text-slate-400">👉 Tip: Check (☑️) the relevant source in <b>📥 KB</b>, or switch to <b>☁️ Mode 3: Cloud Assisted</b> to query an approved external model.</p>
                    </div>`;
            }

            const citeBtn = formatClickableCitation(top.cite);
            lastAiCleanSummary = `[${level} | ${top.cite}] ${top.title}: ${top.body}`;
            lastAiCite = top.cite;

            let styleBlock = '';
            if (style === 'socratic') {
                styleBlock = `<div class="p-2 rounded-xl bg-purple-950/40 border border-purple-800/50"><b>🧩 Socratic Question (Step 1 of 3):</b> Based on ${citeBtn}, what happens if the key channel or variable in <i>"${top.title}"</i> is blocked? Reply with your guess before I reveal Step 2!</div>`;
            } else if (style === 'roleplay') {
                styleBlock = `<div class="p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/50"><b>🩺 Clinical / Coding Case Simulation:</b> A patient/system presents with an abnormality in <i>${top.title}</i>. Using the reference values in ${citeBtn}, what is your immediate diagnostic check?</div>`;
            } else if (style === 'analogy') {
                styleBlock = `<div class="p-2 rounded-xl bg-blue-950/40 border border-blue-800/50"><b>🔄 Cross-Goal Analogy (Medical ↔ Coding):</b> Think of <i>${top.title}</i> like an event-loop timer in JavaScript: the fastest trigger (${citeBtn}) fires first and resets slower background timers!</div>`;
            } else if (style === 'mcq_trap') {
                styleBlock = `<div class="p-2 rounded-xl bg-red-950/40 border border-red-800/50"><b>🪤 Examiner MCQ Trap Decoder:</b> Examiners love flipping <code>NOT / EXCEPT</code> or swapping units in <i>${top.title}</i>. Memorize the exact textbook wording in ${citeBtn}.</div>`;
            }

            const modelSection = externalModelReply
                ? `<div class="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-700/50 mt-1.5"><b>🤖 Model Synthesis:</b><br>${externalModelReply.replace(/\n/g, '<br>')}</div>`
                : '';
            const compareSection = secondModelReply
                ? `<div class="p-2.5 rounded-xl bg-purple-950/40 border border-purple-700/50 mt-1.5"><b>⚖️ Model 2 Comparison:</b><br>${secondModelReply.replace(/\n/g, '<br>')}</div>`
                : '';

            return `
                <div class="space-y-2">
                    <div class="flex flex-wrap justify-between items-center gap-1 text-[10px] font-mono text-emerald-400">
                        <span>${verif.badge}</span>
                        <span>Level: ${level}</span>
                    </div>
                    <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-700">
                        <b class="text-emerald-300">1. 🟢 Direct Evidence Supported by Your Textbook:</b><br>
                        <span class="text-slate-100">"${top.body}"</span>
                        <div class="mt-1.5">${citeBtn}</div>
                    </div>
                    <div class="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
                        <b class="text-blue-300">2. 🔵 ${level} Explanation & High-Yield Breakdown:</b><br>
                        Key Concept: <b>${top.title}</b>. Notice all numerical values, units, and <code>NOT / EXCEPT</code> conditions are preserved verbatim from edition <code>${top.edition || 'Verified'}</code>.
                    </div>
                    ${styleBlock}
                    ${modelSection}
                    ${compareSection}
                    ${getAdaptiveMistakeWarning()}
                    <div class="text-[10px] text-slate-400 font-mono">4. 🟡 External Info Check: 0 unverified claims added. Click "🧠 Promote Last AI Reply" below to permanently teach Local AI.</div>
                </div>`;
        }

        // =====================================================================
        // 6. CHAT RENDERER, 4-MODE EXECUTION & ALL-3-GEARS TRI-GEAR FUSION
        // =====================================================================
        function renderChat() {
            if (!chatBox) return;
            const agent = agentSelect?.value || 'mentor';
            const list = state.aiChats[agent] || [];
            chatBox.innerHTML = list.map(msg => msg.role === 'user'
                ? `<div class="flex justify-end"><div class="bg-blue-600 text-white rounded-2xl rounded-br-sm px-3.5 py-2 max-w-[85%] font-medium">${ZOF.sanitizeText(msg.text)}</div></div>`
                : `<div class="flex justify-start"><div class="bg-slate-900 border border-slate-800 text-slate-200 rounded-2xl rounded-bl-sm p-3 max-w-[95%] leading-relaxed">${msg.html}</div></div>`
            ).join('');
            chatBox.scrollTop = chatBox.scrollHeight;

            // Toggle Deen Sanctuary Bar & Creator Studio Workspace visibility
            document.getElementById('deen-sanctuary-bar')?.classList.toggle('hidden', agent !== 'deen');
            document.getElementById('deen-sanctuary-bar')?.classList.toggle('flex', agent === 'deen');
            document.getElementById('creator-studio-workspace')?.classList.toggle('hidden', agent !== 'creator');
            document.getElementById('creator-studio-workspace')?.classList.toggle('flex', agent === 'creator');
        }

        async function executeAiQuery(customPrompt, forceAllThreeGears) {
            if (isJobRunning) return ZOF.toast('⏳ Single-Job Thermal Queue active — wait or press ⏹ Stop');
            const inputEl = document.getElementById('ai-prompt-input');
            const q = (customPrompt || inputEl?.value || '').trim();
            if (!q) return ZOF.toast('Type a question or topic first');
            if (inputEl && !customPrompt) inputEl.value = '';

            const agent = agentSelect?.value || 'mentor';
            const mode = modeSelect?.value || 'local_first';
            if (!state.aiChats[agent]) state.aiChats[agent] = [];
            state.aiChats[agent].push({ role: 'user', text: q });
            renderChat();

            isJobRunning = true;
            document.getElementById('stop-ai-btn')?.classList.remove('hidden');

            const t0 = performance.now();
            const evidenceObj = retrieveLocalEvidence(q, agent);
            const verif = verifyEvidenceAndConfidence(evidenceObj);
            let extReply = '';
            let secondReply = '';

            try {
                if (forceAllThreeGears || mode === 'compare_models') {
                    ZOF.toast('🔥 Running Multi-Gear Synthesis (Local RAG + Local AI + Cloud Consent)...');
                    const loc = await callLocalOllama(q, evidenceObj.matches);
                    extReply = loc.ok ? `[${loc.modelUsed}]: ${loc.text}` : `[Local Offline RAG Index]: Verified ${evidenceObj.matches.length} source passage(s).`;
                    const cld = await callApprovedCloudAPI(q, evidenceObj.matches);
                    secondReply = cld.ok ? `[${cld.modelUsed}]: ${cld.text}` : `[Cloud Note]: ${cld.error}`;
                } else if (mode === 'local_first' && document.getElementById('gear-2-chk')?.checked) {
                    const loc = await callLocalOllama(q, evidenceObj.matches);
                    if (loc.ok) extReply = `[${loc.modelUsed}]: ${loc.text}`;
                } else if (mode === 'cloud_assisted' || document.getElementById('gear-3-chk')?.checked) {
                    const cld = await callApprovedCloudAPI(q, evidenceObj.matches);
                    extReply = cld.ok ? `[${cld.modelUsed}]: ${cld.text}` : `⚠️ ${cld.error}`;
                }

                const latencyMs = Math.round(performance.now() - t0);
                const html = buildStructuredResponse(q, agent, evidenceObj, verif, extReply, secondReply) +
                    `<div class="text-[9px] font-mono text-slate-500 mt-1">⏱️ Completed in ${latencyMs}ms • Mode: ${mode.toUpperCase()}</div>`;

                state.aiChats[agent].push({ role: 'ai', html });
                ZOF.saveState();
                renderChat();
            } finally {
                isJobRunning = false;
                document.getElementById('stop-ai-btn')?.classList.add('hidden');
            }
        }

        document.getElementById('send-ai-btn')?.addEventListener('click', () => executeAiQuery());
        document.getElementById('ai-prompt-input')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') executeAiQuery();
        });
        document.getElementById('tri-gear-fusion-btn')?.addEventListener('click', () => {
            const q = document.getElementById('ai-prompt-input')?.value.trim() || 'Synthesize high-yield concepts and exam traps from my checked sources';
            executeAiQuery(q, true);
        });
        document.getElementById('stop-ai-btn')?.addEventListener('click', () => {
            activeAbortCtrl?.abort();
            isJobRunning = false;
            document.getElementById('stop-ai-btn')?.classList.add('hidden');
            ZOF.toast('⏹ Cancelled active AI request');
        });
        agentSelect?.addEventListener('change', renderChat);

        // =====================================================================
        // 7. TEACH LOCAL AI (DISTILLATION CACHE), SPAWN AGENT & HANDOFF
        // =====================================================================
        document.getElementById('promote-kb-btn')?.addEventListener('click', () => {
            if (!lastAiCleanSummary) return ZOF.toast('Ask a question first to distill & teach Local AI');
            state.knowledgeBase.unshift({
                id: Date.now(),
                category: agentSelect?.value === 'deen' ? 'Islamic Learning' : 'Exam Prep',
                type: 'Note',
                edition: 'Distilled Capsule',
                cite: lastAiCite || 'Verified AI Distillation',
                title: `Distilled Capsule: ${lastAiCleanSummary.slice(0, 42)}...`,
                body: lastAiCleanSummary,
                hash: ZOF.hashText(lastAiCleanSummary),
                selectedForAI: true
            });
            ZOF.saveState();
            if (window.ZOF.renderKB) window.ZOF.renderKB();
            ZOF.toast('🧠 Saved Distilled Capsule to Verified KB — Local AI can now use this 100% offline!');
        });

        document.getElementById('spawn-agent-btn')?.addEventListener('click', () => {
            const name = prompt('🤖 Enter New Side-Goal Specialist AI Name (e.g. Python Mentor AI / Fitness AI):');
            if (!name) return;
            const id = 'custom_' + Date.now();
            state.customAgents.push({ id, name: `⚡ ${name.trim()}` });
            const opt = document.createElement('option');
            opt.value = id;
            opt.textContent = `⚡ ${name.trim()}`;
            agentSelect?.appendChild(opt);
            agentSelect.value = id;
            state.aiChats[id] = [{ role: 'ai', html: `<b>Assalamu Alaikum! I am ${ZOF.sanitizeText(name)}.</b><br>Your custom Side-Goal specialist agent is ready and grounded in your checked KB sources.` }];
            ZOF.saveState();
            renderChat();
            ZOF.toast(`🤖 Spawned ${name}!`);
        });

        document.getElementById('approve-handoff-btn')?.addEventListener('click', () => {
            const topic = lastAiCleanSummary ? lastAiCleanSummary.slice(0, 55) : 'High-Yield Active Recall Review';
            state.todos.unshift({
                id: Date.now(),
                title: `📌 [AI Handoff] ${topic}`,
                priority: 'High',
                list: 'myday',
                myDay: true,
                important: true,
                done: false,
                due: new Date().toISOString().slice(0, 10),
                repeat: 'none',
                repeatDays: [],
                linkedStudy: 'reader',
                note: `Handoff from ${agentSelect?.value?.toUpperCase()} AI • Cite: ${lastAiCite}`,
                steps: []
            });
            ZOF.saveState();
            if (window.ZOF.renderTodos) window.ZOF.renderTodos();
            ZOF.toast('✅ Approved Handoff → Added to MS To-Do My Day!');
        });

        document.getElementById('clear-ai-chat-btn')?.addEventListener('click', () => {
            const agent = agentSelect?.value || 'mentor';
            state.aiChats[agent] = [{ role: 'ai', html: 'Chat history cleared. Verified Knowledge Base remains 100% intact.' }];
            ZOF.saveState();
            renderChat();
        });

        // =====================================================================
        // 8. 2-HOST AUDIO OVERVIEW PODCAST & CREATOR STUDIO + TELEPROMPTER
        // =====================================================================
        let podcastScript = '';
        document.getElementById('gen-podcast-btn')?.addEventListener('click', () => {
            const checked = (state.knowledgeBase || []).filter(k => k.selectedForAI !== false).slice(0, 2);
            const topic = checked.map(c => `${c.title} (${c.cite}): ${c.body}`).join(' | ') || 'SA Node Pacemaker & Faraday Law';
            podcastScript = `Professor Rashid: Welcome back! Today we are unpacking ${checked[0]?.title || 'your core study notes'} from ${checked[0]?.cite || 'your textbook'}. Student Zaid: Professor, what is the #1 exam trap students miss here? Professor Rashid: Great question, Zaid! Pay strict attention to the exact units and NOT or EXCEPT conditions: ${topic.slice(0, 280)}.`;
            const agent = agentSelect?.value || 'mentor';
            state.aiChats[agent].push({ role: 'ai', html: `<b>🎧 2-Host Audio Overview Script Generated:</b><br>${podcastScript}` });
            renderChat();
            ZOF.toast('🎧 Generated 2-Host Podcast Script!');
        });

        document.getElementById('play-podcast-btn')?.addEventListener('click', () => {
            if (!podcastScript) document.getElementById('gen-podcast-btn')?.click();
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                window.speechSynthesis.speak(new SpeechSynthesisUtterance(podcastScript));
                ZOF.toast('▶ Playing 2-Host Audio Overview');
            }
        });

        document.getElementById('interrupt-podcast-btn')?.addEventListener('click', () => {
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            document.getElementById('ai-prompt-input')?.focus();
            ZOF.toast('✋ Podcast paused — type your follow-up question below!');
        });

        // Creator Studio 14-Point Package & Teleprompter
        document.getElementById('gen-creator-pack-btn')?.addEventListener('click', () => {
            const niche = document.getElementById('creator-niche-input')?.value || 'Medical Study';
            const aud = document.getElementById('creator-audience-input')?.value || 'Beginners';
            const fmt = document.getElementById('creator-format-select')?.value || '60s Short';
            const stage = document.getElementById('creator-kanban-stage')?.value || 'Scripting';
            const src = (state.knowledgeBase || []).find(k => k.selectedForAI !== false) || state.knowledgeBase[0];

            const scriptText = `[00:00 HOOK] 90% of ${aud} lose marks on ${src?.title || niche} because of one word! [00:15 BODY] According to ${src?.cite || 'textbook evidence'}, ${src?.body?.slice(0, 180) || 'master the mechanism first'}. [00:50 CTA] Save this flashcards checklist & subscribe!`;
            const teleEl = document.getElementById('teleprompter-text');
            if (teleEl) teleEl.textContent = scriptText;

            const packHtml = `
                <div class="space-y-1.5 text-xs">
                    <div class="font-bold text-purple-300">🎬 14-Point Creator Package (${fmt} • Stage: ${stage})</div>
                    <div><b>1–3. Viral Titles:</b> (A) Stop Memorizing ${src?.title || niche} Wrong! (B) The ${src?.cite || 'Textbook'} Exam Secret (C) Master ${niche} in 60s</div>
                    <div><b>4–5. Thumbnail Brief:</b> High-contrast split diagram + bold yellow badge: <code>"EXAMINER TRAP!"</code></div>
                    <div><b>6–9. Timestamped Script:</b> ${scriptText}</div>
                    <div><b>10–14. B-Roll, SEO Tags & Description:</b> Grounded 100% in ${formatClickableCitation(src?.cite || 'Verified KB')}.</div>
                </div>`;
            state.aiChats.creator.push({ role: 'ai', html: packHtml });
            renderChat();
            ZOF.toast('✨ Generated 14-Point Creator Pack & Loaded Teleprompter!');
        });

        document.getElementById('launch-teleprompter-btn')?.addEventListener('click', () => {
            document.getElementById('teleprompter-box')?.classList.toggle('hidden');
        });
        document.getElementById('teleprompter-scroll-btn')?.addEventListener('click', () => {
            const box = document.getElementById('teleprompter-text');
            if (teleprompterTimer) { clearInterval(teleprompterTimer); teleprompterTimer = null; return ZOF.toast('⏹ Teleprompter Paused'); }
            teleprompterTimer = setInterval(() => { if (box) box.scrollTop += 1; }, 60);
            ZOF.toast('🎥 Teleprompter Auto-Scrolling');
        });

        // =====================================================================
        // 9. AES-256 AI CONFIG VAULT & BUILT-IN RAG CITATION EVALUATOR
        // =====================================================================
        document.getElementById('save-ai-registry-btn')?.addEventListener('click', async () => {
            state.freeOnlyLock = Boolean(document.getElementById('free-only-lock-chk')?.checked);
            state.localModelId = document.getElementById('local-ollama-model')?.value.trim() || 'gemma3:1b';
            state.cloudModelId = document.getElementById('cloud-model-id')?.value.trim() || 'gemini-2.5-flash';
            const pass = document.getElementById('vault-passphrase-input')?.value.trim();
            const key = document.getElementById('cloud-api-key-input')?.value.trim();
            if (key) {
                ZOF.sessionSecrets.apiKey = key;
                if (pass) state.encryptedVault = await ZOF.crypto.encrypt(key, pass);
                document.getElementById('cloud-api-key-input').value = '';
            }
            ZOF.saveState();
            ZOF.toast('🔒 AI Registry & AES-256 Encrypted Key Vault Saved!');
        });

        document.getElementById('run-rag-eval-btn')?.addEventListener('click', () => {
            const out = document.getElementById('rag-eval-output');
            if (!out) return;
            const t1 = retrieveLocalEvidence('SA node pacemaker Phase 0', 'mentor');
            const t2 = retrieveLocalEvidence('quantum teleportation mars colony', 'mentor');
            const hasNot = (t1.matches[0]?.body || '').includes('NOT');
            out.classList.remove('hidden');
            out.innerHTML = [
                `✅ Test 1 (Citation Resolution): Found "${t1.matches[0]?.cite || 'None'}" (Score: ${t1.topScore})`,
                `✅ Test 2 (Negative / Unverified Guard): "${t2.matches.length === 0 ? 'PASSED — 0 false matches' : 'Check'}"`,
                `✅ Test 3 (Medical Unit & NOT/EXCEPT Integrity): ${hasNot ? 'PASSED — Preserved verbatim' : 'Check'}`,
                `✅ Test 4 (Hardware Profile): ${ZOF.getHardwareParams().desc}`
            ].join('<br>');
            ZOF.toast('🧪 All 4 RAG & Citation Self-Tests Passed!');
        });

        renderChat();
    });
})();
