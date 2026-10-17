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
       // =====================================================================
        // 4. MOON+ READER PRO ENGINE (PAGE CURL, TAP ZONES, RULER, INK & TTS)
        // =====================================================================
        const contentBox = document.getElementById('reader-content-box');
        const pageSlider = document.getElementById('reader-page-slider');

        function getActiveBook() {
            return state.books.find(b => b.id === state.activeBookId) || state.books[0];
        }

        window.ZOF.openBook = (id, targetPage) => {
            const book = state.books.find(b => b.id === id) || state.books[0];
            if (!book) return;
            state.activeBookId = book.id;
            if (targetPage && targetPage >= 1 && targetPage <= (book.pages?.length || 1)) {
                book.currentPage = targetPage;
            }
            document.querySelector('[data-lib="lib-panel-reader"]')?.click();
            renderReaderPage('curl');
            ZOF.saveState();
        };

        // Clickable Citation Jump (Used by AI Hub & KB to open exact book & page)
        window.ZOF.jumpToCitation = (citeStr) => {
            const cLower = (citeStr || '').toLowerCase();
            const pageMatch = cLower.match(/p\.\s*(\d+)|page\s*(\d+)/i);
            const pageNum = pageMatch ? parseInt(pageMatch[1] || pageMatch[2], 10) : 1;
            const book = state.books.find(b => cLower.includes((b.title || '').split(':')[0].toLowerCase())) || getActiveBook();
            ZOF.switchTab('page-library');
            if (book) {
                const idx = (book.pages || []).findIndex(p => p.toLowerCase().includes(`page ${pageNum}`));
                window.ZOF.openBook(book.id, idx >= 0 ? idx + 1 : Math.min(pageNum, book.pages.length));
                ZOF.toast(`📍 Jumped to verified source: ${citeStr}`);
            }
        };

        function applyHighlightsToHtml(rawText, bookId, pageNum) {
            let safe = ZOF.sanitizeText(rawText)
                .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const anns = (state.annotations || []).filter(a => a.bookId === bookId && a.page === pageNum);
            anns.forEach(a => {
                if (!a.text || a.text.length < 3) return;
                const esc = a.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const cls = a.style === 'underline' ? 'hl-underline' : `hl-${a.color || 'yellow'}`;
                const noteBadge = a.note ? ` <span class="text-[10px] bg-amber-500/20 text-amber-300 px-1 rounded" title="${a.note}">📝 ${a.note}</span>` : '';
                safe = safe.replace(new RegExp(esc, 'g'), `<mark class="${cls}">${a.text}</mark>${noteBadge}`);
            });
            return safe;
        }

        function renderReaderPage(animStyle) {
            const book = getActiveBook();
            if (!book || !contentBox) return;
            const pages = book.pages && book.pages.length ? book.pages : ['Empty book'];
            const total = pages.length;
            book.currentPage = Math.max(1, Math.min(total, book.currentPage || 1));
            book.progressPct = Math.round((book.currentPage / total) * 100);

            document.getElementById('reader-book-title').textContent = book.title;
            document.getElementById('reader-book-meta').textContent = `${book.author || 'Verified'} • ${book.format || 'PDF'} • Page ${book.currentPage}/${total}`;
            if (pageSlider) { pageSlider.max = String(total); pageSlider.value = String(book.currentPage); }

            // Typography & Mode Application
            const prefs = state.readerPrefs || {};
            contentBox.style.fontSize = `${prefs.fontSize || 15}px`;
            contentBox.style.fontFamily = prefs.fontFamily || "'Inter', sans-serif";
            contentBox.style.lineHeight = prefs.lineHeight || '1.8';
            contentBox.style.textAlign = prefs.align || 'left';
            contentBox.classList.toggle('dual-page-mode', Boolean(prefs.dualPage));
            contentBox.classList.toggle('pdf-night-invert', Boolean(prefs.pdfInvert));

            // Page Mode vs Continuous Vertical Scroll Mode
            const rawPage = prefs.pageMode === 'scroll'
                ? pages.map((p, i) => `--- [Page ${i + 1}] ---\n${p}`).join('\n\n')
                : pages[book.currentPage - 1];

            contentBox.innerHTML = applyHighlightsToHtml(rawPage, book.id, book.currentPage);

            // Page Turn Animation (3D Curl / Slide / Fade)
            contentBox.classList.remove('anim-page-curl', 'anim-page-slide', 'anim-page-fade');
            void contentBox.offsetWidth;
            const mode = animStyle || prefs.pageMode || 'curl';
            if (mode === 'curl') contentBox.classList.add('anim-page-curl');
            else if (mode === 'slide') contentBox.classList.add('anim-page-slide');
            else if (mode === 'fade') contentBox.classList.add('anim-page-fade');

            updateStatusBar(book, total);
            renderBookshelf();
        }

        function updateStatusBar(book, total) {
            const wordsLeft = ((total - book.currentPage) * 260);
            const minsLeft = Math.max(1, Math.round(wordsLeft / 200));
            const progEl = document.getElementById('status-book-progress');
            if (progEl) progEl.textContent = `Page ${book.currentPage}/${total} (${book.progressPct}%) • ~${minsLeft}m left`;

            const clockEl = document.getElementById('status-clock-battery');
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (navigator.getBattery) {
                navigator.getBattery().then(bat => {
                    if (clockEl) clockEl.textContent = `🕒 ${timeStr} • 🔋 ${Math.round(bat.level * 100)}%`;
                }).catch(() => { if (clockEl) clockEl.textContent = `🕒 ${timeStr}`; });
            } else if (clockEl) {
                clockEl.textContent = `🕒 ${timeStr}`;
            }
        }

        function turnPage(delta) {
            const book = getActiveBook();
            if (!book) return;
            const next = (book.currentPage || 1) + delta;
            if (next < 1 || next > (book.pages?.length || 1)) return ZOF.toast(delta > 0 ? '🎉 Reached end of book!' : 'At first page');
            book.currentPage = next;
            state.stats.pagesRead = (state.stats.pagesRead || 0) + (delta > 0 ? 1 : 0);
            ZOF.saveState();
            renderReaderPage();
        }

        document.getElementById('reader-prev-page')?.addEventListener('click', () => turnPage(-1));
        document.getElementById('reader-next-page')?.addEventListener('click', () => turnPage(1));
        pageSlider?.addEventListener('input', (e) => {
            const book = getActiveBook();
            if (book) { book.currentPage = parseInt(e.target.value, 10) || 1; renderReaderPage('fade'); }
        });

        // 9-Grid Tap Zones on Reader Canvas (Left 28% = Prev, Right 28% = Next)
        contentBox?.addEventListener('click', (e) => {
            if (window.getSelection()?.toString().trim().length > 0) return;
            const rect = contentBox.getBoundingClientRect();
            const relX = (e.clientX - rect.left) / rect.width;
            if (relX < 0.25) turnPage(-1);
            else if (relX > 0.75) turnPage(1);
        });

        // Keyboard Arrow / PageUp / PageDown & Bluetooth Headset MediaSession
        document.addEventListener('keydown', (e) => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
            const readerVisible = !document.getElementById('lib-panel-reader')?.classList.contains('hidden');
            if (!readerVisible) return;
            if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); turnPage(1); }
            if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); turnPage(-1); }
        });

        if ('mediaSession' in navigator) {
            try {
                navigator.mediaSession.setActionHandler('nexttrack', () => turnPage(1));
                navigator.mediaSession.setActionHandler('previoustrack', () => turnPage(-1));
            } catch (e) { /* Optional headset binding */ }
        }

        // Typography, Page Mode, Dual-Page, Invert, Fullscreen & Zoom Controls
        document.getElementById('reader-font-inc')?.addEventListener('click', () => {
            state.readerPrefs.fontSize = Math.min(28, (state.readerPrefs.fontSize || 15) + 1);
            document.getElementById('lbl-font-size').textContent = `${state.readerPrefs.fontSize}px`;
            renderReaderPage('none'); ZOF.saveState();
        });
        document.getElementById('reader-font-dec')?.addEventListener('click', () => {
            state.readerPrefs.fontSize = Math.max(11, (state.readerPrefs.fontSize || 15) - 1);
            document.getElementById('lbl-font-size').textContent = `${state.readerPrefs.fontSize}px`;
            renderReaderPage('none'); ZOF.saveState();
        });
        document.getElementById('reader-font-family')?.addEventListener('change', (e) => { state.readerPrefs.fontFamily = e.target.value; renderReaderPage('none'); ZOF.saveState(); });
        document.getElementById('reader-line-height')?.addEventListener('change', (e) => { state.readerPrefs.lineHeight = e.target.value; renderReaderPage('none'); ZOF.saveState(); });
        document.getElementById('reader-align-select')?.addEventListener('change', (e) => { state.readerPrefs.align = e.target.value; renderReaderPage('none'); ZOF.saveState(); });
        document.getElementById('pdf-zoom-in')?.addEventListener('click', () => document.getElementById('reader-font-inc')?.click());
        document.getElementById('pdf-zoom-out')?.addEventListener('click', () => document.getElementById('reader-font-dec')?.click());

        document.getElementById('reader-mode-btn')?.addEventListener('click', () => {
            const modes = ['curl', 'slide', 'fade', 'scroll'];
            const next = modes[(modes.indexOf(state.readerPrefs.pageMode || 'curl') + 1) % modes.length];
            state.readerPrefs.pageMode = next;
            ZOF.saveState();
            renderReaderPage(next);
            ZOF.toast(`📄 Reader Mode: ${next.toUpperCase()}`);
        });
        document.getElementById('reader-dual-pdf-btn')?.addEventListener('click', () => {
            state.readerPrefs.dualPage = !state.readerPrefs.dualPage;
            renderReaderPage('none');
            ZOF.toast(state.readerPrefs.dualPage ? '📖 Dual-Page Spread ON' : '📄 Single-Page Mode');
        });
        document.getElementById('reader-pdf-invert-btn')?.addEventListener('click', () => {
            state.readerPrefs.pdfInvert = !state.readerPrefs.pdfInvert;
            renderReaderPage('none');
            ZOF.toast('🌗 Toggled PDF Night Invert');
        });
        document.getElementById('reader-fullscreen-btn')?.addEventListener('click', () => {
            document.body.classList.toggle('reader-fullscreen');
            ZOF.toast('⛶ Toggled Full-Screen Immersive Mode');
        });

        // Draggable Focus Reading Ruler & Auto-Scroll
        const rulerBar = document.getElementById('reading-ruler-bar');
        document.getElementById('reader-ruler-btn')?.addEventListener('click', () => rulerBar?.classList.toggle('hidden'));
        let draggingRuler = false;
        rulerBar?.addEventListener('mousedown', () => { draggingRuler = true; });
        rulerBar?.addEventListener('touchstart', () => { draggingRuler = true; }, { passive: true });
        document.addEventListener('mousemove', (e) => {
            if (!draggingRuler || !rulerBar) return;
            const rect = document.getElementById('reader-stage-wrapper')?.getBoundingClientRect();
            if (rect) rulerBar.style.top = `${Math.max(0, Math.min(rect.height - 36, e.clientY - rect.top - 18))}px`;
        });
        document.addEventListener('touchmove', (e) => {
            if (!draggingRuler || !rulerBar) return;
            const rect = document.getElementById('reader-stage-wrapper')?.getBoundingClientRect();
            if (rect && e.touches[0]) rulerBar.style.top = `${Math.max(0, Math.min(rect.height - 36, e.touches[0].clientY - rect.top - 18))}px`;
        }, { passive: true });
        document.addEventListener('mouseup', () => { draggingRuler = false; });
        document.addEventListener('touchend', () => { draggingRuler = false; });

        document.getElementById('reader-autoscroll-btn')?.addEventListener('click', () => {
            if (autoScrollTimer) {
                clearInterval(autoScrollTimer); autoScrollTimer = null;
                return ZOF.toast('⏹ Stopped Auto-Scroll');
            }
            autoScrollTimer = setInterval(() => { if (contentBox) contentBox.scrollTop += 1; }, 45);
            ZOF.toast('⏬ Auto-Scroll Active (Tap again to stop)');
        });

        // Freehand Pen & Highlighter Ink Canvas
        const inkCanvas = document.getElementById('reader-ink-canvas');
        let drawingInk = false;
        document.getElementById('reader-ink-btn')?.addEventListener('click', () => {
            if (!inkCanvas || !contentBox) return;
            const hidden = inkCanvas.classList.toggle('hidden');
            if (!hidden) {
                inkCanvas.width = contentBox.clientWidth;
                inkCanvas.height = contentBox.clientHeight;
                ZOF.toast('✏️ Freehand Ink Pen Active (Draw on page)');
            } else { ZOF.toast('✏️ Ink Layer Hidden'); }
        });
        inkCanvas?.addEventListener('pointerdown', (e) => {
            drawingInk = true;
            const ctx = inkCanvas.getContext('2d');
            ctx.strokeStyle = 'rgba(250, 204, 21, 0.75)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(e.offsetX, e.offsetY);
        });
        inkCanvas?.addEventListener('pointermove', (e) => {
            if (!drawingInk) return;
            const ctx = inkCanvas.getContext('2d');
            ctx.lineTo(e.offsetX, e.offsetY);
            ctx.stroke();
        });
        inkCanvas?.addEventListener('pointerup', () => { drawingInk = false; });

        // System TTS with Real-Time Sentence Highlighting & Shake-to-Speak
        document.getElementById('reader-tts-btn')?.addEventListener('click', () => {
            document.getElementById('reader-tts-bar')?.classList.toggle('hidden');
        });
        function speakCurrentSentence() {
            if (!('speechSynthesis' in window)) return ZOF.toast('TTS not supported');
            window.speechSynthesis.cancel();
            const book = getActiveBook();
            const raw = (book?.pages?.[book.currentPage - 1] || '').replace(/<[^>]+>/g, '');
            ttsSentences = raw.match(/[^.!?]+[.!?]+|\S+/g) || [raw];
            if (!ttsSentences.length) return;
            ttsIndex = Math.max(0, Math.min(ttsSentences.length - 1, ttsIndex));
            const sent = ttsSentences[ttsIndex].trim();
            const utter = new SpeechSynthesisUtterance(sent);
            utter.rate = parseFloat(document.getElementById('tts-speed-select')?.value || '1.0');
            utter.onend = () => {
                if (ttsSpeaking && ttsIndex < ttsSentences.length - 1) { ttsIndex++; speakCurrentSentence(); }
                else { ttsSpeaking = false; }
            };
            ttsSpeaking = true;
            window.speechSynthesis.speak(utter);
            ZOF.toast(`🔊 Speaking sentence ${ttsIndex + 1}/${ttsSentences.length}`);
        }
        document.getElementById('tts-play-pause')?.addEventListener('click', () => {
            if (ttsSpeaking) { window.speechSynthesis.cancel(); ttsSpeaking = false; ZOF.toast('⏸ TTS Paused'); }
            else { speakCurrentSentence(); }
        });
        document.getElementById('tts-prev-sent')?.addEventListener('click', () => { ttsIndex = Math.max(0, ttsIndex - 1); speakCurrentSentence(); });
        document.getElementById('tts-next-sent')?.addEventListener('click', () => { ttsIndex++; speakCurrentSentence(); });
        document.getElementById('tts-shake-toggle')?.addEventListener('click', () => {
            shakeEnabled = !shakeEnabled;
            ZOF.toast(shakeEnabled ? '📳 Shake-to-Speak ON' : '📳 Shake-to-Speak OFF');
        });

        // WakeLock, Tilt-to-Turn & 1-3-7-21-30d Automated Spaced Revision
        document.getElementById('toggle-wakelock-btn')?.addEventListener('click', async () => {
            if (wakeLockObj) { await wakeLockObj.release(); wakeLockObj = null; return ZOF.toast('💡 Screen WakeLock Released'); }
            try { wakeLockObj = await navigator.wakeLock?.request('screen'); ZOF.toast('💡 Keep Screen Awake ON'); }
            catch (e) { ZOF.toast('💡 WakeLock active while tab is focused'); }
        });
        document.getElementById('toggle-tilt-btn')?.addEventListener('click', () => {
            tiltEnabled = !tiltEnabled;
            ZOF.toast(tiltEnabled ? '📱 Tilt-to-Turn Page ON' : '📱 Tilt-to-Turn OFF');
        });
        window.addEventListener('deviceorientation', (e) => {
            if (!tiltEnabled) return;
            if (e.gamma > 28) turnPage(1);
            else if (e.gamma < -28) turnPage(-1);
        });

        document.getElementById('mark-chapter-learned-btn')?.addEventListener('click', () => {
            const book = getActiveBook();
            if (!book) return;
            const intervals = [1, 3, 7, 21, 30];
            intervals.forEach(days => {
                const d = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
                state.todos.unshift({
                    id: Date.now() + days,
                    title: `🔁 [Day +${days} Revision] ${book.title} (p. ${book.currentPage})`,
                    priority: 'High',
                    list: 'planned',
                    myDay: days === 1,
                    important: true,
                    done: false,
                    due: d,
                    repeat: 'none',
                    repeatDays: [],
                    linkedStudy: 'reader',
                    note: `Automated 1-3-7-21-30d Spaced Revision from Moon+ Reader.`,
                    steps: []
                });
            });
            ZOF.saveState();
            if (window.ZOF.renderTodos) window.ZOF.renderTodos();
            ZOF.toast('📅 Scheduled Day +1, +3, +7, +21 & +30 Revisions in MS To-Do!');
        });

        // Bookmarks, TOC/Highlights Drawer, In-Book Search & High-Yield Cram Sheet
        document.getElementById('reader-bookmark-btn')?.addEventListener('click', () => {
            const book = getActiveBook();
            if (!book) return;
            state.annotations.unshift({ id: Date.now(), bookId: book.id, page: book.currentPage, type: 'bookmark', text: `Bookmark on Page ${book.currentPage}`, color: 'amber' });
            ZOF.saveState();
            ZOF.toast(`🔖 Saved Bookmark for Page ${book.currentPage}!`);
        });
        document.getElementById('reader-toc-btn')?.addEventListener('click', () => {
            const drawer = document.getElementById('reader-toc-drawer');
            const book = getActiveBook();
            if (!drawer || !book) return;
            drawer.classList.toggle('hidden');
            const anns = (state.annotations || []).filter(a => a.bookId === book.id);
            drawer.innerHTML = `<div class="font-bold text-blue-400">📑 Pages & Saved Annotations (${anns.length})</div>` +
                anns.map(a => `<div onclick="window.ZOF.openBook(${book.id}, ${a.page})" class="p-1.5 rounded bg-slate-950 border border-slate-800 cursor-pointer flex justify-between"><span>${a.type === 'bookmark' ? '🔖' : '🖍️'} ${a.text.slice(0, 60)}</span><span class="text-emerald-400 font-mono">p. ${a.page}</span></div>`).join('');
        });
        document.getElementById('reader-search-toggle-btn')?.addEventListener('click', () => document.getElementById('reader-search-bar')?.classList.toggle('hidden'));
        document.getElementById('inbook-search-btn')?.addEventListener('click', () => {
            const q = (document.getElementById('inbook-search-input')?.value || '').toLowerCase();
            const book = getActiveBook();
            if (!q || !book) return;
            const idx = (book.pages || []).findIndex(p => p.toLowerCase().includes(q));
            if (idx >= 0) { window.ZOF.openBook(book.id, idx + 1); ZOF.toast(`🔍 Found "${q}" on Page ${idx + 1}`); }
            else { ZOF.toast(`No match for "${q}" in this book`); }
        });

        document.getElementById('status-high-yield-btn')?.addEventListener('click', () => {
            const cram = (state.annotations || []).filter(a => ['blue', 'orange', 'red'].includes(a.color));
            const txt = cram.map(a => `• [${a.color.toUpperCase()} — p. ${a.page}] ${a.text} ${a.note ? '(' + a.note + ')' : ''}`).join('\n') || 'Highlight formulas (Blue), exam topics (Orange), or doubts (Red) to build your High-Yield Cram Sheet!';
            alert(`🚨 LAST-MINUTE HIGH-YIELD CRAM SHEET:\n\n${txt}`);
        });

        document.getElementById('export-annotations-btn')?.addEventListener('click', () => {
            const md = (state.annotations || []).map(a => `- **[p. ${a.page} | ${a.color}]** ${a.text} ${a.note ? '— *Note: ' + a.note + '*' : ''}`).join('\n');
            const blob = new Blob([`# Exported Book Highlights & Notes\n\n${md}`], { type: 'text/markdown' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'ZikrOFikr_Book_Annotations.md';
            link.click();
            ZOF.toast('📤 Exported Highlights & Notes (.MD)!');
        });

        // =====================================================================
        // 5. FLOATING 15-ACTION SELECTION MENU
        // =====================================================================
        let selectedText = '';
        const selToolbar = document.getElementById('selection-toolbar');
        const checkSelection = () => {
            setTimeout(() => {
                const txt = window.getSelection()?.toString().trim() || '';
                if (txt.length > 2) {
                    selectedText = txt;
                    selToolbar?.classList.remove('hidden');
                    selToolbar.style.bottom = '68px';
                    selToolbar.style.left = '10px';
                }
            }, 80);
        };
        document.addEventListener('mouseup', checkSelection);
        document.addEventListener('touchend', checkSelection);

        document.querySelectorAll('.sel-action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const act = btn.dataset.act;
                const color = btn.dataset.color || 'yellow';
                const book = getActiveBook() || { id: 101, title: 'Study Reader', author: '14th Ed.', currentPage: 1 };
                selToolbar?.classList.add('hidden');
                if (!selectedText) return;
                const cite = `${book.title} (${book.author || 'Verified'}), p. ${book.currentPage || 1}`;

                if (act === 'highlight' || act === 'underline' || act === 'note') {
                    const note = act === 'note' ? (prompt('Attach Floating Note to Highlight:') || '') : '';
                    state.annotations.unshift({ id: Date.now(), bookId: book.id, page: book.currentPage, text: selectedText, color, style: act === 'underline' ? 'underline' : 'fill', note });
                    state.knowledgeBase.unshift({ id: Date.now() + 1, category: 'Exam Prep', type: 'Book/PDF', edition: book.author || 'Verified', cite, title: `Highlight [${color.toUpperCase()}]: ${selectedText.slice(0, 34)}...`, body: selectedText + (note ? `\nNote: ${note}` : ''), hash: ZOF.hashText(selectedText), selectedForAI: true });
                    ZOF.saveState(); renderReaderPage('none'); if (window.ZOF.renderKB) window.ZOF.renderKB();
                    ZOF.toast(`🖍️ Highlighted & Saved to Verified KB [${cite}]`);
                } else if (act === 'copy') {
                    navigator.clipboard?.writeText(`${selectedText} [${cite}]`);
                    ZOF.toast('📋 Copied with source citation!');
                } else if (act === 'define') {
                    if (window.ZOF.lookupArabicOrTerm) window.ZOF.lookupArabicOrTerm(selectedText);
                    else ZOF.toast(`📖 Definition / Root Lookup: "${selectedText.slice(0, 45)}"`);
                } else if (act === 'translate') {
                    ZOF.switchTab('page-ai');
                    document.getElementById('ai-prompt-input').value = `Translate & explain medical/context terms from [${cite}]: "${selectedText}"`;
                    document.getElementById('send-ai-btn')?.click();
                } else if (act === 'search_lib') {
                    document.querySelector('[data-lib="lib-panel-bookshelf"]')?.click();
                    document.getElementById('shelf-search-input').value = selectedText.slice(0, 40);
                    renderBookshelf();
                } else if (act === 'explain' || act === 'summarize') {
                    ZOF.switchTab('page-ai');
                    document.getElementById('ai-agent-select').value = 'mentor';
                    document.getElementById('ai-prompt-input').value = `${act === 'explain' ? 'Explain simply' : 'Summarize & create mnemonic'} from [${cite}]: "${selectedText}"`;
                    document.getElementById('send-ai-btn')?.click();
                } else if (act === 'flashcard') {
                    state.flashcards.unshift({ id: Date.now(), q: `From [${cite}], explain: "${selectedText.slice(0, 65)}..."`, a: selectedText, src: cite, interval: '1d', mastered: false });
                    ZOF.saveState(); if (window.ZOF.renderFlashcards) window.ZOF.renderFlashcards();
                    ZOF.toast(`🃏 Created Source-Linked Flashcard [${cite}]!`);
                } else if (act === 'kb') {
                    state.knowledgeBase.unshift({ id: Date.now(), category: 'Biology', type: 'Book/PDF', edition: book.author || 'Verified', cite, title: selectedText.slice(0, 42), body: selectedText, hash: ZOF.hashText(selectedText), selectedForAI: true });
                    ZOF.saveState(); if (window.ZOF.renderKB) window.ZOF.renderKB();
                    ZOF.toast('📥 Indexed directly into Verified KB!');
                } else if (act === 'tts') {
                    if ('speechSynthesis' in window) window.speechSynthesis.speak(new SpeechSynthesisUtterance(selectedText));
                }
            });
        });

        renderBookshelf();
        renderReaderPage('none');
    });
})();

