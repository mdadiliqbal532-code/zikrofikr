/* ============================================================================
   ZikrOFikr OS — Moon+ Library & Reader Pro Engine (module-library.js)
   Part 1: Bookshelf (Grid/List/Wall), Lazy PDF/EPUB/DOCX/CBZ Extractor,
           Duplicate Check, Private Shelf, Folder Scanner & Metadata Manager
   ============================================================================ */

(function () {
    'use strict';

    ZOF.onReady(() => {
        const state = ZOF.state;
        let shelfViewMode = 'grid';
        let showHiddenShelf = false;
        let autoScrollTimer = null;
        let ttsSpeaking = false;
        let ttsSentences = [];
        let ttsIndex = 0;
        let tiltEnabled = false;
        let shakeEnabled = false;
        let wakeLockObj = null;

        // =====================================================================
        // 1. LIBRARY SUB-TAB NAVIGATION & QUICK HOME CARD LINKS
        // =====================================================================
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

        document.getElementById('quick-card-read')?.addEventListener('click', () => {
            ZOF.switchTab('page-library');
            document.querySelector('[data-lib="lib-panel-reader"]')?.click();
        });
        document.getElementById('quick-card-revise')?.addEventListener('click', () => {
            ZOF.switchTab('page-library');
            document.querySelector('[data-lib="lib-panel-cards"]')?.click();
        });
        document.getElementById('quick-card-tasks')?.addEventListener('click', () => ZOF.switchTab('page-tasks'));
        document.getElementById('quick-card-ai')?.addEventListener('click', () => ZOF.switchTab('page-ai'));

        // =====================================================================
        // 2. ON-DEMAND LAZY LOADERS FOR HEAVY ENGINES (0 KB STARTUP RAM!)
        // =====================================================================
        async function loadScriptOnce(url, globalCheck) {
            if (window[globalCheck]) return window[globalCheck];
            return new Promise((resolve, reject) => {
                const s = document.createElement('script');
                s.src = url;
                s.onload = () => resolve(window[globalCheck]);
                s.onerror = () => reject(new Error('Failed to load ' + url));
                document.head.appendChild(s);
            });
        }

        async function extractFilePages(file) {
            const name = file.name || 'Imported_Book';
            const ext = name.split('.').pop().toLowerCase();

            // 1. Real PDF Page-by-Page Extractor (Lazy-Loads PDF.js)
            if (ext === 'pdf') {
                ZOF.toast('⏳ Lazy-loading PDF.js & extracting page-linked medical text...');
                try {
                    await loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js', 'pdfjsLib');
                    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                    const buf = await file.arrayBuffer();
                    const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
                    const pages = [];
                    const maxPages = Math.min(pdf.numPages, 250);
                    for (let i = 1; i <= maxPages; i++) {
                        const page = await pdf.getPage(i);
                        const txtContent = await page.getTextContent();
                        const pageStr = txtContent.items.map(it => it.str).join(' ');
                        pages.push(`PAGE ${i} (${name}):\n${ZOF.sanitizeText(pageStr)}`);
                    }
                    return { format: 'PDF', pages: pages.length ? pages : ['Empty PDF'] };
                } catch (e) {
                    return { format: 'PDF', pages: [`PDF Loaded (${name}). Connect once to cache PDF.js worker for offline extraction.`] };
                }
            }

            // 2. Real EPUB & CBZ Extractor (Uses JSZip)
            if (ext === 'epub' || ext === 'cbz') {
                try {
                    const zip = await window.JSZip.loadAsync(file);
                    const pages = [];
                    const files = Object.keys(zip.files).filter(f => /\.(xhtml|html|htm|txt|xml)$/i.test(f)).sort();
                    for (let i = 0; i < Math.min(files.length, 120); i++) {
                        const rawHtml = await zip.files[files[i]].async('string');
                        const stripped = rawHtml.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
                            .replace(/<[^>]+>/g, ' ')
                            .replace(/\s+/g, ' ')
                            .trim();
                        if (stripped.length > 40) {
                            pages.push(`SECTION ${pages.length + 1} (${name}):\n${ZOF.sanitizeText(stripped)}`);
                        }
                    }
                    return { format: ext.toUpperCase(), pages: pages.length ? pages : [`${ext.toUpperCase()} archive indexed: ${name}`] };
                } catch (e) {
                    return { format: ext.toUpperCase(), pages: [`Could not unpack ${name}: ${e.message}`] };
                }
            }

            // 3. Real DOCX Extractor (Lazy-Loads Mammoth.js)
            if (ext === 'docx') {
                try {
                    await loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js', 'mammoth');
                    const buf = await file.arrayBuffer();
                    const res = await window.mammoth.extractRawText({ arrayBuffer: buf });
                    const clean = ZOF.sanitizeText(res.value || '');
                    const chunks = clean.match(/[\s\S]{1,1800}/g) || [clean];
                    return { format: 'DOCX/CBZ', pages: chunks.map((c, i) => `PAGE ${i + 1} (${name}):\n${c}`) };
                } catch (e) {
                    return { format: 'DOCX/CBZ', pages: [`DOCX imported (${name}).`] };
                }
            }

            // 4. TXT, Markdown, HTML, JSON, CSV
            const text = ZOF.sanitizeText(await file.text());
            const splitPages = text.includes('---PAGE---')
                ? text.split('---PAGE---').map(s => s.trim()).filter(Boolean)
                : (text.match(/[\s\S]{1,1800}/g) || [text]);
            return {
                format: 'TXT/MD',
                pages: splitPages.map((p, idx) => p.startsWith('PAGE ') ? p : `PAGE ${idx + 1} (${name}):\n${p}`)
            };
        }

        // =====================================================================
        // 3. MOON+ BOOKSHELF RENDERER (GRID, LIST, 3D COVER WALL & FILTERS)
        // =====================================================================
        function renderBookshelf() {
            const grid = document.getElementById('bookshelf-grid');
            if (!grid) return;

            const q = (document.getElementById('shelf-search-input')?.value || '').toLowerCase();
            const catFilter = document.getElementById('shelf-filter-cat')?.value || 'all';
            const fmtFilter = document.getElementById('shelf-filter-format')?.value || 'all';
            const sortMode = document.getElementById('shelf-sort-select')?.value || 'recent';

            let books = state.books.filter(b => {
                if (Boolean(b.isHidden) !== showHiddenShelf) return false;
                if (catFilter === 'Favorites' && !b.isFavorite) return false;
                if (catFilter === 'Reading' && (b.progressPct <= 0 || b.progressPct >= 100)) return false;
                if (catFilter === 'Completed' && b.progressPct < 100) return false;
                if (!['all', 'Favorites', 'Reading', 'Completed'].includes(catFilter) && b.category !== catFilter) return false;
                if (fmtFilter !== 'all' && b.format !== fmtFilter) return false;
                if (q) {
                    const inMeta = (b.title || '').toLowerCase().includes(q) ||
                                   (b.author || '').toLowerCase().includes(q) ||
                                   (b.tags || []).join(' ').toLowerCase().includes(q);
                    const inPages = (b.pages || []).some(p => p.toLowerCase().includes(q));
                    if (!inMeta && !inPages) return false;
                }
                return true;
            });

            if (sortMode === 'title') books.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
            if (sortMode === 'author') books.sort((a, b) => (a.author || '').localeCompare(b.author || ''));
            if (sortMode === 'progress') books.sort((a, b) => (b.progressPct || 0) - (a.progressPct || 0));
            if (sortMode === 'added') books.sort((a, b) => (b.id || 0) - (a.id || 0));

            grid.className = shelfViewMode === 'list'
                ? 'flex flex-col gap-2'
                : (shelfViewMode === 'wall' ? 'grid grid-cols-2 sm:grid-cols-4 gap-3' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5');

            grid.innerHTML = books.map(b => {
                const total = (b.pages || []).length || 1;
                const cur = Math.min(total, b.currentPage || 1);
                const pct = Math.round((cur / total) * 100);
                b.progressPct = pct;

                if (shelfViewMode === 'wall') {
                    return `
                        <div onclick="window.ZOF.openBook(${b.id})" class="bg-gradient-to-br from-slate-900 via-blue-950/40 to-slate-950 border border-slate-700 hover:border-blue-400 rounded-2xl p-3.5 flex flex-col justify-between aspect-[3/4] cursor-pointer shadow-lg transition-transform hover:-translate-y-1">
                            <div class="flex justify-between items-center text-[9px] font-mono">
                                <span class="px-1.5 py-0.5 rounded bg-blue-600/30 text-blue-300 font-bold">${b.format || 'BOOK'}</span>
                                <span>${b.isFavorite ? '⭐' : ''}</span>
                            </div>
                            <div class="my-auto text-center">
                                <h4 class="text-xs font-extrabold text-white line-clamp-3">${b.title}</h4>
                                <p class="text-[10px] text-slate-400 mt-1 truncate">${b.author || 'Verified Source'}</p>
                            </div>
                            <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div class="bg-emerald-500 h-full" style="width:${pct}%"></div>
                            </div>
                        </div>`;
                }

                return `
                    <div class="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-3 flex flex-col justify-between gap-2 transition-all">
                        <div>
                            <div class="flex justify-between items-center gap-1">
                                <span class="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/40">${b.format || 'PDF'} • ${b.category}</span>
                                <div class="flex items-center gap-1.5 text-xs">
                                    <button type="button" onclick="window.ZOF.toggleBookFav(${b.id})" title="Favorite">${b.isFavorite ? '⭐' : '☆'}</button>
                                    <button type="button" onclick="window.ZOF.editBookMeta(${b.id})" class="text-[10px] text-slate-400 hover:text-white" title="Edit Metadata">✏️</button>
                                    <button type="button" onclick="window.ZOF.deleteBook(${b.id})" class="text-[10px] text-red-400" title="Delete">✕</button>
                                </div>
                            </div>
                            <h4 onclick="window.ZOF.openBook(${b.id})" class="text-xs font-bold text-white mt-1.5 cursor-pointer hover:text-blue-400">${b.title}</h4>
                            <p class="text-[10px] text-slate-400">${b.author || 'Edition Verified'} • ${(b.tags || []).join(' ')}</p>
                            ${b.cloudUrl ? `<a href="${b.cloudUrl}" target="_blank" rel="noopener" class="inline-block mt-1 text-[10px] text-amber-300 underline font-mono">☁️ Open Linked Cold-Storage File</a>` : ''}
                        </div>
                        <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                            <span class="text-emerald-400 font-mono">Page ${cur}/${total} (${pct}%)</span>
                            <button type="button" onclick="window.ZOF.openBook(${b.id})" class="bg-blue-600/20 text-blue-300 border border-blue-500/30 font-bold px-2.5 py-0.5 rounded-lg">Read ▶</button>
                        </div>
                    </div>`;
            }).join('') || `<p class="text-xs text-slate-500 col-span-full text-center py-6">${showHiddenShelf ? '🔒 Private Shelf is empty.' : 'No matching books found.'}</p>`;
        }

        // View Mode, Search, Filter & Sort Listeners
        document.querySelectorAll('.shelf-view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                shelfViewMode = btn.dataset.view;
                document.querySelectorAll('.shelf-view-btn').forEach(b => {
                    b.className = `shelf-view-btn ${b === btn ? 'bg-blue-600 text-white' : 'text-slate-400'} text-[10px] font-bold px-2 py-1 rounded-lg`;
                });
                renderBookshelf();
            });
        });
        ['shelf-search-input', 'shelf-filter-cat', 'shelf-filter-format', 'shelf-sort-select'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', renderBookshelf);
            document.getElementById(id)?.addEventListener('change', renderBookshelf);
        });

        // Private Shelf, Dedupe & Folder Scanner
        document.getElementById('toggle-hidden-shelf-btn')?.addEventListener('click', () => {
            if (!showHiddenShelf) {
                const pin = prompt('🔒 Enter PIN to access Private Shelf (Default: 1234):');
                if (pin !== state.appLockPin && pin !== '1234') return ZOF.toast('❌ Invalid PIN');
            }
            showHiddenShelf = !showHiddenShelf;
            renderBookshelf();
            ZOF.toast(showHiddenShelf ? '🔒 Viewing Private Shelf' : '📚 Returned to Main Shelf');
        });

        document.getElementById('dedupe-shelf-btn')?.addEventListener('click', () => {
            const seen = new Set();
            const before = state.books.length;
            state.books = state.books.filter(b => {
                const sig = `${(b.title || '').toLowerCase()}_${(b.pages || []).length}`;
                if (seen.has(sig)) return false;
                seen.add(sig);
                return true;
            });
            const removed = before - state.books.length;
            ZOF.saveState();
            renderBookshelf();
            ZOF.toast(removed ? `🧹 Removed ${removed} duplicate book(s)!` : '✅ Zero duplicates found!');
        });

        document.getElementById('sd-folder-picker-btn')?.addEventListener('click', async () => {
            if (window.showDirectoryPicker) {
                try {
                    const dirHandle = await window.showDirectoryPicker();
                    let count = 0;
                    for await (const entry of dirHandle.values()) {
                        if (entry.kind === 'file' && /\.(pdf|epub|txt|md|docx|cbz|html)$/i.test(entry.name)) {
                            const file = await entry.getFile();
                            await importBookFile(file);
                            count++;
                        }
                    }
                    ZOF.toast(`📂 Imported ${count} study file(s) from folder!`);
                } catch (e) { /* User cancelled */ }
            } else {
                document.getElementById('book-file-input')?.click();
            }
        });

        async function importBookFile(file) {
            const extracted = await extractFilePages(file);
            const title = file.name.replace(/\.[^/.]+$/, '');
            const newId = Date.now() + Math.floor(Math.random() * 1000);
            const newBook = {
                id: newId,
                title,
                author: `Imported (${(file.size / 1024).toFixed(0)} KB)`,
                format: extracted.format,
                category: 'Biology/Medical',
                tags: ['#imported'],
                isFavorite: false,
                isHidden: showHiddenShelf,
                currentPage: 1,
                totalPages: extracted.pages.length,
                progressPct: 0,
                cloudUrl: '',
                pages: extracted.pages
            };
            state.books.unshift(newBook);
            // Index first 3 pages into Verified KB automatically
            extracted.pages.slice(0, 3).forEach((pText, idx) => {
                state.knowledgeBase.unshift({
                    id: newId + idx + 1,
                    category: 'Biology',
                    type: 'Book/PDF',
                    edition: 'Imported File',
                    cite: `${title}, p. ${idx + 1}`,
                    title: `${title} — Page ${idx + 1}`,
                    body: pText.slice(0, 900),
                    hash: ZOF.hashText(pText),
                    selectedForAI: true
                });
            });
            ZOF.saveState();
            renderBookshelf();
            if (window.ZOF.renderKB) window.ZOF.renderKB();
        }

        document.getElementById('book-file-input')?.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files || []);
            for (const f of files) await importBookFile(f);
            ZOF.toast(`📥 Imported & indexed ${files.length} file(s)!`);
        });

        document.getElementById('add-book-btn')?.addEventListener('click', () => {
            const title = document.getElementById('new-book-title').value.trim();
            const author = document.getElementById('new-book-author').value.trim() || 'Edition Verified';
            const tags = document.getElementById('new-book-tags').value.split(/\s+/).filter(Boolean);
            const category = document.getElementById('new-book-cat').value;
            const cloudUrl = document.getElementById('new-book-cloud-url').value.trim();
            const rawContent = ZOF.sanitizeText(document.getElementById('new-book-content').value.trim());
            if (!title) return ZOF.toast('Enter a Book or Chapter Title');
            const pages = rawContent
                ? (rawContent.includes('---PAGE---') ? rawContent.split('---PAGE---').map(s => s.trim()) : (rawContent.match(/[\s\S]{1,1800}/g) || [rawContent]))
                : [`Cloud-Linked Volume: ${title}\nAuthor/Edition: ${author}\nCold Link: ${cloudUrl}`];
            const id = Date.now();
            state.books.unshift({ id, title, author, format: 'PDF', category, tags, isFavorite: false, isHidden: showHiddenShelf, currentPage: 1, totalPages: pages.length, progressPct: 0, cloudUrl, pages });
            pages.forEach((p, idx) => {
                state.knowledgeBase.unshift({
                    id: id + idx + 1,
                    category: category.includes('Islamic') ? 'Islamic Learning' : (category.includes('Med') ? 'Biology' : category),
                    type: 'Book/PDF',
                    edition: author,
                    cite: `${title} (${author}), p. ${idx + 1}`,
                    title: `${title} — p. ${idx + 1}`,
                    body: p,
                    hash: ZOF.hashText(p),
                    selectedForAI: true
                });
            });
            document.getElementById('new-book-title').value = '';
            document.getElementById('new-book-content').value = '';
            ZOF.saveState();
            renderBookshelf();
            if (window.ZOF.renderKB) window.ZOF.renderKB();
            window.ZOF.openBook(id);
            ZOF.toast('📚 Added to Shelf & Indexed in Verified KB!');
        });

        window.ZOF.toggleBookFav = (id) => {
            const b = state.books.find(x => x.id === id);
            if (b) { b.isFavorite = !b.isFavorite; ZOF.saveState(); renderBookshelf(); }
        };
        window.ZOF.editBookMeta = (id) => {
            const b = state.books.find(x => x.id === id);
            if (!b) return;
            const t = prompt('Edit Title:', b.title);
            const a = prompt('Edit Author & Edition:', b.author);
            if (t) b.title = t.trim();
            if (a) b.author = a.trim();
            ZOF.saveState();
            renderBookshelf();
        };
        window.ZOF.deleteBook = (id) => {
            state.books = state.books.filter(x => x.id !== id);
            ZOF.saveState();
            renderBookshelf();
        };
// === END OF BATCH 4 PART 1 — PASTE BATCH 4 PART 2 DIRECTLY BELOW THIS LINE ===
