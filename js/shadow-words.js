/* Word-by-word shadowing decisions for speaking practice.
   The assistant says one sentence word, then the learner repeats it. */
(function (root) {
  'use strict';

  const WORD_RE = /[A-Za-z]+(?:['’][A-Za-z]+)*(?:-[A-Za-z]+)*/g;
  const MISS_LIMIT = 3;

  function normalize(value) {
    // Drop apostrophes instead of splitting on them, so "don't" and "dont" both count.
    return String(value || '').normalize('NFKC').toLowerCase().replace(/[’‘']/g, '').replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function tokens(sentence) {
    const source = String(sentence || '');
    const list = [];
    for (const match of source.matchAll(WORD_RE)) list.push({ text: match[0], index: match.index });
    return list;
  }

  function words(sentence) {
    return tokens(sentence).map(part => part.text);
  }

  function matches(expected, heard) {
    const want = normalize(expected);
    const got = normalize(heard);
    return Boolean(want) && want === got;
  }

  // One recognition result for the word at `index`. A match moves forward.
  // A miss replays the same word until MISS_LIMIT, then the turn stops.
  function afterAttempt(attempt) {
    const index = attempt && Number.isInteger(attempt.index) && attempt.index >= 0 ? attempt.index : 0;
    const total = attempt && Number.isInteger(attempt.total) && attempt.total > 0 ? attempt.total : 0;
    const misses = attempt && Number.isInteger(attempt.misses) && attempt.misses > 0 ? attempt.misses : 0;
    const expected = attempt && typeof attempt.expected === 'string' ? attempt.expected : '';
    const alternatives = attempt && Array.isArray(attempt.alternatives) ? attempt.alternatives.filter(text => typeof text === 'string' && text.trim()) : [];
    const matched = alternatives.find(text => matches(expected, text)) || '';
    if (matched) {
      const next = index + 1;
      return { ok: true, matched, heard: matched, index: next, misses: 0, replay: false, stop: false, done: next >= total };
    }
    const nextMisses = misses + 1;
    const stop = nextMisses >= MISS_LIMIT;
    return { ok: false, matched: '', heard: alternatives[0] || '', index, misses: nextMisses, replay: !stop, stop, done: false };
  }

  root.ReadFoxShadow = Object.freeze({ words, tokens, matches, normalize, afterAttempt, MISS_LIMIT });
})(typeof globalThis !== 'undefined' ? globalThis : this);
