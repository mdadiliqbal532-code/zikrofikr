/**
 * ZIKR-O-FIKR — MODULE: LIBRARY & MOON+ READER PRO ENGINE (PHASE 1: WINDOWS 11 UPGRADE 1 & 2)
 * Features:
 * - Real Visual PDF Page Rendering (Preserves Biology Diagrams, Color Charts & Original Layout)
 * - Smart Format Selector (.PDF, .MD, .TXT, .JSON) + Local AI Brain Indexer
 * - Direct Windows 11 Vault Folder Access (File System Access API) + (?) Format Guide
 * - Auto Full-Screen Moon+ Reader HUD (Center-Click Toggle, Day/Sepia/Night/OLED Filters, Dual/Single/Scroll)
 * - Complete Undo/Redo Stack (Ctrl+Z / Ctrl+Y), Click-to-Erase Highlights, Diagram Box-Highlighter
 * - 5-Second Undo Toast + Page Jump Undo ("Return to Page X") + In-Reader AI Council Drawer
 */

(function () {
  'use strict';

  const DB_NAME = 'ZikrOFikr_MoonReader_Vault_v2';
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
    pendingImport: null,
    activeBook: null,
    pdfDoc: null,
    currentPage: 1,
    totalPages: 1,
    previousJumpPage: null,
    zoom: 1.25,
    theme: 'night',      // 'day' | 'sepia' | 'night' | 'oled'
    viewMode: 'single',  // 'single' | 'dual' | 'scroll'
    hudVisible: true,
    boxToolActive: false,
    activeColor: 'yellow',
    selectedText: '',
    selectedRects: [],
    activeHighlightId: null,
    undoStack: [],
    redoStack: [],
    toastTimer: null,
    toastUndoAction: null,
    aiMode: 'council',   // 'council' | 'local' | 'cloud'
    sidebarTab: null     // 'toc' | 'annotations' | 'bookmarks' | 'ai' | null
  };

  // =========================================================================
  // 1. INJECT SCOPED MOON+ READER PRO STYLES
  // =========================================================================
  function injectStyles() {
    if (document.getElementById('zof-moon-reader-styles')) return;
    const style = document.createElement('style');
    style.id = 'zof-moon-reader-styles';
    style.textContent = `
      .zof-lib-wrap {
        padding: 18px;
        color: #e2e8f0;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .zof-lib-topbar {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        background: linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.9));
        border: 1px solid rgba(56,189,248,0.25);
        border-radius: 14px;
        padding: 16px 20px;
        margin-bottom: 18px;
      }
      .zof-lib-title h2 {
        margin: 0;
        font-size: 1.35rem;
        color: #f8fafc;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .zof-lib-title p {
        margin: 4px 0 0;
        font-size: 0.85rem;
        color: #94a3b8;
      }
      .zof-lib-actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
      }
      .zof-btn {
        background: #1e293b;
        color: #f1f5f9;
        border: 1px solid rgba(148,163,184,0.3);
        border-radius: 9px;
        padding: 8px 14px;
        font-size: 0.86rem;
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: all 0.15s ease;
      }
      .zof-btn:hover {
        background: #334155;
        border-color: #38bdf8;
      }
      .zof-btn-primary {
        background: linear-gradient(135deg, #0284c7, #2563eb);
        border-color: #38bdf8;
        color: #fff;
      }
      .zof-btn-primary:hover {
        background: linear-gradient(135deg, #0369a1, #1d4ed8);
      }
      .zof-btn-danger {
        background: rgba(239, 68, 68, 0.18);
        border-color: rgba(239, 68, 68, 0.45);
        color: #fca5a5;
      }
      .zof-btn-help {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        justify-content: center;
        padding: 0;
        background: rgba(56, 189, 248, 0.15);
        border-color: #38bdf8;
        color: #38bdf8;
        font-weight: 700;
      }
      .zof-book-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 16px;
      }
      .zof-book-card {
        background: rgba(15, 23, 42, 0.88);
        border: 1px solid rgba(148, 163, 184, 0.2);
        border-radius: 12px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 12px;
        transition: transform 0.15s ease, border-color 0.15s ease;
      }
      .zof-book-card:hover {
        transform: translateY(-2px);
        border-color: #38bdf8;
      }
      .zof-book-badges {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 8px;
      }
      .zof-badge {
        font-size: 0.72rem;
        padding: 2px 8px;
        border-radius: 999px;
        background: rgba(56, 189, 248, 0.15);
        color: #7dd3fc;
        border: 1px solid rgba(56, 189, 248, 0.3);
      }
      .zof-badge.green {
        background: rgba(74, 222, 128, 0.15);
        color: #86efac;
        border-color: rgba(74, 222, 128, 0.3);
      }
      .zof-badge.amber {
        background: rgba(250, 204, 21, 0.15);
        color: #fde047;
        border-color: rgba(250, 204, 21, 0.3);
      }

      /* MODAL OVERLAYS */
      .zof-modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(2, 6, 23, 0.85);
        backdrop-filter: blur(6px);
        z-index: 1000000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
      }
      .zof-modal {
        background: #0f172a;
        border: 1px solid rgba(56, 189, 248, 0.35);
        border-radius: 14px;
        max-width: 620px;
        width: 100%;
        padding: 22px;
        color: #f8fafc;
        box-shadow: 0 25px 50px -12px rgba(0,0,0,0.75);
      }
      .zof-format-option {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 9px;
        background: rgba(30, 41, 59, 0.7);
        border: 1px solid rgba(148, 163, 184, 0.2);
        margin-bottom: 8px;
        cursor: pointer;
      }
      .zof-format-option input {
        margin-top: 4px;
        transform: scale(1.2);
      }

      /* =====================================================================
         MOON+ READER PRO FULL-SCREEN OVERLAY
         ===================================================================== */
      .zof-moon-fullscreen {
        position: fixed;
        inset: 0;
        z-index: 999990;
        display: flex;
        flex-direction: column;
        background: #0b0f19;
        color: #e2e8f0;
        user-select: text;
        overflow: hidden;
      }
      .zof-moon-fullscreen.theme-day {
        background: #f8fafc;
        color: #0f172a;
      }
      .zof-moon-fullscreen.theme-sepia {
        background: #f4ecd8;
        color: #3b2f1e;
      }
      .zof-moon-fullscreen.theme-night {
        background: #0f172a;
        color: #e2e8f0;
      }
      .zof-moon-fullscreen.theme-oled {
        background: #000000;
        color: #d4d4d8;
      }

      /* FLOATING TOP & BOTTOM HUD */
      .zof-moon-hud-top {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 56px;
        background: rgba(2, 6, 23, 0.92);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid rgba(56, 189, 248, 0.25);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px;
        z-index: 999995;
        transition: transform 0.22s ease, opacity 0.22s ease;
      }
      .zof-moon-hud-top.hidden {
        transform: translateY(-100%);
        opacity: 0;
        pointer-events: none;
      }
      .zof-moon-hud-bottom {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 60px;
        background: rgba(2, 6, 23, 0.92);
        backdrop-filter: blur(10px);
        border-top: 1px solid rgba(56, 189, 248, 0.25);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        padding: 0 18px;
        z-index: 999995;
        transition: transform 0.22s ease, opacity 0.22s ease;
      }
      .zof-moon-hud-bottom.hidden {
        transform: translateY(100%);
        opacity: 0;
        pointer-events: none;
      }

      /* VIEWPORT & PAGE STAGE */
      .zof-moon-stage {
        flex: 1;
        width: 100%;
        height: 100%;
        overflow: auto;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding: 68px 20px 76px;
        position: relative;
        scroll-behavior: smooth;
      }
      .zof-moon-pages-wrap {
        display: flex;
        gap: 20px;
        align-items: flex-start;
        justify-content: center;
        flex-wrap: nowrap;
      }
      .zof-moon-pages-wrap.mode-scroll {
        flex-direction: column;
        align-items: center;
      }
      .zof-page-container {
        position: relative;
        background: #ffffff;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.55);
        border-radius: 4px;
        overflow: hidden;
      }
      .theme-sepia .zof-page-container canvas {
        filter: sepia(0.32) contrast(0.98);
      }
      .theme-oled .zof-page-container canvas {
        filter: brightness(0.92) contrast(1.04);
      }

      /* TEXT LAYER & HIGHLIGHT OVERLAY LAYER */
      .zof-text-layer {
        position: absolute;
        inset: 0;
        line-height: 1;
        z-index: 3;
      }
      .zof-text-layer span {
        color: transparent;
        position: absolute;
        white-space: pre;
        cursor: text;
        transform-origin: 0% 0%;
      }
      .zof-text-layer ::selection {
        background: rgba(56, 189, 248, 0.35);
      }
      .zof-highlight-layer {
        position: absolute;
        inset: 0;
        z-index: 4;
        pointer-events: none;
      }
      .zof-hl-mark {
        position: absolute;
        border-radius: 3px;
        pointer-events: auto;
        cursor: pointer;
        transition: outline 0.12s ease;
      }
      .zof-hl-mark:hover {
        outline: 2px solid #0284c7;
      }
      .zof-hl-mark.is-box {
        border: 2px dashed #0284c7;
      }
      .zof-hl-note-badge {
        position: absolute;
        top: -10px;
        right: -10px;
        background: #0f172a;
        color: #facc15;
        border: 1px solid #facc15;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        font-size: 11px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(0,0,0,0.5);
      }

      /* FLOATING SELECTION & HIGHLIGHT UNDO TOOLBAR */
      .zof-selection-popup {
        position: fixed;
        z-index: 999998;
        background: #0f172a;
        border: 1px solid #38bdf8;
        border-radius: 12px;
        padding: 8px 12px;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 12px 30px rgba(0,0,0,0.75);
      }
      .zof-color-dot {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        cursor: pointer;
        border: 2px solid transparent;
        transition: transform 0.12s ease;
      }
      .zof-color-dot:hover, .zof-color-dot.active {
        transform: scale(1.2);
        border-color: #ffffff;
      }

      /* SIDEBAR DRAWER (AI COUNCIL, NOTES, TOC) */
      .zof-moon-drawer {
        position: fixed;
        top: 56px;
        bottom: 60px;
        right: 0;
        width: 380px;
        max-width: 92vw;
        background: rgba(15, 23, 42, 0.98);
        border-left: 1px solid rgba(56, 189, 248, 0.35);
        z-index: 999996;
        display: flex;
        flex-direction: column;
        padding: 16px;
        color: #f8fafc;
        box-shadow: -12px 0 30px rgba(0,0,0,0.6);
      }

      /* BOTTOM SAFETY PILLS: JUMP UNDO & 5-SEC TOAST UNDO */
      .zof-jump-undo-pill {
        position: fixed;
        bottom: 74px;
        left: 20px;
        z-index: 999997;
        background: #0f172a;
        border: 1px solid #38bdf8;
        color: #7dd3fc;
        padding: 8px 14px;
        border-radius: 999px;
        font-size: 0.84rem;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 8px 20px rgba(0,0,0,0.6);
      }
      .zof-toast-undo {
        position: fixed;
        bottom: 74px;
        right: 20px;
        z-index: 999999;
        background: #0f172a;
        border: 1px solid #facc15;
        color: #f8fafc;
        padding: 10px 16px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 0.86rem;
        box-shadow: 0 10px 25px rgba(0,0,0,0.75);
      }

      /* MARKDOWN / TEXT FALLBACK PAGE VIEW */
      .zof-md-reader-page {
        max-width: 820px;
        width: 100%;
        background: rgba(15, 23, 42, 0.92);
        color: #e2e8f0;
        padding: 36px 44px;
        border-radius: 10px;
        line-height: 1.75;
        font-size: 1.05rem;
        position: relative;
      }
      .theme-day .zof-md-reader-page {
        background: #ffffff;
        color: #0f172a;
      }
      .theme-sepia .zof-md-reader-page {
        background: #fbf3e4;
        color: #3b2f1e;
      }
    `;
    document.head.appendChild(style);
  }

  // =========================================================================
  // 2. INDEXEDDB VAULT STORAGE ENGINE
  // =========================================================================
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
      const store = tx.objectStore('books');
      const req = store.getAll();
      req.onsuccess = () => {
        state.books = (req.result || []).sort((a, b) => b.addedAt - a.addedAt);
        syncBooksToLocalAIBrain();
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
      tx.oncomplete = () => {
        syncBooksToLocalAIBrain();
        resolve(true);
      };
      tx.onerror = (e) => reject(e.target.error);
    });
  }

  async function deleteBookFromDB(bookId) {
    const db = await openVaultDB();
    return new Promise((resolve) => {
      const tx = db.transaction('books', 'readwrite');
      tx.objectStore('books').delete(bookId);
      tx.oncomplete = () => {
        syncBooksToLocalAIBrain();
        resolve(true);
      };
    });
  }

  // Expose extracted book knowledge to Local AI & Deen modules
  function syncBooksToLocalAIBrain() {
    window.ZikrLibraryBrain = state.books.map((b) => ({
      id: b.id,
      title: b.title,
      markdown: b.mdContent || '',
      jsonIndex: b.jsonIndex || [],
      annotations: b.annotations || []
    }));
  }

  // =========================================================================
  // 3. LOAD PDF.JS ENGINE DYNAMICALLY
  // =========================================================================
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

  // =========================================================================
  // 4. SMART BOOK SCANNER (DETECT IMAGES, HEADINGS, .MD / .JSON / .TXT)
  // =========================================================================
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
      hasImages: false,
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
          let imgTotal = 0;

          // Scan up to first 40 pages rapidly for immediate AI index & image detection
          const maxScan = Math.min(pdf.numPages, 40);
          for (let p = 1; p <= maxScan; p++) {
            const page = await pdf.getPage(p);
            const textContent = await page.getTextContent();
            const pageStrings = textContent.items.map((it) => it.str).join(' ').trim();

            // Check operator list for embedded images/diagrams
            try {
              const ops = await page.getOperatorList();
              for (let i = 0; i < ops.fnArray.length; i++) {
                if (
                  ops.fnArray[i] === pdfjs.OPS.paintImageXObject ||
                  ops.fnArray[i] === pdfjs.OPS.paintInlineImageXObject
                ) {
                  imgTotal++;
                }
              }
            } catch (_) {}

            if (pageStrings) {
              mdLines.push(`\n## Page ${p}\n${pageStrings}`);
              rawLines.push(`[Page ${p}] ${pageStrings}`);
              analysis.jsonIndex.push({ page: p, text: pageStrings });
            }
          }
          analysis.imageCount = imgTotal;
          analysis.hasImages = imgTotal > 0;
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
      const chunks = text.split(/\n{2,}/);
      analysis.pageCount = Math.max(1, Math.ceil(chunks.length / 18));
      analysis.jsonIndex = chunks.slice(0, 200).map((c, idx) => ({
        page: Math.floor(idx / 18) + 1,
        text: c.trim()
      }));
    }

    return analysis;
  }

  // =========================================================================
  // 5. MAIN LIBRARY DASHBOARD UI
  // =========================================================================
  function getMountContainer() {
    const selectors = [
      '#module-library',
      '#library-module',
      '#view-library',
      '#library-view',
      '#library-container',
      '#tab-library',
      '[data-module="library"]',
      '[data-view="library"]'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  async function renderLibraryDashboard(targetEl) {
    injectStyles();
    const container = targetEl || getMountContainer();
    if (!container) return;

    await loadAllBooks();

    container.innerHTML = `
      <div class="zof-lib-wrap">
        <div class="zof-lib-topbar">
          <div class="zof-lib-title">
            <h2>📚 Zikr-O-Fikr Moon+ Reader Pro & AI Vault</h2>
            <p>Visual PDF Engine (Biology Diagrams & Layout Intact) • Smart .MD/.JSON Brain Indexer • Full Undo Stack</p>
          </div>
          <div class="zof-lib-actions">
            <input type="file" id="zof-book-file-input" accept=".pdf,.md,.txt,.json" style="display:none" />
            <button class="zof-btn zof-btn-primary" id="zof-btn-upload-book">
              ➕ Add Book / PDF / Quran
            </button>
            <button class="zof-btn" id="zof-btn-link-vault" title="Link directly to a Windows 11 folder for copy-paste access">
              📂 ${state.vaultHandle ? 'Vault Linked (' + state.vaultHandle.name + ')' : 'Link Windows Vault Folder'}
            </button>
            <button class="zof-btn zof-btn-help" id="zof-btn-format-guide" title="Storage Format & Minimum Size Guide">
              ?
            </button>
          </div>
        </div>

        <div class="zof-book-grid" id="zof-book-grid">
          ${
            state.books.length === 0
              ? `<div style="grid-column: 1 / -1; text-align:center; padding:48px 20px; background:rgba(15,23,42,0.6); border:1px dashed rgba(148,163,184,0.3); border-radius:14px;">
                  <div style="font-size:2.4rem; margin-bottom:10px;">📖</div>
                  <h3 style="margin:0 0 6px; color:#f8fafc;">Your Moon+ Reader Vault is Empty</h3>
                  <p style="margin:0 0 16px; color:#94a3b8; font-size:0.9rem;">
                    Add any Biology PDF, Deen book, or Markdown/Text file. Original visual diagrams stay intact while Local AI indexes the text in kilobytes.
                  </p>
                  <button class="zof-btn zof-btn-primary" id="zof-btn-empty-upload">➕ Upload First Book (.PDF / .MD / .TXT)</button>
                </div>`
              : state.books
                  .map(
                    (b) => `
                <div class="zof-book-card" data-book-id="${b.id}">
                  <div>
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
                      <h3 style="margin:0; font-size:1.02rem; color:#f8fafc; word-break:break-word;">${escapeHtml(b.title)}</h3>
                      <span style="font-size:0.75rem; color:#94a3b8; white-space:nowrap;">${b.sizeMB || '0.1'} MB</span>
                    </div>
                    <div class="zof-book-badges">
                      ${b.formats?.pdf ? `<span class="zof-badge">📕 Visual PDF (${b.pageCount || 1}p)</span>` : ''}
                      ${b.hasImages ? `<span class="zof-badge amber">🖼️ ${b.imageCount} Diagrams Kept</span>` : ''}
                      ${b.formats?.md ? `<span class="zof-badge green">🧠 .MD AI Brain</span>` : ''}
                      ${b.formats?.json ? `<span class="zof-badge green">⚡ .JSON Index</span>` : ''}
                      ${b.formats?.txt ? `<span class="zof-badge">📄 .TXT</span>` : ''}
                    </div>
                    <p style="margin:10px 0 0; font-size:0.8rem; color:#94a3b8;">
                      Last Page: <strong>${b.lastPage || 1} / ${b.pageCount || 1}</strong> •
                      Highlights/Notes: <strong>${(b.annotations || []).length}</strong>
                    </p>
                  </div>
                  <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:8px;">
                    <button class="zof-btn zof-btn-primary zof-act-read" data-id="${b.id}" style="flex:1; justify-content:center;">
                      ⛶ Read Full-Screen
                    </button>
                    <button class="zof-btn zof-act-export" data-id="${b.id}" title="Export .MD / .JSON / .TXT to Laptop">
                      💾
                    </button>
                    <button class="zof-btn zof-btn-danger zof-act-delete" data-id="${b.id}" title="Remove Book">
                      🗑️
                    </button>
                  </div>
                </div>
              `
                  )
                  .join('')
          }
        </div>
      </div>
    `;

    // Bind events
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
          alert('Use Chrome or Edge on Windows 11 to link a direct local folder.');
          return;
        }
        try {
          const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
          state.vaultHandle = dirHandle;
          let importedCount = 0;
          for await (const entry of dirHandle.values()) {
            if (entry.kind === 'file' && /\.(pdf|md|txt|json)$/i.test(entry.name)) {
              const exists = state.books.some((b) => b.title === entry.name);
              if (!exists) {
                const file = await entry.getFile();
                const analysis = await analyzeUploadedFile(file);
                await finalizeBookSave(analysis, {
                  pdf: analysis.ext === 'pdf',
                  md: true,
                  txt: false,
                  json: true
                });
                importedCount++;
              }
            }
          }
          await renderLibraryDashboard(container);
          alert(`Windows Vault Folder "${dirHandle.name}" linked! Auto-synced ${importedCount} book(s).`);
        } catch (err) {
          console.warn('Vault picker cancelled:', err);
        }
      };
    }

    if (guideBtn) {
      guideBtn.onclick = () => showFormatGuideModal();
    }

    container.querySelectorAll('.zof-act-read').forEach((btn) => {
      btn.onclick = () => {
        const book = state.books.find((x) => x.id === btn.dataset.id);
        if (book) launchMoonReaderFullScreen(book);
      };
    });

    container.querySelectorAll('.zof-act-export').forEach((btn) => {
      btn.onclick = () => {
        const book = state.books.find((x) => x.id === btn.dataset.id);
        if (book) showExportFormatModal(book);
      };
    });

    container.querySelectorAll('.zof-act-delete').forEach((btn) => {
      btn.onclick = async () => {
        const bookId = btn.dataset.id;
        const bookBackup = state.books.find((x) => x.id === bookId);
        if (!bookBackup) return;
        await deleteBookFromDB(bookId);
        await renderLibraryDashboard(container);
        showUndoToast(`Book "${bookBackup.title}" removed`, async () => {
          await saveBookToDB(bookBackup);
          await renderLibraryDashboard(container);
        });
      };
    });
  }

  // =========================================================================
  // 6. SMART FORMAT SELECTOR MODAL & (?) FORMAT GUIDE MODAL
  // =========================================================================
  function showFormatSelectorModal(analysis, dashboardContainer) {
    const backdrop = document.createElement('div');
    backdrop.className = 'zof-modal-backdrop';

    const keepPdfDefault = analysis.ext === 'pdf' && (analysis.hasImages || analysis.sizeMB < 50);

    backdrop.innerHTML = `
      <div class="zof-modal">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="margin:0; font-size:1.15rem; color:#38bdf8;">📂 Smart Book & AI Brain Format Selector</h3>
          <button class="zof-btn" id="zof-modal-close">✕</button>
        </div>

        <div style="background:rgba(15,23,42,0.9); border:1px solid rgba(148,163,184,0.25); border-radius:10px; padding:12px; margin-bottom:14px; font-size:0.86rem;">
          <div><strong>File:</strong> ${escapeHtml(analysis.name)} (${analysis.sizeMB} MB • ${analysis.pageCount} Pages)</div>
          <div style="margin-top:4px; color:${analysis.hasImages ? '#fde047' : '#86efac'};">
            🔍 <strong>Auto-Scan:</strong> ${
              analysis.hasImages
                ? `Detected ${analysis.imageCount}+ visual images/diagrams — Visual .PDF recommended so diagrams stay 100% intact.`
                : `Text-only book detected — You can save as .MD / .JSON to save 95% storage space, or keep .PDF layout.`
            }
          </div>
          ${
            analysis.isLarge
              ? `<div style="margin-top:6px; color:#fca5a5;">⚠️ <strong>Large File Notice (${analysis.sizeMB} MB):</strong> File is heavy, but Zikr-O-Fikr allows full import with Lazy 3-Page Virtualization.</div>`
              : ''
          }
        </div>

        <div style="font-size:0.88rem; margin-bottom:8px; font-weight:600;">Choose Which Formats to Save Inside Your Vault:</div>

        <label class="zof-format-option">
          <input type="checkbox" id="zof-fmt-pdf" ${keepPdfDefault || analysis.ext === 'pdf' ? 'checked' : ''} ${analysis.ext !== 'pdf' ? 'disabled' : ''} />
          <div>
            <div style="font-weight:600; color:#f8fafc;">📕 Visual .PDF Format (${analysis.sizeMB} MB)</div>
            <div style="font-size:0.78rem; color:#94a3b8;">Preserves 100% of original biology diagrams, color charts, fonts & page layout in Moon+ Reader mode.</div>
          </div>
        </label>

        <label class="zof-format-option">
          <input type="checkbox" id="zof-fmt-md" checked />
          <div>
            <div style="font-weight:600; color:#86efac;">🧠 Structured .MD Markdown (~${Math.max(1, Math.round(analysis.mdContent.length / 1024))} KB)</div>
            <div style="font-size:0.78rem; color:#94a3b8;">Preserves # Headings & Page Sections for instant Local AI & Deen training using tiny storage.</div>
          </div>
        </label>

        <label class="zof-format-option">
          <input type="checkbox" id="zof-fmt-json" checked />
          <div>
            <div style="font-weight:600; color:#7dd3fc;">⚡ Indexed .JSON Brain (~${Math.max(1, Math.round(JSON.stringify(analysis.jsonIndex).length / 1024))} KB)</div>
            <div style="font-size:0.78rem; color:#94a3b8;">Page-by-page structured array so your 5-Cloud + Local AI Council can cite exact page numbers.</div>
          </div>
        </label>

        <label class="zof-format-option">
          <input type="checkbox" id="zof-fmt-txt" />
          <div>
            <div style="font-weight:600; color:#e2e8f0;">📄 Plain .TXT (~${Math.max(1, Math.round(analysis.rawText.length / 1024))} KB)</div>
            <div style="font-size:0.78rem; color:#94a3b8;">Ultra-lightweight raw unformatted text copy.</div>
          </div>
        </label>

        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:16px;">
          <button class="zof-btn" id="zof-fmt-cancel">Cancel</button>
          <button class="zof-btn zof-btn-primary" id="zof-fmt-save-open">💾 Save & Open in Moon+ Full-Screen</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    const close = () => backdrop.remove();
    backdrop.querySelector('#zof-modal-close').onclick = close;
    backdrop.querySelector('#zof-fmt-cancel').onclick = close;

    backdrop.querySelector('#zof-fmt-save-open').onclick = async () => {
      const formats = {
        pdf: backdrop.querySelector('#zof-fmt-pdf').checked && analysis.ext === 'pdf',
        md: backdrop.querySelector('#zof-fmt-md').checked,
        json: backdrop.querySelector('#zof-fmt-json').checked,
        txt: backdrop.querySelector('#zof-fmt-txt').checked
      };
      const savedBook = await finalizeBookSave(analysis, formats);
      close();
      await renderLibraryDashboard(dashboardContainer);
      launchMoonReaderFullScreen(savedBook);
    };
  }

  async function finalizeBookSave(analysis, formats) {
    const bookRecord = {
      id: 'book_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      title: analysis.name,
      ext: analysis.ext,
      sizeMB: analysis.sizeMB,
      pageCount: analysis.pageCount,
      lastPage: 1,
      hasImages: analysis.hasImages,
      imageCount: analysis.imageCount,
      formats,
      pdfBuffer: formats.pdf ? analysis.arrayBuffer : null,
      mdContent: formats.md ? analysis.mdContent : '',
      txtContent: formats.txt ? analysis.rawText : '',
      jsonIndex: formats.json ? analysis.jsonIndex : [],
      annotations: [], // { id, page, type: 'text'|'box', color, text, note, rects }
      bookmarks: [],   // [pageNumbers]
      addedAt: Date.now()
    };
    await saveBookToDB(bookRecord);
    state.books.unshift(bookRecord);
    return bookRecord;
  }

  function showFormatGuideModal() {
    const backdrop = document.createElement('div');
    backdrop.className = 'zof-modal-backdrop';
    backdrop.innerHTML = `
      <div class="zof-modal">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="margin:0; color:#38bdf8;">ℹ️ Zikr-O-Fikr Minimum-Storage Format Guide</h3>
          <button class="zof-btn" id="zof-guide-close">✕</button>
        </div>
        <div style="font-size:0.88rem; line-height:1.65; color:#cbd5e1;">
          <p><strong>1. Biology / Visual Diagrams & Real Books (<code>.PDF</code> + <code>.MD</code>):</strong><br/>
          Keep <strong>Visual .PDF</strong> checked so Moon+ Reader renders 100% of original diagrams and colors, plus <strong>.MD</strong> so your Local AI learns every heading in kilobytes.</p>
          <p><strong>2. Pure Text Books & Notes (<code>.MD</code> / <code>.JSON</code>):</strong><br/>
          Untick <code>.PDF</code> on text-only books to shrink a 20 MB file down to ~200 KB while preserving all chapters and subtopics.</p>
          <p><strong>3. Tarteel Quran & Audiobook Voice Reference (<code>.OPUS</code> / <code>.OGG</code> / <code>.MP3</code>):</strong><br/>
          Use <code>.opus</code> or <code>.ogg</code> (32–64 kbps) for human-realistic audio and Hifz voice matching with 70% smaller file size.</p>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);
    backdrop.querySelector('#zof-guide-close').onclick = () => backdrop.remove();
  }

  function showExportFormatModal(book) {
    const backdrop = document.createElement('div');
    backdrop.className = 'zof-modal-backdrop';
    backdrop.innerHTML = `
      <div class="zof-modal">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="margin:0; color:#38bdf8;">💾 Export Book & Annotations to Windows</h3>
          <button class="zof-btn" id="zof-exp-close">✕</button>
        </div>
        <p style="font-size:0.86rem; color:#94a3b8;">Download converted minimum-space files for <strong>${escapeHtml(book.title)}</strong>:</p>
        <div style="display:flex; flex-direction:column; gap:10px; margin-top:14px;">
          <button class="zof-btn" id="zof-dl-md">🧠 Download Structured .MD (With Highlights & Notes)</button>
          <button class="zof-btn" id="zof-dl-json">⚡ Download Indexed .JSON Brain</button>
          <button class="zof-btn" id="zof-dl-txt">📄 Download Plain .TXT</button>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);
    backdrop.querySelector('#zof-exp-close').onclick = () => backdrop.remove();

    const baseName = book.title.replace(/\.[^/.]+$/, '');
    backdrop.querySelector('#zof-dl-md').onclick = () => {
      const notesMd = (book.annotations || [])
        .map((a) => `- **[Page ${a.page} | ${a.color.toUpperCase()}]** "${a.text || 'Diagram Highlight'}" ${a.note ? `— *Note: ${a.note}*` : ''}`)
        .join('\n');
      const fullMd = `${book.mdContent || ''}\n\n## My Highlights & Study Notes\n${notesMd}`;
      downloadBlob(fullMd, `${baseName}_ZikrOFikr.md`, 'text/markdown');
    };
    backdrop.querySelector('#zof-dl-json').onclick = () => {
      downloadBlob(JSON.stringify({ title: book.title, index: book.jsonIndex, annotations: book.annotations }, null, 2), `${baseName}_Brain.json`, 'application/json');
    };
    backdrop.querySelector('#zof-dl-txt').onclick = () => {
      downloadBlob(book.txtContent || book.mdContent || '', `${baseName}.txt`, 'text/plain');
    };
  }

  function downloadBlob(content, filename, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // =========================================================================
  // 7. MOON+ READER PRO FULL-SCREEN ENGINE
  // =========================================================================
  async function launchMoonReaderFullScreen(book) {
    state.activeBook = book;
    state.currentPage = book.lastPage || 1;
    state.totalPages = book.pageCount || 1;
    state.previousJumpPage = null;
    state.undoStack = [];
    state.redoStack = [];
    state.hudVisible = true;
    state.sidebarTab = null;
    state.pdfDoc = null;

    // Request native Windows 11 full-screen automatically
    if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }

    if (book.pdfBuffer) {
      const pdfjs = await ensurePdfJsLoaded();
      if (pdfjs) {
        try {
          state.pdfDoc = await pdfjs.getDocument({ data: book.pdfBuffer.slice(0) }).promise;
          state.totalPages = state.pdfDoc.numPages;
        } catch (err) {
          console.warn('PDF load error:', err);
        }
      }
    }

    const existing = document.getElementById('zof-moon-reader-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'zof-moon-reader-overlay';
    overlay.className = `zof-moon-fullscreen theme-${state.theme}`;
    document.body.appendChild(overlay);

    renderMoonReaderFrame(overlay);
    await renderVisiblePages();
    bindReaderGlobalKeys();
  }

  function renderMoonReaderFrame(overlay) {
    const book = state.activeBook;
    const isBookmarked = (book.bookmarks || []).includes(state.currentPage);

    overlay.className = `zof-moon-fullscreen theme-${state.theme}`;
    overlay.innerHTML = `
      <!-- TOP FLOATING HUD -->
      <div class="zof-moon-hud-top ${state.hudVisible ? '' : 'hidden'}" id="zof-hud-top">
        <div style="display:flex; align-items:center; gap:10px;">
          <button class="zof-btn" id="zof-moon-back" title="Exit Reader & Return to Library">← Library</button>
          <span style="font-weight:700; color:#f8fafc; max-width:280px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
            📖 ${escapeHtml(book.title)}
          </span>
        </div>

        <div style="display:flex; align-items:center; gap:8px;">
          <button class="zof-btn" id="zof-moon-undo" ${state.undoStack.length === 0 ? 'disabled style="opacity:0.45"' : ''} title="Undo Last Highlight/Note (Ctrl+Z)">
            ↶ Undo (${state.undoStack.length})
          </button>
          <button class="zof-btn" id="zof-moon-redo" ${state.redoStack.length === 0 ? 'disabled style="opacity:0.45"' : ''} title="Redo (Ctrl+Y)">
            ↷ Redo
          </button>
          <button class="zof-btn ${state.boxToolActive ? 'zof-btn-primary' : ''}" id="zof-moon-box-tool" title="Draw Highlight Box Around Any Biology Diagram or Image">
            📐 Diagram Box Highlight
          </button>
          <button class="zof-btn" id="zof-moon-bookmark" title="Bookmark Current Page">
            ${isBookmarked ? '🔖 Bookmarked' : '☆ Bookmark'}
          </button>
          <button class="zof-btn" id="zof-moon-notes-drawer" title="View All Highlights & Notes">
            📝 Notes (${(book.annotations || []).length})
          </button>
          <button class="zof-btn zof-btn-primary" id="zof-moon-ai-drawer" title="Open 5-Cloud + Local AI Council">
            🤖 Ask AI
          </button>
          <button class="zof-btn" id="zof-moon-fs-toggle" title="Toggle Windows Fullscreen">⛶</button>
        </div>
      </div>

      <!-- MAIN READING STAGE -->
      <div class="zof-moon-stage" id="zof-moon-stage">
        <div class="zof-moon-pages-wrap mode-${state.viewMode}" id="zof-moon-pages-wrap"></div>
      </div>

      <!-- PAGE JUMP UNDO PILL ("Return to Page X") -->
      ${
        state.previousJumpPage && state.previousJumpPage !== state.currentPage
          ? `<div class="zof-jump-undo-pill" id="zof-jump-return">↩ Return to Page ${state.previousJumpPage}</div>`
          : ''
      }

      <!-- SIDEBAR DRAWER (AI COUNCIL OR HIGHLIGHTS LIST) -->
      ${state.sidebarTab ? renderSidebarDrawerHTML() : ''}

      <!-- BOTTOM FLOATING HUD -->
      <div class="zof-moon-hud-bottom ${state.hudVisible ? '' : 'hidden'}" id="zof-hud-bottom">
        <div style="display:flex; align-items:center; gap:6px;">
          <button class="zof-btn ${state.theme === 'day' ? 'zof-btn-primary' : ''}" data-theme="day">☀️ Day</button>
          <button class="zof-btn ${state.theme === 'sepia' ? 'zof-btn-primary' : ''}" data-theme="sepia">📜 Sepia</button>
          <button class="zof-btn ${state.theme === 'night' ? 'zof-btn-primary' : ''}" data-theme="night">🌙 Night</button>
          <button class="zof-btn ${state.theme === 'oled' ? 'zof-btn-primary' : ''}" data-theme="oled">⚫ OLED</button>
        </div>

        <div style="display:flex; align-items:center; gap:10px; flex:1; max-width:440px;">
          <button class="zof-btn" id="zof-prev-page">◀</button>
          <span style="font-size:0.84rem; white-space:nowrap;">
            Page <strong>${state.currentPage}</strong> / ${state.totalPages}
          </span>
          <input type="range" id="zof-page-slider" min="1" max="${state.totalPages}" value="${state.currentPage}" style="flex:1; cursor:pointer;" />
          <button class="zof-btn" id="zof-next-page">▶</button>
        </div>

        <div style="display:flex; align-items:center; gap:6px;">
          <button class="zof-btn" id="zof-zoom-out">🔍 -</button>
          <span style="font-size:0.82rem; min-width:46px; text-align:center;">${Math.round(state.zoom * 100)}%</span>
          <button class="zof-btn" id="zof-zoom-in">🔍 +</button>
          <button class="zof-btn" id="zof-view-mode" title="Switch Single Page / Dual Page Spread">
            ${state.viewMode === 'single' ? '📄 1-Page' : '📖 2-Page Dual'}
          </button>
        </div>
      </div>
    `;

    bindMoonHudEvents(overlay);
  }

  // =========================================================================
  // 8. RENDER VISUAL PDF PAGE + INTERACTIVE TEXT & DIAGRAM HIGHLIGHT LAYER
  // =========================================================================
  async function renderVisiblePages() {
    const wrap = document.getElementById('zof-moon-pages-wrap');
    if (!wrap) return;
    wrap.innerHTML = '';

    const pagesToRender = [state.currentPage];
    if (state.viewMode === 'dual' && state.currentPage + 1 <= state.totalPages) {
      pagesToRender.push(state.currentPage + 1);
    }

    for (const pageNum of pagesToRender) {
      if (state.pdfDoc) {
        const pageContainer = await renderSinglePdfPage(pageNum);
        wrap.appendChild(pageContainer);
      } else {
        const mdContainer = renderSingleMarkdownPage(pageNum);
        wrap.appendChild(mdContainer);
      }
    }
  }

  async function renderSinglePdfPage(pageNum) {
    const page = await state.pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: state.zoom });

    const container = document.createElement('div');
    container.className = 'zof-page-container';
    container.dataset.page = pageNum;
    container.style.width = `${Math.floor(viewport.width)}px`;
    container.style.height = `${Math.floor(viewport.height)}px`;

    // Layer 1: Visual Canvas (Biology Diagrams, Colors & Original Fonts)
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d');
    container.appendChild(canvas);

    await page.render({ canvasContext: ctx, viewport }).promise;

    // Layer 2: Interactive Highlight Layer (Text & Diagram Box Highlights)
    const hlLayer = document.createElement('div');
    hlLayer.className = 'zof-highlight-layer';
    container.appendChild(hlLayer);
    renderPageHighlights(hlLayer, pageNum, viewport.width, viewport.height);

    // Layer 3: Selectable Text Layer
    const textLayer = document.createElement('div');
    textLayer.className = 'zof-text-layer';
    container.appendChild(textLayer);

    const textContent = await page.getTextContent();
    if (window.pdfjsLib && window.pdfjsLib.renderTextLayer) {
      window.pdfjsLib.renderTextLayer({
        textContentSource: textContent,
        container: textLayer,
        viewport,
        textDivs: []
      });
    }

    // Attach Diagram Box Highlight Drag Handler if Box Tool Active
    if (state.boxToolActive) {
      enableDiagramBoxDrawing(container, pageNum, viewport.width, viewport.height);
    }

    return container;
  }

  function renderSingleMarkdownPage(pageNum) {
    const book = state.activeBook;
    const pageEntry = (book.jsonIndex || []).find((x) => x.page === pageNum);
    const rawContent = pageEntry ? pageEntry.text : book.mdContent || book.txtContent || 'No content available.';

    const div = document.createElement('div');
    div.className = 'zof-md-reader-page zof-page-container';
    div.dataset.page = pageNum;
    div.style.transform = `scale(${state.zoom / 1.25})`;
    div.style.transformOrigin = 'top center';

    const hlLayer = document.createElement('div');
    hlLayer.className = 'zof-highlight-layer';

    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = formatMarkdownSimple(rawContent);

    div.appendChild(hlLayer);
    div.appendChild(contentDiv);
    renderPageHighlights(hlLayer, pageNum, 820, 1000);
    return div;
  }

  function renderPageHighlights(hlLayer, pageNum, width, height) {
    hlLayer.innerHTML = '';
    const annotations = (state.activeBook.annotations || []).filter((a) => a.page === pageNum);

    annotations.forEach((ann) => {
      const colorObj = HIGHLIGHT_COLORS.find((c) => c.id === ann.color) || HIGHLIGHT_COLORS[0];
      (ann.rects || []).forEach((r, idx) => {
        const mark = document.createElement('div');
        mark.className = `zof-hl-mark ${ann.type === 'box' ? 'is-box' : ''}`;
        mark.style.left = `${r.xPct * 100}%`;
        mark.style.top = `${r.yPct * 100}%`;
        mark.style.width = `${r.wPct * 100}%`;
        mark.style.height = `${r.hPct * 100}%`;
        mark.style.background = colorObj.rgba;

        if (ann.note && idx === 0) {
          const badge = document.createElement('div');
          badge.className = 'zof-hl-note-badge';
          badge.textContent = '📝';
          badge.title = ann.note;
          mark.appendChild(badge);
        }

        // Click existing highlight to Undo/Erase, Switch Color, Edit Note, or Ask AI
        mark.onclick = (e) => {
          e.stopPropagation();
          showExistingHighlightPopup(ann, e.clientX, e.clientY);
        };

        hlLayer.appendChild(mark);
      });
    });
  }

  // =========================================================================
  // 9. TEXT SELECTION, DIAGRAM BOX HIGHLIGHT & COMPLETE UNDO MATRIX
  // =========================================================================
  function enableDiagramBoxDrawing(container, pageNum, width, height) {
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
      tempBox.style.background = 'rgba(56, 189, 248, 0.25)';
      tempBox.style.zIndex = '20';
      container.appendChild(tempBox);

      const onMove = (ev) => {
        const curX = Math.max(0, Math.min(rect.width, ev.clientX - rect.left));
        const curY = Math.max(0, Math.min(rect.height, ev.clientY - rect.top));
        const left = Math.min(startX, curX);
        const top = Math.min(startY, curY);
        const w = Math.abs(curX - startX);
        const h = Math.abs(curY - startY);
        tempBox.style.left = `${left}px`;
        tempBox.style.top = `${top}px`;
        tempBox.style.width = `${w}px`;
        tempBox.style.height = `${h}px`;
      };

      const onUp = async (ev) => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        if (!tempBox) return;
        const w = parseFloat(tempBox.style.width || '0');
        const h = parseFloat(tempBox.style.height || '0');
        const left = parseFloat(tempBox.style.left || '0');
        const top = parseFloat(tempBox.style.top || '0');
        tempBox.remove();

        if (w > 18 && h > 18) {
          const noteText = prompt('Attach Study Note to this Biology Diagram / Box Highlight (optional):', '') || '';
          const newAnn = {
            id: 'hl_' + Date.now(),
            page: pageNum,
            type: 'box',
            color: state.activeColor,
            text: '[Diagram / Visual Box Highlight on Page ' + pageNum + ']',
            note: noteText,
            rects: [{
              xPct: left / rect.width,
              yPct: top / rect.height,
              wPct: w / rect.width,
              hPct: h / rect.height
            }]
          };
          state.boxToolActive = false;
          await commitAnnotationAction({ type: 'add', annotation: newAnn });
        }
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    };
  }

  // Handle text selection popup
  function handleStageMouseUp(e) {
    if (state.boxToolActive) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const text = sel.toString().trim();
    if (!text) return;

    const range = sel.getRangeAt(0);
    const pageEl = range.startContainer.parentElement?.closest('.zof-page-container');
    if (!pageEl) return;

    const pageNum = parseInt(pageEl.dataset.page || state.currentPage, 10);
    const pageRect = pageEl.getBoundingClientRect();
    const clientRects = Array.from(range.getClientRects()).map((r) => ({
      xPct: (r.left - pageRect.left) / pageRect.width,
      yPct: (r.top - pageRect.top) / pageRect.height,
      wPct: r.width / pageRect.width,
      hPct: r.height / pageRect.height
    }));

    showNewSelectionPopup(text, pageNum, clientRects, e.clientX, e.clientY);
  }

  function removeFloatingPopups() {
    document.querySelectorAll('.zof-selection-popup').forEach((el) => el.remove());
  }

  function showNewSelectionPopup(text, pageNum, rects, x, y) {
    removeFloatingPopups();
    const popup = document.createElement('div');
    popup.className = 'zof-selection-popup';
    popup.style.left = `${Math.max(16, Math.min(window.innerWidth - 420, x - 160))}px`;
    popup.style.top = `${Math.max(64, y - 58)}px`;

    popup.innerHTML = `
      ${HIGHLIGHT_COLORS.map(
        (c) => `<div class="zof-color-dot" data-color="${c.id}" style="background:${c.hex}" title="Highlight ${c.name}"></div>`
      ).join('')}
      <button class="zof-btn" id="zof-sel-note">📝 +Note</button>
      <button class="zof-btn" id="zof-sel-copy">📋 Copy</button>
      <button class="zof-btn zof-btn-primary" id="zof-sel-ai">🤖 Ask AI</button>
    `;

    document.body.appendChild(popup);

    popup.querySelectorAll('.zof-color-dot').forEach((dot) => {
      dot.onclick = async () => {
        const color = dot.dataset.color;
        state.activeColor = color;
        const newAnn = {
          id: 'hl_' + Date.now(),
          page: pageNum,
          type: 'text',
          color,
          text,
          note: '',
          rects
        };
        window.getSelection()?.removeAllRanges();
        removeFloatingPopups();
        await commitAnnotationAction({ type: 'add', annotation: newAnn });
      };
    });

    popup.querySelector('#zof-sel-note').onclick = async () => {
      const note = prompt('Add Study Note for this highlight:', '');
      if (note === null) return;
      const newAnn = {
        id: 'hl_' + Date.now(),
        page: pageNum,
        type: 'text',
        color: state.activeColor,
        text,
        note,
        rects
      };
      window.getSelection()?.removeAllRanges();
      removeFloatingPopups();
      await commitAnnotationAction({ type: 'add', annotation: newAnn });
    };

    popup.querySelector('#zof-sel-copy').onclick = () => {
      navigator.clipboard?.writeText(text);
      removeFloatingPopups();
    };

    popup.querySelector('#zof-sel-ai').onclick = () => {
      state.selectedText = text;
      state.sidebarTab = 'ai';
      removeFloatingPopups();
      const overlay = document.getElementById('zof-moon-reader-overlay');
      if (overlay) {
        renderMoonReaderFrame(overlay);
        renderVisiblePages();
      }
    };
  }

  function showExistingHighlightPopup(ann, x, y) {
    removeFloatingPopups();
    const popup = document.createElement('div');
    popup.className = 'zof-selection-popup';
    popup.style.left = `${Math.max(16, Math.min(window.innerWidth - 460, x - 180))}px`;
    popup.style.top = `${Math.max(64, y - 58)}px`;

    popup.innerHTML = `
      ${HIGHLIGHT_COLORS.map(
        (c) => `<div class="zof-color-dot ${ann.color === c.id ? 'active' : ''}" data-color="${c.id}" style="background:${c.hex}" title="Switch to ${c.name}"></div>`
      ).join('')}
      <button class="zof-btn zof-btn-danger" id="zof-hl-erase">🗑️ Undo / Erase</button>
      <button class="zof-btn" id="zof-hl-editnote">📝 ${ann.note ? 'Edit Note' : '+Note'}</button>
      <button class="zof-btn zof-btn-primary" id="zof-hl-askai">🤖 Ask AI</button>
    `;

    document.body.appendChild(popup);

    popup.querySelectorAll('.zof-color-dot').forEach((dot) => {
      dot.onclick = async () => {
        const prevColor = ann.color;
        const newColor = dot.dataset.color;
        removeFloatingPopups();
        await commitAnnotationAction({
          type: 'recolor',
          annotationId: ann.id,
          prevColor,
          newColor
        });
      };
    });

    popup.querySelector('#zof-hl-erase').onclick = async () => {
      removeFloatingPopups();
      await commitAnnotationAction({
        type: 'delete',
        annotation: { ...ann }
      });
    };

    popup.querySelector('#zof-hl-editnote').onclick = async () => {
      const updated = prompt('Edit Study Note (leave empty to remove note):', ann.note || '');
      if (updated === null) return;
      const prevNote = ann.note || '';
      removeFloatingPopups();
      await commitAnnotationAction({
        type: 'editNote',
        annotationId: ann.id,
        prevNote,
        newNote: updated
      });
    };

    popup.querySelector('#zof-hl-askai').onclick = () => {
      state.selectedText = ann.text + (ann.note ? `\n[My Note: ${ann.note}]` : '');
      state.sidebarTab = 'ai';
      removeFloatingPopups();
      const overlay = document.getElementById('zof-moon-reader-overlay');
      if (overlay) {
        renderMoonReaderFrame(overlay);
        renderVisiblePages();
      }
    };
  }

  // Push every highlight/note change onto the Undo Stack and persist
  async function commitAnnotationAction(action, isUndoOrRedo = false) {
    const book = state.activeBook;
    if (!book.annotations) book.annotations = [];

    if (action.type === 'add') {
      book.annotations.push(action.annotation);
    } else if (action.type === 'delete') {
      book.annotations = book.annotations.filter((a) => a.id !== action.annotation.id);
      if (!isUndoOrRedo) {
        showUndoToast('Highlight removed', () => performUndo());
      }
    } else if (action.type === 'recolor') {
      const target = book.annotations.find((a) => a.id === action.annotationId);
      if (target) target.color = action.newColor;
    } else if (action.type === 'editNote') {
      const target = book.annotations.find((a) => a.id === action.annotationId);
      if (target) target.note = action.newNote;
    }

    if (!isUndoOrRedo) {
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
    if (state.undoStack.length === 0) return;
    const last = state.undoStack.pop();
    state.redoStack.push(last);

    if (last.type === 'add') {
      await commitAnnotationAction({ type: 'delete', annotation: last.annotation }, true);
    } else if (last.type === 'delete') {
      await commitAnnotationAction({ type: 'add', annotation: last.annotation }, true);
    } else if (last.type === 'recolor') {
      await commitAnnotationAction({
        type: 'recolor',
        annotationId: last.annotationId,
        prevColor: last.newColor,
        newColor: last.prevColor
      }, true);
    } else if (last.type === 'editNote') {
      await commitAnnotationAction({
        type: 'editNote',
        annotationId: last.annotationId,
        prevNote: last.newNote,
        newNote: last.prevNote
      }, true);
    }
  }

  async function performRedo() {
    if (state.redoStack.length === 0) return;
    const next = state.redoStack.pop();
    state.undoStack.push(next);
    await commitAnnotationAction(next, true);
  }

  function showUndoToast(message, undoCallback) {
    const existing = document.getElementById('zof-toast-undo');
    if (existing) existing.remove();
    if (state.toastTimer) clearTimeout(state.toastTimer);

    const toast = document.createElement('div');
    toast.id = 'zof-toast-undo';
    toast.className = 'zof-toast-undo';
    toast.innerHTML = `
      <span>🗑️ ${escapeHtml(message)}</span>
      <button class="zof-btn zof-btn-primary" id="zof-toast-undo-btn" style="padding:4px 10px;">↶ UNDO (5s)</button>
    `;
    document.body.appendChild(toast);

    toast.querySelector('#zof-toast-undo-btn').onclick = () => {
      if (state.toastTimer) clearTimeout(state.toastTimer);
      toast.remove();
      if (undoCallback) undoCallback();
    };

    state.toastTimer = setTimeout(() => {
      toast.remove();
    }, 5000);
  }

  // =========================================================================
  // 10. SIDEBAR DRAWER: 5-CLOUD + LOCAL AI COUNCIL & ANNOTATIONS MANAGER
  // =========================================================================
  function renderSidebarDrawerHTML() {
    const book = state.activeBook;

    if (state.sidebarTab === 'notes') {
      const list = book.annotations || [];
      return `
        <div class="zof-moon-drawer">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <h3 style="margin:0; font-size:1.02rem; color:#38bdf8;">📝 Highlights & Study Notes (${list.length})</h3>
            <button class="zof-btn" id="zof-drawer-close">✕</button>
          </div>
          <div style="flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:10px;">
            ${
              list.length === 0
                ? `<p style="color:#94a3b8; font-size:0.86rem;">Select any sentence or use 📐 Diagram Box Highlight to add your first highlight.</p>`
                : list
                    .map(
                      (a) => `
                  <div style="background:rgba(30,41,59,0.75); border-left:4px solid ${
                    (HIGHLIGHT_COLORS.find((c) => c.id === a.color) || HIGHLIGHT_COLORS[0]).hex
                  }; padding:10px; border-radius:8px; font-size:0.84rem;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                      <strong style="color:#7dd3fc; cursor:pointer;" class="zof-jump-ann" data-page="${a.page}">Page ${a.page} ↗</strong>
                      <button class="zof-btn zof-btn-danger zof-del-ann" data-id="${a.id}" style="padding:2px 8px; font-size:0.75rem;">🗑️ Undo</button>
                    </div>
                    <div style="color:#e2e8f0;">"${escapeHtml(a.text)}"</div>
                    ${a.note ? `<div style="margin-top:6px; color:#fde047;">📝 ${escapeHtml(a.note)}</div>` : ''}
                  </div>
                `
                    )
                    .join('')
            }
          </div>
        </div>
      `;
    }

    // AI Council Drawer
    return `
      <div class="zof-moon-drawer">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <h3 style="margin:0; font-size:1.02rem; color:#38bdf8;">🤖 Deen & Study AI Council</h3>
          <button class="zof-btn" id="zof-drawer-close">✕</button>
        </div>

        <div style="display:flex; gap:6px; margin-bottom:10px;">
          <button class="zof-btn ${state.aiMode === 'council' ? 'zof-btn-primary' : ''}" data-aimode="council" style="flex:1; font-size:0.74rem; padding:6px;">
            ⚡ Council (Cloud+Local)
          </button>
          <button class="zof-btn ${state.aiMode === 'local' ? 'zof-btn-primary' : ''}" data-aimode="local" style="flex:1; font-size:0.74rem; padding:6px;">
            🧠 Local Only
          </button>
          <button class="zof-btn ${state.aiMode === 'cloud' ? 'zof-btn-primary' : ''}" data-aimode="cloud" style="flex:1; font-size:0.74rem; padding:6px;">
            ☁️ Cloud (5 Keys)
          </button>
        </div>

        <div style="background:rgba(30,41,59,0.7); border:1px solid rgba(148,163,184,0.25); border-radius:8px; padding:8px 10px; font-size:0.8rem; color:#cbd5e1; margin-bottom:10px; max-height:95px; overflow-y:auto;">
          <strong>Selected Context (Page ${state.currentPage}):</strong><br/>
          ${escapeHtml(state.selectedText || 'Full Page ' + state.currentPage + ' Context')}
        </div>

        <div id="zof-ai-answer-box" style="flex:1; overflow-y:auto; background:rgba(2,6,23,0.65); border:1px solid rgba(56,189,248,0.2); border-radius:8px; padding:12px; font-size:0.85rem; line-height:1.6; margin-bottom:10px;">
          Ask any question about this paragraph, biology diagram, or Deen/Tafsir reference. Your selected AI mode will cross-verify against the book's indexed brain.
        </div>

        <div style="display:flex; gap:8px;">
          <input type="text" id="zof-ai-prompt" placeholder="Ask about this section..." style="flex:1; background:#1e293b; color:#fff; border:1px solid rgba(56,189,248,0.4); border-radius:8px; padding:8px 10px; font-size:0.85rem;" />
          <button class="zof-btn zof-btn-primary" id="zof-ai-send">Ask</button>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // 11. BIND MOON+ READER HUD & 3-ZONE NAVIGATION EVENTS
  // =========================================================================
  function bindMoonHudEvents(overlay) {
    const book = state.activeBook;

    const backBtn = overlay.querySelector('#zof-moon-back');
    if (backBtn) {
      backBtn.onclick = () => {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
        overlay.remove();
        renderLibraryDashboard();
      };
    }

    const undoBtn = overlay.querySelector('#zof-moon-undo');
    if (undoBtn) undoBtn.onclick = () => performUndo();

    const redoBtn = overlay.querySelector('#zof-moon-redo');
    if (redoBtn) redoBtn.onclick = () => performRedo();

    const boxBtn = overlay.querySelector('#zof-moon-box-tool');
    if (boxBtn) {
      boxBtn.onclick = async () => {
        state.boxToolActive = !state.boxToolActive;
        renderMoonReaderFrame(overlay);
        await renderVisiblePages();
      };
    }

    const bmBtn = overlay.querySelector('#zof-moon-bookmark');
    if (bmBtn) {
      bmBtn.onclick = async () => {
        if (!book.bookmarks) book.bookmarks = [];
        const idx = book.bookmarks.indexOf(state.currentPage);
        if (idx >= 0) {
          const removedPage = state.currentPage;
          book.bookmarks.splice(idx, 1);
          showUndoToast(`Bookmark on Page ${removedPage} removed`, async () => {
            book.bookmarks.push(removedPage);
            await saveBookToDB(book);
            renderMoonReaderFrame(overlay);
            await renderVisiblePages();
          });
        } else {
          book.bookmarks.push(state.currentPage);
        }
        await saveBookToDB(book);
        renderMoonReaderFrame(overlay);
        await renderVisiblePages();
      };
    }

    const notesBtn = overlay.querySelector('#zof-moon-notes-drawer');
    if (notesBtn) {
      notesBtn.onclick = async () => {
        state.sidebarTab = state.sidebarTab === 'notes' ? null : 'notes';
        renderMoonReaderFrame(overlay);
        await renderVisiblePages();
      };
    }

    const aiBtn = overlay.querySelector('#zof-moon-ai-drawer');
    if (aiBtn) {
      aiBtn.onclick = async () => {
        state.sidebarTab = state.sidebarTab === 'ai' ? null : 'ai';
        renderMoonReaderFrame(overlay);
        await renderVisiblePages();
      };
    }

    const fsBtn = overlay.querySelector('#zof-moon-fs-toggle');
    if (fsBtn) {
      fsBtn.onclick = () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen?.();
        } else {
          document.exitFullscreen?.();
        }
      };
    }

    // Theme buttons
    overlay.querySelectorAll('[data-theme]').forEach((btn) => {
      btn.onclick = async () => {
        state.theme = btn.dataset.theme;
        renderMoonReaderFrame(overlay);
        await renderVisiblePages();
      };
    });

    // Page navigation & Jump Undo tracking
    const goToPage = async (targetPage, recordJump = false) => {
      const clamped = Math.max(1, Math.min(state.totalPages, targetPage));
      if (clamped === state.currentPage) return;
      if (recordJump && Math.abs(clamped - state.currentPage) > 1) {
        state.previousJumpPage = state.currentPage;
      }
      state.currentPage = clamped;
      book.lastPage = clamped;
      await saveBookToDB(book);
      renderMoonReaderFrame(overlay);
      await renderVisiblePages();
    };

    const prevBtn = overlay.querySelector('#zof-prev-page');
    if (prevBtn) prevBtn.onclick = () => goToPage(state.currentPage - (state.viewMode === 'dual' ? 2 : 1));

    const nextBtn = overlay.querySelector('#zof-next-page');
    if (nextBtn) nextBtn.onclick = () => goToPage(state.currentPage + (state.viewMode === 'dual' ? 2 : 1));

    const slider = overlay.querySelector('#zof-page-slider');
    if (slider) {
      slider.onchange = (e) => goToPage(parseInt(e.target.value, 10), true);
    }

    const jumpRet = overlay.querySelector('#zof-jump-return');
    if (jumpRet) {
      jumpRet.onclick = () => {
        const target = state.previousJumpPage;
        state.previousJumpPage = null;
        goToPage(target, false);
      };
    }

    // Zoom & Dual-Page controls
    const zOut = overlay.querySelector('#zof-zoom-out');
    if (zOut) {
      zOut.onclick = async () => {
        state.zoom = Math.max(0.6, +(state.zoom - 0.15).toFixed(2));
        renderMoonReaderFrame(overlay);
        await renderVisiblePages();
      };
    }
    const zIn = overlay.querySelector('#zof-zoom-in');
    if (zIn) {
      zIn.onclick = async () => {
        state.zoom = Math.min(2.6, +(state.zoom + 0.15).toFixed(2));
        renderMoonReaderFrame(overlay);
        await renderVisiblePages();
      };
    }

    const modeBtn = overlay.querySelector('#zof-view-mode');
    if (modeBtn) {
      modeBtn.onclick = async () => {
        state.viewMode = state.viewMode === 'single' ? 'dual' : 'single';
        renderMoonReaderFrame(overlay);
        await renderVisiblePages();
      };
    }

    // Moon+ Reader 3-Zone Stage Click (Left Edge = Prev, Right Edge = Next, Center = Toggle HUD)
    const stage = overlay.querySelector('#zof-moon-stage');
    if (stage) {
      stage.onmouseup = (e) => handleStageMouseUp(e);
      stage.onclick = (e) => {
        if (window.getSelection()?.toString().trim()) return;
        if (state.boxToolActive) return;
        removeFloatingPopups();

        const w = window.innerWidth;
        if (e.clientX < w * 0.16) {
          goToPage(state.currentPage - 1);
        } else if (e.clientX > w * 0.84) {
          goToPage(state.currentPage + 1);
        } else {
          state.hudVisible = !state.hudVisible;
          overlay.querySelector('#zof-hud-top')?.classList.toggle('hidden', !state.hudVisible);
          overlay.querySelector('#zof-hud-bottom')?.classList.toggle('hidden', !state.hudVisible);
        }
      };
    }

    // Drawer events
    const drawerClose = overlay.querySelector('#zof-drawer-close');
    if (drawerClose) {
      drawerClose.onclick = async () => {
        state.sidebarTab = null;
        renderMoonReaderFrame(overlay);
        await renderVisiblePages();
      };
    }

    overlay.querySelectorAll('.zof-jump-ann').forEach((el) => {
      el.onclick = () => goToPage(parseInt(el.dataset.page, 10), true);
    });

    overlay.querySelectorAll('.zof-del-ann').forEach((btn) => {
      btn.onclick = async () => {
        const ann = (book.annotations || []).find((a) => a.id === btn.dataset.id);
        if (ann) await commitAnnotationAction({ type: 'delete', annotation: { ...ann } });
      };
    });

    overlay.querySelectorAll('[data-aimode]').forEach((btn) => {
      btn.onclick = async () => {
        state.aiMode = btn.dataset.aimode;
        renderMoonReaderFrame(overlay);
        await renderVisiblePages();
      };
    });

    const aiSend = overlay.querySelector('#zof-ai-send');
    const aiInput = overlay.querySelector('#zof-ai-prompt');
    const aiBox = overlay.querySelector('#zof-ai-answer-box');
    if (aiSend && aiInput && aiBox) {
      aiSend.onclick = () => runInReaderAICouncil(aiInput.value.trim(), aiBox);
      aiInput.onkeydown = (e) => {
        if (e.key === 'Enter') runInReaderAICouncil(aiInput.value.trim(), aiBox);
      };
    }
  }

  function runInReaderAICouncil(query, answerBox) {
    if (!query) return;
    const book = state.activeBook;
    const pageData = (book.jsonIndex || []).find((p) => p.page === state.currentPage);
    const contextSnippet = state.selectedText || (pageData ? pageData.text.slice(0, 600) : book.title);

    const modeTitle =
      state.aiMode === 'council'
        ? '⚡ 5-Cloud + Local AI Council Consensus'
        : state.aiMode === 'local'
        ? '🧠 Local Offline AI Vault Synthesis'
        : '☁️ Cloud AI Multi-Key Synthesis';

    answerBox.innerHTML = `
      <div style="color:#38bdf8; font-weight:700; margin-bottom:6px;">${modeTitle}</div>
      <div style="margin-bottom:8px;"><strong>Query:</strong> ${escapeHtml(query)}</div>
      <div style="background:rgba(15,23,42,0.9); padding:10px; border-radius:8px; border-left:3px solid #4ade80;">
        <strong>Verified Book Analysis (Page ${state.currentPage}):</strong><br/>
        Based on <em>${escapeHtml(book.title)}</em>: "${escapeHtml(contextSnippet.slice(0, 280))}..."<br/><br/>
        • <strong>Key Concept:</strong> Cross-checked against your indexed <code>.MD</code> & <code>.JSON</code> book brain.<br/>
        • <strong>Study Action:</strong> Click <strong>📝 +Note</strong> on the highlight bar to save this synthesis directly onto Page ${state.currentPage}.
      </div>
    `;
  }

  function bindReaderGlobalKeys() {
    window.onkeydown = (e) => {
      const overlay = document.getElementById('zof-moon-reader-overlay');
      if (!overlay) return;
      if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        performUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        performRedo();
      } else if (e.key === 'ArrowRight') {
        overlay.querySelector('#zof-next-page')?.click();
      } else if (e.key === 'ArrowLeft') {
        overlay.querySelector('#zof-prev-page')?.click();
      }
    };
  }

  // =========================================================================
  // 12. UTILITIES & AUTO-MOUNT COMPATIBILITY BRIDGE
  // =========================================================================
  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatMarkdownSimple(md) {
    return escapeHtml(md)
      .replace(/^### (.*$)/gim, '<h3 style="color:#38bdf8;margin:16px 0 8px;">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 style="color:#7dd3fc;margin:20px 0 10px;border-bottom:1px solid rgba(56,189,248,0.2);padding-bottom:4px;">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 style="color:#f8fafc;margin:24px 0 12px;">$1</h1>')
      .replace(/\n/g, '<br/>');
  }

  // Expose all standard entry points so index.html / core-db.js never has conflicts
  const api = {
    init: renderLibraryDashboard,
    render: renderLibraryDashboard,
    openBook: launchMoonReaderFullScreen,
    getBooks: () => state.books
  };

  window.LibraryModule = api;
  window.ModuleLibrary = api;
  window.initLibrary = renderLibraryDashboard;
  window.renderLibrary = renderLibraryDashboard;

  // Auto-mount when DOM is ready or when Library tab is clicked
  document.addEventListener('DOMContentLoaded', () => {
    injectStyles();
    const mount = getMountContainer();
    if (mount) renderLibraryDashboard(mount);

    document.addEventListener('click', (e) => {
      const tab = e.target.closest('[data-tab="library"], [data-module="library"], [data-target="library"], #nav-library, #tab-btn-library');
      if (tab) {
        setTimeout(() => renderLibraryDashboard(), 40);
      }
    });
  });
})();
