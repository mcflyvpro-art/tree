/* Arbre des trois monothéismes — application */
(function(){
'use strict';

/* ---------- constantes ---------- */
const COL = 284, ROW = 50, R = 8, KMIN = 0.03, KMAX = 2.4;
const T_LABEL = {c:'Tronc commun', j:'Judaïsme et Israël', x:'Christianisme', m:'Islam et Arabes', o:'Autres peuples', n:'Religions issues'};
const T_SHORT = {c:'Tronc commun', j:'Judaïsme', x:'Christianisme', m:'Islam', o:'Autres peuples', n:'Religions issues'};
const T_ORDER = ['c','j','x','m','o','n'];
const H_LABEL = {A:'Attesté', H:'Historique', D:'Débattu', T:'Tradition seule'};
const H_LONG = {
  A:'Attesté par l’archéologie ou une source extérieure',
  H:'Existence admise par les historiens',
  D:'Historicité débattue',
  T:'Connu par la tradition seule'
};
const H_ORDER = ['A','H','D','T'];
const K_LABEL = {p:'Personne', m:'Courant, groupe ou institution', e:'Événement'};
const K_SHORT = {p:'Personne', m:'Courant · groupe', e:'Événement'};
const L_LABEL = {
  f:'filiation',
  g:'filiation, générations omises',
  s:'transmission : maître, succession ou héritage',
  r:'rupture ou schisme',
  a:'filiation légale par Joseph ; naissance virginale selon les évangiles et le Coran'
};
const T_OVERRIDE = {idumeens:'j'};
const EV_CAT = {
  isr:['Israël et Juda anciens','j'], jud:['Judaïsme du Second Temple','j'], chr:['Christianisme','x'],
  arb:['Arabie préislamique','m'], isl:['Islam','m'], neg:['Silences et faux','neg']
};
const CF_CAT = {
  A:['Face aux empires',['o']], J:['Entre juifs',['j']], X:['Entre chrétiens',['x']], M:['Entre musulmans',['m']],
  JX:['Juifs et chrétiens',['j','x']], JM:['Juifs et musulmans',['j','m']], XM:['Chrétiens et musulmans',['x','m']],
  D:['Dialogues',['c']]
};
const QUICK = ['adam','noe','abraham','ismael','isaac','jacob','moise','david','hillel','talmudb','jesus','paul','nicee',
  'schisme1054','reforme1517','mahomet','ali','husayn','rashidun','fatimides','israel1948'];
const mq = q => (window.matchMedia ? window.matchMedia(q) : {matches:false, addEventListener(){}});
const reduceMotion = mq('(prefers-reduced-motion: reduce)').matches;
const narrow = () => mq('(max-width: 860px)').matches;
const sideSheet = () => mq('(max-width: 860px) and (orientation: landscape) and (min-width: 560px)').matches;
const finePointer = () => mq('(hover: hover) and (pointer: fine)').matches;

/* ---------- utilitaires ---------- */
function el(tag, attrs, ...kids){
  const e = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)){
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(Infinity)){
    if (c == null || c === false || c === '') continue;
    e.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return e;
}
const SVGNS = 'http://www.w3.org/2000/svg';
function ico(name, cls){
  const s = document.createElementNS(SVGNS, 'svg');
  s.setAttribute('aria-hidden', 'true');
  if (cls) s.setAttribute('class', cls);
  const u = document.createElementNS(SVGNS, 'use');
  u.setAttribute('href', '#i-' + name);
  s.append(u);
  return s;
}
function markEl(t, h, k, small){
  return el('span', {class:`mw t-${t} h-${h} k-${k || 'p'}${small ? ' sm' : ''}`, 'aria-hidden':'true'}, el('span', {class:'mk'}));
}
const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[ʿʾ'’`ʼ]/g, '').toLowerCase();
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function push(map, key, val){ if (!map.has(key)) map.set(key, []); map.get(key).push(val); }
const rand = a => a[Math.floor(Math.random() * a.length)];
function shuffle(a){ a = a.slice(); for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const sample = (a, n) => shuffle(a).slice(0, n);
const firstSentence = s => { const m = s.match(/^.+?[.!?](?=\s|$)/); return m ? m[0] : s; };
const plural = (n, one, many) => n + ' ' + (n > 1 ? many : one);

/* ---------- mémoire locale ---------- */
const KEY = 'arbre3m.v1';
const store = (() => {
  let s = {};
  try { s = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch(_e){ s = {}; }
  s.seen = Array.isArray(s.seen) ? s.seen : [];
  s.tours = s.tours && typeof s.tours === 'object' ? s.tours : {};
  return s;
})();
let saveT = 0;
function save(){
  clearTimeout(saveT);
  saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch(_e){} }, 250);
}

/* ---------- données ---------- */
const fr = v => typeof v === 'string' ? v.replace(/« /g, '« ').replace(/ »/g, ' »').replace(/ ([;:?!])/g, ' $1') : v;
NODES.forEach(d => ['n','a','d','x','e','f'].forEach(f => { if (d[f]) d[f] = fr(d[f]); }));
EVID.forEach(e => ['n','w','a','lim','d'].forEach(f => { if (e[f]) e[f] = fr(e[f]); }));
CONF.forEach(c => ['n','x','d'].forEach(f => { if (c[f]) c[f] = fr(c[f]); }));
XLINKS.forEach(l => { l[3] = fr(l[3]); });
GLOSSARY.forEach(g => { g.t = fr(g.t); g.d = fr(g.d); });
TOURS.forEach(t => t.steps.forEach(s => { s[1] = fr(s[1]); }));

const byId = new Map();
NODES.forEach((d, ix) => { const n = Object.assign({}, d, {ix, children:[], collapsed:false, lw:0, vis:false, txt:d.x}); delete n.x; byId.set(d.i, n); });
let root = null;
byId.forEach(n => { if (n.p){ n.parent = byId.get(n.p); n.parent.children.push(n); } else root = n; });
(function inherit(n){
  n.T = T_OVERRIDE[n.i] || n.t || (n.parent ? n.parent.T : 'c');
  n.H = n.h || (n.parent ? n.parent.H : 'T');
  n.K = n.k || 'p';
  n.L = n.l || 'f';
  n.children.forEach(inherit);
})(root);
(function count(n){ n.desc = n.children.reduce((s, c) => s + 1 + count(c), 0); return n.desc; })(root);
const ALL = [...byId.values()];
ALL.forEach(n => {
  n.nkey = norm(n.n); n.key = norm(n.n + ' ' + (n.a || ''));
  n.tkey = norm([n.txt, n.e, n.f, n.d].filter(Boolean).join(' '));
});
const XL = new Map();
XLINKS.forEach(([a, b, t, lab]) => { push(XL, a, {o:byId.get(b), t, lab}); push(XL, b, {o:byId.get(a), t, lab}); });
const EV_BY = new Map(); EVID.forEach(e => push(EV_BY, e.id, e));
const CF_BY = new Map(); CONF.forEach(c => c.ids.forEach(id => push(CF_BY, id, c)));
const GL = new Map(GLOSSARY.map(g => [g.id, g]));
const TOUR = new Map(TOURS.map(t => [t.id, t]));
const seen = new Set(store.seen.filter(id => byId.has(id)));

/* ---------- textes enrichis ---------- */
const RICH = makeRich(NODES);
function rich(text, opt){
  const f = document.createDocumentFragment();
  for (const s of RICH.segments(text, opt)){
    if (s.k === 't') f.append(s.s);
    else if (s.k === 'r') f.append(el('button', {type:'button', class:'ref', 'data-ref':JSON.stringify(s.ref), title:'Que signifie cette référence ?'}, s.s));
    else if (s.k === 'g') f.append(el('button', {type:'button', class:'term', 'data-g':s.id, title:'Définition'}, s.s));
    else if (s.k === 'm'){
      const n = byId.get(s.id);
      f.append(el('button', {type:'button', class:`men t-${n.T}`, 'data-id':n.i, title:'Voir la fiche : ' + n.n + (n.d ? ' · ' + n.d : '')}, s.s));
    }
  }
  return f;
}

/* ---------- éléments ---------- */
const $ = id => document.getElementById(id);
const vp = $('vp'), world = $('world'), svg = $('links'), layer = $('nodes'), panel = $('panel'), pbody = $('pbody');
const mini = $('mini'), mctx = mini.getContext ? mini.getContext('2d') : null;
const viewTree = $('view-tree'), hcard = $('hcard'), pop = $('pop'), modal = $('modal'), modalIn = $('modal-in'), toastEl = $('toast');

ALL.forEach(n => {
  const b = el('button', {type:'button', class:`node t-${n.T} h-${n.H} k-${n.K}${seen.has(n.i) ? ' seen' : ''}`, 'data-id':n.i,
    'aria-label':n.n + (n.d ? ', ' + n.d : '') + (seen.has(n.i) ? ' (déjà lu)' : '')},
    el('span', {class:'mk', 'aria-hidden':'true'}),
    el('span', {class:'lb'}, el('span', {class:'nm'}, n.n), n.d ? el('span', {class:'dt'}, n.d) : null));
  b.hidden = true;
  n.el = b; layer.append(b);
  if (n.children.length){
    const t = el('button', {type:'button', class:`tog t-${n.T}`, 'data-id':n.i});
    t.hidden = true;
    n.tog = t; layer.append(t);
  }
});

/* ---------- disposition ---------- */
let visible = [], bounds = {w:1000, h:1000};
function layout(){
  visible = []; let row = 0, maxD = 0;
  (function walk(n, depth){
    visible.push(n);
    n.depth = depth; n.x = depth * COL; if (depth > maxD) maxD = depth;
    if (n.collapsed || !n.children.length){ n.y = row * ROW; row++; }
    else {
      n.children.forEach(c => walk(c, depth + 1));
      n.y = (n.children[0].y + n.children[n.children.length - 1].y) / 2;
    }
  })(root, 0);
  bounds = {w:maxD * COL + COL + 60, h:Math.max(ROW, row * ROW)};
}
let firstRender = true;
function render(){
  const vset = new Set(visible);
  for (const n of ALL){
    const on = vset.has(n);
    if (on !== n.vis){
      n.vis = on; n.el.hidden = !on; if (n.tog) n.tog.hidden = !on;
      if (on && !firstRender && !reduceMotion){
        n.el.classList.add('enter'); if (n.tog) n.tog.classList.add('enter');
        setTimeout(() => { n.el.classList.remove('enter'); if (n.tog) n.tog.classList.remove('enter'); }, 400);
      }
    }
  }
  firstRender = false;
  for (const n of visible) n.el.style.transform = `translate(${n.x - R}px,${n.y - R}px)`;
  const need = visible.filter(n => !n.lw || n.lwEst);
  const widths = need.map(n => n.el.offsetWidth);
  need.forEach((n, i) => {
    if (widths[i]){ n.lw = widths[i]; n.lwEst = false; }
    else { n.lw = Math.min(229, 23 + n.n.length * 7.2); n.lwEst = true; }
  });
  for (const n of visible){
    if (!n.tog) continue;
    const closed = n.collapsed;
    n.tog.textContent = closed ? '+' + n.desc : '−';
    n.tog.classList.toggle('closed', closed);
    n.tog.setAttribute('aria-expanded', String(!closed));
    n.tog.setAttribute('aria-label', (closed ? 'Déplier' : 'Replier') + ' la branche de ' + n.n + ' (' + plural(n.desc, 'entrée', 'entrées') + ')');
    n.tog.title = closed ? 'Déplier : ' + plural(n.desc, 'entrée cachée', 'entrées cachées') : 'Replier cette branche';
    n.tog.style.transform = `translate(${n.x - R + n.lw + 6}px,${n.y - 10}px)`;
  }
  world.style.width = bounds.w + 'px'; world.style.height = bounds.h + 'px';
  svg.setAttribute('width', bounds.w); svg.setAttribute('height', bounds.h + ROW);
  drawLinks(); sizeMini(); drawMini();
}
function relayout(){ layout(); render(); }

/* ---------- traits ---------- */
let sel = null, showAllX = false, xtNodes = [];
const offT = new Set(), offH = new Set();
const labelEnd = n => n.x - R + n.lw + (n.tog ? (n.collapsed ? 26 + 7 * String(n.desc).length : 31) : 6);
const escX = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
function xgeom(a, b){
  const x1 = labelEnd(a), y1 = a.y, x2 = labelEnd(b), y2 = b.y;
  const bow = Math.min(1600, 70 + Math.abs(y2 - y1) * 0.2 + Math.abs(x2 - x1) * 0.06);
  const cx = Math.max(x1, x2) + bow, cy = (y1 + y2) / 2;
  return {d:`M${x1} ${y1}Q${cx} ${cy} ${x2} ${y2}`, ax:0.25 * x1 + 0.5 * cx + 0.25 * x2, ay:cy};
}
function drawLinks(){
  const path = new Set();
  if (sel && sel.vis) for (let a = sel; a; a = a.parent) path.add(a);
  let s = '';
  for (const c of visible){
    const p = c.parent; if (!p) continue;
    const sx = p.x - R + p.lw + 6 + 20 + 3, sy = p.y, ex = c.x - R - 4, ey = c.y;
    const mx = sx + Math.max(12, (ex - sx) / 2);
    const d = `M${sx} ${sy}C${mx} ${sy} ${mx} ${ey} ${ex} ${ey}`;
    s += `<path class="ln t-${c.T} l-${c.L}${path.has(c) ? ' on' : ''}${c.dim ? ' dim' : ''}" d="${d}"/>`;
    if (c.L === 'a') s += `<path class="lna" d="${d}"/>`;
    if (c.L === 'r'){
      const qx = (sx + 6 * mx + ex) / 8, qy = (sy + ey) / 2;
      s += `<path class="brk${c.dim ? ' dim' : ''}" d="M${qx - 6} ${qy + 6}L${qx - 1} ${qy - 6}M${qx + 1} ${qy + 6}L${qx + 6} ${qy - 6}"/>`;
    }
  }
  const pairs = [];
  if (showAllX) XLINKS.forEach(([a, b, t]) => { const A = byId.get(a), B = byId.get(b); if (A.vis && B.vis) pairs.push([A, B, t, false, '']); });
  if (sel && sel.vis) (XL.get(sel.i) || []).forEach(o => { if (o.o.vis) pairs.push([sel, o.o, o.t, true, o.lab]); });
  let labels = '';
  for (const [A, B, t, hot, lab] of pairs){
    const g = xgeom(A, B);
    s += `<path class="xln x-${t}${hot ? ' hot' : ''}" d="${g.d}"/>`;
    if (hot){
      s += `<circle class="xe x-${t}" cx="${labelEnd(B)}" cy="${B.y}" r="4.5"/>`;
      labels += `<text class="xlab x-${t}" x="${g.ax + 8}" y="${g.ay + 4}">${escX(lab)}</text>`;
    }
  }
  svg.innerHTML = s + labels;
}
function applyDim(){
  for (const n of ALL){
    n.dim = offT.has(n.T) || offH.has(n.H);
    n.el.classList.toggle('dim', n.dim);
    if (n.tog) n.tog.classList.toggle('dim', n.dim);
  }
  drawLinks(); drawMini();
}

/* ---------- zoom et déplacement ---------- */
let k = 0.8, tx = 0, ty = 0, vpR = {width:800, height:600, left:0, top:0}, anim = 0;
function readVp(){ const r = vp.getBoundingClientRect(); vpR = {width:r.width || 800, height:r.height || 600, left:r.left, top:r.top}; }
function apply(){
  world.style.transform = `translate(${tx}px,${ty}px) scale(${k})`;
  let g = 26 * k; while (g < 13) g *= 3;
  vp.style.backgroundSize = `${g}px ${g}px`;
  vp.style.backgroundPosition = `${tx}px ${ty}px`;
  drawMini(); hideHover();
}
function zoomAt(f, px, py){
  const nk = clamp(k * f, KMIN, KMAX), r = nk / k;
  tx = px - (px - tx) * r; ty = py - (py - ty) * r; k = nk; apply();
}
function animateTo(nk, ntx, nty, instant){
  cancelAnimationFrame(anim);
  if (instant || reduceMotion){ k = nk; tx = ntx; ty = nty; apply(); return; }
  const k0 = k, x0 = tx, y0 = ty, t0 = performance.now(), D = 520;
  const step = now => {
    const u = clamp((now - t0) / D, 0, 1), e = u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
    k = k0 + (nk - k0) * e; tx = x0 + (ntx - x0) * e; ty = y0 + (nty - y0) * e; apply();
    if (u < 1) anim = requestAnimationFrame(step);
  };
  anim = requestAnimationFrame(step);
}
function centerOn(n, kk, instant){
  readVp();
  const nk = clamp(kk || k, KMIN, KMAX);
  const small = narrow(), side = sideSheet();
  const fx = side ? 0.06 : small ? 0.08 : 0.3, fy = small && !side ? (panel.classList.contains('open') ? 0.17 : 0.4) : 0.45;
  animateTo(nk, vpR.width * fx - n.x * nk, vpR.height * fy - n.y * nk, instant);
}
function fitAll(){
  readVp();
  const nk = clamp(Math.min(vpR.width / bounds.w, vpR.height / bounds.h) * 0.94, KMIN, KMAX);
  animateTo(nk, (vpR.width - bounds.w * nk) / 2, (vpR.height - bounds.h * nk) / 2);
}

const ptrs = new Map();
let moved = false, startX = 0, startY = 0, lastDist = 0, lastMid = null, suppress = false;
const dist = () => { const p = [...ptrs.values()]; return Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) || 1; };
const midp = () => { const p = [...ptrs.values()]; return {x:(p[0].x + p[1].x) / 2, y:(p[0].y + p[1].y) / 2}; };
vp.addEventListener('pointerdown', e => {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  cancelAnimationFrame(anim);
  suppress = false;
  ptrs.set(e.pointerId, {x:e.clientX, y:e.clientY});
  if (ptrs.size === 1){ startX = e.clientX; startY = e.clientY; moved = false; readVp(); }
  if (ptrs.size === 2){
    moved = true; lastDist = dist(); lastMid = midp();
    ptrs.forEach((_, id) => { try { vp.setPointerCapture(id); } catch(_e){} });
  }
});
vp.addEventListener('pointermove', e => {
  if (!ptrs.has(e.pointerId)) return;
  const prev = ptrs.get(e.pointerId), cur = {x:e.clientX, y:e.clientY};
  ptrs.set(e.pointerId, cur);
  if (ptrs.size === 1){
    if (!moved && Math.hypot(cur.x - startX, cur.y - startY) > 6){
      moved = true; vp.classList.add('grabbing');
      try { vp.setPointerCapture(e.pointerId); } catch(_e){}
    }
    if (moved){ tx += cur.x - prev.x; ty += cur.y - prev.y; apply(); }
  } else if (ptrs.size === 2){
    const d = dist(), m = midp();
    zoomAt(d / lastDist, m.x - vpR.left, m.y - vpR.top);
    tx += m.x - lastMid.x; ty += m.y - lastMid.y; apply();
    lastDist = d; lastMid = m;
  }
});
function endPtr(e){
  if (!ptrs.has(e.pointerId)) return;
  ptrs.delete(e.pointerId);
  if (moved) suppress = true;
  if (ptrs.size === 1){ const p = [...ptrs.values()][0]; startX = p.x; startY = p.y; }
  if (!ptrs.size) vp.classList.remove('grabbing');
}
vp.addEventListener('pointerup', endPtr);
vp.addEventListener('pointercancel', endPtr);
vp.addEventListener('click', e => { if (suppress){ suppress = false; e.stopPropagation(); e.preventDefault(); } }, true);
vp.addEventListener('wheel', e => {
  e.preventDefault(); cancelAnimationFrame(anim); readVp();
  if (e.ctrlKey || e.metaKey) zoomAt(Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.06 : 0.0025)), e.clientX - vpR.left, e.clientY - vpR.top);
  else { const m = e.deltaMode === 1 ? 20 : 1; tx -= (e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX) * m; ty -= (e.shiftKey && !e.deltaX ? 0 : e.deltaY) * m; apply(); }
}, {passive:false});
vp.addEventListener('click', e => {
  if (!e.target.closest('.node,.tog') && narrow() && panel.classList.contains('open')) closeSheet();
});
vp.addEventListener('dblclick', e => {
  if (e.target.closest('.node,.tog')) return;
  readVp(); zoomAt(1.6, e.clientX - vpR.left, e.clientY - vpR.top);
});
vp.addEventListener('keydown', e => {
  if (e.target !== vp) return;
  const step = 90;
  const map = {ArrowLeft:[step, 0], ArrowRight:[-step, 0], ArrowUp:[0, step], ArrowDown:[0, -step]};
  if (map[e.key]){ tx += map[e.key][0]; ty += map[e.key][1]; apply(); e.preventDefault(); }
  else if (e.key === '+' || e.key === '='){ readVp(); zoomAt(1.25, vpR.width / 2, vpR.height / 2); e.preventDefault(); }
  else if (e.key === '-'){ readVp(); zoomAt(0.8, vpR.width / 2, vpR.height / 2); e.preventDefault(); }
  else if (e.key === '0'){ fitAll(); e.preventDefault(); }
});
$('zin').addEventListener('click', () => { readVp(); zoomAt(1.3, vpR.width / 2, vpR.height / 2); });
$('zout').addEventListener('click', () => { readVp(); zoomAt(1 / 1.3, vpR.width / 2, vpR.height / 2); });
$('zfit').addEventListener('click', fitAll);
$('zguide').addEventListener('click', () => go('#/guide'));
$('zrand').addEventListener('click', randomNode);

