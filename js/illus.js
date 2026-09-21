// Générateurs d'illustrations SVG (toutes vectorielles, thémables via les classes CSS .i-*)

// ---------- Couleur de lumière ----------
export function kelvinRGB(k) {
  const t = Math.max(1000, Math.min(40000, k)) / 100;
  let r, g, b;
  if (t <= 66) { r = 255; g = 99.4708025861 * Math.log(t) - 161.1195681661; }
  else { r = 329.698727446 * Math.pow(t - 60, -0.1332047592); g = 288.1221695283 * Math.pow(t - 60, -0.0755148492); }
  if (t >= 66) b = 255; else if (t <= 19) b = 0; else b = 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  const c = v => Math.round(Math.max(0, Math.min(255, v)));
  return [c(r), c(g), c(b)];
}
export function hexRGB(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
export function lightRGB(l) { return l.c ? hexRGB(l.c) : kelvinRGB(l.k || 4300); }
export const rgb = a => `rgb(${a[0]},${a[1]},${a[2]})`;

let uid = 0;
const U = p => `${p}${++uid}`;
const wrap = (vb, inner, label = '', cls = '', mode = 'slice') =>
  `<svg class="illus ${cls}" viewBox="${vb}" preserveAspectRatio="xMidYMid ${mode}" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
const NS = 'vector-effect="non-scaling-stroke"';

// ======================================================================
// 1. VALEURS DE PLAN : une scène unique, recadrée par le viewBox
// ======================================================================
function figureFront(x, y, s = 1, extra = '') {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path class="i-fig" d="M-10,-92 L-12,0 L-3,0 L-1,-78 L1,-78 L3,0 L12,0 L10,-92 Z"/>
    <path class="i-fig2" d="M-21,-150 Q-24,-147 -23,-138 L-18,-90 L18,-90 L23,-138 Q24,-147 21,-150 Q10,-155 0,-155 Q-10,-155 -21,-150 Z"/>
    <path class="i-fig2" d="M-21,-148 L-28,-100 L-26,-94 L-22,-95 L-17,-136 Z M21,-148 L28,-100 L26,-94 L22,-95 L17,-136 Z"/>
    <ellipse class="i-skin" cx="-26" cy="-95" rx="3" ry="4"/><ellipse class="i-skin" cx="26" cy="-95" rx="3" ry="4"/>
    <rect class="i-prop" x="23" y="-101" width="9" height="6" rx="0.6" transform="rotate(-12 27 -98)"/>
    <rect class="i-skin" x="-4" y="-158" width="8" height="9"/>
    <ellipse class="i-skin" cx="0" cy="-167.5" rx="10" ry="12.5"/>
    <path class="i-hair" d="M-10.5,-167 Q-12,-181 0,-181 Q12,-181 10.5,-167 Q9,-175 0,-175 Q-7,-175 -10.5,-167 Z"/>
    <g class="i-face">
      <path class="i-brow" vector-effect="non-scaling-stroke" d="M-7,-172.3 Q-4.5,-173.4 -2,-172.4 M2,-172.4 Q4.5,-173.4 7,-172.3" fill="none"/>
      <ellipse class="i-eye" cx="-4.2" cy="-169" rx="1.9" ry="1"/><ellipse class="i-eye" cx="4.2" cy="-169" rx="1.9" ry="1"/>
      <circle class="i-pupil" cx="-4.2" cy="-169" r="0.7"/><circle class="i-pupil" cx="4.2" cy="-169" r="0.7"/>
      <path class="i-line" vector-effect="non-scaling-stroke" d="M0,-168 L-1,-163.5 L0.8,-163.2" fill="none"/>
      <path class="i-mouth" vector-effect="non-scaling-stroke" d="M-2.8,-159.6 Q0,-158.6 2.8,-159.6" fill="none"/>
    </g>${extra}
  </g>`;
}

const SCENE = () => `
  <rect class="i-sky" x="-800" y="-200" width="3000" height="1080"/>
  <path class="i-far" d="M-800,880 L-400,830 L-100,860 L150,815 L420,862 L640,826 L900,858 L1250,812 L1700,860 L2200,835 L2200,880 Z"/>
  <rect class="i-ground" x="-800" y="880" width="3000" height="900"/>
  <path class="i-far2" d="M180,880 L180,852 L200,840 L220,852 L220,880 Z M226,880 L226,860 L246,860 L246,880 Z"/>
  <g class="i-tree"><rect x="716" y="930" width="7" height="70"/><ellipse cx="719" cy="910" rx="34" ry="42"/></g>
  <g class="i-tree"><rect x="1080" y="880" width="4" height="36"/><ellipse cx="1082" cy="872" rx="16" ry="20"/></g>
  <path class="i-road" d="M470,1000 L530,1000 L760,1400 L240,1400 Z"/>
  <ellipse class="i-shadow" cx="500" cy="1000" rx="22" ry="4"/>
  ${figureFront(500, 1000)}`;

const CROPS = {
  tgpe: [-33, 300, 1600, 900], pe: [170, 760, 533.3, 300], pm: [318, 805, 364.4, 205], pa: [380, 812, 240, 135],
  pt: [436, 814, 163.6, 92], pr: [457, 815, 106.7, 60], gp: [476, 816.5, 58.7, 33], tgp: [491.1, 826, 17.8, 10],
  serre: [484, 825, 32, 18], insert: [511, 894, 32, 18],
};
export function shot(v, label = '') {
  const c = CROPS[v] || CROPS.pt;
  return wrap(c.join(' '), SCENE(), label, 'shot', 'meet');
}

