// Labo 3D : une tête sculptée procéduralement, éclairée par un « rig » (même format que les plans de feu).
import * as THREE from '../vendor/three.bundle.js';
import { OrbitControls } from '../vendor/three.bundle.js';
import { kelvinRGB, hexRGB } from './illus.js';
import { buildDecor } from './env.js';

const HEAD_Y = 1.62;
const HEAD_R = 0.118;

const ss = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const g = (d2, s) => Math.exp(-d2 / s);

// ---------- Tête procédurale ----------
function headGeometry() {
  const geo = new THREE.SphereGeometry(1, 160, 120);
  const p = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    const { x, y, z } = v;
    const front = ss(0.25, 0.8, z);
    let r = 1;
    // arcades sourcilières
    r += 0.055 * g((y - 0.27) ** 2, 0.004) * g(x * x, 0.22) * front;
    // orbites
    r -= 0.085 * (g((x - 0.33) ** 2, 0.018) + g((x + 0.33) ** 2, 0.018)) * g((y - 0.13) ** 2, 0.01) * front;
    // globes oculaires (léger renflement au centre de l'orbite)
    r += 0.03 * (g((x - 0.33) ** 2, 0.005) + g((x + 0.33) ** 2, 0.005)) * g((y - 0.12) ** 2, 0.003) * front;
    // nez
    const ny = y;
    const noseProfile = ny > 0.16 ? 0 : ny > -0.24 ? 0.05 + (0.16 - ny) * 0.62 : Math.max(0, 0.3 - (-0.24 - ny) * 3.2);
    const nw = 0.0025 + Math.max(0, 0.12 - ny) * 0.012;
    r += noseProfile * g(x * x, nw) * front;
    // narines
    r += 0.035 * (g((x - 0.085) ** 2, 0.002) + g((x + 0.085) ** 2, 0.002)) * g((y + 0.3) ** 2, 0.0025) * front;
    // pommettes
    r += 0.05 * (g((Math.abs(x) - 0.5) ** 2, 0.02)) * g((y + 0.02) ** 2, 0.02) * ss(0, 0.6, z);
    // lèvres et sillon
    r += 0.05 * g(x * x, 0.02) * g((y + 0.47) ** 2, 0.004) * front;
    r -= 0.02 * g(x * x, 0.03) * g((y + 0.52) ** 2, 0.0008) * front;
    r += 0.04 * g(x * x, 0.02) * g((y + 0.6) ** 2, 0.004) * front;
    // menton
    r += 0.07 * g(x * x, 0.05) * g((y + 0.84) ** 2, 0.01) * front;
    // oreilles
    r += 0.13 * g((y - 0.03) ** 2, 0.03) * g((z + 0.05) ** 2, 0.012) * ss(0.85, 0.97, Math.abs(x));
    let X = x * r, Y = y * r, Z = z * r;
    // mâchoire : affinage vers le bas
    const jaw = ss(-0.15, -0.95, y);
    X *= 1 - 0.22 * jaw;
    Z *= 1 - (z > 0 ? 0.05 : 0.25) * jaw;
    // arrière du crâne
    if (z < 0) { Z *= 1.12; Y += 0.05 * ss(0, -0.8, z) * ss(-0.3, 0.6, y); }
    // proportions globales
    X *= 0.8; Y *= 1.05; Z *= 0.95;
    p.setXYZ(i, X, Y, Z);
  }
  geo.computeVertexNormals();
  return geo;
}

// ---------- Textures de gobo ----------
function goboTexture(kind) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, 256, 256);
  x.fillStyle = '#000';
  if (kind === 'stores') { for (let i = 0; i < 256; i += 22) x.fillRect(0, i, 256, 11); }
  else if (kind === 'fenetre') { x.fillRect(122, 0, 12, 256); x.fillRect(0, 122, 256, 12); x.fillRect(0, 0, 256, 18); x.fillRect(0, 238, 256, 18); x.fillRect(0, 0, 18, 256); x.fillRect(238, 0, 18, 256); }
  else if (kind === 'feuilles') {
    let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 70; i++) { x.beginPath(); x.ellipse(rnd() * 256, rnd() * 256, 8 + rnd() * 26, 5 + rnd() * 16, rnd() * 3, 0, 7); x.fill(); }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

