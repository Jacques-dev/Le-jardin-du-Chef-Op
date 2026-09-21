// Vues outils : composeur, labo 3D, découpage
import { INTENTIONS, TECHNIQUES, CATEGORIES, AXES, T, I, C } from './data/index.js';
import { illustration, plot, shot, angle as angleIllus, move as moveIllus, ROLE_NOM, kelvinRGB, rgb } from './illus.js';
import { ICONS } from './icons.js';
import { store, uid } from './store.js';
import { $, $$, esc, toast, share, ask, download, famColor, setTitle, intChip, techChip } from './ui.js';
import { analyse, combineRig, view3d, labView, suggest, encodeSel, decodeSel, encodeRig, decodeRig, LIGHT_PRESETS } from './setup.js';

// =====================================================================
// COMPOSEUR
// =====================================================================
function framePreview(sel) {
  const s = shot(sel.valeur || 'pr', 'Cadre');
  const rot = sel.angle === 'debulle' ? 'transform:rotate(-12deg) scale(1.28);' : '';
  return `<div style="${rot}width:100%;height:100%">${s}</div>`;
}
export function composerView(v, q) {
  setTitle('Composeur');
  let sel = [...q.keys()].length ? decodeSel(q.toString()) : store.composer;
  const planRef = q.get('plan'); // "projet:plan" en édition
  let lab = null, show3d = store.labView?.composer3d ?? true;

  v.innerHTML = `
  <section class="hero" style="padding-bottom:4px"><span class="eyebrow">Composeur de plan</span><h1>Composer un plan</h1>
    <p>Choisissez un élément par axe. L'outil lit l'intention produite, signale les contradictions et rédige les consignes pour chaque poste.</p></section>
  <div class="composer">
    <div>
      <div class="panel">
        <div class="axis" style="margin-bottom:14px"><label for="fromInt">Partir d'une intention</label>
          <select id="fromInt"><option value="">— choisir pour pré-remplir —</option>${INTENTIONS.map(i => `<option value="${i.id}">${esc(i.nom)}</option>`).join('')}</select></div>
        <div class="axes">${AXES.map(a => `<div class="axis"><label for="ax-${a.id}"><span>${a.nom}</span><a href="#" data-open="${a.id}" hidden>fiche →</a></label>
          <select id="ax-${a.id}" data-axis="${a.id}"><option value="">—</option>${TECHNIQUES.filter(t => a.cats.includes(t.cat)).map(t => `<option value="${t.id}">${esc(t.nom)}</option>`).join('')}</select></div>`).join('')}</div>
        <div class="actions">
          ${planRef ? `<button class="btn primary" id="updPlan">${ICONS.film} Mettre à jour le plan</button>` : ''}
          <button class="btn ${planRef ? '' : 'primary'}" id="addPlan">${ICONS.plus} Ajouter au découpage</button>
          <button class="btn" id="shareSel">${ICONS.share} Partager</button>
          <a class="btn" id="toLab" href="#/labo">${ICONS.cube} Labo 3D</a>
          <button class="btn" id="rand" title="Tirage au hasard">${ICONS.dice} Hasard</button>
          <button class="btn" id="reset">${ICONS.reset} Vider</button>
        </div>
      </div>
    </div>
    <div class="result-col">
      <div class="previews">
        <figure class="visual"><div id="pvFrame" style="aspect-ratio:16/10;overflow:hidden"></div><figcaption>Cadre</figcaption></figure>
        <figure class="visual"><div id="pvAngle" style="aspect-ratio:16/10;overflow:hidden"></div><figcaption id="pvAngleCap">Caméra</figcaption></figure>
        <figure class="visual"><div id="pvPlot" style="aspect-ratio:16/10;overflow:hidden"></div><figcaption>Plan de feu combiné</figcaption></figure>
        <figure class="visual"><div id="pv3d" style="aspect-ratio:16/10;position:relative;overflow:hidden"></div><figcaption style="display:flex;justify-content:space-between;align-items:center">Rendu 3D <button class="chip sm" id="t3d" style="padding:1px 8px">${show3d ? 'Couper' : 'Afficher'}</button></figcaption></figure>
      </div>
      <div class="panel" style="margin-top:12px"><h2>Intention produite</h2><div id="reading"></div></div>
      <div class="panel" style="margin-top:12px"><h2>Brief technicien</h2><div class="brief" id="brief"></div></div>
    </div>
  </div>`;

  const selects = $$('[data-axis]', v);
  function sync() {
    selects.forEach(s => { s.value = sel[s.dataset.axis] || ''; const a = $(`[data-open="${s.dataset.axis}"]`, v); a.hidden = !s.value; a.href = `#/t/${s.value}`; });
    store.composer = sel;
    const qs = encodeSel(sel) + (planRef ? `&plan=${planRef}` : '');
    history.replaceState({ keepScroll: true }, '', `#/composer${qs ? '?' + qs : ''}`);
    render();
  }
  function render() {
    const A = analyse(sel);
    $('#pvFrame', v).innerHTML = framePreview(sel);
    if (sel.mouvement) { $('#pvAngle', v).innerHTML = illustration(T[sel.mouvement]); $('#pvAngleCap', v).textContent = 'Mouvement'; }
    else { $('#pvAngle', v).innerHTML = angleIllus(T[sel.angle || 'angle-normal'].illus, 'Angle'); $('#pvAngleCap', v).textContent = 'Angle'; }
    const rig = combineRig(sel);
    $('#pvPlot', v).innerHTML = plot(rig);
    $('#toLab', v).href = `#/labo?r=${encodeRig(rig)}&${new URLSearchParams(Object.entries(labView(sel))).toString()}`;
    update3d(rig);
    // lecture
    const r = $('#reading', v);
    if (!A.techs.length) r.innerHTML = `<p class="muted" style="margin:0">Choisissez au moins un élément, ou partez d'une intention.</p>`;
    else r.innerHTML = `<div class="bars">${A.ranked.slice(0, 8).map(x => `<a class="bar" href="#/intention/${x.i.id}" style="--c:${famColor(x.i.famille)}"><span>${esc(x.i.nom)}</span><span class="track"><span class="fill" style="display:block;width:${x.s / A.max * 100}%"></span></span></a>`).join('')}</div>
      ${A.tensions.map(([a, b]) => `<div class="tension"><b>Tension</b> : ${esc(a.nom)} ↔ ${esc(b.nom)}. Contradiction à corriger, ou ambiguïté voulue ?</div>`).join('')}`;
    // brief
    const order = ['Réal', 'Cadre', 'Point', 'Machino', 'Électro', 'Électro / Machino', 'Électro / Effets', 'Chef op', 'Déco', 'Déco / Costume', 'Costume', 'Maquillage', 'Scripte', 'Son', 'Régie', 'Étalo'];
    const keys = Object.keys(A.postes).sort((a, b) => (order.indexOf(a) + 99) % 99 - (order.indexOf(b) + 99) % 99);
    $('#brief', v).innerHTML = A.techs.length ? `<p style="margin:0" class="muted">${A.techs.map(t => esc(t.nom)).join(' · ')}</p>` + keys.map(k => `<h4>${esc(k)}</h4><ul>${A.postes[k].map(x => `<li><b>${esc(x.t.nom.replace(/\s*\(.*\)/, ''))}</b> — ${esc(x.txt)}</li>`).join('')}</ul>`).join('') : '<p class="muted" style="margin:0">Le brief apparaîtra ici.</p>';
  }
  let pending = null;
  async function update3d(rig) {
    const box = $('#pv3d', v);
    if (!show3d) { lab?.dispose(); lab = null; box.innerHTML = `<div class="loading" style="position:absolute;inset:0;display:grid;place-items:center;color:var(--muted);font-size:13px">Rendu 3D coupé</div>`; return; }
    if (!lab) {
      box.innerHTML = `<div class="stage" style="position:absolute;inset:0;border:0;border-radius:0;aspect-ratio:auto"><span class="hint">glisser pour tourner</span></div>`;
      try { const { createLab } = await import('./lab3d.js'); if (!box.isConnected) return; lab = createLab($('.stage', box), { rig, mini: true, view: view3d(sel) }); }
      catch (e) { box.innerHTML = `<div class="loading" style="color:var(--muted);padding:10px;font-size:13px">3D indisponible.</div>`; }
      return;
    }
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(() => { lab.setRig(rig); lab.setView(view3d(sel)); });
    $('.stage', box).style.transform = sel.angle === 'debulle' ? 'rotate(-12deg) scale(1.28)' : '';
  }
  selects.forEach(s => s.addEventListener('change', () => { sel = { ...sel, [s.dataset.axis]: s.value }; if (!s.value) delete sel[s.dataset.axis]; sync(); }));
  $('#fromInt', v).onchange = e => { if (e.target.value) { sel = suggest(e.target.value); toast(`Plan suggéré pour « ${I[e.target.value].nom} »`); sync(); } };
  $('#reset', v).onclick = () => { sel = {}; $('#fromInt', v).value = ''; sync(); };
  $('#rand', v).onclick = () => { sel = {}; for (const a of AXES) { if (['compo', 'pdv', 'source'].includes(a.id) && Math.random() < 0.5) continue; const opts = TECHNIQUES.filter(t => a.cats.includes(t.cat)); sel[a.id] = opts[Math.floor(Math.random() * opts.length)].id; } sync(); };
  $('#shareSel', v).onclick = () => share('Plan composé — Le jardin du Chef Op', location.href.split('&plan=')[0]);
  $('#t3d', v).onclick = e => { show3d = !show3d; store.labView = { ...(store.labView || {}), composer3d: show3d }; e.target.textContent = show3d ? 'Couper' : 'Afficher'; update3d(combineRig(sel)); };
  $('#addPlan', v).onclick = () => addToProject(sel);
  if (planRef) $('#updPlan', v).onclick = () => {
    const [pid, plid] = planRef.split(':'); const pr = store.project(pid); const pl = pr?.plans.find(p => p.id === plid);
    if (!pl) return toast('Plan introuvable');
    pl.setup = { ...sel }; store.upsertProject(pr); toast('Plan mis à jour'); location.hash = `#/decoupage/${pid}`;
  };
  $$('[data-open]', v).forEach(a => a.addEventListener('click', e => { if (a.hidden) e.preventDefault(); }));
  sync();
  return () => { lab?.dispose(); };
}

