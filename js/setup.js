// Logique du composeur : analyse d'un setup, rig combiné, vue 3D, encodage URL.
import { T, I, AXES, TECHNIQUES, PAR_INTENTION } from './data/index.js';

const clone = o => JSON.parse(JSON.stringify(o));

// ---------- Vue 3D associée aux techniques de cadre ----------
const ELEV = { 'angle-normal': 0, plongee: -28, 'plongee-totale': -75, 'contre-plongee': 22, 'contre-plongee-totale': 45, debulle: 0, 'hauteur-hanches': 12, 'hauteur-sol': 30 };
const MM = { 'tres-grand-angle': 16, 'grand-angle': 28, 'focale-normale': 50, 'teleobjectif-court': 85, teleobjectif: 180, anamorphique: 50, 'faible-profondeur': 85, 'profondeur-champ-large': 35, 'bascule-point': 85, 'split-diopter': 40, flare: 50 };
const FRAME = { tgpe: 4, pe: 2.6, pm: 2, pa: 1.3, pt: 0.95, pr: 0.62, gp: 0.36, tgp: 0.14, insert: 0.6, serre: 0.26 };
export function view3d(sel) {
  const v = { elev: 0, mm: 85, frame: 0.5 };
  if (sel.angle && ELEV[sel.angle] != null) v.elev = ELEV[sel.angle];
  if (sel.optique && MM[sel.optique]) v.mm = MM[sel.optique];
  if (sel.valeur && FRAME[sel.valeur]) v.frame = FRAME[sel.valeur];
  if (sel.compo === 'cadrage-serre') v.frame = 0.26;
  return v;
}
// Ouverture associée aux techniques d'optique (pour le flou d'arrière-plan)
const NSTOP = { 'faible-profondeur': 1.4, 'profondeur-champ-large': 11, 'teleobjectif-court': 2, teleobjectif: 2.8, 'bascule-point': 2, 'tres-grand-angle': 5.6, 'grand-angle': 4 };
export function viewForTechnique(t) {
  // Décor de rue + flou optique : on voit l'effet de la focale sur l'arrière-plan
  const base = { env: 'rue', dof: true, N: 2.8 };
  if (t.cat === 'angle') return { ...base, elev: ELEV[t.id] ?? 0, mm: 50, frame: 0.9 };
  if (t.cat === 'optique') return { ...base, elev: 0, mm: MM[t.id] || 50, frame: 0.9, N: NSTOP[t.id] || 2.8 };
  if (t.cat === 'valeur') return { ...base, elev: 0, mm: 50, frame: FRAME[t.id] || 0.6, N: 4 };
  return null;
}
// Réglage transmis du composeur au labo
export function labView(sel) {
  return { ...view3d(sel), dof: 1, N: NSTOP[sel.optique] || 2.8, env: sel.optique ? 'rue' : 'studio' };
}