// ======================================================================
// 2. ANGLES : vue de profil + ce que voit la caméra
// ======================================================================
function camSide(x, y, rot, s = 1) {
  // rot : direction de l'objectif en degrés (0 = vers la droite, 180 = vers la gauche)
  const flip = Math.cos(rot * Math.PI / 180) < 0 ? ' scale(1 -1)' : '';
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})${flip}">
    <rect class="i-cam" x="-9" y="-4.5" width="12" height="9" rx="1.5"/>
    <path class="i-cam" d="M3,-3 L8,-4.5 L8,4.5 L3,3 Z"/>
    <circle class="i-cam" cx="-5" cy="-7" r="2.6"/><circle class="i-cam" cx="1" cy="-7" r="2.6"/>
  </g>`;
}
function personSide(x, ground, h = 60) {
  const s = h / 180;
  return `<g transform="translate(${x} ${ground}) scale(${s})">
    <path class="i-fig" d="M-6,-92 L-8,0 L4,0 L3,-4 L1,-80 L5,-92 Z"/>
    <path class="i-fig2" d="M-9,-152 Q-13,-120 -8,-90 L8,-90 Q11,-120 7,-152 Q0,-157 -9,-152 Z"/>
    <ellipse class="i-skin" cx="-1" cy="-167" rx="10" ry="12.5"/>
    <path class="i-skin" d="M-11,-170 L-15,-165 L-10,-163 Z"/>
    <rect class="i-skin" x="-4" y="-158" width="7" height="8"/>
  </g>`;
}
export function angle({ tilt = 0, h = 1.6, roll = 0 }, label = '') {
  const G = 88, px = 26, m = Math.min(30, 72 / h); // sol, x personnage, pixels par mètre
  const camX = tilt === -90 ? px : 76, camY = G - h * m;
  const t = tilt === -90 ? -90 : tilt;
  const dir = t === -90 ? [0, 1] : [-Math.cos(t * Math.PI / 180), -Math.sin(t * Math.PI / 180)];
  const fov = 22 * Math.PI / 180;
  const ray = a => { const ca = Math.cos(a), sa = Math.sin(a); return [dir[0] * ca - dir[1] * sa, dir[0] * sa + dir[1] * ca]; };
  const r1 = ray(fov), r2 = ray(-fov), L = 120;
  const side = `
    <rect class="i-bg" x="0" y="0" width="100" height="100"/>
    <line class="i-ink" x1="0" y1="${G}" x2="100" y2="${G}" ${NS}/>
    ${personSide(px, G, 1.75 * m)}
    <path class="i-beam" d="M${camX},${camY} L${camX + r1[0] * L},${camY + r1[1] * L} L${camX + r2[0] * L},${camY + r2[1] * L} Z"/>
    <line class="i-dash" x1="${camX}" y1="${camY}" x2="${camX + dir[0] * 90}" y2="${camY + dir[1] * 90}" ${NS}/>
    ${camSide(camX, camY, Math.atan2(dir[1], dir[0]) * 180 / Math.PI, 0.9)}
    <line class="i-mute" x1="${camX}" y1="${camY}" x2="${camX}" y2="${G}" ${NS} stroke-dasharray="2 2"/>
    <text class="i-txt" x="${camX + 5}" y="${h < 0.5 ? camY - 9 : (camY + G) / 2 + 2}">${h.toString().replace('.', ',')} m</text>`;
  // cadre vu par la caméra : vraie projection perspective depuis la caméra du schéma
  const fx = 103, fy = 40, fw = 51, fh = 28.7;
  const id = U('clip');
  const D = t === -90 ? 0 : (camX - px) / m; // distance horizontale caméra → sujet, en mètres
  const frame = cameraView({ h, tilt: t, roll, D, vfov: 44, x: fx, y: fy, w: fw, h2: fh });
  const inner = `<defs><clipPath id="${id}"><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="1.5"/></clipPath></defs>
    ${side}<rect class="i-bg" x="99" y="0" width="61" height="100"/>
    <text class="i-txt i-cap" x="${fx}" y="${fy - 4}">vue caméra</text>
    <g clip-path="url(#${id})">${frame}</g>
    <rect class="i-frame" x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="1.5" ${NS}/>`;
  return wrap('0 0 160 100', inner, label, 'angle');
}

// ---------- Vue caméra en perspective (sténopé) ----------
// Monde : x = latéral, y = hauteur, z = vers la caméra ; le personnage est à l'origine, face à la caméra.
function hull(pts) {
  pts = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
// Silhouette 3D simplifiée : segments = deux ellipses horizontales (y, rx, rz, centre x, centre z)
const BODY = [
  { cls: 'i-fig', a: [0.05, 0.075, 0.08, -0.1, 0.02], b: [0.9, 0.08, 0.08, -0.1, 0] },
  { cls: 'i-fig', a: [0.05, 0.075, 0.08, 0.1, 0.02], b: [0.9, 0.08, 0.08, 0.1, 0] },
  { cls: 'i-fig2', a: [0.88, 0.18, 0.11, 0, 0], b: [1.44, 0.23, 0.12, 0, 0] },
  { cls: 'i-fig2', a: [1.42, 0.05, 0.05, -0.25, 0], b: [0.86, 0.045, 0.045, -0.29, 0.02] },
  { cls: 'i-fig2', a: [1.42, 0.05, 0.05, 0.25, 0], b: [0.86, 0.045, 0.045, 0.29, 0.02] },
  { cls: 'i-skin', a: [1.43, 0.05, 0.05, 0, 0], b: [1.54, 0.05, 0.05, 0, 0] },
  { cls: 'i-skin', sphere: [0, 1.65, 0.01, 0.105, 0.125] },
  { cls: 'i-hair', sphere: [0, 1.7, -0.04, 0.108, 0.09] },
];
export function cameraView({ h, tilt, roll = 0, D, vfov = 44, x: X, y: Y, w: W, h2: H }) {
  const t = tilt * Math.PI / 180;
  const C = [0, h, D];
  const f = [0, Math.sin(t), -Math.cos(t)], r = [1, 0, 0];
  const u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
  const F = (H / 2) / Math.tan(vfov * Math.PI / 360);
  const cx = X + W / 2, cy = Y + H / 2, NEAR = 0.05;
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cam = p => { const v = [p[0] - C[0], p[1] - C[1], p[2] - C[2]]; return [dot(v, r), dot(v, u), dot(v, f)]; };
  const scr = c => [cx + c[0] / c[2] * F, cy - c[1] / c[2] * F];
  const clipPoly = poly => { // polygone en coordonnées caméra, coupé au plan proche
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const A = poly[i], B = poly[(i + 1) % poly.length], ina = A[2] > NEAR, inb = B[2] > NEAR;
      if (ina) out.push(A);
      if (ina !== inb) { const k = (NEAR - A[2]) / (B[2] - A[2]); out.push([A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k, NEAR]); }
    }
    return out;
  };
  const path = pts => pts.length > 2 ? 'M' + pts.map(p => p.map(v => v.toFixed(2)).join(',')).join('L') + 'Z' : '';
  let g = `<rect class="i-sky" x="${X - 60}" y="${Y - 60}" width="${W + 120}" height="${H + 120}"/>`;
  // sol
  const ground = clipPoly([[-400, 0, -400], [400, 0, -400], [400, 0, D + 400], [-400, 0, D + 400]].map(cam)).map(scr);
  g += `<path class="i-ground" d="${path(ground)}"/>`;
  // lignes au sol (perspective)
  const seg = (a, b) => { const P = clipPoly([cam(a), cam(b), cam(b)]); if (P.length < 2) return ''; const [p, q] = [scr(P[0]), scr(P[1])]; return `M${p[0].toFixed(2)},${p[1].toFixed(2)}L${q[0].toFixed(2)},${q[1].toFixed(2)}`; };
  let lines = '';
  for (let x = -5; x <= 5; x++) lines += seg([x, 0, -30], [x, 0, D + 10]);
  for (let z = -30; z <= Math.ceil(D) + 10; z++) lines += seg([-5, 0, z], [5, 0, z]);
  g += `<path class="i-line2" d="${lines}" ${NS} opacity=".45"/>`;
  // ombre au sol
  const sh = clipPoly(Array.from({ length: 16 }, (_, i) => cam([Math.cos(i / 16 * 6.283) * 0.35, 0.001, Math.sin(i / 16 * 6.283) * 0.22]))).map(scr);
  g += `<path class="i-shadow" d="${path(sh)}"/>`;
  // corps : chaque segment = enveloppe convexe de ses deux ellipses projetées, du plus loin au plus proche
  const ring = (y, rx, rz, ox, oz, n = 14) => Array.from({ length: n }, (_, i) => [ox + Math.cos(i / n * 6.283) * rx, y, oz + Math.sin(i / n * 6.283) * rz]);
  const parts = BODY.map(b => {
    let pts;
    if (b.sphere) { const [ox, oy, oz, rr, ry] = b.sphere; pts = []; for (let k = -3; k <= 3; k++) { const a = k / 3 * 1.4; pts.push(...ring(oy + Math.sin(a) * ry, Math.cos(a) * rr, Math.cos(a) * rr, ox, oz)); } }
    else pts = [...ring(...b.a), ...ring(...b.b)];
    const cp = pts.map(cam).filter(p => p[2] > NEAR);
    const depth = cp.reduce((s, p) => s + p[2], 0) / (cp.length || 1);
    return { cls: b.cls, depth, d: cp.length > 2 ? path(hull(cp.map(scr))) : '' };
  }).sort((a, b) => b.depth - a.depth);
  g += parts.map(p => `<path class="${p.cls}" d="${p.d}"/>`).join('');
  return `<g transform="rotate(${roll} ${cx} ${cy})">${g}</g>`;
}

// ======================================================================
// 3. VUES DE DESSUS (points de vue, mouvements, plans de feu)
// ======================================================================
function personTop(x, y, rot = 0, label = '', hl = false) {
  return `<g transform="translate(${x} ${y}) rotate(${rot})">
    <ellipse class="${hl ? 'i-acc' : 'i-fig2'}" cx="0" cy="0" rx="8" ry="3.8"/>
    <circle class="i-skin" cx="0" cy="0" r="3.6"/>
    <path class="i-skin" d="M-1.2,-3.3 L0,-5.4 L1.2,-3.3 Z"/>
  </g>${label ? `<text class="i-txt" text-anchor="middle" x="${x}" y="${y + 12}">${label}</text>` : ''}`;
}
function camTop(x, y, rot = 0, fov = 40, len = 40, label = '') {
  const a = fov / 2 * Math.PI / 180, dx = Math.tan(a) * len;
  return `<g transform="translate(${x} ${y}) rotate(${rot})">
    <path class="i-beam" d="M0,-4 L${-dx},${-4 - len} L${dx},${-4 - len} Z"/>
    <rect class="i-cam" x="-4" y="-2" width="8" height="10" rx="1.2"/>
    <rect class="i-cam" x="-2.5" y="-5" width="5" height="3.5"/>
  </g>${label ? `<text class="i-txt i-b" text-anchor="middle" x="${x}" y="${y + 17}">${label}</text>` : ''}`;
}
// Caméra orientée vers une cible (tx, ty) : le cône s'arrête juste avant le sujet
function aimCam(x, y, tx, ty, fov = 30, label = '') {
  const rot = Math.atan2(tx - x, y - ty) * 180 / Math.PI;
  const len = Math.max(8, Math.hypot(tx - x, ty - y) - 9);
  return camTop(x, y, rot, fov, len, label);
}
const arrowDefs = id => `<defs><marker id="${id}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path class="i-accf" d="M0,0 L10,5 L0,10 Z"/></marker></defs>`;
const arrow = (d, id, extra = '') => `<path class="i-arrow" d="${d}" marker-end="url(#${id})" ${NS} ${extra}/>`;