export async function addToProject(setup) {
  const projects = store.projects();
  const ans = await ask({
    title: 'Ajouter au découpage', ok: 'Ajouter', fields: [
      { label: 'Projet', options: [...projects.map(p => ({ value: p.id, label: p.nom })), { value: '__new', label: '+ Nouveau projet…' }], value: projects[0]?.id || '__new' },
      { label: 'Nom du nouveau projet (si nouveau)', placeholder: 'Ex. Court-métrage « L\'attente »' },
      { label: 'Titre du plan', placeholder: 'Ex. Séq. 3 — Marc découvre la lettre' },
      { label: 'Notes', area: true, placeholder: 'Intention du réalisateur, contraintes, décor…' },
    ]
  });
  if (!ans) return;
  let [pid, pnom, titre, notes] = ans;
  let pr = pid === '__new' ? { id: uid(), nom: pnom.trim() || 'Nouveau projet', created: Date.now(), plans: [] } : store.project(pid);
  pr.plans.push({ id: uid(), titre: titre.trim() || `Plan ${pr.plans.length + 1}`, notes, setup: { ...setup } });
  store.upsertProject(pr);
  toast(`Ajouté à « ${pr.nom} »`);
}

// =====================================================================
// LABO 3D
// =====================================================================
const ROLES = ['key', 'fill', 'back', 'rim', 'practical', 'neg'];
const DECORS = [['studio', 'Studio'], ['rue', 'Rue'], ['nature', 'Nature'], ['interieur', 'Intérieur']];
const STOPS = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16];
const stopIdx = N => STOPS.reduce((b, s, i) => Math.abs(s - N) < Math.abs(STOPS[b] - N) ? i : b, 0);
const GOBOS = { '': 'aucun', stores: 'stores', fenetre: 'fenêtre', feuilles: 'feuillage' };
export function laboView(v, q) {
  setTitle('Labo lumière 3D');
  const presetId = q.get('p') && T[q.get('p')]?.rig ? q.get('p') : null;
  let rig = q.get('r') ? decodeRig(q.get('r')) : null;
  if (!rig) rig = JSON.parse(JSON.stringify(T[presetId || 'rembrandt'].rig));
  rig.lights ||= [];
  let view = { elev: +(q.get('elev') ?? 0), mm: +(q.get('mm') ?? 85), frame: +(q.get('frame') ?? 0.5),
    env: DECORS.some(d => d[0] === q.get('env')) ? q.get('env') : 'studio', dof: q.get('dof') !== '0', N: STOPS[stopIdx(+(q.get('N') || 2.8))] };
  let lab = null, showRig = true, current = presetId || (q.get('r') ? '' : 'rembrandt');
  // État d'ouverture, pour le bouton « Réinitialiser »
  const initial = { rig: JSON.parse(JSON.stringify(rig)), view: { ...view }, current };

  v.innerHTML = `
  <section class="hero" style="padding-bottom:0"><span class="eyebrow">Labo lumière 3D</span><h1>Labo lumière</h1>
    <p>Chargez un schéma, déplacez les sources, changez leur douceur et leur couleur : le visage réagit en direct. Le plan de feu se dessine en même temps.</p></section>
  <div class="lab">
    <div>
      <div class="stage" id="stage"><div class="loading">Chargement de la scène 3D…</div>
        <div class="toolbar"><button id="resetAll" title="Revenir au réglage d'ouverture du labo">↺ Réinitialiser</button><button id="tgRig" class="on">Projecteurs</button><button id="snap">Capture</button></div>
        <span class="hint">1 doigt : tourner · 2 doigts : zoomer</span></div>
      <div class="panel" style="margin-top:12px"><h2>Caméra</h2><div class="ctrl">
        ${slider('elev', 'Hauteur', -80, 60, 1, view.elev, '°')}
        ${slider('mm', 'Focale', 14, 200, 1, view.mm, ' mm')}
        ${slider('frame', 'Cadre', 0.14, 2.5, 0.01, view.frame, ' m')}
        <div class="slider"><span>Décor</span><div class="chips decor-pick" role="radiogroup" aria-label="Décor">${DECORS.map(([id, n]) => `<button class="chip sm ${view.env === id ? 'on' : ''}" data-env="${id}" role="radio" aria-checked="${view.env === id}">${n}</button>`).join('')}</div><span></span></div>
        <label class="slider"><span>Ouverture</span><input type="range" id="s-N" min="0" max="${STOPS.length - 1}" step="1" value="${stopIdx(view.N)}"><output id="o-N">f/${view.N}</output></label>
        <label class="slider"><span>Flou optique</span><input type="checkbox" id="dof" ${view.dof ? 'checked' : ''} style="justify-self:start;width:20px;height:20px;accent-color:var(--accent)"><span></span></label>
        <p class="muted cam-info" id="camInfo"></p>
      </div></div>
      <div class="visual" style="margin-top:12px" id="plan"></div>
    </div>
    <div class="ctrl">
      <div class="panel" style="padding:14px"><div class="axis"><label for="preset"><span>Schéma de départ</span><a id="presetLink" href="#">fiche →</a></label>
        <select id="preset"><option value="">— réglage libre —</option>${CATEGORIES.filter(c => c.groupe === 'lumiere').map(c => `<optgroup label="${c.nom}">${LIGHT_PRESETS.filter(t => t.cat === c.id).map(t => `<option value="${t.id}">${esc(t.nom)}</option>`).join('')}</optgroup>`).join('')}</select></div>
        <div class="ctrl" style="margin-top:12px">
          ${slider('yaw', 'Tête', -90, 90, 1, rig.yaw || 0, '°')}
          ${slider('amb', 'Ambiance', 0, 0.4, 0.01, rig.amb || 0, '')}
          ${slider('bgi', 'Fond', 0, 2, 0.01, rig.bg?.i || 0, '')}
          ${slider('bgk', 'Couleur fond', 1800, 12000, 100, rig.bg?.k || 4300, ' K')}
          <label class="slider"><span>Fumée</span><input type="checkbox" id="haze" ${rig.haze ? 'checked' : ''} style="justify-self:start;width:20px;height:20px;accent-color:var(--accent)"><span></span></label>
        </div></div>
      <div id="lights" class="ctrl"></div>
      <div class="actions" style="margin-top:0">
        <button class="btn" id="addL">${ICONS.plus} Ajouter une source</button>
        <button class="btn" id="shareL">${ICONS.share} Partager ce réglage</button>
      </div>
    </div>
  </div>`;

  function slider(id, label, min, max, step, val, unit) {
    return `<label class="slider"><span>${label}</span><input type="range" id="s-${id}" min="${min}" max="${max}" step="${step}" value="${val}"><output id="o-${id}">${fmt(val, step)}${unit}</output></label>`;
  }
  function fmt(v, step) { return step < 1 ? (+v).toFixed(2) : Math.round(v); }

  function lightCard(l, k) {
    const col = rgb(l.c ? hexToArr(l.c) : kelvinRGB(l.k || 4300));
    const s = (id, label, min, max, step, val, unit) => `<label class="slider"><span>${label}</span><input type="range" data-k="${k}" data-p="${id}" min="${min}" max="${max}" step="${step}" value="${val}"><output>${fmt(val, step)}${unit}</output></label>`;
    return `<div class="light-card"><header><span class="sw" style="background:${col}"></span>
      <select data-k="${k}" data-p="r" style="width:auto;padding:4px 8px">${ROLES.map(r => `<option value="${r}" ${l.r === r ? 'selected' : ''}>${ROLE_NOM[r]}</option>`).join('')}</select>
      <label><button class="icon-btn" data-del="${k}" title="Supprimer" aria-label="Supprimer la source" style="width:30px;height:30px">${ICONS.trash}</button></label></header>
      ${l.r === 'neg' ? s('az', 'Azimut', -180, 180, 1, l.az, '°') : `
      ${s('az', 'Azimut', -180, 180, 1, l.az, '°')}
      ${s('el', 'Hauteur', -80, 89, 1, l.el, '°')}
      ${s('d', 'Distance', 0.6, 5, 0.1, l.d || 2.2, ' m')}
      ${s('i', 'Intensité', 0, 2.5, 0.05, l.i ?? 1, '')}
      ${s('s', 'Douceur', 0, 1, 0.01, l.s ?? 0.3, '')}
      ${l.c ? `<label class="slider"><span>Couleur</span><input type="color" data-k="${k}" data-p="c" value="${l.c}" style="height:30px;width:100%;border:0;background:none"><button class="chip sm" data-k="${k}" data-tok="1">K</button></label>`
        : `<label class="slider"><span>Température</span><input type="range" data-k="${k}" data-p="k" min="1800" max="12000" step="100" value="${l.k || 4300}"><output>${l.k || 4300} K</output></label>
           <label class="slider"><span></span><button class="chip sm" data-k="${k}" data-toc="1" style="justify-self:start">Couleur libre…</button><span></span></label>`}
      <label class="slider"><span>Motif</span><select data-k="${k}" data-p="gobo" style="padding:6px 8px">${Object.entries(GOBOS).map(([g, n]) => `<option value="${g}" ${(l.gobo || '') === g ? 'selected' : ''}>${n}</option>`).join('')}</select><span></span></label>
      <label class="slider"><span>Effet</span><select data-k="${k}" data-p="flick" style="padding:6px 8px"><option value="">fixe</option><option value="true" ${l.flick === true ? 'selected' : ''}>scintillement</option><option value="strobe" ${l.flick === 'strobe' ? 'selected' : ''}>stroboscope</option></select><span></span></label>`}
    </div>`;
  }
  function hexToArr(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }

  function renderLights() { $('#lights', v).innerHTML = rig.lights.map(lightCard).join('') || '<div class="empty">Aucune source : ajoutez-en une.</div>'; }
  let raf = 0, rafV = 0;
  function apply(full = false) {
    $('#preset', v).value = current;
    $('#presetLink', v).hidden = !current; $('#presetLink', v).href = `#/t/${current}`;
    if (full) renderLights();
    // Une seule mise à jour (3D + plan de feu) par image affichée, même si le curseur envoie plus d'événements
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => { lab?.setRig(rig); $('#plan', v).innerHTML = plot(rig, 'Plan de feu'); });
  }
  function setGlobal() {
    const g = id => +$('#s-' + id, v).value;
    rig.yaw = g('yaw'); rig.amb = g('amb'); rig.bg = { ...(rig.bg || {}), i: g('bgi'), k: g('bgk') }; delete rig.bg.c;
    rig.haze = $('#haze', v).checked;
    for (const id of ['yaw', 'amb', 'bgi', 'bgk']) { const inp = $('#s-' + id, v); $('#o-' + id, v).textContent = fmt(inp.value, +inp.step) + (id === 'yaw' ? '°' : id === 'bgk' ? ' K' : ''); }
    current = ''; apply();
  }
  function loadPreset(id) { loadRig(T[id].rig, id); }
  function loadRig(r, cur) {
    current = cur; rig = JSON.parse(JSON.stringify(r)); rig.lights ||= [];
    $('#s-yaw', v).value = rig.yaw || 0; $('#s-amb', v).value = rig.amb || 0; $('#s-bgi', v).value = rig.bg?.i || 0; $('#s-bgk', v).value = rig.bg?.k || 4300; $('#haze', v).checked = !!rig.haze;
    ['yaw', 'amb', 'bgi', 'bgk'].forEach(id => { const inp = $('#s-' + id, v); $('#o-' + id, v).textContent = fmt(inp.value, +inp.step) + (id === 'yaw' ? '°' : id === 'bgk' ? ' K' : ''); });
    apply(true);
  }

  // Événements
  $('#preset', v).onchange = e => e.target.value ? loadPreset(e.target.value) : (current = '', apply());
  ['yaw', 'amb', 'bgi', 'bgk'].forEach(id => $('#s-' + id, v).addEventListener('input', setGlobal));
  $('#haze', v).addEventListener('change', setGlobal);
  function camInfo() {
    const d = (view.frame / 2) / Math.tan(Math.atan(12 / view.mm));
    $('#camInfo', v).textContent = `Caméra à ${d < 10 ? d.toFixed(1).replace('.', ',') : Math.round(d)} m du sujet · ${view.dof ? `flou calculé pour ${view.mm} mm à f/${String(view.N).replace('.', ',')}` : 'flou optique désactivé'}`;
  }
  function syncCam() {
    ['elev', 'mm', 'frame'].forEach(id => { const inp = $('#s-' + id, v); inp.value = view[id]; $('#o-' + id, v).textContent = fmt(view[id], +inp.step) + (id === 'elev' ? '°' : id === 'mm' ? ' mm' : ' m'); });
    $('#s-N', v).value = stopIdx(view.N); $('#o-N', v).textContent = 'f/' + String(view.N).replace('.', ',');
    $('#dof', v).checked = view.dof;
    $$('[data-env]', v).forEach(b => { const on = b.dataset.env === view.env; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
    camInfo();
  }
  const pushView = () => { camInfo(); cancelAnimationFrame(rafV); rafV = requestAnimationFrame(() => lab?.setView(view)); };
  ['elev', 'mm', 'frame'].forEach(id => $('#s-' + id, v).addEventListener('input', e => {
    view[id] = +e.target.value; $('#o-' + id, v).textContent = fmt(e.target.value, +e.target.step) + (id === 'elev' ? '°' : id === 'mm' ? ' mm' : ' m');
    pushView();
  }));
  $('#s-N', v).addEventListener('input', e => { view.N = STOPS[+e.target.value]; $('#o-N', v).textContent = 'f/' + String(view.N).replace('.', ','); pushView(); });
  $('#dof', v).addEventListener('change', e => { view.dof = e.target.checked; pushView(); });
  $$('[data-env]', v).forEach(b => b.addEventListener('click', () => { view.env = b.dataset.env; syncCam(); pushView(); }));
  camInfo();
  const lightsEl = $('#lights', v);
  lightsEl.addEventListener('input', e => {
    const el = e.target; if (el.dataset.k == null || !el.dataset.p) return;
    const l = rig.lights[+el.dataset.k]; const p = el.dataset.p;
    if (el.type === 'range') { l[p] = +el.value; el.nextElementSibling.textContent = fmt(el.value, +el.step) + ({ az: '°', el: '°', d: ' m', k: ' K' }[p] || ''); }
    else if (p === 'c') l.c = el.value;
    if (p === 'k' || p === 'c') el.closest('.light-card').querySelector('.sw').style.background = rgb(l.c ? hexToArr(l.c) : kelvinRGB(l.k));
    current = ''; apply();
  });
  lightsEl.addEventListener('change', e => {
    const el = e.target; if (el.tagName !== 'SELECT') return;
    const l = rig.lights[+el.dataset.k]; const p = el.dataset.p;
    if (p === 'r') l.r = el.value;
    if (p === 'gobo') { if (el.value) l.gobo = el.value; else delete l.gobo; }
    if (p === 'flick') { if (el.value) l.flick = el.value === 'true' ? true : el.value; else delete l.flick; }
    current = ''; apply(p === 'r');
  });
  lightsEl.addEventListener('click', e => {
    const d = e.target.closest('[data-del]'); if (d) { rig.lights.splice(+d.dataset.del, 1); current = ''; apply(true); return; }
    const tc = e.target.closest('[data-toc]'); if (tc) { const l = rig.lights[+tc.dataset.k]; const c = kelvinRGB(l.k || 4300); l.c = '#' + c.map(x => x.toString(16).padStart(2, '0')).join(''); delete l.k; apply(true); return; }
    const tk = e.target.closest('[data-tok]'); if (tk) { const l = rig.lights[+tk.dataset.k]; delete l.c; l.k = 4300; apply(true); }
  });
  $('#addL', v).onclick = () => { rig.lights.push({ r: rig.lights.some(l => l.r === 'key') ? 'fill' : 'key', az: -40, el: 20, d: 2.2, i: 0.6, s: 0.6, k: 4300 }); current = ''; apply(true); };
  $('#shareL', v).onclick = () => share('Réglage lumière — Le jardin du Chef Op', `${location.origin}${location.pathname}#/labo?r=${encodeRig(rig)}&elev=${view.elev}&mm=${view.mm}&frame=${view.frame}&env=${view.env}&dof=${view.dof ? 1 : 0}&N=${view.N}`);
  $('#resetAll', v).onclick = () => {
    view = { ...initial.view };
    syncCam();
    showRig = true; $('#tgRig', v).classList.add('on'); lab?.setShowRig(true);
    lab?.setView(view);
    loadRig(initial.rig, initial.current);
    toast('Labo réinitialisé');
  };
  $('#tgRig', v).onclick = e => { showRig = !showRig; e.target.classList.toggle('on', showRig); lab?.setShowRig(showRig); };
  $('#snap', v).onclick = () => { if (!lab) return; const a = document.createElement('a'); a.href = lab.snapshot(); a.download = `lumiere-${current || 'reglage'}.jpg`; a.click(); };

  apply(true);
  import('./lab3d.js').then(({ createLab }) => {
    if (!v.isConnected || !$('#stage', v)) return;
    $('#stage .loading', v)?.remove();
    lab = createLab($('#stage', v), { rig, view });
  }).catch(err => { $('#stage', v).innerHTML = `<div class="loading">Le rendu 3D (WebGL) n'est pas disponible sur cet appareil.</div>`; console.error(err); });
  return () => lab?.dispose();
}

// =====================================================================
// DÉCOUPAGE
// =====================================================================
const date = t => new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
export function decoupageView(v) {
  setTitle('Découpage');
  const draw = () => {
    const ps = store.projects();
    v.innerHTML = `<section class="hero"><span class="eyebrow">Sur cet appareil</span><h1>Découpage</h1>
      <p>Regroupez vos plans par projet : setup, notes, consignes. Imprimez-les pour le plateau ou partagez-les à l'équipe par lien.</p>
      <div class="actions"><button class="btn primary" id="newP">${ICONS.plus} Nouveau projet</button>
      <label class="btn" style="cursor:pointer">${ICONS.upload} Importer un fichier<input type="file" accept=".json,application/json" id="imp" hidden></label>
      <a class="btn" href="#/composer">${ICONS.sliders} Composeur</a></div></section>
      <div class="projects">${ps.length ? ps.map(p => `<a class="entry" href="#/decoupage/${p.id}"><h3 style="margin-top:0">${esc(p.nom)}</h3><p>${p.plans.length} plan${p.plans.length > 1 ? 's' : ''} · modifié le ${date(p.updated || p.created)}</p></a>`).join('')
        : `<div class="empty">Aucun projet. Créez-en un, ou ajoutez un plan depuis le composeur.</div>`}</div>`;
    $('#newP', v).onclick = async () => {
      const r = await ask({ title: 'Nouveau projet', fields: [{ label: 'Nom du projet', placeholder: 'Ex. Clip « Nuit blanche »' }], ok: 'Créer' });
      if (!r) return; const p = store.upsertProject({ id: uid(), nom: r[0].trim() || 'Nouveau projet', created: Date.now(), plans: [] });
      location.hash = `#/decoupage/${p.id}`;
    };
    $('#imp', v).onchange = async e => {
      const f = e.target.files[0]; if (!f) return;
      try { const p = JSON.parse(await f.text()); importProject(p); draw(); } catch { toast('Fichier invalide'); }
    };
  };
  draw();
}
function importProject(p) {
  if (!p || !Array.isArray(p.plans)) throw new Error('invalide');
  const clean = { id: uid(), nom: String(p.nom || 'Projet importé').slice(0, 120), created: Date.now(), plans: p.plans.slice(0, 500).map(pl => ({ id: uid(), titre: String(pl.titre || '').slice(0, 200), notes: String(pl.notes || '').slice(0, 4000), setup: decodeSel(encodeSel(pl.setup || {})) })) };
  store.upsertProject(clean); toast(`« ${clean.nom} » importé`); return clean;
}
const b64 = { enc: o => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''), dec: s => JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))))) };

