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
    prompt: "Cinematic 35mm film still, dramatic medium close-up bust portrait of a character in three-quarters view: head and body turned 35 degrees to the side relative to the camera. Authentic short lighting cinematography setup: the single key light is positioned on the far side turned away from the camera, illuminating only the narrow cheek in the distance. The broad side of the face facing the camera is in deep dramatic moody chiaroscuro shadow. Only the narrow far cheekbone and the crisp edge of the nose bridge catch the light, sculpting a dramatic slimming silhouette. Low ambient fill, atmospheric dark interior, 35mm grain, 16:9 widescreen. Not a profile view: clear three-quarter angle showing both eyes."
  },
  broad: {
    id: "broad",
    nom: "Éclairage large (broad)",
    prompt: "Cinematic 35mm film still, medium close-up portrait of a character in three-quarters view: head turned 35 degrees to the side relative to the camera in the exact same three-quarter pose as short lighting. Authentic broad lighting cinematography setup: the key light is placed on the camera side, illuminating the broad cheek that faces the camera. The wide cheek facing the lens is bathed in radiant light, making the face look full and open, while the narrow cheek receding into perspective falls into soft dimensional shadow. Warm intimate interior, cinematic portraiture, subtle 35mm grain, 16:9 widescreen. Not a frontal view, not a profile: three-quarters angle."
  },
  split: {
    id: "split",
    nom: "Éclairage divisé (split)",
    prompt: "Cinematic 35mm film still, intense medium close-up portrait of a character looking directly straight ahead into the camera lens, head-on frontal view. Authentic textbook split lighting setup: a single hard key light placed at exactly 90 degrees directly to one side of the face at eye level, with zero fill light on the opposite side. The vertical center of the face creates a razor-sharp division line down the forehead and nose: exactly half the face is illuminated in crisp high-contrast light, while the other entire half is plunged into pure velvety pitch-black darkness. Graphic film noir aesthetic conveying profound inner duality, rich blacks, 35mm film texture, 16:9 widescreen."
  },
  loop: {
    id: "loop",
    nom: "Éclairage en boucle (loop)",
    prompt: "Cinematic 35mm film still, medium close-up portrait of an actor facing towards the camera. Classic cinema portrait lighting: key light positioned at a 35-degree angle to the side and slightly elevated above eye level at 30 degrees, with soft fill light on the opposite side. The angled light creates natural facial modeling, casting a realistic subtle small diagonal drop shadow from the base of the nose pointing down towards the corner of the lip, leaving a wide clear illuminated patch on the cheek without connecting to the cheekbone shadow. High-end film cinematography, natural skin texture, Kodak Portra 35mm look, 16:9 widescreen. Negative rule: no drawn lines, no curly shapes, no figure-eight, no loops drawn on face, no tattoos, no symbols, pure realistic optical shadow only."
  },
  laterale: {
    id: "laterale",
    nom: "Lumière latérale rasante (raking)",
    prompt: "Cinematic 35mm film still, intense close-up portrait of a weathered, rugged character facing forward. Authentic raking side light cinematography setup (lumière latérale rasante): a hard, low-angle directional light positioned at a sharp 80-degree side angle skimming horizontally across the facial skin. The grazing light carves extreme tactile relief, exaggerating skin texture, pores, expression lines, and sculptural bone structure with dramatic micro-shadows. Gritty cinema realism, tactile high contrast, 35mm Kodak grain, 16:9 widescreen. Clean film frame: no text, no subtitles, no borders, no sprocket holes."
  }
};

const MODEL = 'models/gemini-3.1-flash-image';

export async function generateSchema(id, customSuffix = '') {
  const schema = SCHEMAS_PROMPTS[id];
  if (!schema) {
    console.error(`Inconnu: ${id}`);
    return null;
  }
  const prompt = customSuffix ? `${schema.prompt} ${customSuffix}` : schema.prompt;
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