export function top(k, label = '') {
  const bg = `<rect class="i-bg" x="0" y="0" width="160" height="100"/>`;
  let s = '';
  switch (k) {
    case 'pov': s = `${personTop(80, 45, 180, 'B')}${camTop(80, 78, 0, 55, 22)}${personTop(80, 78, 0, '')}<text class="i-txt" x="92" y="86">A = caméra</text>`; break;
    case 'ots': s = `${personTop(80, 22, 180, 'B')}${personTop(72, 66, 10, 'A')}${aimCam(84, 82, 80, 22, 26)}`; break;
    case 'shotreverse': s = `<line class="i-axis" x1="16" y1="50" x2="144" y2="50" ${NS}/><text class="i-txt i-cap" x="20" y="46">axe 180°</text>
      ${aimCam(98, 74, 60, 50, 26)}${aimCam(62, 74, 100, 50, 26)}<text class="i-txt i-b" x="106" y="80">cam 1 → A</text><text class="i-txt i-b" x="54" y="80" text-anchor="end">cam 2 → B</text>${personTop(60, 50, 90, 'A')}${personTop(100, 50, -90, 'B')}`; break;
    case 'twoshot': s = `${personTop(68, 36, 150, 'A')}${personTop(92, 36, 210, 'B')}${camTop(80, 84, 0, 50, 45)}`; break;
    case 'lookcam': s = `${personTop(80, 30, 180, '', true)}${camTop(80, 78, 0, 30, 42)}<line class="i-dash" x1="80" y1="36" x2="80" y2="70" ${NS}/><text class="i-txt" x="86" y="52">regard</text>`; break;
    case 'back': s = `${personTop(80, 48, 0, 'A')}<rect class="i-mute2" x="40" y="10" width="80" height="6"/><text class="i-txt" text-anchor="middle" x="80" y="26">ce qu'il découvre</text>${camTop(80, 84, 0, 40, 30)}`; break;
    case 'profile': s = `${personTop(80, 40, 90, 'A')}${camTop(80, 82, 0, 30, 36)}<path class="i-dash" d="M85,40 L130,40" ${NS}/><text class="i-txt" x="112" y="36">regard</text>`; break;
  }
  return wrap('16 6 128 80', bg + s, label, 'top');
}