const colorOf = l => { const a = l.c ? hexRGB(l.c) : kelvinRGB(l.k || 4300); return new THREE.Color().setRGB(a[0] / 255, a[1] / 255, a[2] / 255, THREE.SRGBColorSpace); };

// ======================================================================
export function createLab(container, { rig, mini = false, view = {} } = {}) {
  const coarse = matchMedia('(pointer: coarse)').matches;
  const fullDPR = Math.min(coarse ? 1.75 : 2, window.devicePixelRatio || 1);
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(fullDPR);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  // Les ombres ne sont recalculées que si l'éclairage change (pas quand on tourne la caméra)
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  // Brouillard toujours présent (densité 0 sans fumée) pour éviter de recompiler les shaders
  scene.fog = new THREE.FogExp2(0x1a1a1f, 0);
  const camera = new THREE.PerspectiveCamera(20, 4 / 3, 0.05, 400);

  // Décor
  const studio = new THREE.Group(); scene.add(studio);
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x6d6a66, roughness: 1 });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), wallMat);
  wall.position.set(0, 2, -1.6); wall.receiveShadow = true; studio.add(wall);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshStandardMaterial({ color: 0x3a3632, roughness: 1 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; studio.add(floor);

  // Décors (construits à la demande, gardés en mémoire)
  const decors = {};
  let decorId = 'studio', decor = null;
  function setDecor(id) {
    decorId = id || 'studio';
    if (decorId !== 'studio' && !decors[decorId]) { decors[decorId] = buildDecor(decorId); if (decors[decorId]) scene.add(decors[decorId].group); }
    decor = decors[decorId] || null;
    studio.visible = !decor;
    for (const k in decors) decors[k].group.visible = decors[k] === decor;
    applyDecorLight();
    renderer.shadowMap.needsUpdate = true; requestRender();
  }

  // Personnage
  const subject = new THREE.Group(); scene.add(subject);
  const skin = new THREE.MeshStandardMaterial({ color: 0xc8987c, roughness: 0.52, metalness: 0 });
  const head = new THREE.Mesh(headGeometry(), skin);
  head.scale.setScalar(HEAD_R); head.position.y = HEAD_Y; head.castShadow = head.receiveShadow = true;
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x2a1b12, roughness: 0.75 });
  const hair = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32, 0, Math.PI * 2, 0, 1.45), hairMat);
  hair.scale.set(0.845, 1.0, 1.03); hair.rotation.x = -0.62; hair.position.set(0, 0.06, -0.06);
  hair.castShadow = hair.receiveShadow = true; head.add(hair);
  // yeux (pour les reflets)
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x1b120c, roughness: 0.08, metalness: 0 });
  for (const sx of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 16), eyeMat);
    e.position.set(sx * 0.265, 0.135, 0.78); e.scale.set(1, 0.72, 0.5); head.add(e);
  }
  const cloth = new THREE.MeshStandardMaterial({ color: 0x3b3f46, roughness: 0.9 });
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.06, 0.14, 32), skin);
  neck.position.y = HEAD_Y - 0.15; neck.castShadow = neck.receiveShadow = true;
  const shoulders = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.27, 8, 24), cloth);
  shoulders.rotation.z = Math.PI / 2; shoulders.scale.set(1, 1, 0.85); shoulders.position.y = HEAD_Y - 0.235; shoulders.castShadow = shoulders.receiveShadow = true;
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.62, 40), cloth);
  torso.scale.z = 0.55; torso.position.y = HEAD_Y - 0.53; torso.castShadow = torso.receiveShadow = true;
  const pants = new THREE.MeshStandardMaterial({ color: 0x2b2d33, roughness: 0.9 });
  const hips = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.16, 0.2, 32), pants);
  hips.scale.z = 0.62; hips.position.y = HEAD_Y - 0.9; hips.castShadow = hips.receiveShadow = true;
  const legs = [];
  for (const sx of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.055, HEAD_Y - 0.95, 16), pants);
    leg.position.set(sx * 0.085, (HEAD_Y - 0.95) / 2 + 0.04, 0); leg.castShadow = leg.receiveShadow = true;
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.26), new THREE.MeshStandardMaterial({ color: 0x1a1512, roughness: 0.6 }));
    shoe.position.set(sx * 0.085, 0.035, 0.05); shoe.castShadow = true;
    legs.push(leg, shoe);
  }
  const headPivot = new THREE.Group(); headPivot.add(head); subject.add(headPivot, neck, shoulders, torso, hips, ...legs);

  const hemi = new THREE.HemisphereLight(0xbfc8d6, 0x2a2622, 0.05); scene.add(hemi);

  const rigGroup = new THREE.Group(); scene.add(rigGroup);
  const target = new THREE.Object3D(); target.position.set(0, HEAD_Y - 0.05, 0); rigGroup.add(target);
  let showRig = !mini;

  // ---------- Projecteurs réutilisables ----------
  // Chaque source = un « fixture » créé une fois puis mis à jour : bouger un curseur
  // ne recrée ni lumière, ni carte d'ombre, ni texture (d'où la fluidité).
  const SHADOW = mini || coarse ? 1024 : 1536;
  const gobos = {};
  const gobo = k => gobos[k] ||= goboTexture(k);
  const boxGeo = new THREE.BoxGeometry(1, 1, 0.05), cylGeo = new THREE.CylinderGeometry(0.07, 0.09, 0.16, 20);
  const coneGeo = new THREE.ConeGeometry(1, 1, 40, 1, true); coneGeo.translate(0, -0.5, 0); coneGeo.rotateX(-Math.PI / 2);
  const flagGeo = new THREE.PlaneGeometry(0.6, 0.9), flagMat = new THREE.MeshBasicMaterial({ color: 0x050505, side: THREE.DoubleSide });
  const fixtures = [], flags = [];

  function makeFixture() {
    const spot = new THREE.SpotLight(0xffffff, 0, 0, 0.4, 0.5, 0);
    spot.target = target; spot.castShadow = true;
    spot.shadow.mapSize.set(SHADOW, SHADOW);
    spot.shadow.bias = -0.0004; spot.shadow.normalBias = 0.012;
    spot.shadow.camera.near = 0.2; spot.shadow.camera.far = 12;
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const box = new THREE.Mesh(boxGeo, lampMat), cyl = new THREE.Mesh(cylGeo, lampMat);
    box.userData.rigHelper = cyl.userData.rigHelper = true;
    const cone = new THREE.Mesh(coneGeo, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    rigGroup.add(spot, box, cyl, cone);
    return { spot, box, cyl, cone, lampMat };
  }
  function dropFixture(f) {
    rigGroup.remove(f.spot, f.box, f.cyl, f.cone);
    f.spot.shadow.map?.dispose(); f.spot.dispose?.(); f.lampMat.dispose(); f.cone.material.dispose();
  }
  const lights = () => fixtures.map(f => f.spot);

  // Le curseur « Fond » règle la luminosité du décor ; sa température le teinte
  const tint = new THREE.Color();
  function applyDecorLight() {
    const bg = (rig && rig.bg) || { i: 0 };
    const c = bg.c ? hexRGB(bg.c) : kelvinRGB(bg.k || 4300), ref = kelvinRGB(5200);
    tint.setRGB(Math.min(1.3, c[0] / ref[0]), Math.min(1.3, c[1] / ref[1]), Math.min(1.3, c[2] / ref[2]), THREE.SRGBColorSpace);
    const level = 0.22 + (bg.i || 0) * 0.85;
    if (decor) {
      for (const m of decor.fondMats) m.color.copy(tint).multiplyScalar(level);
      if (decor.ground) { decor.ground.material.emissive.copy(tint); decor.ground.material.emissiveIntensity = level * 0.6; }
      scene.fog.color.set(rig?.haze ? 0x1a1a1f : decor.fog.color).multiplyScalar(rig?.haze ? 1 : Math.min(1, level));
      scene.fog.density = rig?.haze ? 0.08 : decor.fog.density;
    } else { scene.fog.color.set(0x1a1a1f); scene.fog.density = rig?.haze ? 0.08 : 0; }
  }

  function setRig(r) {
    rig = JSON.parse(JSON.stringify(r || { lights: [] }));
    headPivot.rotation.y = (rig.yaw || 0) * Math.PI / 180;
    hemi.intensity = 0.03 + (rig.amb || 0) * 3.2;
    const bg = rig.bg || { i: 0 };
    const bc = bg.c ? hexRGB(bg.c) : kelvinRGB(bg.k || 4300);
    wallMat.emissive.setRGB(bc[0] / 255, bc[1] / 255, bc[2] / 255, THREE.SRGBColorSpace);
    wallMat.emissiveIntensity = (bg.i || 0) * 0.42;
    applyDecorLight();

    const srcs = (rig.lights || []).filter(l => l.r !== 'neg');
    const negs = (rig.lights || []).filter(l => l.r === 'neg');
    while (fixtures.length < srcs.length) fixtures.push(makeFixture());
    while (fixtures.length > srcs.length) dropFixture(fixtures.pop());
    while (flags.length < negs.length) { const m = new THREE.Mesh(flagGeo, flagMat); m.userData.rigHelper = true; rigGroup.add(m); flags.push(m); }
    while (flags.length > negs.length) rigGroup.remove(flags.pop());

    let anim = false;
    srcs.forEach((l, k) => {
      const f = fixtures[k];
      const col = colorOf(l);
      const a = l.az * Math.PI / 180, e = (l.el || 0) * Math.PI / 180, d = (l.d || 2.2);
      const s = l.s ?? 0.3;
      const base = (l.i ?? 1) * 7.5;
      f.spot.color.copy(col);
      f.spot.position.set(Math.sin(a) * Math.cos(e) * d, HEAD_Y + Math.sin(e) * d, Math.cos(a) * Math.cos(e) * d);
      f.spot.angle = s > 0.6 ? 0.55 : 0.38;
      f.spot.penumbra = 0.25 + s * 0.7;
      f.spot.shadow.radius = 1 + s * 14;
      f.spot.map = l.gobo ? gobo(l.gobo) : null; // (un motif ajouté/retiré recompile une fois, c'est rare)
      f.spot.intensity = base;
      f.spot.userData = { base, flick: l.flick };
      if (l.flick) anim = true;
      // représentation du projecteur
      f.lampMat.color.copy(col);
      const big = s > 0.5;
      f.box.visible = big && showRig; f.cyl.visible = !big && showRig;
      f.box.scale.set(0.12 + s * 0.5, 0.12 + s * 0.5, 1);
      for (const m of [f.box, f.cyl]) { m.position.copy(f.spot.position); m.lookAt(target.position); }
      f.cyl.rotateX(Math.PI / 2);
      // faisceau visible dans la fumée
      f.cone.visible = !!rig.haze;
      if (rig.haze) {
        const len = f.spot.position.distanceTo(target.position) + 1.5, rad = Math.tan(f.spot.angle) * len;
        f.cone.scale.set(rad, rad, len);
        f.cone.position.copy(f.spot.position); f.cone.lookAt(target.position);
        f.cone.material.color.copy(col); f.cone.material.opacity = 0.05 + (l.i || 1) * 0.03;
      }
    });
    negs.forEach((l, k) => {
      const m = flags[k], a = l.az * Math.PI / 180;
      m.position.set(Math.sin(a) * 0.7, HEAD_Y - 0.1, Math.cos(a) * 0.7); m.lookAt(0, HEAD_Y - 0.1, 0); m.visible = showRig;
    });
    renderer.shadowMap.needsUpdate = true;
    setAnimating(anim);
    requestRender();
  }

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, HEAD_Y - 0.02, 0);
  controls.enableDamping = true; controls.dampingFactor = 0.12;
  controls.enablePan = false; controls.minDistance = 0.3; controls.maxDistance = 60;
  controls.addEventListener('change', () => { busy(); requestRender(); });
  controls.addEventListener('start', () => requestRender());

  let state = { elev: view.elev ?? 0, mm: view.mm ?? 85, frame: view.frame ?? 0.5, env: view.env || 'studio', dof: view.dof ?? false, N: view.N ?? 2.8 };

  function placeCamera() {
    const fovV = 2 * Math.atan(12 / state.mm) * 180 / Math.PI;
    camera.fov = fovV;
    // distance pour que la hauteur cadrée ≈ state.frame mètres
    const d = (state.frame / 2) / Math.tan(fovV * Math.PI / 360);
    const e = state.elev * Math.PI / 180;
    camera.position.set(0, HEAD_Y - 0.06 + Math.sin(e) * d, Math.cos(e) * d);
    controls.target.set(0, HEAD_Y - 0.08, 0);
    camera.near = Math.max(0.02, d / 50);
    camera.updateProjectionMatrix();
    controls.update();
    requestRender();
  }

  function setView(v) { busy(); const envChanged = v.env && v.env !== state.env; Object.assign(state, v); if (envChanged) setDecor(state.env); placeCamera(); }
  function setShowRig(b) { showRig = b; setRig(rig); }

  // ---------- Résolution adaptative ----------
  // Pendant une manipulation, on dessine en résolution réduite ; la netteté revient à l'arrêt.
  let lowRes = false, idleT = 0;
  function busy() {
    if (fullDPR > 1.1 && !lowRes) { lowRes = true; renderer.setPixelRatio(1); resize(); }
    clearTimeout(idleT);
    idleT = setTimeout(() => { if (lowRes) { lowRes = false; renderer.setPixelRatio(fullDPR); resize(); } }, 220);
  }

  // ---------- Profondeur de champ (flou optique) ----------
  // Cercle de confusion physique : CoC = f² / (N·(s − f)) · |d − s| / d, rapporté à la hauteur du capteur (24 mm).
  const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4 });
  rt.depthTexture = new THREE.DepthTexture(4, 4);
  const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const postMat = new THREE.ShaderMaterial({
    uniforms: { tColor: { value: rt.texture }, tDepth: { value: rt.depthTexture }, cNear: { value: 0.05 }, cFar: { value: 400 }, focusD: { value: 1 }, coef: { value: 0 }, aspect: { value: 1 }, maxBlur: { value: 0.06 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `
      #include <common>
      #include <packing>
      uniform sampler2D tColor; uniform sampler2D tDepth;
      uniform float cNear, cFar, focusD, coef, aspect, maxBlur;
      varying vec2 vUv;
      float dist(vec2 uv) { return -perspectiveDepthToViewZ(texture2D(tDepth, uv).x, cNear, cFar); }
      float coc(float d) { return min(maxBlur, coef * abs(d - focusD) / max(d, 0.001)); }
      void main() {
        float d0 = dist(vUv), c0 = coc(d0) * 0.5;
        vec4 col = texture2D(tColor, vUv); float wsum = 1.0;
        if (c0 > 0.0008) {
          for (int i = 0; i < 48; i++) {
            float fi = float(i) + 0.5, r = sqrt(fi / 48.0), a = fi * 2.39996323;
            vec2 off = vec2(cos(a) / aspect, sin(a)) * r * c0;
            vec2 uv = clamp(vUv + off, 0.001, 0.999);
            float di = dist(uv);
            // un objet net plus proche (le personnage) ne doit pas « baver » sur le fond flou
            float w = di < d0 - 0.05 ? clamp(coc(di) * 0.5 / (r * c0 + 1e-4), 0.0, 1.0) : 1.0;
            col += texture2D(tColor, uv) * w; wsum += w;
          }
        }
        gl_FragColor = col / wsum;
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    depthTest: false, depthWrite: false,
  });
  const postScene = new THREE.Scene();
  postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat));
  const headPos = new THREE.Vector3(0, HEAD_Y, 0);
  function draw() {
    if (!state.dof) { renderer.setRenderTarget(null); renderer.render(scene, camera); return; }
    const f = state.mm / 1000, sDist = Math.max(f * 1.5, camera.position.distanceTo(headPos) - 0.08);
    const u = postMat.uniforms;
    u.cNear.value = camera.near; u.cFar.value = camera.far; u.focusD.value = sDist;
    u.coef.value = (f * f) / (state.N * (sDist - f)) / 0.024; u.aspect.value = camera.aspect;
    renderer.setRenderTarget(rt); renderer.render(scene, camera);
    renderer.setRenderTarget(null); renderer.render(postScene, postCam);
  }

  // ---------- Rendu ----------
  let needs = true, raf = 0, disposed = false, animating = false;
  function requestRender() { needs = true; if (!raf && !disposed) raf = requestAnimationFrame(loop); }
  function setAnimating(b) { animating = b; if (b && !raf) raf = requestAnimationFrame(loop); }
  const t0 = performance.now();
  function loop(now) {
    raf = 0;
    if (disposed) return;
    const moved = controls.update();
    if (moved) needs = true;
    if (animating) {
      const t = (now - t0) / 1000;
      for (const l of lights()) {
        const f = l.userData.flick;
        if (f === 'strobe') l.intensity = (Math.sin(t * 9) > 0.55 || Math.sin(t * 2.3) > 0.97) ? l.userData.base * 1.6 : l.userData.base * 0.02;
        else if (f) l.intensity = l.userData.base * (0.82 + 0.1 * Math.sin(t * 13) + 0.08 * Math.sin(t * 7.3 + 1) + 0.05 * Math.sin(t * 23));
      }
      needs = true;
    }
    if (needs && visible) { draw(); needs = false; }
    if ((animating && visible) || moved) raf = requestAnimationFrame(loop);
  }

  function resize() {
    const w = container.clientWidth || 400, h = container.clientHeight || 300;
    renderer.setSize(w, h, false);
    const px = renderer.getPixelRatio(); rt.setSize(Math.round(w * px), Math.round(h * px));
    camera.aspect = w / h; camera.updateProjectionMatrix();
    needs = true; if (!raf && !disposed) raf = requestAnimationFrame(loop);
  }
  const ro = new ResizeObserver(resize); ro.observe(container);

  // Pas de rendu quand la scène est hors écran (économie batterie)
  let visible = true;
  const io = new IntersectionObserver(es => { for (const e of es) { visible = e.isIntersecting; if (visible) requestRender(); } });
  io.observe(container);

  resize();
  setRig(rig);
  setDecor(state.env);
  placeCamera();

  return {
    setRig(r) { busy(); setRig(r); }, setView, setShowRig,
    get view() { return { ...state }; },
    get distance() { return camera.position.distanceTo(headPos); },
    snapshot() { renderer.setPixelRatio(fullDPR); resize(); draw(); return renderer.domElement.toDataURL('image/jpeg', 0.9); },
    dispose() {
      disposed = true; cancelAnimationFrame(raf); clearTimeout(idleT); ro.disconnect(); io.disconnect(); controls.dispose();
      while (fixtures.length) dropFixture(fixtures.pop());
      Object.values(gobos).forEach(t => t.dispose()); rt.dispose(); postMat.dispose(); 
      scene.traverse(o => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
      renderer.dispose(); renderer.forceContextLoss?.(); renderer.domElement.remove();
    },
  };
}