/* ---------- plan d'ensemble ---------- */
let mW = 210, mH = 110, mS = 1, mOx = 0, mOy = 0, miniQ = false;
const colors = {};
function readColors(){
  const cs = getComputedStyle(document.documentElement);
  T_ORDER.forEach(t => colors[t] = cs.getPropertyValue('--c-' + t).trim() || '#888');
  colors.ink = cs.getPropertyValue('--ink').trim() || '#222';
}
function sizeMini(){
  const small = narrow();
  mW = small ? 128 : 210;
  mH = Math.round(clamp(bounds.h * (mW / bounds.w), 36, small ? 84 : 140));
  mS = Math.min(mW / bounds.w, mH / bounds.h);
  mOx = (mW - bounds.w * mS) / 2; mOy = (mH - bounds.h * mS) / 2;
  const dpr = window.devicePixelRatio || 1;
  mini.width = Math.round(mW * dpr); mini.height = Math.round(mH * dpr);
  mini.style.width = mW + 'px'; mini.style.height = mH + 'px';
  if (mctx) mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
function drawMini(){
  if (miniQ) return; miniQ = true;
  requestAnimationFrame(() => {
    miniQ = false; if (!mctx) return;
    mctx.clearRect(0, 0, mW, mH);
    for (const n of visible){
      mctx.globalAlpha = n.dim ? 0.2 : 0.95; mctx.fillStyle = colors[n.T] || '#888';
      mctx.fillRect(mOx + n.x * mS - 1, mOy + n.y * mS - 1, 2.2, 2.2);
    }
    if (sel && sel.vis){ mctx.globalAlpha = 1; mctx.fillStyle = colors.ink; mctx.beginPath(); mctx.arc(mOx + sel.x * mS, mOy + sel.y * mS, 3, 0, 7); mctx.fill(); }
    mctx.globalAlpha = 1; mctx.strokeStyle = colors.ink || '#222'; mctx.lineWidth = 1.3;
    const x0 = -tx / k, y0 = -ty / k;
    mctx.strokeRect(mOx + x0 * mS, mOy + y0 * mS, Math.max(3, vpR.width / k * mS), Math.max(3, vpR.height / k * mS));
  });
}
let miniDrag = false;
function miniGo(e){
  const r = mini.getBoundingClientRect();
  const wx = (e.clientX - r.left - mOx) / mS, wy = (e.clientY - r.top - mOy) / mS;
  readVp(); cancelAnimationFrame(anim);
  tx = vpR.width / 2 - wx * k; ty = vpR.height / 2 - wy * k; apply();
}
mini.addEventListener('pointerdown', e => { miniDrag = true; try { mini.setPointerCapture(e.pointerId); } catch(_e){} miniGo(e); });
mini.addEventListener('pointermove', e => { if (miniDrag) miniGo(e); });
mini.addEventListener('pointerup', () => { miniDrag = false; });
mini.addEventListener('pointercancel', () => { miniDrag = false; });

/* ---------- repli / dépli ---------- */
function keepScreen(n, fn){
  const bx = n.x * k + tx, by = n.y * k + ty;
  fn(); relayout();
  tx += bx - (n.x * k + tx); ty += by - (n.y * k + ty); apply();
}
function toggle(n){
  clearHints();
  keepScreen(n, () => {
    if (n.collapsed){
      n.collapsed = false;
      let c = n; while (c.children.length === 1){ c = c.children[0]; c.collapsed = false; }
    } else n.collapsed = true;
  });
}
function setBranch(n, open){
  keepScreen(n, () => {
    if (open) (function o(m){ m.collapsed = false; m.children.forEach(o); })(n);
    else n.collapsed = true;
  });
  if (open) toast('Branche dépliée : ' + plural(n.desc, 'entrée', 'entrées'));
}
function collapseToTrunk(instant){
  const keep = new Set();
  for (let a = byId.get('abraham'); a; a = a.parent) keep.add(a);
  if (sel) for (let a = sel.parent; a; a = a.parent) keep.add(a);
  ALL.forEach(n => { n.collapsed = n.children.length > 0 && !keep.has(n); });
  relayout(); centerOn(sel || byId.get('abraham'), narrow() ? 0.7 : 0.9, instant);
}
function expandAll(){
  ALL.forEach(n => n.collapsed = false);
  relayout(); centerOn(sel || byId.get('abraham'));
  toast('Les ' + ALL.length + ' entrées sont dépliées');
}
function revealPath(n){
  let changed = false;
  for (let a = n.parent; a; a = a.parent) if (a.collapsed){ a.collapsed = false; changed = true; }
  if (changed) relayout();
}
let hinted = !!store.hinted;
function addHints(){
  if (hinted) return;
  ['isaac','ismael'].forEach(id => { const n = byId.get(id); if (n && n.tog && n.collapsed) n.tog.classList.add('hint'); });
}
function clearHints(){
  if (hinted) return;
  hinted = true; store.hinted = true; save();
  document.querySelectorAll('.tog.hint').forEach(t => t.classList.remove('hint'));
}

layer.addEventListener('click', e => {
  const t = e.target.closest('.tog');
  if (t){ toggle(byId.get(t.dataset.id)); return; }
  const b = e.target.closest('.node');
  if (b){ hideHover(); go('#/arbre/' + b.dataset.id); }
});

/* ---------- carte de survol ---------- */
let hoverT = 0;
function hideHover(){ clearTimeout(hoverT); if (!hcard.hidden) hcard.hidden = true; }
layer.addEventListener('pointerover', e => {
  if (e.pointerType !== 'mouse' || ptrs.size) return;
  const b = e.target.closest('.node'); if (!b) return;
  clearTimeout(hoverT);
  hoverT = setTimeout(() => showHover(byId.get(b.dataset.id)), 280);
});
layer.addEventListener('pointerout', e => {
  const b = e.target.closest('.node'); if (!b) return;
  if (e.relatedTarget && b.contains(e.relatedTarget)) return;
  hideHover();
});
function showHover(n){
  if (!n || !n.vis || !finePointer()) return;
  const text = n.txt || n.e || n.f || '';
  hcard.replaceChildren(...[
    el('div', {class:'hc-h'}, markEl(n.T, n.H, n.K),
      el('div', null, el('h4', null, n.n), n.a ? el('p', {class:'hc-a'}, n.a) : null, n.d ? el('p', {class:'hc-d'}, n.d) : null)),
    text ? el('p', {class:'hc-x'}, text.length > 210 ? text.slice(0, 200).replace(/\s+\S*$/, '') + '…' : text) : null,
    el('div', {class:'hc-f'}, el('span', null, T_SHORT[n.T]), el('span', null, H_LABEL[n.H]),
      n.children.length ? el('span', null, plural(n.desc, 'descendant', 'descendants')) : null,
      seen.has(n.i) ? el('span', null, '✓ lu') : el('span', null, 'Cliquer pour lire la fiche'))].filter(Boolean));
  const r = n.el.getBoundingClientRect(), v = viewTree.getBoundingClientRect();
  hcard.hidden = false;
  const w = hcard.offsetWidth, h = hcard.offsetHeight;
  let x = r.left - v.left, y = r.bottom - v.top + 10;
  if (x + w > v.width - 12) x = v.width - w - 12;
  if (y + h > v.height - 70) y = r.top - v.top - h - 10;
  hcard.style.left = Math.max(12, x) + 'px'; hcard.style.top = Math.max(12, y) + 'px';
}

/* ---------- fiche ---------- */
function openSheet(open){
  panel.classList.toggle('open', !!open);
  if (!open) panel.classList.remove('full');
  document.body.classList.toggle('sheet', !!open && narrow());
}
function setSel(n){
  if (sel){ sel.el.classList.remove('sel'); sel.el.removeAttribute('aria-current'); }
  xtNodes.forEach(m => m.el.classList.remove('xt')); xtNodes = [];
  sel = n || null;
  if (sel){
    sel.el.classList.add('sel'); sel.el.setAttribute('aria-current', 'true');
    (XL.get(sel.i) || []).forEach(o => { o.o.el.classList.add('xt'); xtNodes.push(o.o); });
  }
  drawLinks(); drawMini();
}
function markSeen(n){
  if (seen.has(n.i)) return;
  seen.add(n.i); store.seen = [...seen]; save();
  n.el.classList.add('seen');
  n.el.setAttribute('aria-label', n.n + (n.d ? ', ' + n.d : '') + ' (déjà lu)');
  updateProgress();
}
function focusNode(n, opt){
  opt = opt || {};
  revealPath(n);
  setSel(n);
  showNode(n);
  openSheet(true);
  markSeen(n);
  if (opt.center !== false) centerOn(n, Math.max(k, narrow() ? 0.75 : 0.85));
}
const nlink = n => el('button', {type:'button', class:'nlink', 'data-id':n.i}, n.n);
function lineIcon(t){
  const s = el('span', {class:'ic', 'aria-hidden':'true'});
  s.innerHTML = t === 'c'
    ? '<svg width="24" height="10"><path d="M1 5H23" class="xln x-c hot"/></svg>'
    : '<svg width="24" height="10"><path d="M1 5H23" class="xln x-l hot"/></svg>';
  return s;
}
function lineSample(cls, extra, t){
  const s = el('span', {class:'sw', 'aria-hidden':'true'});
  s.innerHTML = `<svg width="44" height="14"><path d="M2 7H42" class="ln ${t ? 't-' + t : 't-k'} on ${cls}"/>${extra || ''}</svg>`;
  return s;
}
const LSAMPLE = {
  f:() => lineSample('l-f'),
  g:() => lineSample('l-g'),
  s:() => lineSample('l-s'),
  r:() => lineSample('l-r', '<path class="brk" d="M16 13L21 1M23 13L28 1"/>'),
  a:() => lineSample('l-a', '<path d="M2 7H42" class="lna"/>')
};
function section(title, icon, cls, ...body){
  return el('section', {class:'sec' + (cls ? ' ' + cls : '')}, el('h3', null, icon ? ico(icon) : null, title), ...body);
}
function canBack(){ return !!(history.state && history.state.i > 0); }

function navBar(extra, more){
  const back = el('button', {type:'button', class:'pbtn', 'aria-label':'Retour', title:'Retour', onclick:() => history.back()}, ico('back'));
  back.disabled = !canBack();
  return el('div', {class:'pnav'}, back, el('div', {class:'sp'}, extra || null),
    ...(more || []),
    el('button', {type:'button', class:'pbtn closebtn', 'aria-label':'Fermer', title:'Fermer', onclick:closeSheet}, ico('close')));
}
function crumbs(n){
  const anc = []; for (let a = n.parent; a; a = a.parent) anc.unshift(a);
  const box = el('nav', {class:'crumbs', 'aria-label':'Ascendance'});
  const show = anc.slice(-2);
  if (anc.length > 2) box.append(el('button', {type:'button', title:'Voir toute la lignée', onclick:() => {
    const d = pbody.querySelector('details.lin'); if (d){ d.open = true; d.scrollIntoView({block:'start', behavior:reduceMotion ? 'auto' : 'smooth'}); }
  }}, '…'), el('span', {class:'sep'}, '›'));
  show.forEach(a => box.append(el('button', {type:'button', 'data-id':a.i, title:a.n}, a.n), el('span', {class:'sep'}, '›')));
  if (box.lastChild) box.lastChild.remove();
  return box;
}

function showNode(n){
  hidePop();
  const box = el('article', {class:`pn t-${n.T}`});
  const share = el('button', {type:'button', class:'pbtn', 'aria-label':'Partager', title:'Partager cette fiche', onclick:() => shareNode(n)}, ico('share'));
  box.append(navBar(crumbs(n), [share]));
  const tb = tourBanner(n); if (tb) box.append(tb);
  const seenOpt = {g:new Set(), m:new Set()};
  const inner = el('div', {class:'pin'});
  inner.append(el('header', {class:'ph'},
    el('div', {class:'kind'}, markEl(n.T, n.H, n.K, true), K_SHORT[n.K] + ' · ' + T_SHORT[n.T]),
    el('h2', null, n.n),
    n.a ? el('p', {class:'al'}, n.a) : null,
    n.d ? el('p', {class:'dd'}, rich(n.d, {self:n.i, seen:seenOpt, mentions:false})) : null));
  inner.append(el('div', {class:'tags'},
    el('button', {type:'button', class:'tag', 'data-g-h':n.H, title:'Que signifie ce degré d’historicité ?'}, markEl('k', n.H, 'p', true), H_LABEL[n.H], ico('info', 'ti')),
    el('span', {class:'tag'}, markEl(n.T, 'H', 'p', true), T_LABEL[n.T]),
    el('span', {class:'tag'}, markEl('k', 'H', n.K, true), K_LABEL[n.K])));
  if (n.parent) inner.append(el('p', {class:'rel'}, LSAMPLE[n.L](),
    el('span', null, 'Rattaché à ', nlink(n.parent), ' : ', L_LABEL[n.L], '.')));
  const opt = {self:n.i, seen:seenOpt};
  if (n.txt) inner.append(section('Rôle et récit', 'book', '', el('p', null, rich(n.txt, opt))));
  if (n.e) inner.append(section('Ce que dit l’histoire', 'evid', 'hist', el('p', null, rich(n.e, opt))));
  if (n.f) inner.append(section('Confrontations', 'swords', 'cf', el('p', null, rich(n.f, opt))));
  if (!n.txt && !n.e && !n.f) inner.append(section('Notice', 'book', '', el('p', {class:'empty'}, 'Maillon de la chaîne généalogique, sans récit propre dans les textes.')));
  const xs = XL.get(n.i) || [];
  if (xs.length) inner.append(section('Liens transversaux (' + xs.length + ')', 'link', '',
    el('ul', {class:'xlist'}, xs.map(o => el('li', null, lineIcon(o.t),
      el('div', null, el('span', null, o.lab),
        el('div', null, el('button', {type:'button', class:'xgo', 'data-id':o.o.i}, markEl(o.o.T, o.o.H, o.o.K, true), o.o.n))))))));
  const evs = EV_BY.get(n.i) || [];
  if (evs.length) inner.append(section('Preuves et silences', 'search', '',
    el('ul', {class:'xlist'}, evs.map(e => el('li', null, el('span', {class:'ic'}, markEl(EV_CAT[e.c][1], 'A', 'e', true)),
      el('div', null, el('strong', null, e.n), ' (', e.d, ') : ', rich(e.a, {self:n.i, seen:seenOpt}),
        e.lim && e.lim !== '—' ? el('span', {class:'lim'}, 'Limite : ', rich(e.lim, {self:n.i, seen:seenOpt})) : null))))));
  const cfs = CF_BY.get(n.i) || [];
  if (cfs.length) inner.append(section('Dans la chronologie des confrontations', 'clock', '',
    el('ul', {class:'xlist'}, cfs.map(c => el('li', null, lineIcon(c.c === 'D' ? 'l' : 'c'),
      el('div', null, el('strong', null, c.n), ' (', c.d, ') : ', rich(c.x, {self:n.i, seen:seenOpt})))))));
  if (n.children.length) inner.append(section('Suite dans l’arbre (' + n.children.length + ')', 'branch', '',
    el('div', {class:'kids'}, n.children.map(c => el('button', {type:'button', class:'kid', 'data-id':c.i},
      markEl(c.T, c.H, c.K, true), c.n, c.desc ? el('span', {class:'c'}, '+' + c.desc) : null))),
    el('div', {class:'jumps'},
      el('button', {type:'button', class:'btn sm', onclick:() => setBranch(n, true)}, ico('unfold'), 'Déplier toute la branche (' + n.desc + ')'),
      el('button', {type:'button', class:'btn sm', onclick:() => setBranch(n, false)}, ico('fold'), 'Replier'))));
  if (n.parent && n.parent.children.length > 1){
    const sibs = n.parent.children, i = sibs.indexOf(n);
    const pv = sibs[i - 1], nx = sibs[i + 1];
    inner.append(el('div', {class:'sib'},
      pv ? el('button', {type:'button', 'data-id':pv.i}, el('small', null, '‹ Précédent'), el('span', null, pv.n)) : el('span'),
      nx ? el('button', {type:'button', class:'nx', 'data-id':nx.i}, el('small', null, 'Suivant ›'), el('span', null, nx.n)) : el('span')));
  }
  const anc = []; for (let a = n; a; a = a.parent) anc.unshift(a);
  if (anc.length > 1) inner.append(el('details', {class:'lin', open:anc.length <= 12 ? true : null},
    el('summary', null, 'Lignée depuis Adam (' + plural(anc.length - 1, 'étape', 'étapes') + ')'),
    el('ol', null, anc.map((a, i) => el('li', null, i === anc.length - 1 ? el('strong', null, a.n) : nlink(a))))));
  box.append(inner);
  pbody.replaceChildren(box);
  pbody.scrollTop = 0;
  document.title = n.n + ' — Arbre des trois monothéismes';
}

function showGuide(){
  hidePop();
  const g = el('article', {class:'guide'});
  g.append(navBar(el('span', {class:'crumbs'}, 'Guide de lecture')));
  const tb = tourBanner(null); if (tb) g.append(tb);
  const inner = el('div', {class:'pin'});
  inner.append(el('h2', null, 'Comment lire l’arbre'));
  inner.append(el('p', {class:'lead'}, ALL.length + ' personnes, courants et événements, d’Adam aux mouvements d’aujourd’hui. Chaque fiche distingue ce que racontent les traditions et ce que confirme l’histoire.'));
  inner.append(howTo());
  inner.append(section('Par où commencer ?', 'route', '', el('div', {class:'kids'},
    ['origines', 'abraham', 'chiisme', 'preuves'].map(id => { const t = TOUR.get(id);
      return el('button', {type:'button', class:'kid', onclick:() => startTour(t.id)}, ico('play'), t.t); }))));
  inner.append(section('Aller à', 'tree', '', el('div', {class:'kids'}, QUICK.map(id => { const n = byId.get(id);
    return el('button', {type:'button', class:'kid', 'data-id':n.i}, markEl(n.T, n.H, n.K, true), n.n); }))));
  inner.append(legend());
  inner.append(section('Signes et abréviations', 'gloss', '', [
    ['AM', 'année « du monde », calendrier juif traditionnel', 'am'],
    ['~ 570', 'vers 570, date approximative', 'tilde'],
    ['† 62', 'mort en 62', 'dague'],
    ['A ⚭ B', 'un couple réuni dans une seule entrée', 'union'],
    ['A → B', 'plusieurs générations ou une évolution résumées', 'fleche'],
    ['trad.', 'date donnée par la tradition, non vérifiée', 'trad'],
    ['(ar.) (héb.)', 'forme arabe ou hébraïque du nom', 'langues'],
    ['ʿ ʾ ā ḥ ṣ', 'signes de prononciation de l\u2019arabe et de l\u2019hébreu', 'translit'],
    ['Gn 4,8', 'livre, chapitre, verset (touchez-la dans une fiche)', 'refbible']
  ].map(([k, v, id]) => el('div', {class:'lg sg'}, el('b', {class:'sw'}, k), el('span', null, v, ' ', el('a', {class:'more', href:'#/lexique/' + id, 'aria-label':'En savoir plus sur ' + k}, 'Lexique ›'))))));
  inner.append(section('Précautions', 'info', '', el('p', {class:'note'},
    rich('Avant le Xe siècle av. J.-C., les dates suivent la chronologie traditionnelle (AM : « an du monde » du calendrier juif, création en 3761 av. J.-C.) et n’ont pas de valeur historique. Chaque entrée n’a qu’un parent dans l’arbre : à partir des fondateurs, les traits relient aussi des maîtres, des successions et des schismes, et pas seulement des parents. Les généalogies de Mahomet au-delà de ʿAdnān, et de Jésus selon Matthieu et Luc, sont des constructions des traditions.', {mentions:false}))));
  inner.append(el('div', {class:'jumps'},
    el('button', {type:'button', class:'btn', onclick:openWelcome}, ico('spark'), 'Revoir l’accueil'),
    el('a', {class:'btn', href:'#/lexique'}, ico('gloss'), 'Ouvrir le lexique')));
  g.append(inner);
  pbody.replaceChildren(g);
  pbody.scrollTop = 0;
  document.title = 'Arbre des trois monothéismes';
}
function howTo(){
  return el('div', {class:'howto'},
    el('div', null, el('span', {class:'hi'}, ico('tree')), el('span', null, el('b', null, 'Touchez un nom'), ' pour ouvrir sa fiche. Glissez pour vous déplacer, pincez ou utilisez + et − pour zoomer.')),
    el('div', null, el('span', {class:'hi'}, el('span', {class:'demo-tog'}, '+12')), el('span', null, 'Une pastille ', el('b', null, '« +N »'), ' déplie une branche (N entrées cachées).')),
    el('div', null, el('span', {class:'hi'}, 'Aa'), el('span', null, 'Les ', el('b', {class:'demo-t'}, 'mots en pointillé'), ' sont expliqués d’une touche ; les ', el('b', {class:'demo-m'}, 'noms soulignés'), ' mènent à leur fiche.')),
    el('div', null, el('span', {class:'hi'}, 'Gn'), el('span', null, 'Les références comme ', el('b', null, 'Gn 4,8'), ' ou ', el('b', null, 'Coran 2,127'), ' sont décodées et renvoient au texte.')));
}
function legend(){
  const f = document.createDocumentFragment();
  f.append(section('Remplissage : degré d’historicité', null, '', H_ORDER.map(h =>
    el('div', {class:'lg'}, el('span', {class:'sw'}, markEl('k', h, 'p')), el('span', null, el('strong', null, H_LABEL[h]), ' : ', H_LONG[h].charAt(0).toLowerCase() + H_LONG[h].slice(1))))));
  f.append(section('Couleur : tradition', null, '', T_ORDER.map(t =>
    el('div', {class:'lg'}, el('span', {class:'sw'}, markEl(t, 'H', 'p')), el('span', null, T_LABEL[t])))));
  f.append(section('Forme : nature de l’entrée', null, '', ['p','m','e'].map(kk =>
    el('div', {class:'lg'}, el('span', {class:'sw'}, markEl('k', 'H', kk)), el('span', null, K_LABEL[kk])))));
  f.append(section('Traits', null, '', [
    el('div', {class:'lg'}, LSAMPLE.f(), el('span', null, 'Filiation')),
    el('div', {class:'lg'}, LSAMPLE.g(), el('span', null, 'Filiation, générations omises')),
    el('div', {class:'lg'}, LSAMPLE.a(), el('span', null, 'Filiation légale (Jésus et Joseph)')),
    el('div', {class:'lg'}, LSAMPLE.s(), el('span', null, 'Transmission : maître, succession, héritage doctrinal')),
    el('div', {class:'lg'}, LSAMPLE.r(), el('span', null, 'Rupture ou schisme')),
    el('div', {class:'lg'}, el('span', {class:'sw'}, lineIcon('c')), el('span', null, 'Confrontation entre deux entrées')),
    el('div', {class:'lg'}, el('span', {class:'sw'}, lineIcon('l')), el('span', null, 'Lien ou alliance entre deux entrées')),
    el('div', {class:'lg'}, el('span', {class:'sw'}, el('span', {style:'display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--c-c)'})), el('span', null, 'Point après un nom : fiche déjà lue'))
  ], el('p', {class:'note'}, 'Les liens transversaux apparaissent, avec leur explication, quand une fiche est ouverte ; le bouton « Liens » les montre tous.')));
  return f;
}
function closeSheet(){
  if (location.hash.startsWith('#/arbre/') || location.hash.startsWith('#/guide') || location.hash.startsWith('#/parcours/')) go('#/arbre', {replace:true});
  else openSheet(false);
}

/* panneau : délégation des clics */
pbody.addEventListener('click', e => {
  const t = e.target.closest('[data-id],.term,.ref,[data-g-h]');
  if (!t || !pbody.contains(t)) return;
  if (t.classList.contains('term')){ e.preventDefault(); showTermPop(t, t.dataset.g); return; }
  if (t.classList.contains('ref')){ e.preventDefault(); showRefPop(t, JSON.parse(t.dataset.ref)); return; }
  if (t.dataset.gH){ showHistPop(t, t.dataset.gH); return; }
  if (t.dataset.id) go('#/arbre/' + t.dataset.id);
});

/* tiroir mobile : glisser pour agrandir ou fermer */
(function sheetDrag(){
  let y0 = 0, dy = 0, on = false, id = null;
  const start = e => {
    if (!narrow() || !panel.classList.contains('open')) return;
    if (e.target.closest('button,a,input')) return;
    on = true; id = e.pointerId; y0 = e.clientY; dy = 0;
    panel.classList.add('dragging');
    try { e.currentTarget.setPointerCapture(id); } catch(_e){}
  };
  const move = e => {
    if (!on || e.pointerId !== id) return;
    dy = e.clientY - y0;
    const full = panel.classList.contains('full');
    panel.style.setProperty('--drag', Math.max(full ? 0 : -60, dy) + 'px');
  };
  const end = e => {
    if (!on || e.pointerId !== id) return;
    on = false; panel.classList.remove('dragging'); panel.style.removeProperty('--drag');
    const full = panel.classList.contains('full');
    if (Math.abs(dy) < 6){ panel.classList.toggle('full'); return; }
    if (dy < -50) panel.classList.add('full');
    else if (dy > 90){ if (full && dy < 260) panel.classList.remove('full'); else closeSheet(); }
  };
  const grab = $('grab');
  [grab, pbody].forEach(z => {
    z.addEventListener('pointerdown', e => { if (z === grab || e.target.closest('.pnav')) start(e); });
    z.addEventListener('pointermove', move);
    z.addEventListener('pointerup', end);
    z.addEventListener('pointercancel', end);
  });
})();

/* ---------- popovers ---------- */
let popFor = null;
function hidePop(){ if (!pop.hidden){ pop.hidden = true; popFor = null; } }
function placePop(anchor){
  pop.hidden = false;
  if (narrow()) return;
  const r = anchor.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
  let x = r.left + r.width / 2 - w / 2, y = r.bottom + 8;
  x = clamp(x, 10, innerWidth - w - 10);
  if (y + h > innerHeight - 10) y = Math.max(10, r.top - h - 8);
  pop.style.left = x + 'px'; pop.style.top = y + 'px';
}
function popShell(title, sub, body, foot, mark){
  foot = (foot || []).filter(Boolean);
  pop.replaceChildren(...[
    el('div', {class:'pp-h'}, mark || null, el('div', null, el('h4', null, title), sub ? el('p', {class:'pp-s'}, sub) : null),
      el('button', {type:'button', class:'pp-x', 'aria-label':'Fermer', onclick:hidePop}, ico('close'))),
    ...body, foot.length ? el('div', {class:'pp-f'}, ...foot) : null].filter(Boolean));
}
function showTermPop(anchor, id){
  const g = GL.get(id); if (!g) return;
  if (popFor === anchor){ hidePop(); return; }
  const n = g.n && byId.get(g.n);
  popShell(g.t, GLOSS_CAT[g.c], [el('p', null, rich(g.d, {terms:false, self:g.n}))], [
    n ? el('button', {type:'button', class:'btn sm pri', onclick:() => { hidePop(); go('#/arbre/' + n.i); }}, markEl(n.T, n.H, n.K, true), 'Fiche : ' + n.n) : null,
    el('button', {type:'button', class:'btn sm', onclick:() => { hidePop(); go('#/lexique/' + g.id); }}, ico('gloss'), 'Lexique')
  ]);
  popFor = anchor; placePop(anchor);
}
function showRefPop(anchor, ref){
  if (popFor === anchor){ hidePop(); return; }
  const x = RICH.explain(ref);
  popShell(x.title, x.sub, [el('ul', null, x.lines.map(l => el('li', null, el('span', null, l.label),
    l.url ? el('a', {class:'btn sm', href:l.url, target:'_blank', rel:'noopener'}, 'Lire', ico('ext')) : null))),
    x.src ? el('p', {class:'src'}, 'Lecture en ligne : ' + x.src + ' (site externe).') : null]);
  popFor = anchor; placePop(anchor);
}
function showHistPop(anchor, h){
  if (popFor === anchor){ hidePop(); return; }
  const txt = {
    A:'Une découverte archéologique ou un texte indépendant (inscription, chronique étrangère, monnaie…) nomme cette personne ou atteste ce fait.',
    H:'Les historiens admettent son existence à partir de sources concordantes, même sans preuve matérielle directe.',
    D:'Les spécialistes discutent son existence ou l’exactitude de ce qu’on en raconte.',
    T:'Connu uniquement par les textes religieux et la tradition : figure de foi ou de légende, sans attestation extérieure.'
  }[h];
  popShell(H_LABEL[h], 'Degré d’historicité', [el('p', null, txt), el('p', {class:'src'}, 'Le remplissage du repère dans l’arbre indique ce degré : plein et cerclé, plein, à moitié, vide.')], [], markEl('k', h, 'p'));
  popFor = anchor; placePop(anchor);
}
document.addEventListener('pointerdown', e => {
  if (!pop.hidden && !pop.contains(e.target) && !e.target.closest('.term,.ref,[data-g-h]')) hidePop();
}, true);
window.addEventListener('resize', hidePop);

/* ---------- toast ---------- */
let toastT = 0;
function toast(msg, action){
  clearTimeout(toastT);
  toastEl.replaceChildren(el('span', null, msg), ...(action ? [el('button', {type:'button', onclick:() => { action.fn(); toastEl.classList.remove('on'); }}, action.label)] : []));
  toastEl.classList.add('on');
  toastT = setTimeout(() => toastEl.classList.remove('on'), action ? 9000 : 2600);
}

/* ---------- partage ---------- */
function shareNode(n){
  const url = location.href.split('#')[0] + '#/arbre/' + n.i;
  const data = {title:n.n + ' — Arbre des trois monothéismes', text:n.n + (n.d ? ' (' + n.d + ')' : ''), url};
  if (navigator.share) navigator.share(data).catch(() => {});
  else if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => toast('Lien copié'), () => toast(url));
  else toast(url);
}