export function projetView(v, q, pid) {
  let pr = store.project(pid);
  if (!pr) { v.innerHTML = `<div class="hero"><h1>Projet introuvable</h1><p><a href="#/decoupage">Retour au découpage</a></p></div>`; return; }
  setTitle(pr.nom);
  const save = () => store.upsertProject(pr);
  const draw = () => {
    v.innerHTML = `<a class="crumb no-print" href="#/decoupage">${ICONS.back.replace('<svg', '<svg width="14" height="14"')} Découpage</a>
      <section class="hero" style="padding-top:10px"><span class="eyebrow">Projet · ${pr.plans.length} plan${pr.plans.length > 1 ? 's' : ''}</span>
        <h1 id="pname" contenteditable="true" spellcheck="false" style="outline:none">${esc(pr.nom)}</h1>
        <div class="actions no-print">
          <a class="btn primary" href="#/composer">${ICONS.plus} Nouveau plan (composeur)</a>
          <button class="btn" id="print">${ICONS.print} Imprimer / PDF</button>
          <button class="btn" id="shareP">${ICONS.share} Partager par lien</button>
          <button class="btn" id="exp">${ICONS.download} Exporter</button>
          <button class="btn danger" id="delP">${ICONS.trash} Supprimer</button>
        </div></section>
      <div class="projects">${pr.plans.length ? pr.plans.map((pl, k) => planCard(pl, k)).join('') : `<div class="empty">Ce projet est vide. Composez un plan puis « Ajouter au découpage ».</div>`}</div>`;
    $('#pname', v).addEventListener('blur', e => { pr.nom = e.target.textContent.trim() || 'Sans titre'; save(); setTitle(pr.nom); });
    $('#pname', v).addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } });
    $('#print', v).onclick = () => window.print();
    $('#exp', v).onclick = () => download(`${pr.nom.replace(/[^\w\- ]+/g, '').trim() || 'decoupage'}.json`, JSON.stringify({ app: 'jardin-chef-op', version: 1, nom: pr.nom, plans: pr.plans }, null, 2));
    $('#shareP', v).onclick = () => share(`Découpage « ${pr.nom} »`, `${location.origin}${location.pathname}#/import?d=${b64.enc({ nom: pr.nom, plans: pr.plans.map(p => ({ titre: p.titre, notes: p.notes, setup: p.setup })) })}`);
    $('#delP', v).onclick = async () => { const r = await ask({ title: 'Supprimer ce projet ?', text: 'Cette action est définitive sur cet appareil.', ok: 'Supprimer', danger: true }); if (r) { store.deleteProject(pr.id); location.hash = '#/decoupage'; } };
    v.querySelectorAll('[data-notes]').forEach(t => t.addEventListener('input', () => { pr.plans[+t.dataset.notes].notes = t.value; save(); }));
    v.querySelectorAll('[data-titre]').forEach(t => t.addEventListener('blur', () => { pr.plans[+t.dataset.titre].titre = t.textContent.trim(); save(); }));
    v.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => {
      const k = +b.dataset.i, a = b.dataset.act;
      if (a === 'up' && k > 0) [pr.plans[k - 1], pr.plans[k]] = [pr.plans[k], pr.plans[k - 1]];
      if (a === 'down' && k < pr.plans.length - 1) [pr.plans[k + 1], pr.plans[k]] = [pr.plans[k], pr.plans[k + 1]];
      if (a === 'dup') pr.plans.splice(k + 1, 0, { ...JSON.parse(JSON.stringify(pr.plans[k])), id: uid(), titre: pr.plans[k].titre + ' (copie)' });
      if (a === 'del') pr.plans.splice(k, 1);
      save(); draw();
    }));
  };
  function planCard(pl, k) {
    const A = analyse(pl.setup);
    return `<article class="plan">
      <div><div class="num">PLAN ${String(k + 1).padStart(2, '0')}</div>
        <div class="visual" style="margin-top:6px"><div style="aspect-ratio:16/10;overflow:hidden">${framePreview(pl.setup)}</div></div>
        <div class="visual" style="margin-top:6px"><div style="aspect-ratio:16/10;overflow:hidden">${plot(combineRig(pl.setup))}</div></div></div>
      <div style="min-width:0">
        <h3 contenteditable="true" data-titre="${k}" spellcheck="false" style="outline:none">${esc(pl.titre)}</h3>
        <p class="tech">${A.techs.map(t => `<a href="#/t/${t.id}" style="text-decoration:none"><b>${esc(C[t.cat].court)}</b> ${esc(t.nom)}</a>`).join(' · ') || '<span class="muted">Aucun élément</span>'}</p>
        ${A.ranked.length ? `<div class="chips" style="margin:6px 0">${A.ranked.slice(0, 4).map(x => intChip(x.i, 'sm')).join('')}</div>` : ''}
        ${A.tensions.map(([a, b]) => `<div class="tension">Tension : ${esc(a.nom)} ↔ ${esc(b.nom)}</div>`).join('')}
        <textarea data-notes="${k}" placeholder="Notes : intention du réal, contraintes, matériel…" style="margin-top:8px">${esc(pl.notes || '')}</textarea>
        <div class="tools">
          <a class="btn sm" href="#/composer?${encodeSel(pl.setup)}&plan=${pr.id}:${pl.id}">${ICONS.edit} Modifier</a>
          <button class="btn sm" data-act="up" data-i="${k}" aria-label="Monter">${ICONS.up}</button>
          <button class="btn sm" data-act="down" data-i="${k}" aria-label="Descendre">${ICONS.down}</button>
          <button class="btn sm" data-act="dup" data-i="${k}">${ICONS.copy} Dupliquer</button>
          <button class="btn sm danger" data-act="del" data-i="${k}">${ICONS.trash}</button>
        </div>
      </div></article>`;
  }
  draw();
}

