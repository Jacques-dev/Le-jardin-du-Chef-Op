// Générateur automatique de clips vidéo de 4 secondes avec Google Veo 3.1
// Usage : node outils/generer-videos.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env');
const vidDir = path.join(root, 'videos', 'techniques');
const promptsFile = path.join(__dirname, 'prompts-mouvements.json');

if (!fs.existsSync(vidDir)) fs.mkdirSync(vidDir, { recursive: true });

if (!fs.existsSync(envPath)) {
  console.error("❌ Fichier .env introuvable. Veuillez y placer GEMINI_API_KEY=...");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const keyMatch = envContent.match(/GEMINI_API_KEY=([^\r\n#]+)/);
if (!keyMatch) {
  console.error("❌ GEMINI_API_KEY introuvable dans le fichier .env");
  process.exit(1);
}
const apiKey = keyMatch[1].trim();

const prompts = JSON.parse(fs.readFileSync(promptsFile, 'utf8'));

const existingVids = new Set(
  fs.readdirSync(vidDir)
    .filter(f => f.endsWith('.mp4') || f.endsWith('.webm'))
    .map(f => path.basename(f, path.extname(f)))
);

const targetId = process.argv[2];
const toGenerate = targetId
  ? prompts.filter(p => p.id === targetId)
  : prompts.filter(p => !existingVids.has(p.id));

console.log("======================================================");
console.log("🎬 GÉNÉRATEUR VIDÉO DE MOUVEMENTS DE CAMÉRA (GOOGLE VEO 3.1)");
console.log("======================================================");
console.log(`📊 Vidéos existantes : ${existingVids.size}`);
console.log(`🎯 Vidéos à générer  : ${toGenerate.length}`);
console.log("======================================================\n");

if (toGenerate.length === 0) {
  console.log("✨ Toutes les vidéos de mouvements sont déjà générées !");
  import('./sync-photos.mjs');
  process.exit(0);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function generateVideo(item) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-fast-generate-preview:predictLongRunning?key=${apiKey}`;
  
  const cleanPrompt = `Pure continuous single take starting directly in motion from the very first frame. Uninterrupted continuous camera movement with constant smooth velocity throughout. Strictly no opening transition, no fade in from black, no cuts, no montage: ${item.prompt}`;

  const payload = {
    instances: [{ prompt: cleanPrompt }],
    parameters: {
      aspectRatio: '16:9',
      durationSeconds: 4,
      negativePrompt: 'transitions, cuts, fade in, fade out, black screen, opening fade, title cards, text overlay, morphing, montage, jump cut, crossfade, blurry, watermark'
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Erreur API (${res.status}) : ${errText}`);
  }

  const op = await res.json();
  if (!op.name) throw new Error("Réponse inattendue sans identifiant d'opération.");

  // Polling de l'opération
  const pollUrl = `https://generativelanguage.googleapis.com/v1beta/${op.name}?key=${apiKey}`;
  let attempts = 0;
  while (attempts < 40) {
    await sleep(8000);
    const pollRes = await fetch(pollUrl);
    if (!pollRes.ok) throw new Error(`Erreur polling (${pollRes.status})`);
    const pollData = await pollRes.json();
    
    if (pollData.done) {
      if (pollData.error) throw new Error(pollData.error.message || 'Erreur génération');
      const sample = pollData.response?.generateVideoResponse?.generatedSamples?.[0];
      const downloadUri = sample?.video?.uri;
      if (!downloadUri) throw new Error("Aucun lien de téléchargement trouvé dans le résultat.");
      
      // Téléchargement du fichier MP4
      const fullDownloadUrl = `${downloadUri}${downloadUri.includes('?') ? '&' : '?'}key=${apiKey}`;
      const dlRes = await fetch(fullDownloadUrl);
      if (!dlRes.ok) throw new Error(`Échec du téléchargement du fichier vidéo (${dlRes.status})`);
      const buffer = Buffer.from(await dlRes.arrayBuffer());
      const destPath = path.join(vidDir, `${item.id}.mp4`);
      fs.writeFileSync(destPath, buffer);
      return buffer.length;
    }
    attempts++;
  }
  throw new Error("Délai d'attente dépassé (timeout).");
}

let successes = 0, errors = 0;

for (let i = 0; i < toGenerate.length; i++) {
  const item = toGenerate[i];
  process.stdout.write(`[${i + 1}/${toGenerate.length}] 🎥 Génération de « ${item.nom} » (${item.id})... `);
  try {
    const bytes = await generateVideo(item);
    console.log(`✅ OK (${(bytes / 1024 / 1024).toFixed(1)} Mo)`);
    successes++;
  } catch (err) {
    console.log(`❌ Erreur : ${err.message}`);
    errors++;
  }
}

console.log("\n======================================================");
console.log(`🎉 Terminé : ${successes} vidéos générées avec succès (${errors} erreurs)`);
console.log("🔄 Synchronisation du site et du Service Worker...");
await import('./sync-photos.mjs');