/* ---------- au hasard ---------- */
function randomNode(){
  const pool = ALL.filter(n => n.txt && !seen.has(n.i));
  const n = rand(pool.length ? pool : ALL.filter(m => m.txt));
  go('#/arbre/' + n.i);
}

/* ---------- barre d'outils et filtres ---------- */
(function buildBar(){
  const bar = $('bar');
  const gT = el('div', {class:'grp', role:'group', 'aria-label':'Traditions'}, el('span', {class:'grp-l'}, 'Traditions'));
  T_ORDER.forEach(t => {
    const b = el('button', {type:'button', class:'chip', 'aria-pressed':'true', title:'Estomper ou rétablir : ' + T_LABEL[t]}, markEl(t, 'H', 'p', true), T_SHORT[t]);
    b.addEventListener('click', () => { const on = b.getAttribute('aria-pressed') === 'true'; b.setAttribute('aria-pressed', String(!on)); on ? offT.add(t) : offT.delete(t); applyDim(); });
    gT.append(b);
  });
  const gH = el('div', {class:'grp', role:'group', 'aria-label':'Historicité'}, el('span', {class:'grp-l'}, 'Historicité'));
  H_ORDER.forEach(h => {
    const b = el('button', {type:'button', class:'chip', 'aria-pressed':'true', title:H_LONG[h]}, markEl('k', h, 'p', true), H_LABEL[h]);
    b.addEventListener('click', () => { const on = b.getAttribute('aria-pressed') === 'true'; b.setAttribute('aria-pressed', String(!on)); on ? offH.add(h) : offH.delete(h); applyDim(); });
    gH.append(b);
  });
  const xMob = el('button', {type:'button', class:'chip', 'aria-pressed':'false'}, ico('link'), 'Tous les liens');
  const gX = el('div', {class:'grp bar-x', role:'group', 'aria-label':'Affichage'}, el('span', {class:'grp-l'}, 'Affichage'),
    el('button', {type:'button', class:'chip', onclick:() => { closeBar(); collapseToTrunk(); }}, ico('fold'), 'Replier'),
    el('button', {type:'button', class:'chip', onclick:() => { closeBar(); expandAll(); }}, ico('unfold'), 'Tout déplier'),
    xMob,
    el('button', {type:'button', class:'chip', onclick:() => { closeBar(); go('#/guide'); }}, ico('info'), 'Légende'));
  bar.append(gT, gH, gX);
  const xBtn = $('zx');
  const setX = v => { showAllX = v; xBtn.setAttribute('aria-pressed', String(v)); xMob.setAttribute('aria-pressed', String(v)); drawLinks(); };
  xBtn.addEventListener('click', () => setX(!showAllX));
  xMob.addEventListener('click', () => setX(!showAllX));
  $('zfold').addEventListener('click', () => collapseToTrunk());
  $('zopen').addEventListener('click', expandAll);
  const fb = $('zfilt');
  fb.addEventListener('click', () => { const o = !bar.classList.contains('open'); bar.classList.toggle('open', o); fb.setAttribute('aria-expanded', String(o)); });
  function closeBar(){ bar.classList.remove('open'); fb.setAttribute('aria-expanded', 'false'); }
  document.addEventListener('pointerdown', e => { if (bar.classList.contains('open') && !bar.contains(e.target) && !fb.contains(e.target)) closeBar(); });
})();

