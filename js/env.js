// Décors du labo 3D : Studio, Rue, Nature, Intérieur.
// Construits en code (aucune image), avec une vraie profondeur pour montrer
// la compression de perspective des focales et le flou d'arrière-plan.
import * as THREE from '../vendor/three.bundle.js';
import { mergeGeometries } from '../vendor/three.bundle.js';

export const DECORS = [
  { id: 'studio', nom: 'Studio' },
  { id: 'rue', nom: 'Rue' },
  { id: 'nature', nom: 'Nature' },
  { id: 'interieur', nom: 'Intérieur' },
];

const rng = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

function tex(w, h, draw, rep = [1, 1]) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rep[0], rep[1]); t.anisotropy = 4;
  return t;
}
function noise(x, w, h, base, amp, n, r) {
  x.fillStyle = base; x.fillRect(0, 0, w, h);
  for (let i = 0; i < n; i++) {
    const v = (r() - 0.5) * amp;
    x.fillStyle = v > 0 ? `rgba(255,255,255,${v})` : `rgba(0,0,0,${-v})`;
    x.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3);
  }
}
// Colore une géométrie (attribut « color ») pour pouvoir tout fusionner en un seul objet
function paint(g, hex) {
  const c = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  if (g.index) g = g.toNonIndexed();
  return g;
}
const box = (w, h, d, x, y, z, hex) => paint(new THREE.BoxGeometry(w, h, d).translate(x, y, z), hex);
const merged = parts => mergeGeometries(parts.map(g => g.index ? g.toNonIndexed() : g));

function sky(top, mid, bottom) {
  const g = new THREE.SphereGeometry(180, 32, 16);
  const p = g.attributes.position, col = [];
  const T = new THREE.Color(top), M = new THREE.Color(mid), B = new THREE.Color(bottom), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i) / 180;
    if (y >= 0) c.copy(M).lerp(T, Math.pow(y, 0.55)); else c.copy(M).lerp(B, Math.min(1, -y * 4));
    col.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
  m.renderOrder = -1;
  return m;
}

// Un décor = un groupe + ses matériaux « de fond » (éclairés par le curseur Fond) + brouillard
function decor() {
  const group = new THREE.Group(), fondMats = [], fixedMats = [];
  const basic = (opts = {}) => { const m = new THREE.MeshBasicMaterial({ vertexColors: true, ...opts }); fondMats.push(m); return m; };
  return { group, fondMats, fixedMats, basic, fog: { color: 0x000000, density: 0 } };
}

