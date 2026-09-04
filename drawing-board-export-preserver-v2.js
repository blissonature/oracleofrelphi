// Drawing Board snapshot export v2: prepare one clean PNG, then save it appropriately per device.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname)) return;
  if (window.__relphiDrawingBoardExportPreserverV2) return;
  window.__relphiDrawingBoardExportPreserverV2 = true;

  const BUTTON_ID = 'snapshotCardRowArrangement';
  const SAVE_BUTTON_ID = 'saveDrawingBoardSnapshotToDevice';
  const STATUS_ID = 'drawingBoardSnapshotStatus';
  const CLONE_ID = 'relphiDrawingBoardSnapshotClone';
  const LIB_URL = 'https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js';
  let queued = false;
  let libraryPromise = null;
  let pendingFile = null;
  let pendingUrl = '';

  function isAppleMobile() {
    return /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

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
        setTimeout(resolve, 3000);
      });
    }));
  }

  function renderedImageToDataUrl(image) {
    const src = image.currentSrc || image.src || '';
    if (/^data:image\//i.test(src)) return src;
    if (!image.naturalWidth || !image.naturalHeight) return '';
    try {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d');
      if (!context) return '';
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/png');
    } catch (_) {
      return '';
    }
  }

  async function fetchedImageToDataUrl(url) {
    if (!url) return '';
    if (/^data:image\//i.test(url)) return url;
    try {
      const absolute = new URL(url, location.href).href;
      const response = await fetch(absolute, { credentials:'same-origin', cache:'force-cache' });
      if (!response.ok) return '';
      const blob = await response.blob();
      if (!/^image\//i.test(blob.type)) return '';
      return await new Promise(function (resolve, reject) {
        const reader = new FileReader();
        reader.addEventListener('load', function () { resolve(String(reader.result || '')); }, { once:true });
        reader.addEventListener('error', reject, { once:true });
        reader.readAsDataURL(blob);
      });
    } catch (_) {
      return '';
    }
  }

  async function inlineImages(source, clone) {
    const originals = Array.from(source.querySelectorAll('img'));
    const copies = Array.from(clone.querySelectorAll('img'));
    let embedded = 0;
    await Promise.all(originals.map(async function (original, index) {
      const copy = copies[index];
      if (!copy) return;
      copy.removeAttribute('srcset');
      copy.removeAttribute('sizes');
      copy.loading = 'eager';
      copy.decoding = 'sync';
      copy.closest('picture')?.querySelectorAll('source').forEach(function (source) {
        source.removeAttribute('srcset');
        source.removeAttribute('sizes');
      });
      let dataUrl = renderedImageToDataUrl(original);
      if (!dataUrl) dataUrl = await fetchedImageToDataUrl(original.currentSrc || original.src || '');
      if (!dataUrl) return;
      copy.src = dataUrl;
      embedded += 1;
    }));
    return { total:originals.length, embedded };
  }

  function replaceEditableFields(clone) {
    clone.querySelectorAll('textarea,input:not([type="range"]):not([type="button"]):not([type="submit"]),select').forEach(function (field) {
      if (field.type === 'checkbox' || field.type === 'radio' || field.type === 'file' || field.type === 'color') {
        field.remove();
        return;
      }
      const text = document.createElement('span');
      text.className = 'snapshot-field-value';
      text.textContent = field.tagName === 'SELECT'
        ? (field.selectedOptions?.[0]?.textContent || field.value || '')
        : (field.value || field.getAttribute('placeholder') || '');
      field.replaceWith(text);
    });
  }

  function removeEditorGui(clone) {
    [
      'button','input[type="range"]','[role="toolbar"]','.card-row-icon-toolbar','.card-row-board-toolbar',
      '.card-row-workspace-toolbar','.card-row-zoom-controls','.drawing-board-toolbar','.drawing-board-controls',
      '.board-controls','.board-zoom-controls','.card-row-board-controls','.card-row-selection-controls',
      '.card-row-resize-handle','.card-row-rotate-handle','.card-row-drag-handle','.row-resize-handle',
      '.row-rotate-handle','.row-drag-handle','[data-row-handle]','[data-board-control]',
      '[data-drawing-board-control]','[data-action="center-board"]','[data-action="arrange-board"]',
      '[aria-label*="Zoom" i]','[aria-label*="Center" i]','[aria-label*="Arrange" i]'
    ].forEach(function (selector) {
      try { clone.querySelectorAll(selector).forEach(function (node) { node.remove(); }); } catch (_) {}
    });
    clone.querySelectorAll('[contenteditable="true"]').forEach(function (node) {
      node.removeAttribute('contenteditable');
      node.removeAttribute('tabindex');
    });
    clone.querySelectorAll('.is-selected,[aria-selected="true"]').forEach(function (node) {
      node.classList.remove('is-selected');
      node.removeAttribute('aria-selected');
    });
    replaceEditableFields(clone);
  }

  async function createCaptureClone(target, width, height) {
    document.getElementById(CLONE_ID)?.remove();
    const clone = target.cloneNode(true);
    clone.id = CLONE_ID;
    clone.setAttribute('aria-hidden', 'true');
    removeEditorGui(clone);
    const imageResult = await inlineImages(target, clone);
    Object.assign(clone.style, {
      position:'fixed', left:'-100000px', top:'0', zIndex:'-1', margin:'0',
      width:width + 'px', height:height + 'px', maxWidth:'none', maxHeight:'none',
      overflow:'visible', transform:'none', transformOrigin:'top left', pointerEvents:'none'
    });
    document.body.appendChild(clone);
    if (document.fonts?.ready) await document.fonts.ready.catch(function () {});
    await waitForImages(clone);
    return { clone, imageResult };
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

  function directDownload(file) {
    clearPendingUrl();
    pendingUrl = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = pendingUrl;
    link.download = file.name || 'drawing-board-snapshot.png';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(clearPendingUrl, 2000);
  }

  async function savePendingFile(destination, button) {
    if (!pendingFile) return;
    button.disabled = true;
    try {
      if (isAppleMobile() && navigator.share && (!navigator.canShare || navigator.canShare({ files:[pendingFile] }))) {
        await navigator.share({ files:[pendingFile], title:'Drawing Board snapshot' });
        setStatus(destination, 'Share sheet opened. Choose Save Image or Save to Files.', false);
      } else {
        directDownload(pendingFile);
        setStatus(destination, 'PNG downloaded.', false);
      }
    } catch (error) {
      if (error?.name === 'AbortError') setStatus(destination, 'Save canceled.', false);
      else {
        console.error('Drawing Board save failed:', error);
        setStatus(destination, 'Could not save the PNG: ' + String(error?.message || error || 'unknown error'), true);
      }
    } finally {
      button.disabled = false;
    }
  }

  function ensureSaveButton(destination) {
    let button = destination.querySelector('#' + SAVE_BUTTON_ID);
    if (button) {
      button.textContent = 'Save PNG';
      button.title = isAppleMobile() ? 'Save this PNG using the iPhone share sheet' : 'Download this PNG to this computer';
      return button;
    }
    button = document.createElement('button');
    button.type = 'button';
    button.id = SAVE_BUTTON_ID;
    button.textContent = 'Save PNG';
    button.title = isAppleMobile() ? 'Save this PNG using the iPhone share sheet' : 'Download this PNG to this computer';
    button.hidden = true;
    const snapshotButton = destination.querySelector('#' + BUTTON_ID);
    snapshotButton?.insertAdjacentElement('afterend', button);
    button.addEventListener('click', function () { savePendingFile(destination, button); });
    return button;
  }

  async function prepareSnapshot(panel, destination, button) {
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
    setStatus(destination, 'Preparing a clean arrangement snapshot with embedded card art…', false);
    let captureClone = null;
    try {
      await waitForImages(target);
      const htmlToImage = await loadLibrary();
      const rect = target.getBoundingClientRect();
      const width = Math.max(1, Math.ceil(target.scrollWidth || rect.width));
      const height = Math.max(1, Math.ceil(target.scrollHeight || rect.height));
      const prepared = await createCaptureClone(target, width, height);
      captureClone = prepared.clone;
      if (prepared.imageResult.total && prepared.imageResult.embedded < prepared.imageResult.total) {
        throw new Error('Only ' + prepared.imageResult.embedded + ' of ' + prepared.imageResult.total + ' board images could be embedded.');
      }
      const maxPixels = 24000000;
      const idealRatio = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
      const safeRatio = Math.min(idealRatio, Math.sqrt(maxPixels / Math.max(1, width * height)));
      const dataUrl = await htmlToImage.toPng(captureClone, {
        cacheBust:false,
        pixelRatio:Math.max(1, safeRatio),
        width,
        height,
        canvasWidth:Math.ceil(width * Math.max(1, safeRatio)),
        canvasHeight:Math.ceil(height * Math.max(1, safeRatio)),
        backgroundColor:'transparent',
        skipAutoScale:true,
        includeQueryParams:false,
        style:{ margin:'0', transform:'none', transformOrigin:'top left', left:'0', top:'0', position:'relative' }
      });
      pendingFile = await dataUrlToFile(dataUrl, filename(panel));
      saveButton.hidden = false;
      setStatus(destination, isAppleMobile() ? 'PNG prepared. Tap Save PNG to open the share sheet.' : 'PNG prepared. Click Save PNG to download it.', false);
    } catch (error) {
      console.error('Drawing Board snapshot failed:', error);
      const detail = String(error?.message || error || 'unknown capture error').replace(/\s+/g, ' ').slice(0, 200);
      setStatus(destination, 'Snapshot failed: ' + detail, true);
    } finally {
      captureClone?.remove();
      button.disabled = false;
    }
  }

  function ensureButton() {
    queued = false;
    const panel = document.getElementById('shortListPanel');
    const destination = panel && panel.querySelector('#drawing-board-post-export .board-options-body, #board-options-export .board-options-body');
    if (!panel || !destination) return;

    // Remove the old v1 controls/listeners if a cached page happened to create them first.
    const oldPrepare = destination.querySelector('#' + BUTTON_ID);
    if (oldPrepare && oldPrepare.dataset.relphiSnapshotV2 !== 'true') oldPrepare.remove();
    const oldSave = destination.querySelector('#' + SAVE_BUTTON_ID);
    if (oldSave && oldSave.dataset.relphiSnapshotV2 !== 'true') oldSave.remove();

    let button = destination.querySelector('#' + BUTTON_ID);
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.id = BUTTON_ID;
      button.dataset.relphiSnapshotV2 = 'true';
      button.textContent = 'Prepare arrangement snapshot (PNG)';
      button.title = 'Create a clean PNG of the arranged board without editor controls';
      const anchor = destination.querySelector('#downloadRowOptimizedHtml') || destination.firstChild;
      destination.insertBefore(button, anchor || null);
      button.addEventListener('click', function () { prepareSnapshot(panel, destination, button); });
    }
    const save = ensureSaveButton(destination);
    save.dataset.relphiSnapshotV2 = 'true';
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
    style.id = 'relphi-drawing-board-snapshot-v2-style';
    style.textContent = '#shortListPanel #snapshotCardRowArrangement{border-color:#dc1f18!important;background:#dc1f18!important;color:#fff!important}#shortListPanel #saveDrawingBoardSnapshotToDevice{border-color:#1659c7!important;background:#1659c7!important;color:#fff!important}#shortListPanel .drawing-board-snapshot-status{flex:1 0 100%;min-height:1.2em;color:#4f4741;font-size:.74rem;font-weight:650;overflow-wrap:anywhere}#shortListPanel .drawing-board-snapshot-status[data-error="true"]{color:#b81712}#relphiDrawingBoardSnapshotClone .snapshot-field-value{display:inline-block;white-space:pre-wrap}';
    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();