/* ---------- vues ---------- */
const VIEWS = ['tree', 'learn', 'evid', 'conf', 'gloss'];
const built = {};
function setView(v){
  const cur = document.body.dataset.view;
  document.querySelectorAll('[data-v]').forEach(a => { if (a.dataset.v === v) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  if (cur === v) return;
  document.body.dataset.view = v;
  VIEWS.forEach(x => { $('view-' + x).hidden = x !== v; });
  hidePop(); hideHover();
  if (v === 'tree'){ readVp(); if (visible.some(n => !n.lw || n.lwEst)) render(); else drawMini(); }
  else { openSheet(false); $('view-' + v).scrollTop = 0; }
  if (v === 'evid' && !built.evid){ buildList('evid'); built.evid = true; }
  if (v === 'conf' && !built.conf){ buildList('conf'); built.conf = true; }
  if (v === 'gloss' && !built.gloss){ buildGloss(); built.gloss = true; }
}
$('n-evid').textContent = EVID.length; $('n-conf').textContent = CONF.length;

/* ---------- routeur ---------- */
let lastRoute = null;
function go(hash, opt){
  opt = opt || {};
  if (hash !== location.hash){
    const i = (history.state && history.state.i) || 0;
    if (opt.replace) history.replaceState({i}, '', hash);
    else history.pushState({i:i + 1}, '', hash);
  }
  route(true);
}
function route(force){
  const h = location.hash || '#/arbre';
  if (!force && h === lastRoute) return;
  lastRoute = h;
  closeSearch();
  const p = h.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  const r = p[0] || 'arbre';
  if (r !== 'quiz' && !modal.hidden && modal.dataset.kind === 'quiz') closeModal(true);
  if (r === 'arbre' || r === 'guide' || r === 'parcours'){
    setView('tree');
    if (r === 'parcours'){
      const t = TOUR.get(p[1]);
      if (t){
        const i = clamp(parseInt(p[2], 10) || 1, 1, t.steps.length) - 1;
        tourCtx = {t, i};
        store.tours[t.id] = Math.max(store.tours[t.id] || 0, i + 1); save();
        focusNode(byId.get(t.steps[i][0]));
        return;
      }
    }
    if (r === 'arbre' && p[1] && byId.has(p[1])){ focusNode(byId.get(p[1])); return; }
    const prev = sel, wasOpen = panel.classList.contains('open');
    setSel(null); showGuide();
    openSheet(r === 'guide');
    if (prev && narrow() && wasOpen && r !== 'guide') centerOn(prev);
    return;
  }
  if (r === 'apprendre' || r === 'quiz'){ setView('learn'); renderLearn(); if (r === 'quiz') openQuiz(); document.title = 'Apprendre — Arbre des trois monothéismes'; return; }
  if (r === 'preuves'){ setView('evid'); document.title = 'Preuves — Arbre des trois monothéismes'; return; }
  if (r === 'confrontations'){ setView('conf'); document.title = 'Confrontations — Arbre des trois monothéismes'; return; }
  if (r === 'lexique'){
    setView('gloss'); document.title = 'Lexique — Arbre des trois monothéismes';
    if (p[1] && GL.has(p[1])) flashGloss(p[1]);
    return;
  }
  go('#/arbre', {replace:true});
}
window.addEventListener('popstate', () => route());
window.addEventListener('hashchange', () => route());
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#/"]');
  if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.button) return;
  e.preventDefault();
  go(a.getAttribute('href'));
});

