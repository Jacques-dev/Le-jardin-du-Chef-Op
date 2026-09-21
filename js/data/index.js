import { INTENTIONS, FAMILLES } from './intentions.js';
import { CADRE } from './cadre.js';
import { COMPO } from './compo.js';
import { MOUVEMENTS } from './mouvements.js';
import { LUMIERE } from './lumiere.js';

export const GROUPES = [
  { id: 'image', nom: 'Image', desc: 'Ce que la caméra cadre et comment.' },
  { id: 'mouvement', nom: 'Mouvement', desc: 'Comment la caméra se déplace.' },
  { id: 'lumiere', nom: 'Lumière', desc: 'Comment la scène est éclairée.' },
];

export const CATEGORIES = [
  { id: 'valeur', groupe: 'image', nom: 'Valeurs de plan', court: 'Plan', couleur: 'var(--c-valeur)' },
  { id: 'angle', groupe: 'image', nom: 'Angles & hauteur', court: 'Angle', couleur: 'var(--c-angle)' },
  { id: 'pdv', groupe: 'image', nom: 'Point de vue & configuration', court: 'Point de vue', couleur: 'var(--c-pdv)' },
  { id: 'compo', groupe: 'image', nom: 'Composition', court: 'Composition', couleur: 'var(--c-compo)' },
  { id: 'optique', groupe: 'image', nom: 'Optique & focale', court: 'Optique', couleur: 'var(--c-optique)' },
  { id: 'mouvement', groupe: 'mouvement', nom: 'Mouvements de caméra', court: 'Mouvement', couleur: 'var(--c-mouvement)' },
  { id: 'schema', groupe: 'lumiere', nom: 'Schémas d’éclairage', court: 'Schéma', couleur: 'var(--c-schema)' },
  { id: 'qualite', groupe: 'lumiere', nom: 'Qualité de lumière', court: 'Qualité', couleur: 'var(--c-qualite)' },
  { id: 'tonalite', groupe: 'lumiere', nom: 'Contraste & tonalité', court: 'Tonalité', couleur: 'var(--c-tonalite)' },
  { id: 'couleur', groupe: 'lumiere', nom: 'Couleur & température', court: 'Couleur', couleur: 'var(--c-couleur)' },
  { id: 'source', groupe: 'lumiere', nom: 'Sources & motivation', court: 'Source', couleur: 'var(--c-source)' },
];

export { INTENTIONS, FAMILLES };
export const TECHNIQUES = [...CADRE, ...COMPO, ...MOUVEMENTS, ...LUMIERE];

export const T = Object.fromEntries(TECHNIQUES.map(t => [t.id, t]));
export const I = Object.fromEntries(INTENTIONS.map(i => [i.id, i]));
export const C = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

// Axes du composeur : une catégorie = un choix (sauf composition et sources, facultatifs).
export const AXES = [
  { id: 'valeur', nom: 'Valeur de plan', cats: ['valeur'] },
  { id: 'angle', nom: 'Angle', cats: ['angle'] },
  { id: 'pdv', nom: 'Point de vue', cats: ['pdv'] },
  { id: 'compo', nom: 'Composition', cats: ['compo'] },
  { id: 'optique', nom: 'Optique', cats: ['optique'] },
  { id: 'mouvement', nom: 'Mouvement', cats: ['mouvement'] },
  { id: 'schema', nom: 'Schéma de lumière', cats: ['schema'] },
  { id: 'qualite', nom: 'Qualité', cats: ['qualite'] },
  { id: 'tonalite', nom: 'Tonalité', cats: ['tonalite'] },
  { id: 'couleur', nom: 'Couleur', cats: ['couleur'] },
  { id: 'source', nom: 'Source', cats: ['source'] },
];

// Relations intention -> techniques (index inverse)
export const PAR_INTENTION = {};
for (const i of INTENTIONS) PAR_INTENTION[i.id] = [];
for (const t of TECHNIQUES) {
  for (const [iid, f] of Object.entries(t.effets || {})) {
    if (PAR_INTENTION[iid]) PAR_INTENTION[iid].push({ t, f });
  }
}
for (const k in PAR_INTENTION) PAR_INTENTION[k].sort((a, b) => b.f - a.f || a.t.nom.localeCompare(b.t.nom));

const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export function recherche(q) {
  q = norm(q.trim());
  if (!q) return [];
  const res = [];
  for (const i of INTENTIONS) {
    const hay = norm(`${i.nom} ${i.en} ${i.desc}`);
    const score = norm(i.nom).includes(q) ? 3 : norm(i.en).includes(q) ? 2 : hay.includes(q) ? 1 : 0;
    if (score) res.push({ type: 'intention', item: i, score: score + 0.5 });
  }
  for (const t of TECHNIQUES) {
    const hay = norm(`${t.nom} ${t.en} ${t.abbr || ''} ${t.resume} ${t.desc}`);
    const score = norm(t.nom).includes(q) ? 3 : norm(t.en).includes(q) || norm(t.abbr || '') === q ? 2 : hay.includes(q) ? 1 : 0;
    if (score) res.push({ type: 'technique', item: t, score });
  }
  return res.sort((a, b) => b.score - a.score).slice(0, 30);
}
