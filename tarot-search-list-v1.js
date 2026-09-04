// Preserve multiword card names inside comma/semicolon Tarot search lists.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname)) return;
  if (window.__relphiTarotSearchListV1) return;
  window.__relphiTarotSearchListV1 = true;

  const RANK_NUMBER = Object.freeze({
    Ace:'A', Two:'2', Three:'3', Four:'4', Five:'5', Six:'6', Seven:'7', Eight:'8', Nine:'9', Ten:'10'
  });
  const COURT_CODE = Object.freeze({ Page:'C1', Princess:'C1', Knight:'C2', Prince:'C2', Queen:'C3', King:'C4' });
  const SUIT_CODE = Object.freeze({ Wands:'W', Cups:'C', Swords:'S', Pentacles:'P', Disks:'P' });

  function cards() {
    return Array.isArray(window.RELPHI_TAROT_CARDS) ? window.RELPHI_TAROT_CARDS : [];
  }

  function normalize(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/\bdisks?\b/g, 'pentacles')
      .replace(/^the\s+/, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function aliases(card) {
    const values = [
      card?.name,
      card?.card_id ? String(card.card_id).replace(/_/g, ' ') : '',
      card?.systems?.golden_dawn_rws?.display_name,
      card?.systems?.thoth?.display_name
    ];
    return new Set(values.map(normalize).filter(Boolean));
  }

  function suitCode(card) {
    return SUIT_CODE[card?.suit] || SUIT_CODE[card?.thoth_suit] || '';
  }

  function coreToken(card, original) {
    if (!card) return '';
    const suit = suitCode(card);
    const rank = String(card.rank || '').trim();
    if (suit && RANK_NUMBER[rank]) return RANK_NUMBER[rank] + suit;
    if (suit && COURT_CODE[rank]) return COURT_CODE[rank] + suit;

    // Majors need a one-token alias because the legacy ordered parser splits on spaces.
    const candidates = [
      original,
      card.name,
      card.systems?.golden_dawn_rws?.display_name,
      card.systems?.thoth?.display_name
    ].map(value => String(value || '').trim().replace(/^the\s+/i, '')).filter(Boolean);
    return candidates.find(value => !/\s/.test(value)) || '';
  }

  function resolveShorthand(raw) {
    const q = String(raw || '').trim().toUpperCase().replace(/\s+/g, '');
    const suitMap = { W:'Wands', C:'Cups', S:'Swords', D:'Pentacles', P:'Pentacles' };
    const rankMap = { A:'Ace', '2':'Two', '3':'Three', '4':'Four', '5':'Five', '6':'Six', '7':'Seven', '8':'Eight', '9':'Nine', '10':'Ten' };
    let match = q.match(/^(10|[2-9]|A)([WCSDP])$/) || q.match(/^([WCSDP])(10|[2-9]|A)$/);
    if (match) {
      const rankPart = /^(10|[2-9]|A)$/.test(match[1]) ? match[1] : match[2];
      const suitPart = /[WCSDP]/.test(match[1]) && !/^(10|[2-9]|A)$/.test(match[1]) ? match[1] : match[2];
      const rank = rankMap[rankPart];
      const suit = suitMap[suitPart];
      return cards().find(card => card.rank === rank && card.suit === suit) || null;
    }
    match = q.match(/^(C[1-4])([WCSDP])$/) || q.match(/^([WCSDP])(C[1-4])$/);
    if (match) {
      const court = /^C[1-4]$/.test(match[1]) ? match[1] : match[2];
      const suitPart = /^[WCSDP]$/.test(match[1]) ? match[1] : match[2];
      const suit = suitMap[suitPart];
      return cards().find(card => COURT_CODE[card.rank] === court && card.suit === suit) || null;
    }
    match = q.match(/^([QK])([WCSDP])$/);
    if (match) {
      const rank = match[1] === 'Q' ? 'Queen' : 'King';
      const suit = suitMap[match[2]];
      return cards().find(card => card.rank === rank && card.suit === suit) || null;
    }
    return null;
  }

  function resolvePhrase(raw) {
    const shorthand = resolveShorthand(raw);
    if (shorthand) return shorthand;
    const wanted = normalize(raw);
    if (!wanted) return null;
    return cards().find(card => aliases(card).has(wanted)) || null;
  }

  function normalizedOrderedQuery(raw) {
    const text = String(raw || '').trim();
    if (!/[,;]/.test(text)) return '';
    const phrases = text.split(/[,;]+/).map(value => value.trim()).filter(Boolean);
    if (phrases.length < 2) return '';
    const resolved = phrases.map(resolvePhrase);
    if (resolved.some(card => !card)) return '';
    const tokens = resolved.map((card, index) => coreToken(card, phrases[index]));
    if (tokens.some(token => !token)) return '';
    return tokens.join(' ');
  }

  function prepareSearch() {
    const input = document.getElementById('oracleCommand');
    if (!input) return;
    const original = input.value;
    const normalized = normalizedOrderedQuery(original);
    if (!normalized || normalized === original) return;
    input.value = normalized;
    window.setTimeout(() => {
      if (input.isConnected && input.value === normalized) input.value = original;
    }, 0);
  }

  document.addEventListener('click', event => {
    if (event.target?.closest?.('#runCommand')) prepareSearch();
  }, true);
  document.addEventListener('keydown', event => {
    if (event.key === 'Enter' && event.target?.matches?.('#oracleCommand')) prepareSearch();
  }, true);

  window.RelphiTarotSearchList = Object.freeze({ normalizedOrderedQuery });
})();