// ---------- Rig combiné ----------
const DEFAULT_RIG = () => clone(T.loop.rig);
export function combineRig(sel) {
  let rig = sel.schema && T[sel.schema]?.rig ? clone(T[sel.schema].rig) : DEFAULT_RIG();
  const L = () => rig.lights;
  const key = () => L().find(l => l.r === 'key') || L()[0];
  const byRole = r => L().filter(l => l.r === r);
  // Source (peut remplacer l'éclairage)
  switch (sel.source) {
    case 'bougie': rig = clone(T.bougie.rig); break;
    case 'sources-pratiques': L().push(...clone(T['sources-pratiques'].rig.lights)); break;
    case 'fenetre': if (key()) Object.assign(key(), { s: 0.95, k: 5600, gobo: 'fenetre' }); break;
    case 'lumiere-naturelle': L().forEach(l => { if (!l.c) l.k = 5600; }); rig.amb = Math.max(rig.amb || 0, 0.12); break;
    case 'volumetrique': rig.haze = true; if (!byRole('back').length) L().push({ r: 'back', az: 150, el: 50, d: 2.2, i: 1.2, s: 0.05, k: 5600 }); break;
    case 'stores': if (key()) Object.assign(key(), { gobo: 'stores', s: 0.02 }); break;
    case 'stroboscope': if (key()) key().flick = 'strobe'; break;
    case 'lumiere-motivee': break;
  }
  // Qualité
  switch (sel.qualite) {
    case 'lumiere-dure': L().forEach(l => { if (l.r !== 'neg') l.s = Math.min(l.s ?? 0.3, 0.06); }); break;
    case 'lumiere-douce': L().forEach(l => { if (l.r === 'key' || l.r === 'fill') l.s = 1; }); break;
    case 'rebond': L().forEach(l => { if (l.r === 'key' || l.r === 'fill') l.s = 0.95; }); rig.amb = Math.max(rig.amb || 0, 0.1); break;
    case 'negative-fill': rig.lights = L().filter(l => l.r !== 'fill'); rig.amb = 0; { const k = key(); L().push({ r: 'neg', az: k ? -Math.sign(k.az || 1) * 70 : -70, el: 0, d: 1, i: 0, s: 1 }); } break;
    case 'tachetee': if (key()) Object.assign(key(), { gobo: 'feuilles', s: 0.05 }); break;
  }
  // Tonalité
  switch (sel.tonalite) {
    case 'high-key': {
      if (!byRole('fill').length) L().push({ r: 'fill', az: -(key()?.az || 40), el: 10, d: 2.2, i: 0.7, s: 1, k: key()?.k || 4300 });
      byRole('fill').forEach(l => l.i = Math.max(l.i, 0.7));
      rig.amb = Math.max(rig.amb || 0, 0.2); rig.bg = { ...(rig.bg || {}), i: 1.1 }; break;
    }
    case 'low-key': rig.lights = L().filter(l => l.r !== 'fill'); rig.amb = 0; rig.bg = { ...(rig.bg || {}), i: 0.02 }; break;
    case 'clair-obscur': rig.lights = L().filter(l => l.r !== 'fill' && l.r !== 'back'); rig.amb = 0; rig.bg = { i: 0 }; if (key()) key().s = Math.min(key().s ?? 0.3, 0.25); break;
    case 'surexposition': L().forEach(l => l.i = (l.i || 1) * 1.9); rig.amb = Math.max(rig.amb || 0, 0.3); rig.bg = { ...(rig.bg || {}), i: 2 }; break;
  }
  // Couleur
  if (sel.couleur && T[sel.couleur]?.rig) {
    const cr = T[sel.couleur].rig;
    const ck = cr.lights.find(l => l.r === 'key') || cr.lights[0];
    const cf = cr.lights.find(l => l.r === 'fill');
    const cb = cr.lights.find(l => l.r === 'back' || l.r === 'rim');
    const paint = (l, src) => { if (!src) return; delete l.c; delete l.k; if (src.c) l.c = src.c; else l.k = src.k; };
    L().forEach(l => {
      if (l.r === 'practical' || l.r === 'neg') return;
      if (l.r === 'key') paint(l, ck);
      else if (l.r === 'fill') paint(l, cf || ck);
      else paint(l, cb || ck);
    });
    if (['teal-orange', 'neon', 'nuit-bleue', 'heure-bleue', 'golden-hour'].includes(sel.couleur) && cb && !L().some(l => l.r === 'back' || l.r === 'rim')) L().push(clone(cb));
    rig.bg = { ...clone(cr.bg || {}), i: rig.bg?.i ?? cr.bg?.i ?? 0.2 };
    if (cr.haze) rig.haze = true;
  }
  return rig;
}

// ---------- Analyse ----------
export function selected(sel) { return AXES.map(a => sel[a.id] && T[sel[a.id]]).filter(Boolean); }
export function analyse(sel) {
  const techs = selected(sel);
  const score = {};
  for (const t of techs) for (const [i, f] of Object.entries(t.effets)) score[i] = (score[i] || 0) + f;
  const ranked = Object.entries(score).map(([id, s]) => ({ i: I[id], s })).sort((a, b) => b.s - a.s);
  const max = ranked[0]?.s || 1;
  // tensions : intentions fortes mutuellement opposées
  const strong = ranked.filter(r => r.s >= Math.max(3, max * 0.45)).map(r => r.i.id);
  const tensions = [];
  for (const a of strong) for (const b of I[a].oppose || []) if (strong.includes(b) && a < b) tensions.push([I[a], I[b]]);
  // brief par poste
  const postes = {};
  for (const t of techs) for (const [p, txt] of t.plateau || []) (postes[p] ||= []).push({ t, txt });
  return { techs, ranked, max, tensions, postes };
}

// ---------- Setup suggéré pour une intention ----------
export function suggest(intentionId) {
  const list = PAR_INTENTION[intentionId] || [];
  const sel = {};
  const need = { valeur: 1, angle: 1, optique: 1, mouvement: 1, schema: 1, qualite: 2, tonalite: 1, couleur: 2, compo: 2, pdv: 2, source: 2 };
  for (const { t, f } of list) {
    if (!sel[t.cat] && f >= (need[t.cat] || 2)) sel[t.cat] = t.id;
  }
  return sel;
}

// ---------- URL ----------
export function encodeSel(sel) {
  const p = new URLSearchParams();
  for (const a of AXES) if (sel[a.id]) p.set(a.id, sel[a.id]);
  return p.toString();
}
export function decodeSel(qs) {
  const p = new URLSearchParams(qs); const sel = {};
  for (const a of AXES) { const v = p.get(a.id); if (v && T[v] && a.cats.includes(T[v].cat)) sel[a.id] = v; }
  return sel;
}
export function encodeRig(rig) { return btoa(unescape(encodeURIComponent(JSON.stringify(rig)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
export function decodeRig(s) { try { return JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))))); } catch { return null; } }

export const LIGHT_PRESETS = TECHNIQUES.filter(t => t.rig);
