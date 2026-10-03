import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = fs.readFileSync(path.join(root, '.env'), 'utf8');
const key = env.match(/GEMINI_API_KEY\s*=\s*(.+)/)[1].trim().replace(/^["']|["']$/g, '');

const MODEL = 'models/gemini-3-pro-image';
const outDir = path.join(root, 'images', 'techniques');

export const NEW_TECHNIQUES = [
  {
    id: "reflet",
    nom: "Plan en reflet",
    prompt: "Cinematic 35mm movie film still, 16:9 widescreen, medium close-up shot. A melancholic character sitting by a rain-streaked window pane inside a quiet night café. The character's face is clearly visible as a luminous, poetic semi-transparent reflection in the dark wet glass, poetically superimposed over the blurry, dreamy amber streetlights and blue hour twilight city outside. Shallow depth of field focusing on the reflection, evocative emotional atmosphere, Wong Kar-wai and Edward Hopper aesthetic, beautiful Kodak 35mm film grain, no text, no borders."
  },
  {
    id: "yeux-egalite",
    nom: "Lignes des yeux alignées",
    prompt: "Cinematic 35mm film still, 16:9 widescreen, medium shot of three business partners or detectives sitting across a polished wooden conference table. Their heads are framed so that their eyelines are strictly aligned on the exact same horizontal level across the frame, creating perfect compositional symmetry and psychological equality. Crisp cinematic lighting, intense focused gazes, David Fincher cinematography, natural film grain, no text."
  },
  {
    id: "yeux-dominant",
    nom: "Regard dominant (ligne haute)",
    prompt: "Cinematic 35mm film still, 16:9 widescreen, depth staging shot in a boardroom. In the sharp foreground, a commanding powerful leader stands tall with an intense gaze, with their eyeline placed high in the upper third of the frame. In the midground, seated subordinates look upward with their eyelines situated much lower in the lower third of the composition. Strong lighting accentuates the vertical gap between the eyelines, establishing clear dominance and authority. Film noir atmosphere, 35mm texture."
  },
  {
    id: "yeux-oblique",
    nom: "Ligne des yeux oblique",
    prompt: "Cinematic 35mm film photograph, full 16:9 widescreen composition without any rotated canvas, filling the complete rectangle edge to edge. Inside the shot, an anxious protagonist leans sideways at a sharp 25-degree diagonal angle against the wall of a shadowy subway tunnel. The diagonal line connecting the character's two eyes slants steeply across the frame from top-left to bottom-right, creating an unstable, skewed diagonal eyeline. Gritty film noir lighting, deep dramatic shadows, Carol Reed cinematography, rich 35mm film grain, perfectly rectangular frame, no black borders, no tilted canvas, no text, no frame overlay."
  },
  {
    id: "yeux-hierarchie",
    nom: "Hiérarchie des regards",
    prompt: "Cinematic 35mm film still, 16:9 widescreen, monumental architectural composition showing a vast vertical separation of eyelines. High up on an illuminated mezzanine balcony in the upper third of the frame, a solitary standing figure looks down into the grand hall. At the very bottom of the frame, multiple figures seen from behind in dark silhouettes tilt their heads upward, looking up toward the distant balcony. An immense vertical void separates the high eyeline above from the low eyelines at the bottom, conveying dramatic scale and vertical hierarchy. Atmospheric cinema lighting, Blade Runner architectural scale, 35mm Kodak grain, no text."
  },
  {
    id: "yeux-basse",
    nom: "Ligne des yeux basse",
    prompt: "Cinematic 35mm film still portrait, 16:9 widescreen, medium close-up of a vulnerable, melancholic protagonist sitting at eye level. Striking unconventional framing with deliberate excessive headroom: the actor's eyes and face are placed unusually low in the bottom third of the frame, leaving a massive, oppressive empty concrete wall and shadowy ceiling looming above in the upper two-thirds. Communicates crushing isolation, loneliness, and emotional weight. Mr. Robot style cinematography, 35mm texture."
  },
  {
    id: "yeux-bascule",
    nom: "Bascule des lignes des yeux",
    prompt: "Cinematic 35mm film still, 16:9 widescreen, intense two-shot confrontation across an office desk. A dynamic power reversal captured in a single frame: one character has just surged to their feet, looming tall above the desk with their eyeline towering high, while their rival recoils backward in a leather chair with their eyeline dropping below, looking up in sudden vulnerability. Atmospheric dramatic lighting, cinematic realism, 35mm Kodak grain."
  },
  {
    id: "yeux-raccord",
    nom: "Raccord regard",
    prompt: "Cinematic 35mm film still diptych, 16:9 widescreen split frame showcasing a textbook eyeline match (raccord regard). On the left panel, an actor looks toward the right edge with their eyeline angled slightly downward. On the right panel, an actress looks toward the left edge with her eyeline angled slightly upward, creating an immediate, perfect psychological connection and mutual gaze across the cut. Cohesive 35mm film aesthetics, shallow depth of field, warm cinema color grading."
  },
  {
    id: "yeux-convergents",
    nom: "Regards convergents",
    prompt: "Cinematic 35mm film still, 16:9 widescreen, medium shot of a group of four diverse people inside a retro diner booth. Every single character in the frame has their head turned and eyes fixated with intense shock and curiosity toward the same specific point off-screen near the frame edge. Their converging lines of sight magnetically direct the audience's attention toward the unseen doorway. Steven Spielberg suspense cinematography, atmospheric lighting, 35mm film grain."
  },
  {
    id: "yeux-divergents",
    nom: "Regards qui s’évitent",
    prompt: "Cinematic 35mm film still, 16:9 widescreen, two-shot of an estranged couple sitting side by side in a dimly lit diner booth. While physically close in the frame, their eyelines diverge in opposite directions: the partner on the left stares pensively out of frame to the far left, while the partner on the right looks away to the far right, completely avoiding eye contact. Palpable emotional distance and melancholic silence, In the Mood for Love Wong Kar-wai color palette, 35mm film grain."
  }
];

export async function generateOne(item) {
  console.log(`\n🎨 Generating [${item.id}] ${item.nom}...`);
  const url = `https://generativelanguage.googleapis.com/v1beta/${MODEL}:generateContent?key=${key}`;
  const body = {
    contents: [{ parts: [{ text: item.prompt }] }]
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
    throw new Error(`No image returned for ${item.id}`);
  }

  const buf = Buffer.from(imgPart.inlineData.data, 'base64');
  const targetPath = path.join(outDir, `${item.id}.jpg`);
  fs.writeFileSync(targetPath, buf);
  console.log(`✅ Saved ${targetPath} (${Math.round(buf.length / 1024)} KB)`);
  return targetPath;
}

const targetArg = process.argv[2];
if (targetArg) {
  if (targetArg === 'yeux') {
    const list = NEW_TECHNIQUES.filter(t => t.id.startsWith('yeux-'));
    for (const item of list) {
      try {
        await generateOne(item);
      } catch(err) {
        console.error(`❌ Failed ${item.id}:`, err.message);
      }
    }
  } else {
    const item = NEW_TECHNIQUES.find(t => t.id === targetArg);
    if (!item) {
      console.error(`Not found: ${targetArg}`);
      process.exit(1);
    }
    await generateOne(item);
  }
} else {
  for (const item of NEW_TECHNIQUES) {
    try {
      await generateOne(item);
    } catch(err) {
      console.error(`❌ Failed ${item.id}:`, err.message);
    }
  }
}

