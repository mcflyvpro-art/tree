/* Arbre des trois monothéismes — lecture enrichie des textes.
   Découpe un texte en morceaux : texte simple, références (Bible, Coran, sources juives),
   termes du lexique et mentions d'autres entrées de l'arbre. */
function makeRich(nodes){
  'use strict';
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const byId = new Map(nodes.map(n => [n.i, n]));
  const B = '(?![\\p{L}\\p{N}])';

  /* ---------- références ---------- */
  const CH = '\\d{1,3}(?:,\\d{1,3}(?:-\\d{1,3})?)?(?:[-–]\\d{1,3})?';
  const bookAlt = Object.keys(BIBLE).sort((a, b) => b.length - a.length).map(esc).join('|');
  const reBible = new RegExp(`(^|[^\\p{L}\\p{N}])((?:${bookAlt})\\s(?:${CH})(?:\\s;\\s${CH}${B})*)${B}`, 'gu');
  const reBibleFull = new RegExp(`(${Object.keys(BIBLE_FULL).join('|')})\\s\\((\\d{1,3}(?:,\\d{1,3}(?:-\\d{1,3})?|[-–]\\d{1,3}))\\)`, 'gu');
  const reCoran = /(Coran\s\d{1,3},\d{1,3}(?:-\d{1,3})?(?:\s;\s\d{1,3},\d{1,3}(?:-\d{1,3})?(?![\d,]))*)/gu;
  const reSura = /([Ss]ourates?\s\d{1,3})(?![\d,])/gu;
  const reBare = /(^|[(\s])(\d{1,3},\d{1,3}(?:-\d{1,3})?)(?![\d,]|\s(?:milliard|million))/gu;
  const reTrig = /Coran|[Ss]ourate|[Ii]slam\s:/gu;
  const reAnti = /Judaïsme\s:|Christianisme\s:|Josèphe|Antiquités|Talmud|Michna/gu;
  const otherAlt = Object.keys(OTHER_REFS).sort((a, b) => b.length - a.length).map(esc).join('|');
  const reOther = new RegExp(`(${otherAlt})`, 'gu');

  function parseChap(book, s){
    // « 4,17-18 », « 1–3 », « 24 »
    const m = s.match(/^(\d{1,3})(?:,(\d{1,3})(?:-(\d{1,3}))?)?(?:[-–](\d{1,3}))?$/);
    if (!m) return null;
    return {book, c:+m[1], v:m[2] ? +m[2] : null, v2:m[3] ? +m[3] : null, c2:m[4] ? +m[4] : null};
  }
  function bibleRef(text){
    const m = text.match(new RegExp(`^(${bookAlt})\\s(.*)$`, 'u'));
    const book = m[1];
    const parts = m[2].split(/\s;\s/).map(p => parseChap(book, p.trim())).filter(Boolean);
    return {kind:'bible', book, parts};
  }
  function coranRef(s){
    const parts = s.replace(/^Coran\s/, '').split(/\s;\s/).map(p => {
      const m = p.trim().match(/^(\d{1,3}),(\d{1,3})(?:-(\d{1,3}))?$/);
      return m ? {s:+m[1], v:+m[2], v2:m[3] ? +m[3] : null} : null;
    }).filter(p => p && p.s >= 1 && p.s <= 114);
    return parts.length ? {kind:'coran', parts} : null;
  }

  /* repère les références d'un texte : [{a, b, ref}] (positions de début et de fin) */
  function findRefs(text){
    const out = [];
    const free = (a, b) => !out.some(r => a < r.b && b > r.a);
    const add = (a, b, ref) => { if (ref && free(a, b)) out.push({a, b, ref}); };
    for (const m of text.matchAll(reOther)) add(m.index, m.index + m[1].length, {kind:'other', key:m[1]});
    for (const m of text.matchAll(reBible)){
      const a = m.index + m[1].length;
      add(a, a + m[2].length, bibleRef(m[2]));
    }
    for (const m of text.matchAll(reBibleFull)){
      const a = m.index + m[0].indexOf('(') + 1;
      const p = parseChap(BIBLE_FULL[m[1]], m[2]);
      add(a, a + m[2].length, p ? {kind:'bible', book:BIBLE_FULL[m[1]], parts:[p]} : null);
    }
    for (const m of text.matchAll(reCoran)) add(m.index, m.index + m[1].length, coranRef(m[1]));
    for (const m of text.matchAll(reSura)){
      const n = +m[1].match(/\d+/)[0];
      if (n >= 1 && n <= 114) add(m.index, m.index + m[1].length, {kind:'coran', parts:[{s:n, v:null, v2:null}]});
    }
    const trig = [...text.matchAll(reTrig)].map(m => m.index);
    const anti = [...text.matchAll(reAnti)].map(m => m.index).concat(out.filter(r => r.ref.kind === 'bible').map(r => r.a));
    for (const m of text.matchAll(reBare)){
      const a = m.index + m[1].length, b = a + m[2].length;
      const t = Math.max(-1, ...trig.filter(i => i < a)), x = Math.max(-1, ...anti.filter(i => i < a));
      if (t < 0 || x > t) continue;
      add(a, b, coranRef(m[2]));
    }
    return out.sort((p, q) => p.a - q.a);
  }

  /* ---------- termes et mentions ---------- */
  const KEY = new Map();   // forme -> {k:'g'|'m'|'x', id}
  // mentions automatiques à partir des noms d'entrées
  const cand = new Map();
  const addCand = (s, id) => { if (!cand.has(s)) cand.set(s, new Set()); cand.get(s).add(id); };
  for (const n of nodes){
    for (let part of n.n.split(/\s(?:·|&|⚭|→|:)\s/)){
      part = part.replace(/\s\([^)]*\)$/, '').trim();
      if (part.length < 3 || /[,«»…?]/.test(part)) continue;
      if (/^\p{Ll}/u.test(part) && !/isme$/.test(part) && !/^al-\p{Lu}/u.test(part)) continue;
      addCand(part, n.i);
    }
  }
  for (const [s, ids] of cand) if (ids.size === 1) KEY.set(s, {k:'m', id:[...ids][0]});
  for (const [s, id] of Object.entries(MENTION_ADD)){
    if (id === null) KEY.delete(s);
    else if (byId.has(id)) KEY.set(s, {k:'m', id});
  }
  // le lexique l'emporte sur les mentions
  for (const g of GLOSSARY){
    if (g.auto === false) continue;
    for (const f of g.m){
      KEY.set(f, {k:'g', id:g.id});
      if (!g.cs && /^\p{Ll}/u.test(f)) KEY.set(cap(f), {k:'g', id:g.id});
    }
  }
  for (const map of Object.values(MENTION_NODE_MAP)) for (const s of Object.keys(map)) if (!KEY.has(s)) KEY.set(s, {k:'m', id:null});
  for (const s of GUARDS) KEY.set(s, {k:'x'});
  const alt = [...KEY.keys()].sort((a, b) => b.length - a.length).map(esc).join('|');
  const reKey = new RegExp(`(^|[^\\p{L}\\p{N}])(${alt})${B}`, 'gu');
  const reBefore = /(?:^|[^\p{L}])(?:ibn|bint|ben|bar|Ibn|Abū|Abī|Umm|Ben)\s$/u;
  const reAfter = /^\s(?:ibn|bint|ben|bar|ha-|Ier|Ire|II|III|IV|VI|1er)(?![\p{L}])/u;
  const reAfterName = /^\s\p{Lu}\p{Ll}/u;

  /* ---------- découpage ----------
     opt : {self:id, seen:{g:Set, m:Set}, terms:bool, mentions:bool, refs:bool} */
  function segments(text, opt){
    opt = opt || {};
    const seen = opt.seen || {g:new Set(), m:new Set()};
    const local = MENTION_NODE_MAP[opt.self] || {};
    const out = [];
    const pushText = s => { if (!s) return; const l = out[out.length - 1]; if (l && l.k === 't') l.s += s; else out.push({k:'t', s}); };
    const refs = opt.refs === false ? [] : findRefs(text);
    let pos = 0;
    const scan = (a, b) => {
      if (opt.terms === false && opt.mentions === false){ pushText(text.slice(a, b)); return; }
      const chunk = text.slice(a, b);
      let p = 0;
      for (const m of chunk.matchAll(reKey)){
        const s = m[2], i = m.index + m[1].length, e = i + s.length;
        const info = KEY.get(s);
        let tok = null;
        if (info.k === 'g' && opt.terms !== false && !seen.g.has(info.id)){
          tok = {k:'g', s, id:info.id}; seen.g.add(info.id);
        } else if (info.k === 'm' && opt.mentions !== false){
          const id = s in local ? local[s] : info.id;
          if (!id || id === opt.self || seen.m.has(id)) continue;
          const before = text.slice(Math.max(0, a + i - 6), a + i), after = text.slice(a + e, a + e + 6);
          const oneWord = !/\s/.test(s);
          if (!reBefore.test(before) && !reAfter.test(after) && !(oneWord && reAfterName.test(after))){
            tok = {k:'m', s, id}; seen.m.add(id);
          }
        }
        if (tok){ pushText(chunk.slice(p, i)); out.push(tok); p = e; }
      }
      pushText(chunk.slice(p));
    };
    for (const r of refs){
      scan(pos, r.a);
      out.push({k:'r', s:text.slice(r.a, r.b), ref:r.ref});
      pos = r.b;
    }
    scan(pos, text.length);
    return out;
  }

  /* ---------- explication d'une référence ---------- */
  function explain(ref){
    if (ref.kind === 'bible'){
      const [fr, en, test] = BIBLE[ref.book];
      const lines = ref.parts.map(p => {
        let s;
        if (p.c2) s = `chapitres ${p.c} à ${p.c2}`;
        else if (p.v == null) s = `chapitre ${p.c}`;
        else if (p.v2) s = `chapitre ${p.c}, versets ${p.v} à ${p.v2}`;
        else s = `chapitre ${p.c}, verset ${p.v}`;
        let ch = p.c, chEnd = p.c2;
        if (ref.book === 'Ml' && p.c === 3 && p.v >= 19){ ch = 4; chEnd = null; }
        const q = en + ' ' + ch + (chEnd ? '-' + chEnd : '');
        return {label:s, url:'https://www.biblegateway.com/passage/?search=' + encodeURIComponent(q) + '&version=LSG'};
      });
      return {title:fr, sub:test === 'AT' ? 'Bible hébraïque · Ancien Testament' : 'Nouveau Testament', lines, src:'Bible (Louis Segond)'};
    }
    if (ref.kind === 'coran'){
      const lines = ref.parts.map(p => {
        let s = `sourate ${p.s} « ${SURAS[p.s]} »`;
        if (p.v != null) s += p.v2 ? `, versets ${p.v} à ${p.v2}` : `, verset ${p.v}`;
        const url = 'https://quran.com/' + p.s + (p.v != null ? '/' + p.v + (p.v2 ? '-' + p.v2 : '') : '');
        return {label:s, url};
      });
      return {title:'Coran', sub:'Sourate (chapitre), puis verset', lines, src:'Coran (quran.com)'};
    }
    const [title, desc, url] = OTHER_REFS[ref.key];
    return {title, sub:ref.key, lines:[{label:desc, url}], src:url ? 'Sefaria' : null};
  }

  return {segments, explain, findRefs, keys:KEY};
}
if (typeof module !== 'undefined') module.exports = {makeRich};