/* ---------- parcours guidés ---------- */
let tourCtx = null;
function startTour(id, step){ const t = TOUR.get(id); if (t) go('#/parcours/' + t.id + '/' + (step || 1)); }
function tourBanner(n){
  if (!tourCtx) return null;
  const {t, i} = tourCtx;
  const here = n && t.steps[i][0] === n.i;
  const box = el('div', {class:`tourb t-${t.c}`});
  box.append(el('div', {class:'tb-h'}, ico('route'), el('span', {class:'tb-t'}, el('small', null, 'Parcours guidé'), t.t), el('span', {class:'sp'}),
    el('span', {class:'tb-c'}, here ? (i + 1) + '\u2009/\u2009' + t.steps.length : 'En pause'),
    el('button', {type:'button', class:'tb-x', 'aria-label':'Quitter le parcours', title:'Quitter le parcours', onclick:() => { tourCtx = null; const tb = pbody.querySelector('.tourb'); if (tb) tb.remove(); }}, ico('close'))));
  if (here){
    box.append(el('p', null, rich(t.steps[i][1], {self:n.i})));
    const last = i === t.steps.length - 1;
    box.append(el('div', {class:'tb-n'},
      el('button', {type:'button', class:'btn sm', disabled:i === 0 ? true : null, onclick:() => startTour(t.id, i)}, ico('back'), 'Précédent'),
      el('span', {class:'dots', 'aria-hidden':'true'}, t.steps.map((_, j) => el('i', {class:j === i ? 'cur' : j < i ? 'on' : ''}))),
      last ? el('button', {type:'button', class:'btn sm pri', onclick:() => finishTour(t)}, ico('check'), 'Terminer')
           : el('button', {type:'button', class:'btn sm pri', onclick:() => startTour(t.id, i + 2)}, 'Suivant', ico('next'))));
  } else {
    box.append(el('p', null, 'Vous explorez librement. Reprenez le parcours où vous l’avez laissé.'));
    box.append(el('div', {class:'tb-n'}, el('span', {class:'dots'}),
      el('button', {type:'button', class:'btn sm pri', onclick:() => startTour(t.id, i + 1)}, ico('play'), 'Reprendre (étape ' + (i + 1) + ')')));
  }
  return box;
}
function finishTour(t){
  store.tours[t.id] = t.steps.length; save();
  tourCtx = null;
  const next = TOURS[(TOURS.indexOf(t) + 1) % TOURS.length];
  toast('Parcours « ' + t.t + ' » terminé !', {label:'Suivant : ' + next.t, fn:() => startTour(next.id)});
  const tb = pbody.querySelector('.tourb'); if (tb) tb.remove();
}