// ======================================================================
// 4. COMPOSITION (cadres 16:9)
// ======================================================================
function bust(x, y, r = 10, dir = 0, cls = 'i-fig2') {
  // y = centre de la tête ; dir -1 regarde à gauche, 1 à droite, 0 face
  const sh = r * 2.3;
  const nose = dir ? `<path class="i-skin" d="M${x + dir * r * 0.85},${y - r * 0.2} L${x + dir * r * 1.3},${y + r * 0.15} L${x + dir * r * 0.85},${y + r * 0.3} Z"/>` : '';
  const eyes = dir === 0 ? `<circle class="i-pupil" cx="${x - r * 0.35}" cy="${y - r * 0.1}" r="${r * 0.1}"/><circle class="i-pupil" cx="${x + r * 0.35}" cy="${y - r * 0.1}" r="${r * 0.1}"/>` : `<circle class="i-pupil" cx="${x + dir * r * 0.5}" cy="${y - r * 0.1}" r="${r * 0.1}"/>`;
  return `<path class="${cls}" d="M${x - sh},${y + r * 4} Q${x - sh},${y + r * 1.5} ${x - r * 0.5},${y + r * 1.3} L${x + r * 0.5},${y + r * 1.3} Q${x + sh},${y + r * 1.5} ${x + sh},${y + r * 4} Z"/>
    <ellipse class="i-skin" cx="${x}" cy="${y}" rx="${r * 0.82}" ry="${r}"/>${nose}${eyes}
    <path class="i-hair" d="M${x - r * 0.85},${y - r * 0.1} Q${x - r * 0.9},${y - r * 1.15} ${x},${y - r * 1.1} Q${x + r * 0.9},${y - r * 1.15} ${x + r * 0.85},${y - r * 0.1} Q${x},${y - r * 0.75} ${x - r * 0.85},${y - r * 0.1} Z"/>`;
}
const grid = () => `<g class="i-grid">${[160 / 3, 320 / 3].map(x => `<line x1="${x}" y1="0" x2="${x}" y2="90" ${NS}/>`).join('')}${[30, 60].map(y => `<line x1="0" y1="${y}" x2="160" y2="${y}" ${NS}/>`).join('')}</g>`;

