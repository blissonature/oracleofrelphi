// Compatibility no-op for color, plus local Chiron and relationship UX bootstrap.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
  document.getElementById('relphiSpecialVectorColorStyle')?.remove();

  function load(src, done) {
    const base = src.split('?')[0];
    const existing = document.querySelector('script[src^="' + base + '"]');
    if (existing) {
      if (done) {
        if (existing.dataset.relphiLoaded === 'true') setTimeout(done, 0);
        else existing.addEventListener('load', done, { once:true });
      }
      return existing;
    }
    const script = document.createElement('script');
    script.async = false;
    script.src = src;
    script.addEventListener('load', function () {
      script.dataset.relphiLoaded = 'true';
      if (done) done();
    }, { once:true });
    document.body.appendChild(script);
    return script;
  }

  function loadProgressiveReveal(started) {
    if (!window.RelphiGlyphRegistry || !window.RelphiGlyphComponent?.createBubble) {
      if (Date.now() - started < 8000) return setTimeout(function(){loadProgressiveReveal(started)}, 40);
      return;
    }

    if (!window.__relphiApprovedInscribedUnitV1) {
      document.querySelector('script[src^="relphi-approved-inscribed-unit-v1.js"]')?.remove();
    }

    load('relphi-approved-inscribed-unit-v1.js?v=2', function () {
      load('sky-chart-progressive-current-reading-v1.js?v=2', function () {
        load('sky-chart-canonical-glyph-correction-v1.js?v=4');
        load('sky-chart-relationship-copy-text-v1.js?v=1');
      });
    });
  }

  load('sky-chart-mobile-scroll-resize-guard-v1.js?v=1');
  loadProgressiveReveal(Date.now());
  load('relphi-glyph-copy-serializer-v1.js?v=1');
  load('sky-chart-chiron-local-v1.js?v=3', function () {
    load('sky-chart-calculated-points-storage-bridge-v2.js?v=3');
  });
  load('sky-chart-relationship-scope-progressive-v1.js?v=3', function () {
    load('sky-chart-cross-axis-groups-v1.js?v=1');
  });
  load('sky-chart-calculation-completion-guard-v1.js?v=1');
  load('sky-chart-dual-house-rings-v1.js?v=3', function () {
    load('sky-chart-wheel-stability-v1.js?v=3');
    load('sky-chart-house-system-filter-v1.js?v=1', function () {
      load('sky-chart-house-system-filter-match-v1.js?v=1', function () {
        load('sky-chart-house-system-validation-v1.js?v=1', function () {
          load('sky-chart-house-system-atomic-guard-v1.js?v=1', function () {
            load('sky-chart-house-ring-persistence-v2.js?v=1');
          });
        });
      });
    });
  });
  load('sky-chart-planetary-hours-portal-v1.js?v=1');
  load('sky-chart-birth-flow-isolation-v1.js?v=1');
  load('sky-chart-workspace-edit-persistence-v1.js?v=1', function () {
    load('sky-chart-workspace-reconciliation-v1.js?v=1', function () {
      load('sky-chart-sky-b-card-guard-v1.js?v=1');
      load('sky-chart-workspace-mobile-order-v1.js?v=1');
      load('sky-chart-workspace-desktop-width-v1.js?v=3');
      load('sky-chart-inline-card-editor-v1.js?v=2');
      load('sky-chart-selected-relationship-layout-v1.js?v=4');
      load('sky-chart-skinny-cards-v1.js?v=4', function () {
        load('sky-chart-skinny-cluster-context-v1.js?v=1');
        load('sky-chart-skinny-heptagram-v1.js?v=1', function () {
          load('sky-chart-skinny-graphic-hierarchy-v2.js');
        });
        load('sky-chart-skinny-aspect-anchor-v1.js?v=1');
      });

      // Use the actual Sky Chart Next canonical-master module, then mount one stable live-data adapter and its focus graph.
      load('sky-chart-next-glyphs.js?v=5', function () {
        load('sky-chart-next-display-adapter-v1.js?v=2', function () {
          load('sky-chart-next-live-interactions-v1.js?v=1', function () {
            load('sky-chart-isolation-results-sync-v1.js');
          });
        });
      });
    });
  });
})();