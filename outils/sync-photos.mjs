// Synchronise automatiquement la liste PHOTOS dans js/data/index.js et met à jour le Service Worker
// Usage : node outils/sync-photos.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imgDir = path.join(root, 'images', 'techniques');
const indexFile = path.join(root, 'js', 'data', 'index.js');

if (!fs.existsSync(imgDir)) {
  fs.mkdirSync(imgDir, { recursive: true });
}

// Récupère la liste des id d'images présentes
const supportedExt = new Set(['.jpg', '.jpeg', '.webp', '.png']);
const ids = fs.readdirSync(imgDir)
  .filter(f => supportedExt.has(path.extname(f).toLowerCase()))
  .map(f => path.basename(f, path.extname(f)));

ids.sort();

console.log(`📸 ${ids.length} images trouvées dans images/techniques :`, ids.join(', '));

// Mise à jour de js/data/index.js
let content = fs.readFileSync(indexFile, 'utf8');
const photosRegex = /export const PHOTOS = new Set\(\[[^\]]*\]\);/;
const newPhotosLine = `export const PHOTOS = new Set(${JSON.stringify(ids)});`;

if (photosRegex.test(content)) {
  content = content.replace(photosRegex, newPhotosLine);
  fs.writeFileSync(indexFile, content, 'utf8');
  console.log(`✅ PHOTOS mis à jour dans js/data/index.js avec ${ids.length} techniques.`);
} else {
  console.warn('⚠️ Impossible de localiser la déclaration export const PHOTOS dans js/data/index.js');
}

// Régénération du Service Worker
import('./generer-sw.mjs');