export function compo(k, label = '') {
  const id = U('ar');
  let s = `<rect class="i-sky" x="0" y="0" width="160" height="90"/>`;
  switch (k) {
    case 'tiers': s += `<rect class="i-ground" x="0" y="62" width="160" height="28"/>${bust(106.7, 32, 10, -1)}${grid()}<circle class="i-accf" cx="106.7" cy="30" r="2"/>`; break;
    case 'symetrie': s += `<path class="i-wall" d="M0,0 L50,22 L50,70 L0,90 Z M160,0 L110,22 L110,70 L160,90 Z"/><rect class="i-wall2" x="50" y="22" width="60" height="48"/><rect class="i-door" x="72" y="34" width="16" height="36"/>${bust(80, 50, 6)}<line class="i-axis" x1="80" y1="0" x2="80" y2="90" ${NS}/>`; break;
    case 'negatif': s += `<rect class="i-ground" x="0" y="78" width="160" height="12"/>${bust(128, 71, 2.6)}<text class="i-txt i-cap" x="12" y="20">vide = sens</text>`; break;
    case 'leadroom': s += `<rect class="i-ground" x="0" y="64" width="160" height="26"/>${bust(52, 34, 11, 1)}${arrowDefs(id)}${arrow('M72,34 L130,34', id)}<text class="i-txt" x="90" y="28">espace de regard</text>`; break;
    case 'shortside': s += `<rect class="i-ground" x="0" y="64" width="160" height="26"/>${bust(122, 34, 11, 1)}${arrowDefs(id)}${arrow('M140,34 L155,34', id)}<text class="i-txt" x="14" y="28">vide derrière</text>`; break;
    case 'lignes': s += `<rect class="i-ground" x="0" y="44" width="160" height="46"/><path class="i-road" d="M40,90 L76,44 L84,44 L120,90 Z"/><path class="i-line2" d="M0,20 L76,44 M160,20 L84,44 M0,90 L78,44 M160,90 L82,44" ${NS}/>${bust(80, 38, 3)}`; break;
    case 'fuite': s += `<path class="i-wall" d="M0,0 L62,30 L62,62 L0,90 Z M160,0 L98,30 L98,62 L160,90 Z"/><path class="i-ground" d="M0,90 L62,62 L98,62 L160,90 Z"/><path class="i-ceil" d="M0,0 L62,30 L98,30 L160,0 Z"/><rect class="i-wall2" x="62" y="30" width="36" height="32"/>${[12, 30, 46].map(x => { const t = x / 62; return `<line class="i-line2" x1="${x}" y1="${t * 30}" x2="${x}" y2="${90 - t * 28}" ${NS}/><line class="i-line2" x1="${160 - x}" y1="${t * 30}" x2="${160 - x}" y2="${90 - t * 28}" ${NS}/>`; }).join('')}${bust(80, 50, 3.4)}<circle class="i-accf" cx="80" cy="46" r="1.2"/>`; break;
    case 'framein': s += `<rect class="i-wall" x="0" y="0" width="160" height="90"/><rect class="i-sky" x="58" y="14" width="44" height="66"/><rect class="i-ground" x="58" y="64" width="44" height="16"/>${bust(80, 42, 7)}<rect class="i-frame2" x="58" y="14" width="44" height="66" ${NS}/>`; break;
    case 'diagonale': s += `<path class="i-ground" d="M0,90 L0,70 L160,20 L160,90 Z"/><path class="i-line2" d="M0,70 L160,20" ${NS}/>${bust(46, 42, 7, 1)}${bust(118, 22, 5, -1)}`; break;
    case 'etagement': s += `<rect class="i-ground" x="0" y="54" width="160" height="36"/>${bust(28, 44, 16, 1, 'i-fig')}${bust(94, 36, 6, -1)}${bust(128, 40, 2.6)}<text class="i-txt i-cap" x="4" y="10">1er plan · 2nd plan · arrière-plan</text>`; break;
    case 'horizonbas': s += `<rect class="i-ground" x="0" y="72" width="160" height="18"/><ellipse class="i-cloud" cx="50" cy="26" rx="24" ry="6"/><ellipse class="i-cloud" cx="118" cy="40" rx="18" ry="4"/>${bust(80, 66, 2.8)}`; break;
    case 'horizonhaut': s += `<rect class="i-ground" x="0" y="18" width="160" height="72"/><path class="i-line2" d="M0,50 Q80,40 160,55 M0,72 Q80,62 160,78" ${NS}/>${bust(96, 46, 4)}`; break;
    case 'amorce': s += `<rect class="i-ground" x="0" y="60" width="160" height="30"/>${bust(96, 36, 9, -1)}<path class="i-fore" d="M0,0 L42,0 Q52,30 36,90 L0,90 Z"/><path class="i-fore" d="M160,0 L130,0 Q124,12 138,26 Q150,30 160,24 Z"/>`; break;
    case 'desequilibre': s += `<rect class="i-ground" x="0" y="66" width="160" height="24"/>${bust(36, 30, 20, 1, 'i-fig')}${bust(132, 58, 3.4, -1)}`; break;
  }
  const cid = U('cc');
  return wrap('0 0 160 90', `<defs><clipPath id="${cid}"><rect width="160" height="90"/></clipPath></defs><g clip-path="url(#${cid})">${s}</g><rect class="i-frame" x="0.5" y="0.5" width="159" height="89" ${NS}/>`, label, 'compo', 'meet');
}

// ======================================================================
// 5. OPTIQUE : champ couvert + compression de l'arrière-plan
// ======================================================================
export function focal({ mm = 50, ana = false }, label = '') {
  const hfov = 2 * Math.atan(36 / (2 * mm)) * 180 / Math.PI;
  const W = 112, h = ana ? W / 2.39 : W * 9 / 16;
  const bgScale = Math.min(2.4, Math.max(0.35, mm / 50));
  const bgY = h * 0.62;
  const trees = [-60, -30, 0, 30, 60].map(o => {
    const x = W / 2 + o * bgScale * 0.65, th = 16 * bgScale;
    return `<g class="i-tree"><rect x="${x - 0.8 * bgScale}" y="${bgY - th * 0.4}" width="${1.6 * bgScale}" height="${th * 0.4}"/><ellipse cx="${x}" cy="${bgY - th * 0.55}" rx="${4.4 * bgScale}" ry="${th * 0.35}"/></g>`;
  }).join('');
  const oy = (100 - h) / 2;
  const frame = `<svg x="0" y="${oy}" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}" preserveAspectRatio="xMidYMid slice">
      <rect class="i-sky" width="${W}" height="${h}"/><path class="i-far" d="M0,${bgY - 6 * bgScale} L30,${bgY - 10 * bgScale} L64,${bgY - 4 * bgScale} L${W},${bgY - 9 * bgScale} L${W},${bgY} L0,${bgY} Z"/>
      ${trees}<rect class="i-ground" y="${bgY}" width="${W}" height="${h}"/>
      ${bust(W / 2, h * 0.47, h * 0.13)}</svg><rect class="i-frame" x="0" y="${oy}" width="${W}" height="${h}" ${NS}/>`;
  const topv = `<g transform="translate(114 0)">${camTop(23, 90, 0, hfov, Math.min(62, 20 / Math.tan(hfov * Math.PI / 360)))}
      <text class="i-txt i-b" text-anchor="middle" x="23" y="12">${mm} mm</text>
      <text class="i-txt i-cap" text-anchor="middle" x="23" y="18">champ ${Math.round(hfov)}°</text></g>`;
  return wrap('0 0 160 100', `<rect class="i-bg" width="160" height="100"/>${frame}<defs><clipPath id="fc${mm}"><rect x="114" y="0" width="46" height="100"/></clipPath></defs><g clip-path="url(#fc${mm})">${topv}</g>`, label, 'focal');
}

