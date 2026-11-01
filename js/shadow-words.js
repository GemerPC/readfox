/* Phrase chunks for shadowing. Fox reads a short group, then pauses.
   The learner repeats along; nothing here listens or scores speech. */
(function (root) {
  'use strict';

  const WORD_RE = /[A-Za-z]+(?:['’][A-Za-z]+)*(?:-[A-Za-z]+)*/g;
  const ARTICLES = new Set(['a', 'an', 'the']);

  function tokens(sentence) {
    const source = String(sentence || '');
    const list = [];
    for (const match of source.matchAll(WORD_RE)) list.push({ text: match[0], index: match.index });
    return list;
  }

  function words(sentence) {
    return tokens(sentence).map(part => part.text);
  }

  function stem(text) {
    return String(text || '').toLowerCase().replace(/[^a-z']/g, '').replace(/'/g, '');
  }

  function units(sentence) {
    const source = String(sentence || '');
    const parts = tokens(source);
    return parts.map((part, index) => {
      const next = index + 1 < parts.length ? parts[index + 1].index : source.length;
      const gap = source.slice(part.index + part.text.length, next);
      const text = source.slice(part.index, next).replace(/\s+/g, ' ').trim();
      const hard = /[.!?…]|;|:/.test(gap);
      const soft = /[,—–]/.test(gap);
      return { text, break: hard ? 'hard' : soft ? 'soft' : '', index };
    });
  }

  function chunkUnits(units) {
    const out = [];
    let i = 0;
    while (i < units.length) {
      let size = Math.min(3, units.length - i);
      const rest = units.length - i - size;
      if (rest === 1 && size < 4) size += 1;
      while (
        size > 2
        && i + size < units.length
        && ARTICLES.has(stem(units[i + size - 1].text))
        && units.length - (i + size - 1) <= 4
      ) size -= 1;
      out.push(units.slice(i, i + size));
      i += size;
    }
    return out;
  }

  function rebalance(groups) {
    const out = groups.map(group => group.slice());
    for (let i = 1; i < out.length; i++) {
      if (out[i].length !== 1) continue;
      const prev = out[i - 1];
      if (prev.length <= 3 && prev.length + 1 <= 4) {
        out[i - 1] = prev.concat(out[i]);
        out.splice(i, 1);
        i -= 1;
      } else if (prev.length > 1) {
        const moved = prev.pop();
        out[i] = [moved].concat(out[i]);
      }
    }
    return out;
  }

  function phrases(sentence) {
    const list = units(sentence);
    if (!list.length) return [];
    const clauses = [];
    let clause = [];
    list.forEach(unit => {
      clause.push(unit);
      if (unit.break === 'hard') { clauses.push(clause); clause = []; }
    });
    if (clause.length) clauses.push(clause);
    const grouped = [];
    clauses.forEach(clauseUnits => {
      const segments = [];
      let segment = [];
      clauseUnits.forEach(unit => {
        segment.push(unit);
        if (unit.break === 'soft') { segments.push(segment); segment = []; }
      });
      if (segment.length) segments.push(segment);
      const merged = [];
      segments.forEach(segment => {
        const prev = merged[merged.length - 1];
        if (prev && (segment.length === 1 || prev.length === 1) && prev.length + segment.length <= 4) {
          merged[merged.length - 1] = prev.concat(segment);
        } else merged.push(segment);
      });
      const chunks = [];
      merged.forEach(segment => chunks.push(...chunkUnits(segment)));
      rebalance(chunks).forEach(group => grouped.push(group));
    });
    return grouped.filter(group => group.length).map(group => ({
      text: group.map(unit => unit.text).join(' '),
      start: group[0].index,
      end: group[group.length - 1].index + 1
    }));
  }

  // Long enough to say the phrase back, and longer when the phrase is longer.
  function pauseMs(phrase) {
    const text = phrase && typeof phrase === 'object' ? phrase.text : phrase;
    const count = Math.max(1, words(text).length);
    return Math.min(3400, Math.max(1400, 800 + count * 500));
  }

  root.ReadFoxShadow = Object.freeze({ words, tokens, phrases, pauseMs });
})(typeof globalThis !== 'undefined' ? globalThis : this);
