// Script dédié à la génération et validation des 6 schémas d'éclairage
// Usage: node outils/generer-schemas.mjs [technique_id]
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, '.env');
const imgDir = path.join(root, 'images', 'techniques');

if (!fs.existsSync(envPath)) {
  console.error("❌ Fichier .env manquant.");
  process.exit(1);
}

const env = fs.readFileSync(envPath, 'utf8');
const match = env.match(/GEMINI_API_KEY\s*=\s*(.+)/);
if (!match) {
  console.error("❌ Clé GEMINI_API_KEY introuvable.");
  process.exit(1);
}
const key = match[1].trim().replace(/^["']|["']$/g, '');

export const SCHEMAS_PROMPTS = {
  butterfly: {
    id: "butterfly",
    nom: "Éclairage papillon (Paramount)",
    prompt: "Cinematic 35mm film still, medium close-up glamour portrait of an elegant woman facing directly forward into the camera lens, eye-level, perfectly centered. Master cinematography Hollywood 1930s Paramount lighting setup: a single high key light positioned directly on camera axis elevated 50 degrees above the lens. High sculpted cheekbones and defined jawline, with a tiny, subtle, clean symmetrical downward shadow cast directly beneath the septum of the nose and a soft shadow under the lower lip. The nose shadow is small and discreet, never reaching the upper lip. Dark luxurious background with soft warm backlight separation, beautiful iris catchlights, Kodak 35mm film texture, 16:9 widescreen. Strict negative rule: no insect, no butterfly wings, no mustache, no face paint, no insect shapes on the skin."
  },
  short: {
    id: "short",
    nom: "Éclairage court (short)",
    prompt: "Cinematic 35mm film still, medium close-up bust portrait of a character in three-quarters view: head and gaze turned 30 degrees to the left. Pure textbook short lighting (éclairage court): a single powerful key light from the far left (-60 degrees) casts bright illumination onto the narrow far cheek and nose bridge. The broad cheek facing the camera (the right cheek) is in deep, pitch-black chiaroscuro shadow, with zero fill light. High contrast film noir cinematography: the entire camera-facing side of the face is black in shadow, only the far side of the face is brightly carved out by light. Dark background with subtle faint wall glow on the right. 35mm Kodak grain, 16:9 widescreen."
  },
  broad: {
    id: "broad",
    nom: "Éclairage large (broad)",
    prompt: "Cinematic 35mm film still portrait of authentic broad lighting (éclairage large). Bust portrait of an actor with body and shoulders facing forward and head turned 30 degrees to the left. A single directional key light is positioned on the front-right side of the frame (camera right, azimuth +45 degrees, elevated 30 degrees). The light illuminates the broad side of the face facing the camera (his left cheek, right side of image). The narrow receding side of his face (his right cheek, left side of image) is in soft shadow, with nose casting a shadow to the left. Warm studio portrait, Kodak 35mm grain, 16:9 widescreen."
  },
  split: {
    id: "split",
    nom: "Éclairage divisé (split)",
    prompt: "Cinematic 35mm film still, intense medium close-up portrait of a character looking directly straight ahead into the camera lens, head-on frontal view. Authentic textbook split lighting setup: a single hard key light placed at exactly 90 degrees on the right side of the frame (viewer's right) at eye level, with pitch darkness and zero fill on the left side. The vertical center of the face creates a razor-sharp division line down the forehead and nose: the right half of the face (viewer's right) is cleanly illuminated in crisp high-contrast light, while the left half of the face (viewer's left) is plunged into pure velvety pitch-black darkness. Graphic film noir aesthetic conveying profound inner duality, rich blacks, 35mm film texture, 16:9 widescreen."
  },
  loop: {
    id: "loop",
    nom: "Éclairage en boucle (loop)",
    prompt: "Cinematic 35mm film still, medium close-up portrait of an actor facing towards the camera in a moody dark cinematic interior studio. Classic cinema portrait lighting: key light is positioned on the right side of the frame (viewer's right) at a 32-degree angle and slightly elevated at 28 degrees. The light casts a subtle, realistic, small diagonal drop shadow from the base of the nose pointing down towards the left corner of the lip (viewer's left), leaving a clear illuminated area on the left cheek without connecting to the cheek shadow. Gentle fill light on the left side. High-end film cinematography, natural skin texture, Kodak Portra 35mm look, 16:9 widescreen. Negative rule: no drawn lines, no curly shapes, no figure-eight, no loops drawn on face, no tattoos, pure optical natural shadow only."
  },
  laterale: {
    id: "laterale",
    nom: "Lumière latérale rasante (raking)",
    prompt: "Cinematic 35mm film still, intense close-up portrait of a weathered, rugged character facing forward. Authentic raking side light cinematography setup (lumière latérale rasante): a single hard, low-angle directional light positioned at a sharp 80-degree angle on the right side of the frame (viewer's right, 12 degrees elevation) skimming horizontally across the facial skin from right to left. The right side of the face and cheek are raked by grazing light accentuating skin texture, deep wrinkles, and tactile relief, while casting horizontal relief shadows across towards the dark left side. Gritty cinema realism, tactile high contrast, 35mm Kodak grain, 16:9 widescreen. Clean film frame: no text, no subtitles, no borders, no sprocket holes."
  }
};

const MODEL = 'models/gemini-3.1-flash-image';

export async function generateSchema(id, customSuffix = '') {
  const schema = SCHEMAS_PROMPTS[id];
  if (!schema) {
    console.error(`Inconnu: ${id}`);
    return null;
  }
  const prompt = customSuffix || schema.prompt;
  console.log(`\n🎨 Génération pour : ${schema.nom} (${id})...`);
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
    console.error("Détail réponse API:", JSON.stringify(json, null, 2));
    throw new Error("Aucune image renvoyée par Gemini.");
  }

  const buf = Buffer.from(imgPart.inlineData.data, 'base64');
  const targetPath = path.join(imgDir, `${id}.jpg`);
  fs.writeFileSync(targetPath, buf);
  console.log(`✅ Image enregistrée : ${targetPath} (${Math.round(buf.length / 1024)} KB)`);
  return targetPath;
}

const targetArg = process.argv[2];
if (targetArg) {
  if (targetArg === 'all') {
    for (const id of Object.keys(SCHEMAS_PROMPTS)) {
      await generateSchema(id);
    }
  } else {
    await generateSchema(targetArg, process.argv.slice(3).join(' '));
  }
}
