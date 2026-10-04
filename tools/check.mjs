// Vérifie la cohérence des données et des fichiers avant le déploiement : node tools/check.mjs
import {readFileSync, existsSync} from 'fs';
import vm from 'vm';

const root = new URL('../', import.meta.url);
const read = f => readFileSync(new URL(f, root), 'utf8');
const errors = [];
const fail = msg => errors.push(msg);

const ctx = {};
vm.createContext(ctx);
for (const f of ['js/data.js', 'js/content.js', 'js/rich.js']) vm.runInContext(read(f), ctx, {filename:f});
const get = name => vm.runInContext(name, ctx);
const NODES = get('NODES'), XLINKS = get('XLINKS'), EVID = get('EVID'), CONF = get('CONF');
const GLOSSARY = get('GLOSSARY'), GLOSS_CAT = get('GLOSS_CAT'), TOURS = get('TOURS');
const MENTION_ADD = get('MENTION_ADD'), MENTION_NODE_MAP = get('MENTION_NODE_MAP');

// arbre
const ids = new Map();
let roots = 0;
for (const n of NODES){
  if (!n.i || !n.n) fail(`entrée sans identifiant ou sans nom : ${JSON.stringify(n).slice(0, 80)}`);
  if (ids.has(n.i)) fail(`identifiant en double : ${n.i}`);
  ids.set(n.i, n);
  if (!n.p) roots++;
}
if (roots !== 1) fail(`l'arbre doit avoir une seule racine (trouvé : ${roots})`);
for (const n of NODES) if (n.p && !ids.has(n.p)) fail(`parent introuvable pour ${n.i} : ${n.p}`);
for (const n of NODES){
  const seen = new Set();
  for (let a = n; a && a.p; a = ids.get(a.p)){ if (seen.has(a.i)){ fail(`boucle dans l'arbre autour de ${n.i}`); break; } seen.add(a.i); }
  if (n.t && !'cjxmon'.includes(n.t)) fail(`tradition inconnue pour ${n.i} : ${n.t}`);
  if (n.h && !'AHDT'.includes(n.h)) fail(`historicité inconnue pour ${n.i} : ${n.h}`);
  if (n.k && !'pme'.includes(n.k)) fail(`nature inconnue pour ${n.i} : ${n.k}`);
  if (n.l && !'fgsra'.includes(n.l)) fail(`type de trait inconnu pour ${n.i} : ${n.l}`);
}
const need = (id, where) => { if (!ids.has(id)) fail(`${where} : entrée introuvable « ${id} »`); };
XLINKS.forEach(([a, b, t], i) => { need(a, `lien ${i}`); need(b, `lien ${i}`); if (!'cl'.includes(t)) fail(`lien ${i} : type inconnu ${t}`); });
EVID.forEach((e, i) => need(e.id, `preuve ${i} (${e.n})`));
CONF.forEach((c, i) => c.ids.forEach(id => need(id, `confrontation ${i} (${c.n})`)));

// lexique, parcours, liens automatiques
const gids = new Set();
for (const g of GLOSSARY){
  if (gids.has(g.id)) fail(`terme en double dans le lexique : ${g.id}`);
  gids.add(g.id);
  if (!GLOSS_CAT[g.c]) fail(`catégorie inconnue pour le terme ${g.id} : ${g.c}`);
  if (g.n) need(g.n, `lexique ${g.id}`);
  if (!g.d || !g.t) fail(`terme incomplet : ${g.id}`);
}
const tids = new Set();
for (const t of TOURS){
  if (tids.has(t.id)) fail(`parcours en double : ${t.id}`);
  tids.add(t.id);
  t.steps.forEach(([id], i) => need(id, `parcours ${t.id}, étape ${i + 1}`));
}
for (const [s, id] of Object.entries(MENTION_ADD)) if (id) need(id, `mention « ${s} »`);
for (const [self, map] of Object.entries(MENTION_NODE_MAP)){
  need(self, 'MENTION_NODE_MAP');
  for (const id of Object.values(map)) if (id) need(id, `MENTION_NODE_MAP.${self}`);
}

// lecture enrichie : chaque texte doit se découper sans erreur
const rich = ctx.makeRich(NODES);
let stats = {r:0, g:0, m:0};
const texts = [];
NODES.forEach(n => ['x', 'e', 'f', 'd'].forEach(k => n[k] && texts.push([n.i, n[k]])));
EVID.forEach(e => texts.push([e.id, e.a], [e.id, e.lim]));
CONF.forEach(c => texts.push([c.ids[0], c.x]));
GLOSSARY.forEach(g => texts.push([g.n || null, g.d]));
TOURS.forEach(t => t.steps.forEach(([id, s]) => texts.push([id, s])));
for (const [self, t] of texts){
  try {
    const segs = rich.segments(t, {self});
    if (segs.map(s => s.s).join('') !== t) fail(`le découpage modifie le texte de ${self}`);
    for (const s of segs){
      if (s.k === 'r'){ stats.r++; rich.explain(s.ref); }
      if (s.k === 'g') stats.g++;
      if (s.k === 'm'){ stats.m++; if (!ids.has(s.id)) fail(`mention vers une entrée inconnue : ${s.id}`); }
    }
  } catch (e){ fail(`erreur de lecture enrichie (${self}) : ${e.message}`); }
}

// fichiers
const sw = read('sw.js');
for (const m of sw.matchAll(/'\.\/([^']*)'/g)){
  const f = m[1].replace(/\?.*$/, '');
  if (f && !existsSync(new URL(f, root))) fail(`sw.js : fichier manquant ${f}`);
}
const html = read('index.html');
for (const m of html.matchAll(/(?:href|src)="([^"#:]+?)(?:\?[^"]*)?"/g)){
  if (!existsSync(new URL(m[1], root))) fail(`index.html : fichier manquant ${m[1]}`);
}
const manifest = JSON.parse(read('manifest.webmanifest'));
for (const i of [...manifest.icons, ...(manifest.screenshots || [])]) if (!existsSync(new URL(i.src, root))) fail(`manifeste : fichier manquant ${i.src}`);

if (errors.length){
  console.error(`✗ ${errors.length} problème(s) :\n- ` + errors.join('\n- '));
  process.exit(1);
}
console.log(`✓ ${NODES.length} entrées, ${XLINKS.length} liens, ${EVID.length} preuves, ${CONF.length} confrontations, ` +
  `${GLOSSARY.length} termes, ${TOURS.length} parcours — ${stats.r} références, ${stats.g} termes et ${stats.m} noms reliés dans les textes.`);
