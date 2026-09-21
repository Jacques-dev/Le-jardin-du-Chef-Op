// Génère CARTOGRAPHIE.md (la cartographie complète en texte) à partir des données.
import fs from 'fs'; import path from 'path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const D = await import(path.join(root, 'js/data/index.js'));
let md = `# Cartographie — Le jardin du Chef Op\n\n${D.INTENTIONS.length} intentions · ${D.TECHNIQUES.length} techniques · force des liens de 1 (faible) à 3 (fort).\n\n## Intentions\n\n`;
for (const f of D.FAMILLES) {
  md += `### ${f.nom}\n\n`;
  for (const i of D.INTENTIONS.filter(i => i.famille === f.id)) {
    const top = D.PAR_INTENTION[i.id].filter(x => x.f >= 2).map(x => `${x.t.nom} (${x.f})`).join(', ');
    md += `- **${i.nom}** — ${i.desc}\n  - Techniques fortes : ${top || '—'}\n`;
  }
  md += '\n';
}
md += `## Techniques\n\n`;
for (const c of D.CATEGORIES) {
  md += `### ${c.nom}\n\n| Technique | Anglais | Effet | Intentions |\n|---|---|---|---|\n`;
  for (const t of D.TECHNIQUES.filter(t => t.cat === c.id))
    md += `| ${t.nom} | ${t.en} | ${t.resume} | ${Object.entries(t.effets).sort((a, b) => b[1] - a[1]).map(([i, f]) => `${D.I[i].nom.split(',')[0]} ${f}`).join(', ')} |\n`;
  md += '\n';
}
fs.writeFileSync(path.join(root, 'CARTOGRAPHIE.md'), md);
console.log('CARTOGRAPHIE.md écrit');