// ------------------------------------------------------------------ RUE
function buildRue() {
  const D = decor(), r = rng(11);
  D.group.add(sky(0x243659, 0xd08a5f, 0x2b2d33));
  // chaussée et trottoirs (reçoivent la lumière et l'ombre du personnage)
  const asphalt = tex(256, 256, (x, w, h) => noise(x, w, h, '#3a3a3d', 0.35, 5000, rng(3)), [80, 80]);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshLambertMaterial({ map: asphalt, emissive: 0xffffff, emissiveMap: asphalt, emissiveIntensity: 0.3 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; D.group.add(ground); D.ground = ground;
  const parts = [];
  for (const s of [-1, 1]) {
    parts.push(box(2.6, 0.14, 260, s * 4.9, 0.07, -70, 0x77746f));
    parts.push(box(0.2, 0.16, 260, s * 3.6, 0.08, -70, 0x8f8b84));
  }
  for (let z = 22; z > -170; z -= 7) parts.push(box(0.14, 0.01, 2.6, 0, 0.006, z, 0xd9d4c4));
  // passage piéton
  for (let x = -2.8; x <= 2.8; x += 0.8) parts.push(box(0.45, 0.01, 2.8, x, 0.007, -9, 0xd9d4c4));
  // immeubles : façades avec fenêtres (texture répétée selon la taille)
  const facade = (wall, glass, lit) => tex(512, 512, (x, w, h) => {
    const rr = rng(Math.floor(r() * 1e6) + 1);
    x.fillStyle = wall; x.fillRect(0, 0, w, h);
    const cw = w / 8, ch = h / 8;
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
      x.fillStyle = rr() < 0.28 ? lit : glass;
      x.fillRect(i * cw + cw * 0.22, j * ch + ch * 0.18, cw * 0.56, ch * 0.58);
      x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(i * cw + cw * 0.18, j * ch + ch * 0.78, cw * 0.64, ch * 0.05);
    }
  });
  const facades = [facade('#8a7a6c', '#2c3440', '#ffd28a'), facade('#6f7479', '#232a33', '#ffe2a8'), facade('#9b8f7c', '#2f3845', '#f7c27a'), facade('#5c5550', '#1f252d', '#ffcf8f')];
  const byFacade = facades.map(() => []);
  const building = (w, h, d, x, z, k) => {
    const g = new THREE.BoxGeometry(w, h, d).translate(x, h / 2, z);
    const uv = g.attributes.uv;
    // faces : +x, -x, +y, -y, +z, -z (4 sommets chacune) ; 1 cellule de fenêtre ≈ 3 m × 3,2 m
    const size = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) { const i = f * 4 + v; uv.setXY(i, uv.getX(i) * size[f][0] / 24, uv.getY(i) * size[f][1] / 25.6); }
    byFacade[k].push(g);
  };
  for (const s of [-1, 1]) {
    for (let z = 30; z > -170;) {
      const w = 7 + r() * 9, d = 9 + r() * 6, h = 9 + r() * 26;
      building(d, h, w - 0.3, s * (6.4 + d / 2), z - w / 2, Math.floor(r() * facades.length));
      z -= w;
    }
  }
  building(70, 46, 12, 0, -182, 1);
  facades.forEach((t, k) => {
    const m = new THREE.MeshBasicMaterial({ map: t }); D.fondMats.push(m);
    D.group.add(new THREE.Mesh(mergeGeometries(byFacade[k]), m));
  });
  // lampadaires : les globes restent lumineux (ils deviennent de beaux bokehs quand ils sont flous)
  const heads = [];
  for (let z = 18; z > -160; z -= 13) for (const s of [-1, 1]) {
    parts.push(paint(new THREE.CylinderGeometry(0.06, 0.08, 4.6, 8).translate(s * 3.8, 2.3, z + (s > 0 ? 6 : 0)), 0x2a2c30));
    parts.push(box(0.9, 0.06, 0.08, s * 3.4, 4.6, z + (s > 0 ? 6 : 0), 0x2a2c30));
    heads.push(new THREE.SphereGeometry(0.18, 12, 8).translate(s * 3.0, 4.5, z + (s > 0 ? 6 : 0)));
  }
  // voitures garées
  const carCols = [0x7b1f24, 0x2c4a6e, 0xc9c3b6, 0x1d1f22, 0x4d5b3a];
  for (let z = 8; z > -120; z -= 9 + r() * 10) {
    const s = r() < 0.5 ? -1 : 1, c = carCols[Math.floor(r() * carCols.length)];
    parts.push(box(1.8, 0.75, 4.2, s * 2.5, 0.55, z, c));
    parts.push(box(1.6, 0.55, 2.2, s * 2.5, 1.2, z - 0.2, 0x3a4652));
  }
  D.group.add(new THREE.Mesh(merged(parts), D.basic()));
  const glow = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.2, 0.7) }); D.fixedMats.push(glow);
  D.group.add(new THREE.Mesh(mergeGeometries(heads), glow));
  D.fog = { color: 0x5e5c68, density: 0.011 };
  return D;
}

