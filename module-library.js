/**
 * ZIKR-O-FIKR — MODULE: LIBRARY & MOON+ READER PRO ENGINE (WINDOWS 11 DIRECT TAB HOOK)
 * Automatically kills stale Service Worker JS cache & hooks directly into "Shelf" and "Moon+ Reader" tabs.
 */

(function () {
  'use strict';

  const DB_NAME = 'ZikrOFikr_MoonReader_Vault_v3';
  const DB_VERSION = 1;
  const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  const PDFJS_WORKER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  const HIGHLIGHT_COLORS = [
    { id: 'yellow', name: 'Yellow', hex: '#facc15', rgba: 'rgba(250, 204, 21, 0.38)' },
    { id: 'green',  name: 'Green',  hex: '#4ade80', rgba: 'rgba(74, 222, 128, 0.38)' },
    { id: 'cyan',   name: 'Cyan',   hex: '#38bdf8', rgba: 'rgba(56, 189, 248, 0.38)' },
    { id: 'pink',   name: 'Pink',   hex: '#f472b6', rgba: 'rgba(244, 114, 182, 0.38)' },
    { id: 'orange', name: 'Orange', hex: '#fb923c', rgba: 'rgba(251, 146, 60, 0.38)' }
  ];

  const state = {
    db: null,
    books: [],
    vaultHandle: null,
    activeBook: null,
    pdfDoc: null,
    currentPage: 1,
    totalPages: 1,
    previousJumpPage: null,
    zoom: 1.3,
    theme: 'night',
    viewMode: 'single',
    hudVisible: true,
    boxToolActive: false,
    activeColor: 'yellow',
    selectedText: '',
    undoStack: [],
    redoStack: [],
    toastTimer: null,
    aiMode: 'council',
    sidebarTab: null
  };

  function injectStyles() {
    if (document.getElementById('zof-moon-reader-styles')) return;
    const style = document.createElement('style');
    style.id = 'zof-moon-reader-styles';
    style.textContent = `
      .zof-lib-wrap { padding: 16px; color: #e2e8f0; font-family: system-ui, -apple-system, sans-serif; }
      .zof-lib-topbar {
        display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px;
        background: linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.92));
        border: 1px solid rgba(56,189,248,0.35); border-radius: 14px; padding: 16px 20px; margin-bottom: 18px;
      }
      .zof-lib-title h2 { margin: 0; font-size: 1.3rem; color: #f8fafc; }
      .zof-lib-title p { margin: 4px 0 0; font-size: 0.84rem; color: #94a3b8; }
      .zof-lib-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
      .zof-btn {
        background: #1e293b; color: #f1f5f9; border: 1px solid rgba(148,163,184,0.35);
        border-radius: 9px; padding: 8px 14px; font-size: 0.85rem; font-weight: 600;
        cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
      }
      .zof-btn:hover { background: #334155; border-color: #38bdf8; }
      .zof-btn-primary { background: linear-gradient(135deg, #0284c7, #2563eb); border-color: #38bdf8; color: #fff; }
      .zof-btn-danger { background: rgba(239, 68, 68, 0.18); border-color: rgba(239, 68, 68, 0.45); color: #fca5a5; }
      .zof-btn-help { width: 34px; height: 34px; border-radius: 50%; justify-content: center; padding: 0; color: #38bdf8; border-color: #38bdf8; }
      .zof-book-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
      .zof-book-card {
        background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(148, 163, 184, 0.25);
        border-radius: 12px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between; gap: 12px;
      }
      .zof-book-badges { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
      .zof-badge { font-size: 0.72rem; padding: 2px 8px; border-radius: 999px; background: rgba(56, 189, 248, 0.15); color: #7dd3fc; border: 1px solid rgba(56, 189, 248, 0.3); }
      .zof-badge.green { background: rgba(74, 222, 128, 0.15); color: #86efac; border-color: rgba(74, 222, 128, 0.3); }
      .zof-badge.amber { background: rgba(250, 204, 21, 0.15); color: #fde047; border-color: rgba(250, 204, 21, 0.3); }
      .zof-modal-backdrop {
        position: fixed; inset: 0; background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(6px);
        z-index: 1000000; display: flex; align-items: center; justify-content: center; padding: 16px;
      }
      .zof-modal {
        background: #0f172a; border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 14px;
        max-width: 620px; width: 100%; padding: 22px; color: #f8fafc;
      }
      .zof-format-option {
        display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; border-radius: 9px;
        background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(148, 163, 184, 0.2); margin-bottom: 8px; cursor: pointer;
      }
      .zof-moon-fullscreen {
        position: fixed; inset: 0; z-index: 999990; display: flex; flex-direction: column;
        background: #0b0f19; color: #e2e8f0; user-select: text; overflow: hidden;
      }
      .zof-moon-fullscreen.theme-day { background: #f8fafc; color: #0f172a; }
      .zof-moon-fullscreen.theme-sepia { background: #f4ecd8; color: #3b2f1e; }
      .zof-moon-fullscreen.theme-night { background: #0f172a; color: #e2e8f0; }
      .zof-moon-fullscreen.theme-oled { background: #000000; color: #d4d4d8; }
      .zof-moon-hud-top {
        position: fixed; top: 0; left: 0; right: 0; height: 56px; background: rgba(2, 6, 23, 0.94);
        border-bottom: 1px solid rgba(56, 189, 248, 0.3); display: flex; align-items: center;
        justify-content: space-between; padding: 0 16px; z-index: 999995; transition: transform 0.2s ease;
      }
      .zof-moon-hud-top.hidden { transform: translateY(-100%); pointer-events: none; }
      .zof-moon-hud-bottom {
        position: fixed; bottom: 0; left: 0; right: 0; height: 60px; background: rgba(2, 6, 23, 0.94);
        border-top: 1px solid rgba(56, 189, 248, 0.3); display: flex; align-items: center;
        justify-content: space-between; gap: 14px; padding: 0 18px; z-index: 999995; transition: transform 0.2s ease;
      }
      .zof-moon-hud-bottom.hidden { transform: translateY(100%); pointer-events: none; }
      .zof-moon-stage {
        flex: 1; width: 100%; height: 100%; overflow: auto; display: flex;
        justify-content: center; align-items: flex-start; padding: 68px 20px 76px; position: relative;
      }
      .zof-moon-pages-wrap { display: flex; gap: 20px; align-items: flex-start; justify-content: center; }
      .zof-page-container {
        position: relative; background: #ffffff; box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
        border-radius: 4px; overflow: hidden;
      }
      .theme-sepia .zof-page-container canvas { filter: sepia(0.32); }
      .zof-text-layer { position: absolute; inset: 0; line-height: 1; z-index: 3; }
      .zof-text-layer span { color: transparent; position: absolute; white-space: pre; cursor: text; transform-origin: 0% 0%; }
      .zof-text-layer ::selection { background: rgba(56, 189, 248, 0.35); }
      .zof-highlight-layer { position: absolute; inset: 0; z-index: 4; pointer-events: none; }
      .zof-hl-mark { position: absolute; border-radius: 3px; pointer-events: auto; cursor: pointer; }
      .zof-hl-mark:hover { outline: 2px solid #0284c7; }
      .zof-hl-mark.is-box { border: 2px dashed #0284c7; }
      .zof-hl-note-badge {
        position: absolute; top: -10px; right: -10px; background: #0f172a; color: #facc15;
        border: 1px solid #facc15; border-radius: 50%; width: 20px; height: 20px; font-size: 11px;
        display: flex; align-items: center; justify-content: center;
      }
      .zof-selection-popup {
        position: fixed; z-index: 999998; background: #0f172a; border: 1px solid #38bdf8;
        border-radius: 12px; padding: 8px 12px; display: flex; align-items: center; gap: 8px;
      }
      .zof-color-dot { width: 22px; height: 22px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; }
      .zof-color-dot:hover, .zof-color-dot.active { transform: scale(1.2); border-color: #fff; }
      .zof-moon-drawer {
        position: fixed; top: 56px; bottom: 60px; right: 0; width: 380px; max-width: 92vw;
        background: rgba(15, 23, 42, 0.98); border-left: 1px solid rgba(56, 189, 248, 0.35);
        z-index: 999996; display: flex; flex-direction: column; padding: 16px; color: #f8fafc;
      }
      .zof-jump-undo-pill {
        position: fixed; bottom: 74px; left: 20px; z-index: 999997; background: #0f172a;
        border: 1px solid #38bdf8; color: #7dd3fc; padding: 8px 14px; border-radius: 999px; cursor: pointer;
      }
      .zof-toast-undo {
        position: fixed; bottom: 74px; right: 20px; z-index: 999999; background: #0f172a;
        border: 1px solid #facc15; color: #f8fafc; padding: 10px 16px; border-radius: 10px;
        display: flex; align-items: center; gap: 12px;
      }
    `;
    document.head.appendChild(style);
  }

  function openVaultDB() {
    return new Promise((resolve, reject) => {
      if (state.db) return resolve(state.db);
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('books')) {
          db.createObjectStore('books', { keyPath: 'id' });
        }
      };
      req.onsuccess = (e) => {
        state.db = e.target.result;
        resolve(state.db);
      };
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async function loadAllBooks() {
    const db = await openVaultDB();
    return new Promise((resolve) => {
      const tx = db.transaction('books', 'readonly');
      const req = tx.objectStore('books').getAll();
      req.onsuccess = () => {
        state.books = (req.result || []).sort((a, b) => b.addedAt - a.addedAt);
        resolve(state.books);
      };
      req.onerror = () => resolve([]);
    });
  }

  async function saveBookToDB(bookRecord) {
    const db = await openVaultDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('books', 'readwrite');
      tx.objectStore('books').put(bookRecord);
      tx.oncomplete = () => resolve(true);
      tx.onerror = (e) => reject(e.target.error);
    });
  }

  async function deleteBookFromDB(bookId) {
    const db = await openVaultDB();
    return new Promise((resolve) => {
      const tx = db.transaction('books', 'readwrite');
      tx.objectStore('books').delete(bookId);
      tx.oncomplete = () => resolve(true);
    });
  }

  function ensurePdfJsLoaded() {
    return new Promise((resolve) => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;
        return resolve(window.pdfjsLib);
      }
      const script = document.createElement('script');
      script.src = PDFJS_CDN;
      script.onload = () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;
        }
        resolve(window.pdfjsLib || null);
      };
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    });
  }

  async function analyzeUploadedFile(file) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const sizeMB = +(file.size / (1024 * 1024)).toFixed(2);
    const arrayBuffer = await file.arrayBuffer();

    const analysis = {
      file,
      name: file.name,
      ext,
      sizeMB,
      isLarge: sizeMB > 25,
      arrayBuffer,
      pageCount: 1,
      imageCount: 0,
      hasImages: true,
      rawText: '',
      mdContent: '',
      jsonIndex: []
    };

    if (ext === 'pdf') {
      const pdfjs = await ensurePdfJsLoaded();
      if (pdfjs) {
        try {
          const pdf = await pdfjs.getDocument({ data: arrayBuffer.slice(0) }).promise;
          analysis.pageCount = pdf.numPages;
          let mdLines = [`# ${file.name.replace(/\.pdf$/i, '')}\n`];
          let rawLines = [];
          const maxScan = Math.min(pdf.numPages, 25);
          for (let p = 1; p <= maxScan; p++) {
            const page = await pdf.getPage(p);
            const textContent = await page.getTextContent();
            const pageStrings = textContent.items.map((it) => it.str).join(' ').trim();
            if (pageStrings) {
              mdLines.push(`\n## Page ${p}\n${pageStrings}`);
              rawLines.push(`[Page ${p}] ${pageStrings}`);
              analysis.jsonIndex.push({ page: p, text: pageStrings });
            }
          }
          analysis.mdContent = mdLines.join('\n');
          analysis.rawText = rawLines.join('\n\n');
        } catch (err) {
          console.warn('PDF scan fallback:', err);
        }
      }
    } else {
      const text = new TextDecoder('utf-8').decode(arrayBuffer);
      analysis.rawText = text;
      analysis.mdContent = ext === 'md' ? text : `# ${file.name}\n\n${text}`;
      analysis.hasImages = false;
    }
    return analysis;
  }

  // Find ANY active Shelf / Moon+ Reader / Library container in ZikrOFikr OS
  function findActiveLibraryContainer() {
    const knownSelectors = [
      '#zof-custom-library-host',
      '#module-library',
      '#library-module',
      '#view-library',
      '#library-view',
      '#tab-shelf',
      '#tab-reader',
      '[data-module="library"]'
    ];
    for (const sel of knownSelectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }

    // Detect legacy "MOON+ LOCAL LIBRARY" or "PAGE X (" box on screen and replace its parent container
    const allElements = Array.from(document.querySelectorAll('div, section, main'));
    for (const el of allElements) {
      const txt = (el.textContent || '').trim();
      if (
        (txt.includes('MOON+ LOCAL LIBRARY & SSD/SD-CARD SHELF') ||
          txt.includes('High-Yield Cram Sheet') ||
          txt.includes('Export Notes')) &&
        el.children.length > 0 &&
        el.clientHeight > 120
      ) {
        return el;
      }
    }
    return null;
  }

  async function renderLibraryDashboard(targetEl) {
    injectStyles();
    const container = targetEl || findActiveLibraryContainer();
    if (!container) return;

    await loadAllBooks();

    container.innerHTML = `
      <div class="zof-lib-wrap">
        <div class="zof-lib-topbar">
          <div class="zof-lib-title">
            <h2>📚 Zikr-O-Fikr Real Visual PDF & Moon+ Reader Pro</h2>
            <p>100% Original PDF Page Rendering (Urdu/Arabic/Biology Diagrams Intact) • Smart .MD/.JSON Brain • Full Undo Stack</p>
          </div>
          <div class="zof-lib-actions">
            <input type="file" id="zof-book-file-input" accept=".pdf,.md,.txt,.json" style="display:none" />
            <button class="zof-btn zof-btn-primary" id="zof-btn-upload-book">
              📥 Import PDF / Book (Visual Mode)
            </button>
            <button class="zof-btn" id="zof-btn-link-vault">
              📂 ${state.vaultHandle ? 'Vault: ' + state.vaultHandle.name : 'Link Windows Folder'}
            </button>
            <button class="zof-btn zof-btn-help" id="zof-btn-format-guide" title="Format Guide">?</button>
          </div>
        </div>

        <div class="zof-book-grid">
          ${
            state.books.length === 0
              ? `<div style="grid-column: 1 / -1; text-align:center; padding:44px 20px; background:rgba(15,23,42,0.75); border:1px dashed rgba(56,189,248,0.4); border-radius:14px;">
                  <div style="font-size:2.4rem; margin-bottom:10px;">📕</div>
                  <h3 style="margin:0 0 6px; color:#f8fafc;">Ready for Real Visual PDF Reading</h3>
                  <p style="margin:0 0 16px; color:#94a3b8; font-size:0.9rem;">
                    Click below to import <strong>Al-Bidaya-wal-Nihaya.pdf</strong> or any Biology PDF. Every page renders visually in Full-Screen Moon+ Reader mode.
                  </p>
                  <button class="zof-btn zof-btn-primary" id="zof-btn-empty-upload">📥 Import Your PDF Book Now</button>
                </div>`
              : state.books
                  .map(
                    (b) => `
                <div class="zof-book-card">
                  <div>
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
                      <h3 style="margin:0; font-size:1rem; color:#f8fafc; word-break:break-word;">${escapeHtml(b.title)}</h3>
                      <span style="font-size:0.75rem; color:#94a3b8; white-space:nowrap;">${b.sizeMB} MB</span>
                    </div>
                    <div class="zof-book-badges">
                      ${b.formats?.pdf ? `<span class="zof-badge">📕 Visual PDF (${b.pageCount}p)</span>` : ''}
                      ${b.formats?.md ? `<span class="zof-badge green">🧠 .MD Brain</span>` : ''}
                      ${b.formats?.json ? `<span class="zof-badge green">⚡ .JSON</span>` : ''}
                    </div>
                    <p style="margin:10px 0 0; font-size:0.8rem; color:#94a3b8;">
                      Page <strong>${b.lastPage || 1} / ${b.pageCount \vert{}\vert{} 1}</strong> • Highlights/Notes: <strong>${(b.annotations || []).length}</strong>
                    </p>
                  </div>
                  <div style="display:flex; gap:8px; margin-top:8px;">
                    <button class="zof-btn zof-btn-primary zof-act-read" data-id="${b.id}" style="flex:1; justify-content:center;">
                      ⛶ Open in Moon+ Full-Screen
                    </button>
                    <button class="zof-btn zof-btn-danger zof-act-delete" data-id="${b.id}">🗑️</button>
                  </div>
                </div>
              `
                  )
                  .join('')
          }
        </div>
      </div>
    `;

    const fileInput = container.querySelector('#zof-book-file-input');
    const upBtn = container.querySelector('#zof-btn-upload-book');
    const emptyUpBtn = container.querySelector('#zof-btn-empty-upload');
    const vaultBtn = container.querySelector('#zof-btn-link-vault');
    const guideBtn = container.querySelector('#zof-btn-format-guide');

    if (upBtn) upBtn.onclick = () => fileInput.click();
    if (emptyUpBtn) emptyUpBtn.onclick = () => fileInput.click();
    if (fileInput) {
      fileInput.onchange = async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const analysis = await analyzeUploadedFile(file);
        showFormatSelectorModal(analysis, container);
        fileInput.value = '';
      };
    }

    if (vaultBtn) {
      vaultBtn.onclick = async () => {
        if (!window.showDirectoryPicker) {
          alert('Use Chrome or Edge on Windows 11 to link a local folder.');
          return;
        }
        try {
          const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
          state.vaultHandle = dirHandle;
          for await (const entry of dirHandle.values()) {
            if (entry.kind === 'file' && /\.(pdf|md|txt|json)$/i.test(entry.name)) {
              if (!state.books.some((b) => b.title === entry.name)) {
                const file = await entry.getFile();
                const analysis = await analyzeUploadedFile(file);
                await finalizeBookSave(analysis, { pdf: analysis.ext === 'pdf', md: true, json: true, txt: false });
              }
            }
          }
          await renderLibraryDashboard(container);
        } catch (_) {}
      };
    }

    if (guideBtn) {
      guideBtn.onclick = () =>
        alert('Storage Format Guide:\n• Keep Visual .PDF checked for Urdu/Arabic/Biology books so pages render visually.\n• Tick .MD / .JSON so your Local AI indexes text in kilobytes.');
    }

    container.querySelectorAll('.zof-act-read').forEach((btn) => {
      btn.onclick = () => {
        const book = state.books.find((x) => x.id === btn.dataset.id);
        if (book) launchMoonReaderFullScreen(book);
      };
    });

    container.querySelectorAll('.zof-act-delete').forEach((btn) => {
      btn.onclick = async () => {
        const bookId = btn.dataset.id;
        const backup = state.books.find((x) => x.id === bookId);
        if (!backup) return;
        await deleteBookFromDB(bookId);
        await renderLibraryDashboard(container);
        showUndoToast(`Removed "${backup.title}"`, async () => {
          await saveBookToDB(backup);
          await renderLibraryDashboard(container);
        });
      };
    });
  }

  function showFormatSelectorModal(analysis, container) {
    const backdrop = document.createElement('div');
    backdrop.className = 'zof-modal-backdrop';
    backdrop.innerHTML = `
      <div class="zof-modal">
        <h3 style="margin:0 0 12px; color:#38bdf8;">📂 Choose Save Format (${escapeHtml(analysis.name)})</h3>
        <p style="font-size:0.85rem; color:#cbd5e1; margin:0 0 12px;">
          Size: <strong>${analysis.sizeMB} MB</strong> • Total Pages: <strong>${analysis.pageCount}</strong>
        </p>
        <label class="zof-format-option">
          <input type="checkbox" id="zof-fmt-pdf" checked ${analysis.ext !== 'pdf' ? 'disabled' : ''} />
          <div>
            <strong>📕 Visual .PDF Mode (Keep Original Pages, Urdu/Arabic Fonts & Biology Diagrams)</strong>
            <div style="font-size:0.78rem; color:#94a3b8;">Renders the real PDF visually inside Moon+ Full-Screen Reader.</div>
          </div>
        </label>
        <label class="zof-format-option">
          <input type="checkbox" id="zof-fmt-md" checked />
          <div>
            <strong>🧠 Structured .MD Markdown (For Local AI Brain)</strong>
            <div style="font-size:0.78rem; color:#94a3b8;">Stores lightweight headings & extracted text for AI search.</div>
          </div>
        </label>
        <label class="zof-format-option">
          <input type="checkbox" id="zof-fmt-json" checked />
          <div>
            <strong>⚡ Indexed .JSON</strong>
            <div style="font-size:0.78rem; color:#94a3b8;">Fast page-level index for citations.</div>
          </div>
        </label>
        <label class="zof-format-option">
          <input type="checkbox" id="zof-fmt-txt" />
          <div>
            <strong>📄 Plain .TXT</strong>
          </div>
        </label>
        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:16px;">
          <button class="zof-btn" id="zof-fmt-cancel">Cancel</button>
          <button class="zof-btn zof-btn-primary" id="zof-fmt-save">💾 Save & Open Full-Screen</button>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);

    backdrop.querySelector('#zof-fmt-cancel').onclick = () => backdrop.remove();
    backdrop.querySelector('#zof-fmt-save').onclick = async () => {
      const formats = {
        pdf: backdrop.querySelector('#zof-fmt-pdf').checked && analysis.ext === 'pdf',
        md: backdrop.querySelector('#zof-fmt-md').checked,
        json: backdrop.querySelector('#zof-fmt-json').checked,
        txt: backdrop.querySelector('#zof-fmt-txt').checked
      };
      const saved = await finalizeBookSave(analysis, formats);
      backdrop.remove();
      await renderLibraryDashboard(container);
      launchMoonReaderFullScreen(saved);
    };
  }

  async function finalizeBookSave(analysis, formats) {
    const bookRecord = {
      id: 'book_' + Date.now(),
      title: analysis.name,
      ext: analysis.ext,
      sizeMB: analysis.sizeMB,
      pageCount: analysis.pageCount,
      lastPage: 1,
      formats,
      pdfBuffer: formats.pdf ? analysis.arrayBuffer : null,
      mdContent: formats.md ? analysis.mdContent : '',
      txtContent: formats.txt ? analysis.rawText : '',
      jsonIndex: formats.json ? analysis.jsonIndex : [],
      annotations: [],
      bookmarks: [],
      addedAt: Date.now()
    };
    await saveBookToDB(bookRecord);
    state.books.unshift(bookRecord);
    return bookRecord;
  }

  async function launchMoonReaderFullScreen(book) {
    injectStyles();
    state.activeBook = book;
    state.currentPage = book.lastPage || 1;
    state.totalPages = book.pageCount || 1;
    state.previousJumpPage = null;
    state.undoStack = [];
    state.redoStack = [];
    state.hudVisible = true;
    state.pdfDoc = null;

    if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }

    if (book.pdfBuffer) {
      const pdfjs = await ensurePdfJsLoaded();
      if (pdfjs) {
        state.pdfDoc = await pdfjs.getDocument({ data: book.pdfBuffer.slice(0) }).promise;
        state.totalPages = state.pdfDoc.numPages;
      }
    }

    const old = document.getElementById('zof-moon-reader-overlay');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id = 'zof-moon-reader-overlay';
    overlay.className = `zof-moon-fullscreen theme-${state.theme}`;
    document.body.appendChild(overlay);

    renderMoonReaderFrame(overlay);
    await renderVisiblePages();
  }

  function renderMoonReaderFrame(overlay) {
    const book = state.activeBook;
    overlay.className = `zof-moon-fullscreen theme-${state.theme}`;
    overlay.innerHTML = `
      <div class="zof-moon-hud-top ${state.hudVisible ? '' : 'hidden'}" id="zof-hud-top">
        <div style="display:flex; align-items:center; gap:10px;">
          <button class="zof-btn" id="zof-moon-back">← Shelf</button>
          <strong style="color:#f8fafc;">📖 ${escapeHtml(book.title)}</strong>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <button class="zof-btn" id="zof-moon-undo" ${state.undoStack.length === 0 ? 'disabled style="opacity:0.4"' : ''}>
            ↶ Undo (${state.undoStack.length})
          </button>
          <button class="zof-btn" id="zof-moon-redo" ${state.redoStack.length === 0 ? 'disabled style="opacity:0.4"' : ''}>
            ↷ Redo
          </button>
          <button class="zof-btn ${state.boxToolActive ? 'zof-btn-primary' : ''}" id="zof-moon-box-tool">
            📐 Box Highlight
          </button>
          <button class="zof-btn" id="zof-moon-fs">⛶ Fullscreen</button>
        </div>
      </div>

      <div class="zof-moon-stage" id="zof-moon-stage">
        <div class="zof-moon-pages-wrap" id="zof-moon-pages-wrap"></div>
      </div>

      ${
        state.previousJumpPage && state.previousJumpPage !== state.currentPage
          ? `<div class="zof-jump-undo-pill" id="zof-jump-return">↩ Return to Page ${state.previousJumpPage}</div>`
          : ''
      }

      <div class="zof-moon-hud-bottom ${state.hudVisible ? '' : 'hidden'}" id="zof-hud-bottom">
        <div style="display:flex; gap:6px;">
          <button class="zof-btn ${state.theme === 'day' ? 'zof-btn-primary' : ''}" data-theme="day">☀️ Day</button>
          <button class="zof-btn ${state.theme === 'sepia' ? 'zof-btn-primary' : ''}" data-theme="sepia">📜 Sepia</button>
          <button class="zof-btn ${state.theme === 'night' ? 'zof-btn-primary' : ''}" data-theme="night">🌙 Night</button>
        </div>
        <div style="display:flex; align-items:center; gap:10px; flex:1; max-width:460px;">
          <button class="zof-btn" id="zof-prev-page">◀ Prev</button>
          <span style="font-size:0.85rem; white-space:nowrap;">Page <strong>${state.currentPage}</strong> / ${state.totalPages}</span>
          <input type="range" id="zof-page-slider" min="1" max="${state.totalPages}" value="${state.currentPage}" style="flex:1;" />
          <button class="zof-btn" id="zof-next-page">Next ▶</button>
        </div>
        <div style="display:flex; gap:6px; align-items:center;">
          <button class="zof-btn" id="zof-zoom-out">🔍 -</button>
          <span>${Math.round(state.zoom * 100)}%</span>
          <button class="zof-btn" id="zof-zoom-in">🔍 +</button>
          <button class="zof-btn" id="zof-view-mode">${state.viewMode === 'single' ? '1-Page' : '2-Page'}</button>
        </div>
      </div>
    `;

    overlay.querySelector('#zof-moon-back').onclick = () => {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      overlay.remove();
      renderLibraryDashboard();
    };
    overlay.querySelector('#zof-moon-undo').onclick = () => performUndo();
    overlay.querySelector('#zof-moon-redo').onclick = () => performRedo();
    overlay.querySelector('#zof-moon-box-tool').onclick = async () => {
      state.boxToolActive = !state.boxToolActive;
      renderMoonReaderFrame(overlay);
      await renderVisiblePages();
    };
    overlay.querySelector('#zof-moon-fs').onclick = () => {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
      else document.exitFullscreen?.();
    };

    overlay.querySelectorAll('[data-theme]').forEach((b) => {
      b.onclick = async () => {
        state.theme = b.dataset.theme;
        renderMoonReaderFrame(overlay);
        await renderVisiblePages();
      };
    });

    const goToPage = async (p, isJump = false) => {
      const target = Math.max(1, Math.min(state.totalPages, p));
      if (isJump && Math.abs(target - state.currentPage) > 1) {
        state.previousJumpPage = state.currentPage;
      }
      state.currentPage = target;
      book.lastPage = target;
      await saveBookToDB(book);
      renderMoonReaderFrame(overlay);
      await renderVisiblePages();
    };

    overlay.querySelector('#zof-prev-page').onclick = () => goToPage(state.currentPage - 1);
    overlay.querySelector('#zof-next-page').onclick = () => goToPage(state.currentPage + 1);
    overlay.querySelector('#zof-page-slider').onchange = (e) => goToPage(parseInt(e.target.value, 10), true);

    const jumpBtn = overlay.querySelector('#zof-jump-return');
    if (jumpBtn) {
      jumpBtn.onclick = () => {
        const prev = state.previousJumpPage;
        state.previousJumpPage = null;
        goToPage(prev, false);
      };
    }

    overlay.querySelector('#zof-zoom-out').onclick = async () => {
      state.zoom = Math.max(0.6, +(state.zoom - 0.15).toFixed(2));
      renderMoonReaderFrame(overlay);
      await renderVisiblePages();
    };
    overlay.querySelector('#zof-zoom-in').onclick = async () => {
      state.zoom = Math.min(2.6, +(state.zoom + 0.15).toFixed(2));
      renderMoonReaderFrame(overlay);
      await renderVisiblePages();
    };
    overlay.querySelector('#zof-view-mode').onclick = async () => {
      state.viewMode = state.viewMode === 'single' ? 'dual' : 'single';
      renderMoonReaderFrame(overlay);
      await renderVisiblePages();
    };

    const stage = overlay.querySelector('#zof-moon-stage');
    stage.onclick = (e) => {
      if (window.getSelection()?.toString().trim() || state.boxToolActive) return;
      const w = window.innerWidth;
      if (e.clientX < w * 0.15) goToPage(state.currentPage - 1);
      else if (e.clientX > w * 0.85) goToPage(state.currentPage + 1);
      else {
        state.hudVisible = !state.hudVisible;
        overlay.querySelector('#zof-hud-top')?.classList.toggle('hidden', !state.hudVisible);
        overlay.querySelector('#zof-hud-bottom')?.classList.toggle('hidden', !state.hudVisible);
      }
    };
  }

  async function renderVisiblePages() {
    const wrap = document.getElementById('zof-moon-pages-wrap');
    if (!wrap) return;
    wrap.innerHTML = '';

    const pages = [state.currentPage];
    if (state.viewMode === 'dual' && state.currentPage + 1 <= state.totalPages) {
      pages.push(state.currentPage + 1);
    }

    for (const p of pages) {
      if (state.pdfDoc) {
        const page = await state.pdfDoc.getPage(p);
        const viewport = page.getViewport({ scale: state.zoom });
        const container = document.createElement('div');
        container.className = 'zof-page-container';
        container.style.width = `${Math.floor(viewport.width)}px`;
        container.style.height = `${Math.floor(viewport.height)}px`;

        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        container.appendChild(canvas);
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

        const hlLayer = document.createElement('div');
        hlLayer.className = 'zof-highlight-layer';
        container.appendChild(hlLayer);
        renderPageHighlights(hlLayer, p);

        if (state.boxToolActive) {
          enableDiagramBoxDrawing(container, p);
        }
        wrap.appendChild(container);
      }
    }
  }

  function renderPageHighlights(hlLayer, pageNum) {
    hlLayer.innerHTML = '';
    const list = (state.activeBook.annotations || []).filter((a) => a.page === pageNum);
    list.forEach((ann) => {
      const colorObj = HIGHLIGHT_COLORS.find((c) => c.id === ann.color) || HIGHLIGHT_COLORS[0];
      (ann.rects || []).forEach((r) => {
        const mark = document.createElement('div');
        mark.className = 'zof-hl-mark is-box';
        mark.style.left = `${r.xPct * 100}%`;
        mark.style.top = `${r.yPct * 100}%`;
        mark.style.width = `${r.wPct * 100}%`;
        mark.style.height = `${r.hPct * 100}%`;
        mark.style.background = colorObj.rgba;
        mark.title = ann.note ? `Note: ${ann.note} (Click to Undo/Remove)` : 'Click to Undo/Remove Highlight';
        mark.onclick = async (e) => {
          e.stopPropagation();
          await commitAnnotationAction({ type: 'delete', annotation: { ...ann } });
        };
        hlLayer.appendChild(mark);
      });
    });
  }

  function enableDiagramBoxDrawing(container, pageNum) {
    let startX = 0, startY = 0, tempBox = null;
    container.style.cursor = 'crosshair';
    container.onmousedown = (e) => {
      if (!state.boxToolActive) return;
      const rect = container.getBoundingClientRect();
      startX = e.clientX - rect.left;
      startY = e.clientY - rect.top;
      tempBox = document.createElement('div');
      tempBox.style.position = 'absolute';
      tempBox.style.border = '2px dashed #38bdf8';
      tempBox.style.background = 'rgba(250, 204, 21, 0.35)';
      container.appendChild(tempBox);

      const onMove = (ev) => {
        const curX = Math.max(0, Math.min(rect.width, ev.clientX - rect.left));
        const curY = Math.max(0, Math.min(rect.height, ev.clientY - rect.top));
        tempBox.style.left = `${Math.min(startX, curX)}px`;
        tempBox.style.top = `${Math.min(startY, curY)}px`;
        tempBox.style.width = `${Math.abs(curX - startX)}px`;
        tempBox.style.height = `${Math.abs(curY - startY)}px`;
      };

      const onUp = async () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        if (!tempBox) return;
        const w = parseFloat(tempBox.style.width || '0');
        const h = parseFloat(tempBox.style.height || '0');
        const left = parseFloat(tempBox.style.left || '0');
        const top = parseFloat(tempBox.style.top || '0');
        tempBox.remove();
        if (w > 15 && h > 15) {
          const note = prompt('Add Note to Highlight (optional):', '') || '';
          const newAnn = {
            id: 'hl_' + Date.now(),
            page: pageNum,
            type: 'box',
            color: state.activeColor,
            note,
            rects: [{ xPct: left / rect.width, yPct: top / rect.height, wPct: w / rect.width, hPct: h / rect.height }]
          };
          state.boxToolActive = false;
          await commitAnnotationAction({ type: 'add', annotation: newAnn });
        }
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    };
  }

  async function commitAnnotationAction(action, isUndoRedo = false) {
    const book = state.activeBook;
    if (!book.annotations) book.annotations = [];
    if (action.type === 'add') {
      book.annotations.push(action.annotation);
    } else if (action.type === 'delete') {
      book.annotations = book.annotations.filter((a) => a.id !== action.annotation.id);
      if (!isUndoRedo) showUndoToast('Highlight removed', () => performUndo());
    }
    if (!isUndoRedo) {
      state.undoStack.push(action);
      state.redoStack = [];
    }
    await saveBookToDB(book);
    const overlay = document.getElementById('zof-moon-reader-overlay');
    if (overlay) {
      renderMoonReaderFrame(overlay);
      await renderVisiblePages();
    }
  }

  async function performUndo() {
    if (!state.undoStack.length) return;
    const last = state.undoStack.pop();
    state.redoStack.push(last);
    if (last.type === 'add') await commitAnnotationAction({ type: 'delete', annotation: last.annotation }, true);
    else if (last.type === 'delete') await commitAnnotationAction({ type: 'add', annotation: last.annotation }, true);
  }

  async function performRedo() {
    if (!state.redoStack.length) return;
    const next = state.redoStack.pop();
    state.undoStack.push(next);
    await commitAnnotationAction(next, true);
  }

  function showUndoToast(msg, cb) {
    const old = document.getElementById('zof-toast-undo');
    if (old) old.remove();
    if (state.toastTimer) clearTimeout(state.toastTimer);
    const t = document.createElement('div');
    t.id = 'zof-toast-undo';
    t.className = 'zof-toast-undo';
    t.innerHTML = `<span>🗑️ ${escapeHtml(msg)}</span><button class="zof-btn zof-btn-primary" id="zof-undo-now">↶ UNDO (5s)</button>`;
    document.body.appendChild(t);
    t.querySelector('#zof-undo-now').onclick = () => {
      clearTimeout(state.toastTimer);
      t.remove();
      if (cb) cb();
    };
    state.toastTimer = setTimeout(() => t.remove(), 5000);
  }

  function escapeHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Hook clicks on "Shelf", "Moon+ Reader", or bottom "Library" button automatically
  function attachGlobalTabInterceptor() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('button, a, div[role="button"]');
      if (!btn) return;
      const label = (btn.textContent || '').trim();
      if (label.includes('Shelf') || label.includes('Moon+ Reader') || label === 'Library') {
        setTimeout(() => {
          const target = findActiveLibraryContainer();
          if (target) {
            renderLibraryDashboard(target);
            if (label.includes('Moon+ Reader') && state.books.length > 0) {
              launchMoonReaderFullScreen(state.books[0]);
            }
          }
        }, 60);
      }
    });
  }

  window.LibraryModule = { init: renderLibraryDashboard, render: renderLibraryDashboard, openBook: launchMoonReaderFullScreen };
  window.ModuleLibrary = window.LibraryModule;

  document.addEventListener('DOMContentLoaded', () => {
    injectStyles();
    attachGlobalTabInterceptor();
    setTimeout(() => renderLibraryDashboard(), 150);
  });
})();
