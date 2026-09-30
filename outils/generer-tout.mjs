// Script de génération en chaîne pour toutes les fiches du site Le jardin du Chef Op
// Usage : node outils/generer-tout.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, '.env');
const imgDir = path.join(root, 'images', 'techniques');

if (!fs.existsSync(envPath)) {
  console.error("❌ Fichier .env manquant à la racine du projet.");
  process.exit(1);
}

const env = fs.readFileSync(envPath, 'utf8');
const match = env.match(/GEMINI_API_KEY\s*=\s*(.+)/);
if (!match) {
  console.error("❌ Clé GEMINI_API_KEY non trouvée dans .env.");
  process.exit(1);
}
const key = match[1].trim().replace(/^["']|["']$/g, '');

// Importe les techniques et les prompts
const { TECHNIQUES } = await import('../js/data/index.js');
let customPrompts = {};
try {
  const pPath = path.join(root, 'outils', 'prompts-techniques.json');
  if (fs.existsSync(pPath)) {
    const list = JSON.parse(fs.readFileSync(pPath, 'utf8'));
    for (const item of list) customPrompts[item.id] = item.prompt;
  }
} catch (e) {}

// Crée le dossier si besoin
if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });

// Identifie les techniques déjà illustrées
const existing = new Set(
  fs.readdirSync(imgDir)
    .filter(f => /\.(jpg|jpeg|webp|png)$/i.test(f))
    .map(f => path.basename(f, path.extname(f)))
);

const toGenerate = TECHNIQUES.filter(t => !existing.has(t.id));

console.log(`\n======================================================`);
console.log(`🎬 GÉNÉRATEUR AUTOMATIQUE DE PHOTOGRAMMES CINÉMA`);
console.log(`======================================================`);
console.log(`📊 Techniques déjà faites : ${existing.size}`);
console.log(`🎯 Techniques à générer   : ${toGenerate.length}`);
console.log(`======================================================\n`);

if (toGenerate.length === 0) {
  console.log("✨ Toutes les techniques sont déjà illustrées !");
  process.exit(0);
}

function buildPrompt(t) {
  if (customPrompts[t.id]) return customPrompts[t.id];
  return `A cinematic 35mm film still illustrating ${t.nom} (${t.en || ''}). ${t.resume || ''}. Cinematic movie still, authentic actors, expressive lighting, realistic director of photography look, Kodak 35mm grain, 16:9 widescreen aspect ratio.`;
}

const MODEL = 'models/gemini-3.1-flash-image';

async function generateOne(t) {
  const prompt = buildPrompt(t);
  const url = `https://generativelanguage.googleapis.com/v1beta/${MODEL}:generateContent?key=${key}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }]
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message || `HTTP ${res.status}`);
  }

  const parts = json.candidates?.[0]?.content?.parts || [];
  const imgPart = parts.find(p => p.inlineData?.data);
  if (!imgPart) {
    throw new Error("Aucune donnée d'image reçue dans la réponse.");
  }

  const buf = Buffer.from(imgPart.inlineData.data, 'base64');
  const targetPath = path.join(imgDir, `${t.id}.jpg`);
  fs.writeFileSync(targetPath, buf);
  return targetPath;
}

let done = 0;
let errors = 0;

for (let i = 0; i < toGenerate.length; i++) {
  const t = toGenerate[i];
  process.stdout.write(`[${i + 1}/${toGenerate.length}] 📸 Génération de « ${t.nom} » (${t.id})... `);
  try {
    await generateOne(t);
    done++;
    console.log(`✅ OK`);
  } catch (err) {
    errors++;
    console.log(`❌ Erreur : ${err.message}`);
    if (err.message.includes('Quota exceeded') || err.message.includes('429')) {
      console.log(`\n⚠️ Facturation non reliée ou quota atteint pour ${MODEL}.`);
      break;
    }
  }

  // Petite pause de 1 seconde entre chaque requête
  if (i < toGenerate.length - 1) {
    await new Promise(r => setTimeout(r, 1000));
  }
}

console.log(`\n======================================================`);
console.log(`🎉 Terminé : ${done} images générées avec succès (${errors} erreurs)`);
console.log(`🔄 Synchronisation du site et du Service Worker...`);
await import('./sync-photos.mjs');
console.log(`======================================================\n`);