export function dof(k, label = '') {
  const f = U('blur'), f2 = U('blur');
  const defs = `<defs><filter id="${f}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.2"/></filter><filter id="${f2}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.4"/></filter>
    <radialGradient id="${f}g"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset=".25" stop-color="#ffd9a0" stop-opacity=".8"/><stop offset="1" stop-color="#ff9d3c" stop-opacity="0"/></radialGradient></defs>`;
  const back = (blur) => `<g ${blur ? `filter="url(#${f})"` : ''}><rect class="i-sky" x="-10" y="-10" width="180" height="110"/><path class="i-far" d="M-10,52 L30,38 L70,50 L120,34 L170,48 L170,60 L-10,60 Z"/>
    <g class="i-tree"><rect x="24" y="36" width="3" height="24"/><ellipse cx="25.5" cy="32" rx="10" ry="14"/></g>
    <g class="i-tree"><rect x="132" y="30" width="3" height="30"/><ellipse cx="133.5" cy="26" rx="12" ry="16"/></g>
    <rect class="i-ground" x="-10" y="60" width="180" height="40"/>
    ${[18, 50, 112, 146].map((x, i) => `<circle class="i-bokeh" cx="${x}" cy="${20 + (i % 2) * 14}" r="${blur ? 6 : 1.5}"/>`).join('')}</g>`;
  let s = defs;
  switch (k) {
    case 'faible': s += back(true) + bust(80, 38, 12); break;
    case 'large': s += back(false) + bust(80, 38, 12); break;
    case 'bascule': s += back(true) + `<g filter="url(#${f2})">${bust(34, 36, 16, 1, 'i-fig')}</g>` + bust(112, 42, 7, -1) + arrowDefs(f + 'a') + `<path class="i-arrow" d="M44,14 Q80,0 108,26" marker-end="url(#${f}a)" ${NS}/><text class="i-txt" x="62" y="8">le point glisse</text>`; break;
    case 'split': s += back(false) + `<rect x="68" y="0" width="24" height="90" class="i-bg" opacity=".35" filter="url(#${f})"/>` + bust(34, 36, 17, 1, 'i-fig') + bust(124, 44, 5, -1) + `<line class="i-dash" x1="80" y1="0" x2="80" y2="90" ${NS}/>`; break;
    case 'flare': s += back(true) + bust(80, 40, 12) + `<circle cx="126" cy="18" r="30" fill="url(#${f}g)"/>${[0.35, 0.6, 0.85].map((t, i) => `<circle cx="${126 - 90 * t}" cy="${18 + 55 * t}" r="${3 + i * 2}" fill="#ffc98a" opacity=".35"/>`).join('')}<rect x="0" y="0" width="160" height="90" fill="#fff" opacity=".08"/>`; break;
  }
  const cid = U('cd');
  return wrap('0 0 160 90', `<defs><clipPath id="${cid}"><rect width="160" height="90"/></clipPath></defs><g clip-path="url(#${cid})">${s}</g><rect class="i-frame" x="0.5" y="0.5" width="159" height="89" ${NS}/>`, label, 'dof', 'meet');
}

// ======================================================================
// 6. MOUVEMENTS
// ======================================================================
export function move(k, label = '') {
  const id = U('mv');
  let s = `<rect class="i-bg" width="160" height="100"/>` + arrowDefs(id);
  const rails = (x1, y1, x2, y2) => `<path class="i-rail" d="M${x1 - 3},${y1} L${x2 - 3},${y2} M${x1 + 3},${y1} L${x2 + 3},${y2}" ${NS}/>`;
  switch (k) {
    case 'fixe': s += personTop(80, 26, 180) + camTop(80, 76, 0, 40, 40) + `<text class="i-txt i-b" text-anchor="middle" x="80" y="97">caméra immobile</text>`; break;
    case 'pan': s += camTop(80, 78, -35, 30, 50) + `<g opacity=".35">${camTop(80, 78, 35, 30, 50)}</g>` + arrow('M58,40 Q80,30 102,40', id) + personTop(50, 30, 150) + personTop(112, 30, 210); break;
    case 'tilt': s += `<line class="i-ink" x1="0" y1="92" x2="160" y2="92" ${NS}/><rect class="i-wall2" x="20" y="8" width="30" height="84"/>` + camSide(110, 70, 180, 1.4) + arrow('M92,78 Q72,60 86,34', id); break;
    case 'dollyin': s += rails(80, 94, 80, 52) + personTop(80, 20, 180) + camTop(80, 86, 0, 40, 30) + arrow('M96,86 L96,56', id); break;
    case 'pushin': s += rails(80, 94, 80, 64) + personTop(80, 20, 180) + camTop(80, 86, 0, 32, 36) + arrow('M96,86 L96,74', id, 'stroke-dasharray="2 2"') + `<text class="i-txt" x="100" y="80">très lent</text>`; break;
    case 'dollyout': s += rails(80, 94, 80, 52) + personTop(80, 26, 180) + camTop(80, 60, 0, 40, 20) + arrow('M96,60 L96,90', id); break;
    case 'lateral': s += rails(20, 84, 140, 84) + `<path class="i-rail" d="M20,84 L140,84" ${NS} opacity="0"/>` + personTop(70, 28, 90) + aimCam(66, 80, 70, 28, 34) + arrow('M70,94 L128,94', id) + arrow('M78,40 L118,40', id); break;
    case 'arc': s += `<circle class="i-rail" cx="80" cy="46" r="34" fill="none" ${NS}/>` + personTop(74, 46, 90) + personTop(86, 46, -90) + camTop(80, 84, 0, 40, 28) + arrow('M112,64 A34,34 0 0 0 112,28', id); break;
    case 'follow': s += personTop(80, 40, 0) + camTop(80, 76, 0, 30, 24) + arrow('M92,40 L92,12', id) + arrow('M100,76 L100,50', id); break;
    case 'zoom': s += personTop(80, 18, 180) + camTop(80, 86, 0, 60, 56) + `<g class="i-zoomin">${camTop(80, 86, 0, 18, 64)}</g>` + `<text class="i-txt" x="100" y="80">la caméra ne bouge pas</text>`; break;
    case 'dollyzoom': s += rails(80, 94, 80, 54) + personTop(80, 18, 180) + `<g opacity=".35">${camTop(80, 86, 0, 18, 64)}</g>` + camTop(80, 58, 0, 55, 34) + arrow('M100,88 L100,62', id) + `<text class="i-txt" x="104" y="76">avance + dézoome</text>`; break;
    case 'handheld': s += personTop(80, 22, 180) + `<path class="i-arrow" d="M30,88 q6,-6 10,-2 t10,-4 t8,-6 t10,-2 t8,-6" ${NS}/>` + camTop(78, 64, 8, 40, 30); break;
    case 'steadicam': s += `<path class="i-arrow" d="M20,92 C40,60 60,90 80,64 S120,40 130,20" marker-end="url(#${id})" ${NS}/>` + aimCam(80, 64, 128, 14, 34) + personTop(128, 14, 200); break;
    case 'crane': s += `<line class="i-ink" x1="0" y1="92" x2="160" y2="92" ${NS}/>` + personSide(40, 92, 40)
      + `<path class="i-rail" d="M132,92 L132,66" stroke-width="2" ${NS}/><path class="i-rail" d="M132,66 L104,76 M132,66 L148,60" ${NS}/><path class="i-dash" d="M132,66 L108,32" ${NS}/>`
      + camSide(102, 77, 182, 1.1) + `<g opacity=".45">${camSide(106, 30, 150, 1.1)}</g>` + arrow('M92,70 Q84,48 98,34', id)
      + `<text class="i-txt" x="112" y="22">grue qui monte</text>`; break;
    case 'drone': s += `<line class="i-ink" x1="0" y1="92" x2="160" y2="92" ${NS}/>` + personSide(40, 92, 16) + `<g transform="translate(110 22)"><rect class="i-cam" x="-10" y="-2" width="20" height="4" rx="1"/><circle class="i-cam" cx="-12" cy="-4" r="4"/><circle class="i-cam" cx="12" cy="-4" r="4"/><rect class="i-cam" x="-3" y="2" width="6" height="5"/></g>` + arrow('M126,40 Q140,60 150,36', id) + `<path class="i-beam" d="M110,28 L20,92 L90,92 Z"/>`; break;
    case 'oner': s += `<path class="i-wall2" d="M10,10 L150,10 L150,90 L10,90 Z" fill="none" ${NS}/><path class="i-line2" d="M60,10 L60,55 M100,45 L100,90" ${NS}/><path class="i-arrow" d="M24,82 L24,24 Q24,18 34,18 L80,18 Q86,18 86,28 L86,70 Q86,80 96,80 L130,80 Q138,80 138,70 L138,24" marker-end="url(#${id})" ${NS}/>` + camTop(24, 82, 0, 30, 14); break;
    case 'whip': s += personTop(40, 24, 150) + personTop(120, 24, 210) + camTop(80, 80, 0, 30, 40) + `<path class="i-arrow" d="M48,46 Q80,26 112,46" marker-end="url(#${id})" ${NS} stroke-width="3"/>` + [0, 1, 2].map(i => `<line class="i-line2" x1="${62 + i * 9}" y1="${50 - i}" x2="${70 + i * 9}" y2="${48 - i}" ${NS}/>`).join(''); break;
    case 'snorricam': s += personTop(80, 40, 180, '', true) + `<path class="i-rail" d="M80,44 L80,62" ${NS}/>` + camTop(80, 66, 0, 50, 14) + `<text class="i-txt" text-anchor="middle" x="80" y="92">caméra fixée au corps</text>` + arrow('M40,20 L120,20', id); break;
    case 'roll': s += `<g transform="rotate(-18 80 50)"><rect class="i-frame2" x="40" y="28" width="80" height="45" ${NS}/><line class="i-ink" x1="40" y1="56" x2="120" y2="56" ${NS}/></g>` + `<path class="i-arrow" d="M122,20 A48,48 0 0 1 132,70" marker-end="url(#${id})" ${NS}/>`; break;
  }
  return wrap('0 0 160 100', s, label, 'move');
}

