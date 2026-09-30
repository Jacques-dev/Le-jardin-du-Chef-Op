// Synchronise automatiquement la liste PHOTOS dans js/data/index.js et met à jour le Service Worker
// Usage : node outils/sync-photos.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imgDir = path.join(root, 'images', 'techniques');
const vidDir = path.join(root, 'videos', 'techniques');
const indexFile = path.join(root, 'js', 'data', 'index.js');

if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });
if (!fs.existsSync(vidDir)) fs.mkdirSync(vidDir, { recursive: true });

// Récupère la liste des id d'images présentes
const supportedImgExt = new Set(['.jpg', '.jpeg', '.webp', '.png']);
const imgIds = fs.readdirSync(imgDir)
  .filter(f => supportedImgExt.has(path.extname(f).toLowerCase()))
  .map(f => path.basename(f, path.extname(f)));
imgIds.sort();

// Récupère la liste des id de vidéos présentes
const supportedVidExt = new Set(['.mp4', '.webm']);
const vidIds = fs.readdirSync(vidDir)
  .filter(f => supportedVidExt.has(path.extname(f).toLowerCase()))
  .map(f => path.basename(f, path.extname(f)));
vidIds.sort();

console.log(`📸 ${imgIds.length} images trouvées dans images/techniques :`, imgIds.join(', '));
console.log(`🎥 ${vidIds.length} vidéos trouvées dans videos/techniques :`, vidIds.join(', '));

// Mise à jour de js/data/index.js
let content = fs.readFileSync(indexFile, 'utf8');
const photosRegex = /export const PHOTOS = new Set\(\[[^\]]*\]\);/;
const newPhotosLine = `export const PHOTOS = new Set(${JSON.stringify(imgIds)});`;

if (photosRegex.test(content)) {
  content = content.replace(photosRegex, newPhotosLine);
}

const videosRegex = /export const VIDEOS = new Set\(\[[^\]]*\]\);/;
const newVideosLine = `export const VIDEOS = new Set(${JSON.stringify(vidIds)});`;

if (videosRegex.test(content)) {
  content = content.replace(videosRegex, newVideosLine);
} else {
  // Insérer VIDEOS après PHOTOS
  content = content.replace(newPhotosLine, `${newPhotosLine}\nexport const VIDEOS = new Set(${JSON.stringify(vidIds)});`);
}

fs.writeFileSync(indexFile, content, 'utf8');
console.log(`✅ PHOTOS (${imgIds.length}) et VIDEOS (${vidIds.length}) mis à jour dans js/data/index.js.`);

// Régénération du Service Worker
import('./generer-sw.mjs');
