// Drawing Board snapshot export: create a guaranteed PNG action in the organized export panel.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname)) return;

  const BUTTON_ID = 'snapshotCardRowArrangement';
  const SAVE_BUTTON_ID = 'saveDrawingBoardSnapshotToDevice';
  const STATUS_ID = 'drawingBoardSnapshotStatus';
  const LIB_URL = 'https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js';
  let queued = false;
  let libraryPromise = null;
  let pendingFile = null;
  let pendingUrl = '';

  function filename(panel) {
    const raw = panel.querySelector('#rowName')?.value || 'drawing-board';
    const safe = String(raw).trim().toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'drawing-board';
    return safe + '-snapshot.png';
  }

  function statusNode(destination) {
    let node = destination.querySelector('#' + STATUS_ID);
    if (node) return node;
    node = document.createElement('span');
    node.id = STATUS_ID;
    node.className = 'drawing-board-snapshot-status';
    node.setAttribute('role', 'status');
    node.setAttribute('aria-live', 'polite');
    destination.appendChild(node);
    return node;
  }

  function setStatus(destination, text, isError) {
    const node = statusNode(destination);
    node.textContent = text || '';
    node.dataset.error = isError ? 'true' : 'false';
  }

  function loadLibrary() {
    if (window.htmlToImage?.toPng) return Promise.resolve(window.htmlToImage);
    if (libraryPromise) return libraryPromise;
    libraryPromise = new Promise(function (resolve, reject) {
      const existing = document.querySelector('script[src="' + LIB_URL + '"]');
      if (existing) {
        if (window.htmlToImage?.toPng) return resolve(window.htmlToImage);
        existing.addEventListener('load', function () {
          if (window.htmlToImage?.toPng) resolve(window.htmlToImage);
          else reject(new Error('Snapshot library loaded without becoming available.'));
        }, { once:true });
        existing.addEventListener('error', function () { reject(new Error('Snapshot library did not load.')); }, { once:true });
        return;
      }
      const script = document.createElement('script');
      script.src = LIB_URL;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.addEventListener('load', function () {
        if (window.htmlToImage?.toPng) resolve(window.htmlToImage);
        else reject(new Error('Snapshot library loaded without becoming available.'));
      }, { once:true });
      script.addEventListener('error', function () { reject(new Error('Snapshot library did not load.')); }, { once:true });
      document.head.appendChild(script);
    });
    return libraryPromise;
  }

  function waitForImages(target) {
    return Promise.all(Array.from(target.querySelectorAll('img')).map(function (image) {
      if (image.complete && image.naturalWidth) return Promise.resolve();
      if (typeof image.decode === 'function') return image.decode().catch(function () {});
      return new Promise(function (resolve) {
        image.addEventListener('load', resolve, { once:true });
        image.addEventListener('error', resolve, { once:true });
        setTimeout(resolve, 2500);
      });
    }));
  }

  async function dataUrlToFile(dataUrl, name) {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return new File([blob], name, { type:'image/png', lastModified:Date.now() });
  }

  function clearPendingUrl() {
    if (!pendingUrl) return;
    URL.revokeObjectURL(pendingUrl);
    pendingUrl = '';
  }

  function fallbackOpenFile(file) {
    clearPendingUrl();
    pendingUrl = URL.createObjectURL(file);
    const opened = window.open(pendingUrl, '_blank', 'noopener');
    if (!opened) location.href = pendingUrl;
  }

  async function sharePendingFile(destination, button) {
    if (!pendingFile) return;
    button.disabled = true;
    try {
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files:[pendingFile] }))) {
        await navigator.share({ files:[pendingFile], title:'Drawing Board snapshot' });
        setStatus(destination, 'The iPhone share sheet opened. Choose Save Image or Save to Files.', false);
      } else {
        fallbackOpenFile(pendingFile);
        setStatus(destination, 'The PNG opened in a new tab. Press and hold the image to save it.', false);
      }
    } catch (error) {
      if (error?.name === 'AbortError') {
        setStatus(destination, 'Save canceled. Tap Save PNG to iPhone when ready.', false);
      } else {
        console.error('Drawing Board share failed:', error);
        fallbackOpenFile(pendingFile);
        setStatus(destination, 'The PNG opened in a new tab. Press and hold the image to save it.', false);
      }
    } finally {
      button.disabled = false;
    }
  }

  function ensureSaveButton(destination) {
    let button = destination.querySelector('#' + SAVE_BUTTON_ID);
    if (button) return button;
    button = document.createElement('button');
    button.type = 'button';
    button.id = SAVE_BUTTON_ID;
    button.textContent = 'Save PNG to iPhone';
    button.title = 'Open the iPhone share sheet for this PNG';
    button.hidden = true;
    const snapshotButton = destination.querySelector('#' + BUTTON_ID);
    snapshotButton?.insertAdjacentElement('afterend', button);
    button.addEventListener('click', function () { sharePendingFile(destination, button); });
    return button;
  }

  async function saveSnapshot(panel, destination, button) {
    const target = panel.querySelector('.card-row-workspace') || panel.querySelector('.short-list-row.card-row-board');
    if (!target) {
      setStatus(destination, 'Open the Drawing Board before saving a snapshot.', true);
      return;
    }
    button.disabled = true;
    const saveButton = ensureSaveButton(destination);
    saveButton.hidden = true;
    pendingFile = null;
    clearPendingUrl();
    setStatus(destination, 'Preparing the arrangement snapshot…', false);
    try {
      await waitForImages(target);
      const htmlToImage = await loadLibrary();
      const rect = target.getBoundingClientRect();
      const width = Math.max(1, Math.ceil(target.scrollWidth || rect.width));
      const height = Math.max(1, Math.ceil(target.scrollHeight || rect.height));
      const maxPixels = 24000000;
      const idealRatio = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
      const safeRatio = Math.min(idealRatio, Math.sqrt(maxPixels / Math.max(1, width * height)));
      const dataUrl = await htmlToImage.toPng(target, {
        cacheBust:true,
        pixelRatio:Math.max(1, safeRatio),
        width:width,
        height:height,
        canvasWidth:Math.ceil(width * Math.max(1, safeRatio)),
        canvasHeight:Math.ceil(height * Math.max(1, safeRatio)),
        backgroundColor:'transparent',
        skipAutoScale:true,
        includeQueryParams:true,
        style:{ margin:'0', transform:'none', transformOrigin:'top left' },
        filter:function (node) {
          return !(node instanceof Element && (
            node.id === BUTTON_ID ||
            node.id === SAVE_BUTTON_ID ||
            node.id === STATUS_ID ||
            node.closest?.('#board-options-export')
          ));
        }
      });
      pendingFile = await dataUrlToFile(dataUrl, filename(panel));
      saveButton.hidden = false;
      setStatus(destination, 'PNG prepared. Tap Save PNG to iPhone to choose Save Image or Save to Files.', false);
    } catch (error) {
      console.error('Drawing Board snapshot failed:', error);
      const detail = String(error?.message || error || 'unknown capture error').replace(/\s+/g, ' ').slice(0, 180);
      setStatus(destination, 'Snapshot failed: ' + detail, true);
    } finally {
      button.disabled = false;
    }
  }

  function ensureButton() {
    queued = false;
    const panel = document.getElementById('shortListPanel');
    const destination = panel && panel.querySelector('#board-options-export .board-options-body');
    if (!panel || !destination) return;

    let button = destination.querySelector('#' + BUTTON_ID);
    if (!button) {
      document.querySelectorAll('#' + BUTTON_ID).forEach(function (legacy) { legacy.remove(); });
      button = document.createElement('button');
      button.type = 'button';
      button.id = BUTTON_ID;
      button.textContent = 'Prepare arrangement snapshot (PNG)';
      button.title = 'Create a PNG of the visible Drawing Board arrangement';
      button.dataset.relphiDirectSnapshot = 'true';
      const anchor = destination.querySelector('#downloadRowOptimizedHtml') || destination.firstChild;
      destination.insertBefore(button, anchor || null);
      button.addEventListener('click', function () { saveSnapshot(panel, destination, button); });
    }
    ensureSaveButton(destination);
    statusNode(destination);
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(ensureButton);
  }

  function start() {
    schedule();
    new MutationObserver(schedule).observe(document.body, { childList:true, subtree:true });
    window.addEventListener('pageshow', schedule);
    window.addEventListener('relphi:drawing-board-restored', schedule);
    window.addEventListener('pagehide', clearPendingUrl);

    const style = document.createElement('style');
    style.textContent = '#shortListPanel #snapshotCardRowArrangement{border-color:#dc1f18!important;background:#dc1f18!important;color:#fff!important}#shortListPanel #saveDrawingBoardSnapshotToDevice{border-color:#1659c7!important;background:#1659c7!important;color:#fff!important}#shortListPanel .drawing-board-snapshot-status{flex:1 0 100%;min-height:1.2em;color:#4f4741;font-size:.74rem;font-weight:650;overflow-wrap:anywhere}#shortListPanel .drawing-board-snapshot-status[data-error="true"]{color:#b81712}';
    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