// ======================================================================
// 7. PLAN DE FEU (vue de dessus) à partir d'un rig
// ======================================================================
const ROLE = { key: 'Face', fill: 'Débouchage', back: 'Contre', rim: 'Liseré', practical: 'Source déco', neg: 'Noir négatif', bg: 'Fond' };
export const ROLE_NOM = ROLE;
export function plot(rig, label = '', opts = {}) {
  const cx = 80, cy = 52, R = 34;
  const id = U('pl');
  const L = rig.lights || [];
  let defs = L.map((l, i) => {
    const c = rgb(lightRGB(l));
    return `<linearGradient id="${id}g${i}" x1="0" x2="1"><stop offset="0" stop-color="${c}" stop-opacity=".55"/><stop offset="1" stop-color="${c}" stop-opacity="0.04"/></linearGradient>`;
  }).join('');
  let s = `<rect class="i-bg" width="160" height="100"/>`;
  if (rig.bg && rig.bg.i > 0.01) {
    const c = rgb(rig.bg.c ? hexRGB(rig.bg.c) : kelvinRGB(rig.bg.k || 4300));
    defs += `<linearGradient id="${id}bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity="${Math.min(0.9, 0.2 + rig.bg.i * 0.5)}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient>`;
    s += `<rect x="14" y="3" width="132" height="16" fill="url(#${id}bg)"/><rect class="i-wall2" x="14" y="3" width="132" height="2.2"/>`;
    s += `<text class="i-txt i-cap" x="145" y="10" text-anchor="end">fond ${rig.bg.i >= 1 ? 'très éclairé' : rig.bg.i > 0.3 ? 'éclairé' : 'peu éclairé'}</text>`;
  } else s += `<rect class="i-wall2" x="14" y="3" width="132" height="2.2"/><text class="i-txt i-cap" x="145" y="10" text-anchor="end">fond noir</text>`;
  if (rig.haze) s += `<text class="i-txt i-cap" x="15" y="10">≋ fumée</text>`;
  let beams = '', lamps = '', labels = '';
  const GOBO = { stores: 'stores', fenetre: 'fenêtre', feuilles: 'feuillage' };
  L.forEach((l, i) => {
    const el = l.el || 0, cosE = Math.cos(el * Math.PI / 180);
    const over = el >= 60; // source quasi verticale : dessinée au-dessus du sujet
    const a = l.az * Math.PI / 180;
    let dist = R * Math.min(1.2, Math.max(0.6, (l.d || 2.2) / 2.2)) * (over ? cosE : Math.max(0.42, cosE));
    if (!over && Math.abs(l.az) < 15) dist *= el < 0 ? 1.05 : 0.62;
    const ux = Math.sin(a), uy = Math.cos(a);
    const x = over ? cx : cx + ux * dist, y = over ? cy : cy + uy * dist;
    const ang = Math.atan2(cy - y, cx - x) * 180 / Math.PI;
    const c = rgb(lightRGB(l));
    const face = 5 + (l.s || 0) * 12;
    const len = Math.hypot(cx - x, cy - y) - 2;
    if (l.r === 'neg') {
      lamps += `<g transform="translate(${x} ${y}) rotate(${ang + 90})"><rect x="-10" y="-1.6" width="20" height="3.2" fill="#050505" stroke="currentColor" stroke-width=".3"/></g>`;
    } else if (over) {
      beams += `<circle cx="${cx}" cy="${cy}" r="12" fill="${c}" opacity=".18"/><circle class="i-dash" cx="${cx}" cy="${cy}" r="12" ${NS}/>`;
      lamps += `<g transform="translate(${cx + 9} ${cy - 9})"><rect class="i-lampbody" x="-3.5" y="-3.5" width="7" height="7" rx="1.2"/><circle r="2.2" fill="${c}"/></g><path class="i-dash" d="M${cx + 6},${cy - 6} L${cx + 3},${cy - 3}" ${NS}/>`;
    } else {
      beams += `<g transform="translate(${x} ${y}) rotate(${ang})"><path d="M2,${-face / 2} L${len},${-face / 2 - 5} L${len},${face / 2 + 5} L2,${face / 2} Z" class="i-beamL" fill="url(#${id}g${i})"/>${l.gobo ? `<path class="i-ink" d="M${len * 0.42},${-face / 2 - 3} L${len * 0.42},${face / 2 + 3}" stroke-dasharray="1.6 1.2" stroke-width="1.4" ${NS}/>` : ''}</g>`;
      if (l.r === 'practical') {
        lamps += `<g transform="translate(${x} ${y})"><circle r="5" fill="${c}" opacity=".25"/><circle r="2.8" fill="${c}" stroke="currentColor" stroke-width=".4"/></g>`;
      } else if (l.rebond) {
        // surface réfléchissante (source réelle vue par le sujet) + projecteur tourné vers elle
        lamps += `<g transform="translate(${x} ${y}) rotate(${ang})"><rect x="-1" y="${-face / 2}" width="2" height="${face}" fill="#f4f1ea" stroke="currentColor" stroke-width=".3"/>
          <g transform="translate(9 0) rotate(180)"><rect class="i-lampbody" x="-6" y="-2.5" width="5.5" height="5" rx="1"/><rect x="-0.6" y="-2" width="1.2" height="4" fill="${c}"/></g>
          <path d="M7.5,-2 L1,${-face / 2 + 1} M7.5,2 L1,${face / 2 - 1}" class="i-dash" ${NS}/></g>`;
      } else if ((l.s || 0) >= 0.5) {
        lamps += `<g transform="translate(${x} ${y}) rotate(${ang})"><path class="i-lampbody" d="M-5,-2.5 L0,${-face / 2} L0,${face / 2} L-5,2.5 Z"/><rect x="-0.4" y="${-face / 2}" width="1.8" height="${face}" fill="${c}"/></g>`;
      } else {
        lamps += `<g transform="translate(${x} ${y}) rotate(${ang})"><rect class="i-lampbody" x="-6" y="-3" width="6.5" height="6" rx="1"/><rect x="0.3" y="-2.4" width="1.4" height="4.8" fill="${c}"/><path class="i-ink" d="M1.5,-3 L4,-5 M1.5,3 L4,5" ${NS}/></g>`;
      }
    }
    const front = !over && Math.abs(ux) < 0.3;
    let lx, ly, anchor;
    if (over) { lx = cx - 15; ly = cy - 4; anchor = 'end'; }
    else if (front) { lx = x + 8 * (i % 2 ? -1 : 1); ly = y + 1; anchor = i % 2 ? 'end' : 'start'; }
    else { lx = x + ux * 9; ly = y + uy * 9 + (uy > 0.3 ? 2 : 0); anchor = ux < -0.3 ? 'end' : 'start'; }
    labels += `<text class="i-txt i-b" x="${lx}" y="${ly}" text-anchor="${anchor}">${l.nom || ROLE[l.r] || l.r}${over ? ' (au-dessus)' : ''}${l.rebond ? ' (rebond)' : ''}</text>`;
    if (l.r !== 'neg') {
      const extra = [l.gobo ? `motif ${GOBO[l.gobo] || l.gobo}` : '', l.flick === 'strobe' ? 'clignote' : l.flick ? 'vacille' : ''].filter(Boolean).join(' · ');
      labels += `<text class="i-txt i-cap" x="${lx}" y="${ly + 4.6}" text-anchor="${anchor}">${el > 0 ? '↑' : el < 0 ? '↓' : ''}${Math.abs(el)}° · ${l.c ? 'couleur' : (l.k || 4300) + ' K'}</text>`;
      if (extra) labels += `<text class="i-txt i-cap" x="${lx}" y="${ly + 9}" text-anchor="${anchor}">${extra}</text>`;
    }
  });
  s += beams + `<g transform="translate(${cx} ${cy}) scale(1.5) translate(${-cx} ${-cy})">${personTop(cx, cy, 180 - (rig.yaw || 0))}</g>` + lamps;
  s += camTop(cx, 93, 0, 36, 8) + `<text class="i-txt i-cap" x="${cx - 6}" y="98" text-anchor="end">caméra</text>` + labels;
  return wrap('0 0 160 100', `<defs>${defs}</defs>` + s, label || 'Plan de feu', 'plot');
}

// ======================================================================
// Dispatch
// ======================================================================
export function illustration(t) {
  const label = t.nom;
  if (t.rig) return plot(t.rig, label);
  const il = t.illus || {};
  switch (il.t) {
    case 'shot': return shot(il.v, label);
    case 'angle': return angle(il, label);
    case 'top': return top(il.k, label);
    case 'compo': return compo(il.k, label);
    case 'focal': return focal(il, label);
    case 'dof': return dof(il.k, label);
    case 'move': return move(il.k, label);
  }
  return wrap('0 0 160 90', `<rect class="i-bg" width="160" height="90"/>`, label);
}