// ------------------------------------------------------------------ NATURE
function buildNature() {
  const D = decor(), r = rng(29);
  D.group.add(sky(0x5f8fc4, 0xc9dde6, 0x6c7d58));
  const grass = tex(256, 256, (x, w, h) => noise(x, w, h, '#4d6b34', 0.4, 9000, rng(5)), [120, 120]);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshLambertMaterial({ map: grass, emissive: 0xffffff, emissiveMap: grass, emissiveIntensity: 0.3 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; D.group.add(ground); D.ground = ground;
  const parts = [];
  // collines lointaines
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI / 2 + (i - 4) * 0.33, R = 150 + r() * 20;
    parts.push(paint(new THREE.SphereGeometry(40 + r() * 30, 16, 8).scale(1.6, 0.35, 1).translate(Math.cos(a) * R, 0, Math.sin(a) * R), i % 2 ? 0x5e7a5c : 0x6f8a68));
  }
  // arbres (feuillus et conifères), éloignés du couloir caméra
  const greens = [0x3f6b2e, 0x4e7d34, 0x35592a, 0x5a8a3a, 0x2f5227];
  let placed = 0;
  for (let k = 0; k < 600 && placed < 150; k++) {
    const rad = 3.5 + Math.pow(r(), 0.7) * 95, a = r() * Math.PI * 2;
    const x = Math.cos(a) * rad, z = Math.sin(a) * rad;
    if (z > -2 && Math.abs(x) < 3 + z * 0.35) continue; // garder la vue de la caméra dégagée
    const s = 0.7 + r() * 0.9, g = greens[Math.floor(r() * greens.length)];
    parts.push(paint(new THREE.CylinderGeometry(0.12 * s, 0.22 * s, 3 * s, 6).translate(x, 1.5 * s, z), 0x4a3526));
    if (r() < 0.45) parts.push(paint(new THREE.ConeGeometry(1.5 * s, 5 * s, 7).translate(x, 4.2 * s, z), 0x2d4a2b));
    else parts.push(paint(new THREE.IcosahedronGeometry(1.8 * s, 1).translate(x, 3.8 * s, z), g));
    placed++;
  }
  // buissons et rochers proches
  for (let k = 0; k < 40; k++) {
    const x = (r() - 0.5) * 30, z = -2 - r() * 25;
    if (Math.abs(x) < 1.2 && z > -4) continue;
    parts.push(r() < 0.7 ? paint(new THREE.IcosahedronGeometry(0.4 + r() * 0.5, 0).scale(1, 0.7, 1).translate(x, 0.25, z), 0x3d6130)
      : paint(new THREE.DodecahedronGeometry(0.3 + r() * 0.4, 0).translate(x, 0.15, z), 0x7d7a72));
  }
  D.group.add(new THREE.Mesh(merged(parts), D.basic()));
  D.fog = { color: 0xb9c8cc, density: 0.009 };
  return D;
}

// ------------------------------------------------------------------ INTÉRIEUR
function buildInterieur() {
  const D = decor(), r = rng(47);
  D.group.add(sky(0x1a1c20, 0x1a1c20, 0x1a1c20));
  const W = 5, Z0 = -6, Z1 = 9, H = 3;
  const parquet = tex(256, 256, (x, w, h) => {
    const rr = rng(9);
    for (let i = 0; i < 8; i++) { x.fillStyle = ['#7a5a3c', '#6d4f34', '#836246', '#72543a'][i % 4]; x.fillRect(0, i * 32, w, 32); x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(0, i * 32, w, 1.5); x.fillRect(rr() * w, i * 32, 1.5, 32); }
  }, [6, 10]);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W * 2, Z1 - Z0), new THREE.MeshLambertMaterial({ map: parquet, emissive: 0xffffff, emissiveMap: parquet, emissiveIntensity: 0.3 }));
  floor.rotation.x = -Math.PI / 2; floor.position.z = (Z0 + Z1) / 2; floor.receiveShadow = true; D.group.add(floor); D.ground = floor;
  const parts = [];
  const plane = (w, h, hex, fn) => { const g = new THREE.PlaneGeometry(w, h); fn(g); return paint(g, hex); };
  // murs (orientés vers l'intérieur : invisibles depuis l'extérieur, utile aux longues focales)
  const wallC = 0xb9ab95;
  // mur du fond avec une fenêtre
  parts.push(plane(W * 2, 0.9, wallC, g => g.translate(0, 0.45, Z0)));
  parts.push(plane(W * 2, 0.6, wallC, g => g.translate(0, H - 0.3, Z0)));
  parts.push(plane(W - 1.6, 1.5, wallC, g => g.translate(-(W + 1.6) / 2, 1.65, Z0)));
  parts.push(plane(W - 1.6, 1.5, wallC, g => g.translate((W + 1.6) / 2, 1.65, Z0)));
  parts.push(plane(Z1 - Z0, H, 0xa89b86, g => g.rotateY(Math.PI / 2).translate(-W, H / 2, (Z0 + Z1) / 2)));
  parts.push(plane(Z1 - Z0, H, 0xa89b86, g => g.rotateY(-Math.PI / 2).translate(W, H / 2, (Z0 + Z1) / 2)));
  parts.push(plane(W * 2, H, wallC, g => g.rotateY(Math.PI).translate(0, H / 2, Z1)));
  parts.push(plane(W * 2, Z1 - Z0, 0xd8d0c2, g => g.rotateX(Math.PI / 2).translate(0, H, (Z0 + Z1) / 2)));
  // plinthes
  parts.push(box(W * 2, 0.1, 0.03, 0, 0.05, Z0 + 0.02, 0xe8e2d6));
  // bibliothèque (gauche du fond)
  const bx = -3.4, bz = Z0 + 0.3;
  parts.push(box(2.2, 2.3, 0.4, bx, 1.15, bz, 0x5a3f2a));
  for (let sh = 0; sh < 5; sh++) {
    const y = 0.15 + sh * 0.45;
    parts.push(box(2.1, 0.03, 0.36, bx, y, bz + 0.02, 0x6d4d33));
    for (let xb = bx - 1; xb < bx + 1;) {
      const bw = 0.04 + r() * 0.05, bh = 0.24 + r() * 0.14;
      parts.push(box(bw, bh, 0.25, xb + bw / 2, y + bh / 2 + 0.015, bz + 0.05, [0x8a2f2a, 0x2e4a6b, 0xc9a96a, 0x3c5e3a, 0xd8d0c0, 0x5b3a5e][Math.floor(r() * 6)]));
      xb += bw + 0.005;
    }
  }
  // canapé (droite)
  parts.push(box(2.2, 0.45, 0.9, 3.4, 0.3, -3.4, 0x49606e), box(2.2, 0.55, 0.2, 3.4, 0.75, -3.8, 0x49606e), box(0.2, 0.3, 0.9, 2.35, 0.6, -3.4, 0x49606e), box(0.2, 0.3, 0.9, 4.45, 0.6, -3.4, 0x49606e));
  // table et chaises
  parts.push(box(1.6, 0.05, 0.9, -1.2, 0.75, -2.6, 0x7a5638));
  for (const [dx, dz] of [[-0.7, -0.38], [0.7, -0.38], [-0.7, 0.38], [0.7, 0.38]]) parts.push(box(0.05, 0.75, 0.05, -1.2 + dx, 0.375, -2.6 + dz, 0x5d402a));
  for (const dz of [-0.75, 0.75]) { parts.push(box(0.45, 0.04, 0.45, -1.2, 0.45, -2.6 + dz, 0x3d3a36)); parts.push(box(0.45, 0.5, 0.04, -1.2, 0.7, -2.6 + dz * 1.28, 0x3d3a36)); }
  // plante
  parts.push(paint(new THREE.CylinderGeometry(0.2, 0.15, 0.4, 12).translate(1.6, 0.2, Z0 + 0.5), 0x8c5a3c), paint(new THREE.IcosahedronGeometry(0.45, 1).translate(1.6, 0.8, Z0 + 0.5), 0x3f6b2e));
  // tableaux
  parts.push(box(0.04, 0.7, 1.0, -W + 0.03, 1.7, -2.2, 0x222222), box(0.02, 0.6, 0.9, -W + 0.06, 1.7, -2.2, 0x9a6b4c));
  parts.push(box(0.04, 0.6, 0.8, W - 0.03, 1.6, 0.8, 0x222222), box(0.02, 0.5, 0.7, W - 0.06, 1.6, 0.8, 0x4c6a8a));
  // porte (mur droit)
  parts.push(box(0.05, 2.1, 0.95, W - 0.03, 1.05, 4.5, 0x6d5a45));
  D.group.add(new THREE.Mesh(merged(parts), D.basic()));
  // sources lumineuses du décor : fenêtre (jour) et abat-jour
  const glowParts = [
    paint(new THREE.PlaneGeometry(3.2, 1.5).translate(0, 1.65, Z0 - 0.02), 0xbfd6e8),
    paint(new THREE.CylinderGeometry(0.18, 0.25, 0.3, 16, 1, true).translate(4.2, 1.55, -4.8), 0xffd9a0),
  ];
  const glow = new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(1.5, 1.5, 1.5), side: THREE.DoubleSide }); D.fixedMats.push(glow);
  D.group.add(new THREE.Mesh(merged(glowParts), glow));
  const deco2 = [box(0.03, 1.5, 0.03, 4.2, 0.75, -4.8, 0x2a2a2a), paint(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 16).translate(4.2, 0.015, -4.8), 0x2a2a2a),
    box(3.3, 0.06, 0.06, 0, 0.9, Z0 + 0.01, 0xe8e2d6), box(3.3, 0.06, 0.06, 0, 2.4, Z0 + 0.01, 0xe8e2d6), box(0.06, 1.5, 0.06, 0, 1.65, Z0 + 0.01, 0xe8e2d6)];
  D.group.add(new THREE.Mesh(merged(deco2), D.basic()));
  D.fog = { color: 0x000000, density: 0 };
  return D;
}

const BUILDERS = { rue: buildRue, nature: buildNature, interieur: buildInterieur };
export function buildDecor(id) { return BUILDERS[id] ? BUILDERS[id]() : null; }
