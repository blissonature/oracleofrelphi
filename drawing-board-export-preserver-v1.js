// Drawing Board snapshot export: create a guaranteed PNG action in the organized export panel.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname)) return;

  const BUTTON_ID = 'snapshotCardRowArrangement';
  const STATUS_ID = 'drawingBoardSnapshotStatus';
  const LIB_URL = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
  let queued = false;
  let libraryPromise = null;

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
    if (window.html2canvas) return Promise.resolve(window.html2canvas);
    if (libraryPromise) return libraryPromise;
    libraryPromise = new Promise(function (resolve, reject) {
      const existing = document.querySelector('script[src="' + LIB_URL + '"]');
      if (existing) {
        existing.addEventListener('load', function () { resolve(window.html2canvas); }, { once:true });
        existing.addEventListener('error', function () { reject(new Error('Snapshot library did not load.')); }, { once:true });
        return;
      }
      const script = document.createElement('script');
      script.src = LIB_URL;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.addEventListener('load', function () {
        if (window.html2canvas) resolve(window.html2canvas);
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

  function downloadCanvas(canvas, name) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (!blob) return reject(new Error('The browser could not create the PNG file.'));
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        resolve();
      }, 'image/png');
    });
  }

  async function saveSnapshot(panel, destination, button) {
    const target = panel.querySelector('.card-row-workspace') || panel.querySelector('.short-list-row.card-row-board');
    if (!target) {
      setStatus(destination, 'Open the Drawing Board before saving a snapshot.', true);
      return;
    }
    button.disabled = true;
    setStatus(destination, 'Preparing the arrangement snapshot…', false);
    try {
      await waitForImages(target);
      const html2canvas = await loadLibrary();
      const scale = Math.min(3, Math.max(2, window.devicePixelRatio || 1));
      const canvas = await html2canvas(target, {
        backgroundColor:null,
        scale:scale,
        useCORS:true,
        allowTaint:false,
        logging:false,
        imageTimeout:10000,
        scrollX:-window.scrollX,
        scrollY:-window.scrollY,
        windowWidth:document.documentElement.clientWidth,
        windowHeight:document.documentElement.clientHeight
      });
      await downloadCanvas(canvas, filename(panel));
      setStatus(destination, 'Arrangement snapshot saved as PNG.', false);
    } catch (error) {
      console.error('Drawing Board snapshot failed:', error);
      setStatus(destination, 'The PNG snapshot could not be created. Reload once and try again.', true);
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
      button.textContent = 'Save arrangement snapshot (PNG)';
      button.title = 'Download the visible Drawing Board arrangement as a PNG image';
      button.dataset.relphiDirectSnapshot = 'true';
      const anchor = destination.querySelector('#downloadRowOptimizedHtml') || destination.firstChild;
      destination.insertBefore(button, anchor || null);
      button.addEventListener('click', function () { saveSnapshot(panel, destination, button); });
    }
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

    const style = document.createElement('style');
    style.textContent = '#shortListPanel #snapshotCardRowArrangement{border-color:#dc1f18!important;background:#dc1f18!important;color:#fff!important}#shortListPanel .drawing-board-snapshot-status{flex:1 0 100%;min-height:1.2em;color:#4f4741;font-size:.74rem;font-weight:650}#shortListPanel .drawing-board-snapshot-status[data-error="true"]{color:#b81712}';
    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
