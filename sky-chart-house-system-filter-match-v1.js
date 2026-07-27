// Makes House System use the exact native subsection and option-row structure from Houses.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const SYSTEMS = [
    ['whole-sign','Whole Sign'],
    ['equal-house','Equal House'],
    ['porphyry','Porphyry'],
    ['placidus','Placidus'],
    ['alcabitius','Alcabitius'],
    ['regiomontanus','Regiomontanus'],
    ['campanus','Campanus'],
    ['koch','Koch']
  ];
  let queued = false;

  function text(node) {
    return String(node?.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function housesContainer() {
    return Array.from(document.querySelectorAll('details,fieldset,.filter-group,.sky-filter-group,.chart-filter-group,.sky-filter-category')).find(function (node) {
      const heading = node.querySelector(':scope > summary,:scope > legend,:scope > button,:scope > .filter-heading,:scope > .sky-filter-heading');
      return text(heading).startsWith('houses');
    }) || null;
  }

  function heading(container, label) {
    return Array.from(container.querySelectorAll('legend,h3,h4,h5,h6,strong,.filter-subheading,.sky-filter-subheading,.filter-section-title,.sky-filter-section-title')).find(function (node) {
      return text(node) === label;
    }) || null;
  }

  function sectionFor(node, container) {
    if (!node) return null;
    const section = node.closest('fieldset,.filter-subsection,.sky-filter-subsection,.filter-section,.sky-filter-section,section');
    return section && section !== container ? section : node.parentElement;
  }

  function houseReference(container) {
    return Array.from(container.querySelectorAll('label')).find(function (label) {
      const input = label.querySelector('input[type="checkbox"],input[type="radio"]');
      return input && /^house\s*1$/i.test(String(label.textContent || '').trim());
    }) || null;
  }

  function selectedValue(fieldset) {
    return fieldset.querySelector('input[type="radio"]:checked')?.value || localStorage.getItem('relphiSkyChartHouseSystemViewV1') || 'whole-sign';
  }

  function cloneOption(reference, value, labelText, selected) {
    const row = reference.cloneNode(false);
    row.removeAttribute('for');
    row.removeAttribute('id');

    const sourceInput = reference.querySelector('input[type="checkbox"],input[type="radio"]');
    const input = sourceInput.cloneNode(false);
    input.type = 'radio';
    input.name = 'relphi-house-system';
    input.value = value;
    input.checked = value === selected;
    input.removeAttribute('id');
    input.removeAttribute('data-filter-group');
    input.removeAttribute('data-filter-set');
    input.removeAttribute('data-house');

    row.replaceChildren(input, document.createTextNode(labelText));
    return row;
  }

  function rebuild() {
    queued = false;
    const fieldset = document.getElementById('relphiHouseSystemFilter');
    const container = housesContainer();
    if (!fieldset || !container) return;

    const setsHeading = heading(container, 'sets');
    const housesHeading = heading(container, 'houses');
    const setsSection = sectionFor(setsHeading, container);
    const housesSection = sectionFor(housesHeading, container);
    const reference = houseReference(container);
    if (!setsHeading || !setsSection || !housesHeading || !housesSection || !reference) return;

    if (fieldset.dataset.nativeStructure !== 'true') {
      const selected = selectedValue(fieldset);
      const nativeHeading = housesHeading.cloneNode(false);
      nativeHeading.textContent = 'House System';
      nativeHeading.removeAttribute('id');

      const sourceList = reference.parentElement;
      const nativeList = sourceList.cloneNode(false);
      nativeList.removeAttribute('id');
      SYSTEMS.forEach(function (system) {
        nativeList.appendChild(cloneOption(reference, system[0], system[1], selected));
      });

      const status = document.createElement('p');
      status.className = 'relphi-house-system-status';
      status.setAttribute('aria-live', 'polite');

      fieldset.className = (housesSection.className || '') + ' relphi-house-system-filter';
      fieldset.replaceChildren(nativeHeading, nativeList, status);
      fieldset.dataset.nativeStructure = 'true';
      fieldset.style.cssText = 'min-width:0;border:0;margin:0;padding:0;';
    }

    if (fieldset.nextElementSibling !== setsSection) {
      setsSection.parentNode.insertBefore(fieldset, setsSection);
    }
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(rebuild);
  }

  function start() {
    rebuild();
    new MutationObserver(queue).observe(document.body, { childList:true, subtree:true });
    window.addEventListener('relphi:sky-builder-v4-loaded', queue);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();