/* ---------- apprendre ---------- */
function updateProgress(){
  const pct = Math.round(seen.size / ALL.length * 100);
  $('prog-t').textContent = (seen.size && pct === 0 ? '<1' : pct) + '%';
  $('prog-arc').style.strokeDashoffset = String(94.25 * (1 - seen.size / ALL.length));
  $('prog').title = 'Votre exploration : ' + seen.size + ' fiches lues sur ' + ALL.length;
}
function tourArt(t){
  const n = t.steps.length, done = store.tours[t.id] || 0, W = 320, H = 86;
  const pts = t.steps.map((_, i) => [24 + i * (W - 48) / Math.max(1, n - 1), 50 + Math.sin(i * 1.3 + t.id.length) * 15]);
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < n; i++){ const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], mx = (x0 + x1) / 2; d += `C${mx} ${y0} ${mx} ${y1} ${x1} ${y1}`; }
  let s = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><path d="${d}" fill="none" stroke="var(--tc)" stroke-width="2" stroke-dasharray="5 5" opacity=".6"/>`;
  pts.forEach(([x, y], i) => { s += `<circle cx="${x}" cy="${y}" r="${i === 0 ? 7 : 5}" fill="${i < done ? 'var(--tc)' : 'var(--surface)'}" stroke="var(--tc)" stroke-width="2"/>`; });
  return s + '</svg>';
}
function renderLearn(){
  const box = $('learn');
  const pct = seen.size / ALL.length;
  const ring = el('div', {class:'ring'});
  ring.innerHTML = `<svg viewBox="0 0 76 76"><circle class="bgc" cx="38" cy="38" r="31"/><circle class="fgc" cx="38" cy="38" r="31" stroke-dasharray="194.8" stroke-dashoffset="${194.8 * (1 - pct)}"/></svg>`;
  ring.append(el('b', null, Math.round(pct * 100) + '%'));
  const byT = {}; T_ORDER.forEach(t => byT[t] = [0, 0]);
  ALL.forEach(n => { byT[n.T][1]++; if (seen.has(n.i)) byT[n.T][0]++; });
  const doneTours = TOURS.filter(t => (store.tours[t.id] || 0) >= t.steps.length).length;
  const fact = randomFact();
  box.replaceChildren(
    el('div', {class:'hero'},
      el('div', {class:'hero-t'},
        el('p', {class:'eyebrow'}, 'Apprendre en explorant'),
        el('h2', null, 'Trois religions, une seule famille d’histoires'),
        el('p', null, 'Suivez un parcours guidé, testez-vous avec un quiz tiré de l’arbre, ou laissez le hasard vous surprendre. Votre progression est enregistrée sur cet appareil.'),
        el('div', {class:'jumps'},
          el('button', {type:'button', class:'btn big pri', onclick:() => startTour(nextTour().id, Math.min((store.tours[nextTour().id] || 0) + 1, nextTour().steps.length))}, ico('play'), (store.tours[nextTour().id] ? 'Reprendre : ' : 'Commencer : ') + nextTour().t),
          el('button', {type:'button', class:'btn big', onclick:() => go('#/quiz')}, ico('trophy'), 'Quiz'),
          el('button', {type:'button', class:'btn big', onclick:randomNode}, ico('dice'), 'Au hasard'))),
      el('div', {class:'stat'},
        el('div', {class:'stat-top'}, ring, el('p', null, el('strong', null, seen.size + ' / ' + ALL.length), 'fiches lues')),
        el('div', {class:'bars'}, T_ORDER.map(t => el('div', {class:'t-' + t}, el('span', null, T_SHORT[t]),
          el('span', {class:'tr'}, el('i', {style:'width:' + (byT[t][0] / byT[t][1] * 100) + '%'})), el('span', null, byT[t][0] + '/' + byT[t][1])))),
        el('div', {class:'bars'}, el('div', null, el('span', null, 'Parcours'), el('span', {class:'tr'}, el('i', {style:'width:' + (doneTours / TOURS.length * 100) + '%;background:var(--c-c)'})), el('span', null, doneTours + '/' + TOURS.length)),
          el('div', null, el('span', null, 'Meilleur quiz'), el('span', {class:'tr'}, el('i', {style:'width:' + ((store.quizBest || 0) * 10) + '%;background:var(--c-c)'})), el('span', null, (store.quizBest || 0) + '/10'))))),
    el('div', {class:'h3x'}, el('h3', null, 'Parcours guidés'), el('p', null, TOURS.length + ' histoires racontées étape par étape dans l’arbre')),
    el('div', {class:'cards'}, TOURS.map(t => {
      const done = store.tours[t.id] || 0, fin = done >= t.steps.length;
      const art = el('div', {class:'art'}); art.innerHTML = tourArt(t);
      return el('button', {type:'button', class:`tcard t-${t.c}`, onclick:() => startTour(t.id, fin || !done ? 1 : Math.min(done + 1, t.steps.length))},
        art, fin ? el('span', {class:'done'}, ico('check'), 'Terminé') : null,
        el('div', {class:'tc-b'}, el('h4', null, t.t), el('p', {class:'s'}, t.s),
          el('div', {class:'meta'}, el('span', null, plural(t.steps.length, 'étape', 'étapes') + ' · ~' + Math.max(3, Math.round(t.steps.length * 0.7)) + ' min'),
            el('span', {class:'pb'}, el('i', {style:'width:' + (Math.min(done, t.steps.length) / t.steps.length * 100) + '%'})))));
    })),
    el('div', {class:'h3x'}, el('h3', null, 'Pour aller plus loin'), el('p', null, 'Défis, anecdotes et raccourcis')),
    el('div', {class:'duo2'},
      el('div', {class:'feat'}, el('div', {class:'ft'}, ico('trophy'), 'Quiz'),
        el('h4', null, 'Testez vos connaissances'),
        el('p', null, '10 questions tirées au sort parmi des milliers possibles : filiations, noms arabes, dates des grandes confrontations, découvertes archéologiques, vocabulaire…'),
        el('div', {class:'jumps'}, el('button', {type:'button', class:'btn pri', onclick:() => go('#/quiz')}, ico('play'), 'Lancer un quiz'),
          store.quizBest ? el('span', {class:'cat'}, 'Record : ' + store.quizBest + '/10') : null)),
      el('div', {class:`feat t-${fact.T}`}, el('div', {class:'ft'}, ico('spark'), 'Le saviez-vous ?'),
        el('h4', null, fact.n),
        el('p', null, rich(fact.snip, {self:fact.i, mentions:false})),
        el('div', {class:'jumps'}, el('button', {type:'button', class:'btn pri', onclick:() => go('#/arbre/' + fact.i)}, ico('book'), 'Lire la fiche'),
          el('button', {type:'button', class:'btn', onclick:renderLearn}, ico('dice'), 'Une autre')))),
    el('div', {class:'h3x'}, el('h3', null, 'Grandes figures'), el('p', null, 'Accès direct')),
    el('div', {class:'quick'}, QUICK.map(id => { const n = byId.get(id);
      return el('button', {type:'button', class:'kid', onclick:() => go('#/arbre/' + n.i)}, markEl(n.T, n.H, n.K, true), n.n, seen.has(n.i) ? el('span', {class:'c'}, '✓') : null); }))
  );
}
function nextTour(){
  return TOURS.find(t => (store.tours[t.id] || 0) > 0 && (store.tours[t.id] || 0) < t.steps.length)
    || TOURS.find(t => !(store.tours[t.id] > 0)) || TOURS[0];
}
function randomFact(){
  const pool = ALL.filter(n => n.e && n.e.length > 60);
  const n = rand(pool);
  return {i:n.i, n:n.n, T:n.T, snip:firstSentence(n.e)};
}

/* ---------- preuves et confrontations ---------- */
function yearOf(d){
  const av = /av\./.test(d);
  const m = d.match(/\d{1,4}/);
  if (m) return av ? -(+m[0]) : +m[0];
  const r = d.match(/\b([IVX]+)(?:er|e)\b/);
  if (r){
    const v = {I:1, V:5, X:10}; let c = 0, prev = 0;
    for (const ch of r[1].split('').reverse()){ const x = v[ch]; c += x < prev ? -x : x; prev = Math.max(prev, x); }
    const y = (c - 1) * 100 + 50; return av ? -y : y;
  }
  return 0;
}
const ERAS = [[-1e9, 'Avant notre ère'], [0, 'Antiquité'], [600, 'Moyen Âge'], [1500, 'Époque moderne'], [1800, 'Époque contemporaine']];
const eraOf = y => { let e = ERAS[0][1]; for (const [s, l] of ERAS) if (y >= s) e = l; return e; };
function buildList(kind){
  const items = kind === 'evid' ? EVID : CONF, cats = kind === 'evid' ? EV_CAT : CF_CAT;
  const fBox = $(kind + '-f'), lBox = $(kind + '-l');
  let cur = 'all';
  const counts = {}; items.forEach(it => counts[it.c] = (counts[it.c] || 0) + 1);
  const chips = [['all', 'Toutes', items.length], ...Object.keys(cats).filter(c => counts[c]).map(c => [c, cats[c][0], counts[c]])];
  const btns = chips.map(([c, lab, nb]) => {
    const dots = c === 'all' ? null : (kind === 'evid' ? [cats[c][1]] : cats[c][1]).map(t => el('span', {class:'d t-' + t, 'aria-hidden':'true'}));
    const b = el('button', {type:'button', class:'chip', 'aria-pressed':String(c === 'all')}, dots, lab, el('span', {class:'c'}, nb));
    b.addEventListener('click', () => { cur = c; btns.forEach(x => x.setAttribute('aria-pressed', String(x === b))); paint(); $('view-' + kind).scrollTop = Math.min($('view-' + kind).scrollTop, fBox.offsetTop); });
    return b;
  });
  fBox.append(...btns);
  function paint(){
    const out = []; let lastGroup = null;
    items.filter(it => cur === 'all' || it.c === cur).forEach(it => {
      const group = kind === 'evid' ? cats[it.c][0] : eraOf(yearOf(it.d));
      if (group !== lastGroup && (kind === 'conf' || cur === 'all')){ out.push(el('div', {class:'tl-era'}, group)); lastGroup = group; }
      if (kind === 'evid'){
        const node = byId.get(it.id), [lab, tc] = cats[it.c];
        out.push(el('article', {class:'ent t-' + tc}, el('div', {class:'ent-d'}, it.d),
          el('div', {class:'ent-c'}, el('h3', null, it.n), el('p', {class:'where'}, it.w), el('p', null, rich(it.a, {self:it.id})),
            it.lim && it.lim !== '—' ? el('p', {class:'lim'}, el('b', null, 'Limite'), rich(it.lim, {self:it.id})) : null,
            el('div', {class:'jumps'}, el('span', {class:'cat t-' + tc}, el('span', {class:'d'}), lab),
              el('button', {type:'button', class:'jump', 'data-id':node.i}, markEl(node.T, node.H, node.K, true), 'Voir dans l’arbre : ' + node.n)))));
        return;
      }
      const [lab, ts] = cats[it.c];
      const art = el('article', {class:'ent' + (ts.length > 1 ? ' duo' : '') + ' t-' + ts[0], style:ts.length > 1 ? `--t1:var(--c-${ts[0]});--t2:var(--c-${ts[1]})` : null},
        el('div', {class:'ent-d'}, it.d),
        el('div', {class:'ent-c'}, el('h3', null, it.n),
          el('div', {class:'jumps', style:'margin-top:8px'}, el('span', {class:'cat'}, ts.map(t => el('span', {class:'d t-' + t})), lab)),
          el('p', null, rich(it.x, {self:it.ids[0]})),
          el('div', {class:'jumps'}, it.ids.map(id => { const n = byId.get(id);
            return el('button', {type:'button', class:'jump', 'data-id':n.i}, markEl(n.T, n.H, n.K, true), n.n); }))));
      out.push(art);
    });
    lBox.replaceChildren(...out);
  }
  paint();
}
['view-evid', 'view-conf', 'view-gloss', 'view-learn'].forEach(id => $(id).addEventListener('click', e => {
  const t = e.target.closest('.term,.ref,.jump[data-id],.men[data-id],.gl button[data-id],.kid[data-id]');
  if (!t) return;
  if (t.classList.contains('term')){ showTermPop(t, t.dataset.g); return; }
  if (t.classList.contains('ref')){ showRefPop(t, JSON.parse(t.dataset.ref)); return; }
  if (t.dataset.id) go('#/arbre/' + t.dataset.id);
}));

/* ---------- lexique ---------- */
const glossKey = g => norm(g.t).replace(/^[^a-z0-9]+/, '');
let glossCur = 'all', glossUses = null;
function computeUses(){
  glossUses = new Map();
  for (const n of ALL){
    const sn = {g:new Set(), m:new Set()};
    for (const t of [n.txt, n.e, n.f, n.d]) if (t) RICH.segments(t, {self:n.i, seen:sn, mentions:false});
    sn.g.forEach(id => push(glossUses, id, n));
  }
}
function buildGloss(){
  if (!glossUses) computeUses();
  const fBox = $('gloss-f');
  const counts = {}; GLOSSARY.forEach(g => counts[g.c] = (counts[g.c] || 0) + 1);
  const chips = [['all', 'Tout', GLOSSARY.length], ...Object.keys(GLOSS_CAT).map(c => [c, GLOSS_CAT[c], counts[c] || 0])];
  const btns = chips.map(([c, lab, nb]) => {
    const b = el('button', {type:'button', class:'chip', 'aria-pressed':String(c === 'all')}, lab, el('span', {class:'c'}, nb));
    b.addEventListener('click', () => { glossCur = c; btns.forEach(x => x.setAttribute('aria-pressed', String(x === b))); paintGloss(); });
    return b;
  });
  fBox.append(...btns);
  $('gq').addEventListener('input', paintGloss);
  paintGloss();
}
function paintGloss(){
  const q = norm($('gq').value.trim());
  const list = GLOSSARY.filter(g => (glossCur === 'all' || g.c === glossCur) && (!q || norm(g.t + ' ' + g.d + ' ' + g.m.join(' ')).includes(q)));
  const sym = list.filter(g => g.c === 'sym'), rest = list.filter(g => g.c !== 'sym').sort((a, b) => glossKey(a).localeCompare(glossKey(b), 'fr'));
  const groups = [];
  if (sym.length) groups.push(['Signes', 'Signes, dates et abréviations', sym]);
  let curL = null;
  rest.forEach(g => { const L = glossKey(g).charAt(0).toUpperCase(); if (L !== curL){ groups.push([L, L, []]); curL = L; } groups[groups.length - 1][2].push(g); });
  const az = $('gloss-az');
  az.replaceChildren(...groups.map(([id, lab]) => el('a', {href:'#gl-' + id, onclick:e => { e.preventDefault(); const t = document.getElementById('gl-' + id); if (t) t.scrollIntoView({behavior:reduceMotion ? 'auto' : 'smooth'}); }}, id === 'Signes' ? '§' : lab)));
  const out = [];
  for (const [id, lab, gs] of groups){
    out.push(el('h3', {class:'gl-l', id:'gl-' + id}, lab));
    for (const g of gs){
      const n = g.n && byId.get(g.n);
      const uses = (glossUses.get(g.id) || []).filter(m => m !== n);
      out.push(el('article', {class:'gl', id:'g-' + g.id},
        el('h3', null, g.t), el('span', {class:'gc'}, GLOSS_CAT[g.c]),
        el('p', null, rich(g.d, {terms:false, self:g.n})),
        n ? el('div', {class:'jumps'}, el('button', {type:'button', class:'jump', 'data-id':n.i}, markEl(n.T, n.H, n.K, true), 'Voir dans l’arbre : ' + n.n)) : null,
        uses.length ? el('div', {class:'seen-in'}, 'Expliqué dans ' + plural(uses.length, 'fiche', 'fiches') + ' : ',
          ...uses.slice(0, 8).flatMap((m, i) => [i ? ', ' : '', el('button', {type:'button', 'data-id':m.i}, m.n)]), uses.length > 8 ? '…' : '') : null));
    }
  }
  if (!list.length) out.push(el('p', {class:'intro'}, 'Aucun mot ne correspond.'));
  $('gloss-l').replaceChildren(...out);
}
function flashGloss(id){
  if (glossCur !== 'all' || $('gq').value){
    glossCur = 'all'; $('gq').value = '';
    document.querySelectorAll('#gloss-f .chip').forEach((b, i) => b.setAttribute('aria-pressed', String(i === 0)));
    paintGloss();
  }
  requestAnimationFrame(() => {
    const t = document.getElementById('g-' + id); if (!t) return;
    t.scrollIntoView({block:'start', behavior:'auto'});
    t.classList.add('flash'); setTimeout(() => t.classList.remove('flash'), 1800);
  });
}

/* ---------- recherche ---------- */
const qIn = $('q'), qRes = $('qres');
let hits = [], hi = -1;
function closeRes(){ qRes.hidden = true; qIn.setAttribute('aria-expanded', 'false'); qIn.removeAttribute('aria-activedescendant'); }
function closeSearch(){ closeRes(); document.body.classList.remove('searching'); }
function paintRes(){
  qRes.replaceChildren();
  if (!hits.length) qRes.append(el('li', {class:'none'}, 'Aucun résultat. Essayez un autre nom ou une autre orthographe.'));
  let grp = null;
  hits.forEach((h, i) => {
    if (h.g !== grp){ grp = h.g; qRes.append(el('li', {class:'grp-t', role:'presentation'}, grp === 'n' ? 'Dans l’arbre' : grp === 'g' ? 'Lexique' : 'Parcours')); }
    const sel_ = String(i === hi);
    const pickIt = e => { e.preventDefault(); pick(h); };
    if (h.g === 'n'){
      const n = h.v;
      qRes.append(el('li', {class:'opt', role:'option', id:'opt-' + i, 'aria-selected':sel_, onmousedown:pickIt, onclick:pickIt},
        markEl(n.T, n.H, n.K, true), el('span', {class:'rn'}, n.n), el('span', {class:'rd'}, [n.d, n.a].filter(Boolean).join(' · ') || T_SHORT[n.T])));
    } else if (h.g === 'g'){
      const g = h.v;
      qRes.append(el('li', {class:'opt', role:'option', id:'opt-' + i, 'aria-selected':sel_, onmousedown:pickIt, onclick:pickIt},
        el('span', {class:'gi', 'aria-hidden':'true'}, 'Aa'), el('span', {class:'rn'}, g.t), el('span', {class:'rd'}, firstSentence(g.d))));
    } else {
      const t = h.v;
      qRes.append(el('li', {class:'opt', role:'option', id:'opt-' + i, 'aria-selected':sel_, onmousedown:pickIt, onclick:pickIt},
        el('span', {class:`gi t-${t.c}`, 'aria-hidden':'true'}, '▶'), el('span', {class:'rn'}, t.t), el('span', {class:'rd'}, t.s + ' · ' + plural(t.steps.length, 'étape', 'étapes'))));
    }
  });
  qRes.hidden = false; qIn.setAttribute('aria-expanded', 'true');
  if (hi >= 0){ qIn.setAttribute('aria-activedescendant', 'opt-' + hi); const o = $('opt-' + hi); if (o && o.scrollIntoView) o.scrollIntoView({block:'nearest'}); }
}
function pick(h){
  qIn.value = ''; qIn.blur(); closeSearch();
  if (h.g === 'n') go('#/arbre/' + h.v.i);
  else if (h.g === 'g') go('#/lexique/' + h.v.id);
  else startTour(h.v.id);
}
qIn.addEventListener('input', () => {
  const q = norm(qIn.value.trim());
  if (q.length < 2){ closeRes(); return; }
  const occ = n => n.tkey.split(q).length - 1;
  const rank = n => n.nkey.startsWith(q) ? 0 : n.nkey.includes(q) ? 1 : n.key.includes(q) ? 2 : n.tkey.includes(q) ? 3 : 9;
  const nodes = ALL.map(n => [rank(n), n]).filter(r => r[0] < 9)
    .sort((a, b) => (a[0] - b[0]) || (a[0] === 3 ? occ(b[1]) - occ(a[1]) || a[1].ix - b[1].ix : a[1].n.length - b[1].n.length))
    .slice(0, 12).map(r => ({g:'n', v:r[1]}));
  const gl = GLOSSARY.map(g => { const t = norm(g.t), m = norm(g.m.join(' ')); return [t.startsWith(q) ? 0 : t.includes(q) || m.includes(q) ? 1 : 9, g]; })
    .filter(r => r[0] < 9).sort((a, b) => a[0] - b[0]).slice(0, 5).map(r => ({g:'g', v:r[1]}));
  const tr = TOURS.filter(t => norm(t.t + ' ' + t.s).includes(q)).slice(0, 3).map(t => ({g:'t', v:t}));
  hits = [...nodes, ...gl, ...tr];
  hi = hits.length ? 0 : -1; paintRes();
});
qIn.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown' && hits.length){ hi = Math.min(hits.length - 1, hi + 1); paintRes(); e.preventDefault(); }
  else if (e.key === 'ArrowUp' && hits.length){ hi = Math.max(0, hi - 1); paintRes(); e.preventDefault(); }
  else if (e.key === 'Enter' && hits[hi] && !qRes.hidden){ pick(hits[hi]); e.preventDefault(); }
  else if (e.key === 'Escape'){ if (!qRes.hidden) closeRes(); else closeSearch(); }
});
qIn.addEventListener('blur', () => setTimeout(() => { if (!narrow()) closeRes(); }, 150));
$('qopen').addEventListener('click', () => { document.body.classList.add('searching'); qIn.focus(); });
$('qclose').addEventListener('click', () => { qIn.value = ''; closeSearch(); });

/* ---------- fenêtre modale ---------- */
let modalReturn = null, idleQ = [];
const whenIdle = fn => { if (modal.hidden) fn(); else idleQ.push(fn); };
function openModal(kind, content){
  modalReturn = document.activeElement;
  modal.dataset.kind = kind;
  modalIn.replaceChildren(el('button', {type:'button', class:'ibtn m-x', 'aria-label':'Fermer', onclick:() => closeModal()}, ico('close')), content);
  modal.hidden = false;
  modalIn.scrollTop = 0;
  modalIn.focus({preventScroll:true});
}
function closeModal(silent){
  if (modal.hidden) return;
  const kind = modal.dataset.kind;
  modal.hidden = true; modalIn.replaceChildren();
  if (kind === 'welcome'){ store.welcomed = true; save(); }
  if (!silent && kind === 'quiz' && location.hash === '#/quiz') go('#/apprendre', {replace:true});
  if (modalReturn && modalReturn.focus) modalReturn.focus({preventScroll:true});
  const q = idleQ; idleQ = []; setTimeout(() => q.forEach(f => f()), 400);
}
modal.addEventListener('pointerdown', e => { if (e.target === modal) closeModal(); });

/* ---------- accueil ---------- */
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const standalone = () => mq('(display-mode: standalone)').matches || navigator.standalone === true;
function welcomeArt(){
  const s = el('div', {class:'w-art', 'aria-hidden':'true'});
  s.innerHTML = `<svg viewBox="0 0 560 170" preserveAspectRatio="xMidYMax meet">
    <g fill="none" stroke-linecap="round" stroke-width="3">
      <path d="M280 170V112" stroke="var(--c-c)" stroke-width="5"/>
      <path d="M280 112C280 70 150 92 120 42" stroke="var(--c-j)"/><path d="M280 112C280 74 268 60 280 26" stroke="var(--c-x)"/><path d="M280 112C280 70 410 92 440 42" stroke="var(--c-m)"/>
      <path d="M120 42C110 26 80 30 62 20M120 42C126 24 150 20 160 10" stroke="var(--c-j)" stroke-dasharray="6 6" opacity=".7"/>
      <path d="M280 26C270 12 250 12 236 6M280 26C290 12 310 12 324 6" stroke="var(--c-x)" stroke-dasharray="6 6" opacity=".7"/>
      <path d="M440 42C434 24 410 20 400 10M440 42C450 26 480 30 498 20" stroke="var(--c-m)" stroke-dasharray="6 6" opacity=".7"/>
    </g>
    <circle cx="280" cy="112" r="9" fill="var(--c-c)"/><circle cx="120" cy="42" r="10" fill="var(--c-j)"/><circle cx="280" cy="26" r="10" fill="var(--c-x)"/><circle cx="440" cy="42" r="10" fill="var(--c-m)"/>
    <g fill="var(--surface)" stroke-width="2.5"><circle cx="62" cy="20" r="6" stroke="var(--c-j)"/><circle cx="160" cy="10" r="6" stroke="var(--c-j)"/><circle cx="236" cy="6" r="6" stroke="var(--c-x)"/><circle cx="324" cy="6" r="6" stroke="var(--c-x)"/><circle cx="400" cy="10" r="6" stroke="var(--c-m)"/><circle cx="498" cy="20" r="6" stroke="var(--c-m)"/></g>
  </svg>`;
  return s;
}
function openWelcome(){
  const t = TOUR.get('origines');
  openModal('welcome', el('div', {class:'welcome'}, welcomeArt(),
    el('div', {class:'w-b'},
      el('h2', {id:'modal-t'}, 'Bienvenue dans l’arbre des trois monothéismes'),
      el('p', {class:'w-lead'}, 'D’Adam aux courants d’aujourd’hui, ' + ALL.length + ' personnes, mouvements et événements du judaïsme, du christianisme et de l’islam — avec, pour chacun, ce que disent les traditions et ce que confirme l’histoire.'),
      howTo(),
      el('div', {class:'w-act'},
        el('button', {type:'button', class:'btn big pri', onclick:() => { closeModal(); startTour(t.id); }}, ico('play'), 'Parcours guidé : ' + t.t),
        el('button', {type:'button', class:'btn big', onclick:() => closeModal()}, 'Explorer librement')),
      isIOS && !standalone() ? el('p', {class:'w-ios'}, 'Astuce : pour l’installer comme une application, touchez le bouton Partager de Safari puis « Sur l’écran d’accueil ». Elle fonctionne ensuite hors connexion.') : null)));
}
$('helpBtn').addEventListener('click', () => { if (narrow()) openWelcome(); else go('#/guide'); });

/* ---------- quiz ---------- */
const qz = {n:0, score:0, streak:0, cur:null, used:new Set(), answered:false};
function arabicName(n){
  if (!n.a || /⚭/.test(n.n)) return null;
  for (const p of n.a.split(' · ')){
    const m = p.match(/^(.*?)\s\(ar\.[^)]*\)/);
    if (m && !/\?/.test(m[1])) return m[1].trim();
  }
  return null;
}
const isAnc = (a, n) => { for (let x = n.parent; x; x = x.parent) if (x === a) return true; return false; };
const GEN = {
  parent(){
    const pool = ALL.filter(n => n.parent && n.parent.parent && n.K === 'p' && n.parent.K === 'p' && (n.L === 'f' || n.L === 'g')
      && !/[→·&]/.test(n.n) && !norm(n.n).includes(norm(n.parent.n.split(/\s/)[0])));
    const n = rand(pool), p = n.parent;
    let cands = ALL.filter(m => m !== p && m !== n && m.K === 'p' && m.children.length && m.T === n.T && !isAnc(m, n) && !/[→]/.test(m.n));
    if (cands.length < 3) cands = ALL.filter(m => m !== p && m !== n && m.K === 'p' && m.children.length);
    const opts = shuffle([p, ...sample(cands, 3)]);
    return {key:'p' + n.i, q:(n.L === 'g' ? 'Dans l’arbre, de quel ancêtre (générations omises) « ' : 'Dans l’arbre, qui est le parent de « ') + n.n + ' »' + (n.L === 'g' ? ' est-il issu ?' : ' ?'),
      opts:opts.map(o => o.n), ans:opts.indexOf(p), id:n.i, explain:n.n + ' est rattaché(e) à ' + p.n + ' (' + L_LABEL[n.L] + ').'};
  },
  arabic(){
    const pool = ALL.filter(n => arabicName(n) && !norm(n.n).includes(norm(arabicName(n)).slice(0, 4)));
    const n = rand(pool), a = arabicName(n);
    const others = sample(pool.filter(m => m !== n).map(arabicName).filter(x => x !== a), 3);
    const opts = shuffle([a, ...others]);
    return {key:'a' + n.i, q:'Quel est le nom arabe — celui du Coran ou de la tradition musulmane — de « ' + n.n + ' » ?', opts, ans:opts.indexOf(a), id:n.i,
      explain:n.n + ' se dit ' + a + ' en arabe. Autres noms : ' + n.a + '.'};
  },
  hist(){
    const pool = ALL.filter(n => n.h && n.K === 'p' && (n.e || n.h === 'T') && !/[→·&⚭]/.test(n.n));
    const n = rand(pool);
    const opts = H_ORDER.map(h => H_LONG[h]);
    return {key:'h' + n.i, q:'D’après les historiens, l’existence de « ' + n.n + ' » est…', opts, ans:H_ORDER.indexOf(n.H), id:n.i,
      explain:n.e ? firstSentence(n.e) : 'Aucune source extérieure ne le mentionne : c’est une figure de la tradition.'};
  },
  date(){
    const c = rand(CONF), y = yearOf(c.d);
    const pool = shuffle(CONF.filter(o => o !== c && Math.abs(yearOf(o.d) - y) > 120));
    const picked = [];
    for (const o of pool){ if (picked.every(p => Math.abs(yearOf(p.d) - yearOf(o.d)) > 80)) picked.push(o); if (picked.length === 3) break; }
    const opts = shuffle([c, ...picked]);
    return {key:'d' + c.n, q:'Quand a eu lieu : « ' + c.n + ' » ?', opts:opts.map(o => o.d), ans:opts.indexOf(c), id:c.ids[0], explain:c.x};
  },
  evid(){
    const pool = EVID.filter(e => e.c !== 'neg');
    const e = rand(pool);
    const opts = shuffle([e, ...sample(pool.filter(o => o !== e && o.n !== e.n), 3)]);
    return {key:'e' + e.n, q:'Quelle découverte nous apprend ceci : « ' + e.a + ' »', opts:opts.map(o => o.n), ans:opts.indexOf(e), id:e.id,
      explain:e.n + ' (' + e.d + ', ' + e.w + ').' + (e.lim && e.lim !== '—' ? ' Limite : ' + e.lim : '')};
  },
  gloss(){
    const pool = GLOSSARY.filter(g => g.c !== 'sym' && g.m.length);
    const g = rand(pool);
    const short = x => { const s = firstSentence(x.d); return s.length > 140 ? s.slice(0, 130).replace(/\s+\S*$/, '') + '…' : s; };
    const same = pool.filter(o => o !== g && o.c === g.c);
    const opts = shuffle([g, ...sample(same.length >= 3 ? same : pool.filter(o => o !== g), 3)]);
    return {key:'g' + g.id, q:'Que signifie « ' + g.t + ' » ?', opts:opts.map(short), ans:opts.indexOf(g), id:g.n || null, gid:g.id, explain:g.d};
  },
  xlink(){
    const pool = XLINKS.filter(l => l[3].length > 14 && !/^(Épouse|Époux)/.test(l[3]));
    const l = rand(pool), A = byId.get(l[0]), B = byId.get(l[1]);
    const opts = shuffle([l[3], ...sample(pool.filter(o => o !== l).map(o => o[3]), 3)]);
    return {key:'x' + l[0] + l[1], q:'Quel lien unit « ' + A.n + ' » et « ' + B.n + ' » ?', opts, ans:opts.indexOf(l[3]), id:A.i,
      explain:A.n + ' et ' + B.n + ' : ' + l[3] + (l[2] === 'c' ? ' (confrontation).' : ' (lien).')};
  }
};
const QZ_ORDER = ['parent', 'arabic', 'date', 'gloss', 'evid', 'hist', 'xlink', 'date', 'gloss', 'parent'];
let qzPlan = [];
function openQuiz(){
  qz.n = 0; qz.score = 0; qz.streak = 0; qz.used = new Set();
  qzPlan = shuffle(QZ_ORDER);
  nextQuestion();
}
function nextQuestion(){
  if (qz.n >= 10){ endQuiz(); return; }
  let q = null;
  for (let tries = 0; tries < 30; tries++){
    try { q = GEN[qzPlan[qz.n]](); } catch(_e){ q = null; }
    if (q && q.ans >= 0 && q.opts.length === 4 && new Set(q.opts).size === 4 && !qz.used.has(q.key)) break;
    q = null;
  }
  if (!q){ qzPlan[qz.n] = 'date'; return nextQuestion(); }
  qz.used.add(q.key); qz.cur = q; qz.answered = false;
  paintQuiz();
}
function paintQuiz(){
  const q = qz.cur;
  const opts = el('div', {class:'qz-o'}, q.opts.map((o, i) => el('button', {type:'button', 'data-i':i, onclick:() => answer(i)}, el('span', {class:'k'}, 'ABCD'[i]), el('span', null, o))));
  openModal('quiz', el('div', {class:'quiz'},
    el('div', {class:'qz-h'}, ico('trophy'), el('span', null, 'Quiz'), el('span', {class:'sp'}), el('span', null, 'Question ' + (qz.n + 1) + '/10'), el('b', null, qz.score + ' pt' + (qz.score > 1 ? 's' : ''))),
    el('div', {class:'qz-bar'}, el('i', {style:'width:' + (qz.n * 10) + '%'})),
    el('h3', {id:'modal-t'}, q.q), opts, el('div', {class:'qz-fb', 'aria-live':'polite'})));
}
function answer(i){
  if (qz.answered) return;
  qz.answered = true;
  const q = qz.cur, ok = i === q.ans;
  if (ok){ qz.score++; qz.streak++; } else qz.streak = 0;
  const bs = modalIn.querySelectorAll('.qz-o button');
  bs.forEach((b, j) => { b.disabled = true; if (j === q.ans) b.classList.add('good'); else if (j === i) b.classList.add('bad'); });
  const n = q.id && byId.get(q.id);
  modalIn.querySelector('.qz-fb').replaceChildren(
    el('div', {class:'qz-e'}, el('b', null, ok ? (qz.streak >= 3 ? 'Bravo, ' + qz.streak + ' d’affilée ! ' : 'Bonne réponse ! ') : 'Pas tout à fait. '), q.explain),
    el('div', {class:'qz-n'},
      n ? el('button', {type:'button', class:'btn', onclick:() => { closeModal(true); go('#/arbre/' + n.i); }}, ico('book'), 'Voir la fiche') :
        q.gid ? el('button', {type:'button', class:'btn', onclick:() => { closeModal(true); go('#/lexique/' + q.gid); }}, ico('gloss'), 'Lexique') : el('span'),
      el('button', {type:'button', class:'btn pri', onclick:() => { qz.n++; nextQuestion(); }}, qz.n >= 9 ? 'Résultat' : 'Question suivante', ico('next'))));
  const pri = modalIn.querySelector('.qz-n .btn.pri'); if (pri) pri.focus({preventScroll:true});
  modalIn.scrollTop = modalIn.scrollHeight;
}
function endQuiz(){
  const s = qz.score, best = Math.max(store.quizBest || 0, s), rec = s > (store.quizBest || 0);
  store.quizBest = best; save();
  const msg = s >= 9 ? 'Exceptionnel ! Vous connaissez l’arbre sur le bout des doigts.' : s >= 7 ? 'Très bien ! Encore quelques branches à explorer.'
    : s >= 4 ? 'Pas mal ! Un parcours guidé vous aidera à aller plus loin.' : 'Un bon début : chaque erreur est une fiche à découvrir.';
  openModal('quiz', el('div', {class:'quiz'}, el('div', {class:'qz-end'},
    el('div', {class:'qz-h', style:'justify-content:center;padding:0'}, ico('trophy'), el('span', null, 'Résultat')),
    el('div', {class:'qz-score', id:'modal-t'}, s + '/10'),
    el('p', null, msg), el('p', null, rec && s ? 'Nouveau record !' : 'Votre record : ' + best + '/10'),
    el('div', {class:'jumps'}, el('button', {type:'button', class:'btn pri big', onclick:openQuiz}, ico('dice'), 'Rejouer'),
      el('button', {type:'button', class:'btn big', onclick:() => { closeModal(true); startTour(nextTour().id); }}, ico('route'), 'Un parcours')))));
}

/* ---------- clavier ---------- */
document.addEventListener('keydown', e => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement && document.activeElement.tagName);
  if (!modal.hidden){
    if (e.key === 'Escape') closeModal();
    else if (modal.dataset.kind === 'quiz' && !typing && /^[1-4a-dA-D]$/.test(e.key) && !qz.answered && qz.cur){ answer('1234'.includes(e.key) ? +e.key - 1 : 'abcd'.indexOf(e.key.toLowerCase())); }
    return;
  }
  if ((e.key === '/' || (e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey))) && !typing){ e.preventDefault(); if (narrow()) document.body.classList.add('searching'); qIn.focus(); }
  else if (e.key === 'Escape' && !typing){
    if (!pop.hidden) hidePop();
    else if (narrow() && panel.classList.contains('open')) closeSheet();
    else if (sel) go('#/arbre', {replace:true});
  } else if (!typing && sel && document.body.dataset.view === 'tree' && (e.key === 'j' || e.key === 'k') && sel.parent){
    const sibs = sel.parent.children, i = sibs.indexOf(sel) + (e.key === 'j' ? 1 : -1);
    if (sibs[i]) go('#/arbre/' + sibs[i].i);
  }
});

/* ---------- thème ---------- */
const darkMq = mq('(prefers-color-scheme: dark)');
const isDark = () => document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : darkMq.matches;
function paintTheme(){
  const d = isDark();
  $('themeBtn').replaceChildren(ico(d ? 'sun' : 'moon'));
  $('themeBtn').title = d ? 'Passer en thème clair' : 'Passer en thème sombre';
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.setAttribute('content', d ? '#13161D' : '#F3F1EB'));
  readColors(); drawMini();
}
$('themeBtn').addEventListener('click', () => {
  const t = isDark() ? 'light' : 'dark';
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem('arbre3m.theme', t); } catch(_e){}
  paintTheme();
});
if (darkMq.addEventListener) darkMq.addEventListener('change', paintTheme);

/* ---------- installation et hors-ligne ---------- */
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; $('installBtn').hidden = false; });
$('installBtn').addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  try { await deferredPrompt.userChoice; } catch(_e){}
  deferredPrompt = null; $('installBtn').hidden = true;
});
window.addEventListener('appinstalled', () => { $('installBtn').hidden = true; toast('Application installée'); });
if ('serviceWorker' in navigator && location.protocol !== 'file:'){
  window.addEventListener('load', () => {
    const first = !navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js').then(reg => {
      if (!first) return;
      const w = reg.installing || reg.waiting;
      if (w) w.addEventListener('statechange', () => { if (w.state === 'activated') whenIdle(() => toast('Prête à fonctionner hors connexion')); });
    }).catch(() => {});
  });
}

/* ---------- démarrage ---------- */
readColors(); paintTheme(); updateProgress();
readVp();
collapseToTrunk(true);
addHints();
if (!history.state) history.replaceState({i:0}, '', location.hash || '#/arbre');
route(true);
if (!store.welcomed && (!location.hash || location.hash === '#/arbre')) setTimeout(openWelcome, 350);
let rT = 0;
window.addEventListener('resize', () => {
  clearTimeout(rT);
  rT = setTimeout(() => { readVp(); sizeMini(); drawMini(); document.body.classList.toggle('sheet', narrow() && panel.classList.contains('open')); }, 80);
});
function remeasure(){ ALL.forEach(n => { n.lw = 0; }); if (document.body.dataset.view === 'tree') render(); }
if (document.fonts){
  if (document.fonts.ready) document.fonts.ready.then(remeasure);
  if (document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', remeasure);
}
})();