export function importView(v, q) {
  setTitle('Importer un découpage');
  let data = null;
  try { data = b64.dec(q.get('d') || ''); } catch { }
  if (!data?.plans) { v.innerHTML = `<div class="hero"><h1>Lien invalide</h1><p>Ce lien de découpage est incomplet. <a href="#/decoupage">Retour</a></p></div>`; return; }
  v.innerHTML = `<section class="hero"><span class="eyebrow">Découpage partagé</span><h1>${esc(data.nom)}</h1><p>${data.plans.length} plan(s). Importez-le pour le retrouver dans votre découpage (sur cet appareil).</p>
    <div class="actions"><button class="btn primary" id="doImp">${ICONS.download} Importer</button><a class="btn" href="#/decoupage">Annuler</a></div></section>
    <div class="projects">${data.plans.map((p, k) => `<div class="panel"><b class="mono" style="color:var(--accent)">PLAN ${k + 1}</b> — ${esc(p.titre)}<p class="muted" style="margin:4px 0 0;font-size:14px">${analyse(decodeSel(encodeSel(p.setup || {}))).techs.map(t => esc(t.nom)).join(' · ')}</p></div>`).join('')}</div>`;
  $('#doImp', v).onclick = () => { const p = importProject(data); location.hash = `#/decoupage/${p.id}`; };
}
