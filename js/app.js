// Le jardin du Chef Op — application (routeur + vues de consultation)
import { INTENTIONS, FAMILLES, TECHNIQUES, CATEGORIES, GROUPES, T, I, C, PAR_INTENTION, recherche } from './data/index.js';
import { illustration, plot, shot } from './illus.js';
import { ICONS, LOGO } from './icons.js';
import { store } from './store.js';
import { $, $$, esc, favBtn, techCard, intChip, techChip, toast, share, famColor, famNom, setTitle } from './ui.js';
import { suggest, encodeSel, viewForTechnique } from './setup.js';
import * as tools from './tools.js';

// ---------------- Thème ----------------
const THEMES = { plateau: 'Plateau (sombre)', jardin: 'Jardin (herbier)' };
function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  const m = document.querySelector('meta[name=theme-color]');
  if (m) m.content = t === 'jardin' ? '#f1ebdc' : '#0d0e10';
  const b = $('#themeBtn');
  if (b) { b.innerHTML = t === 'jardin' ? ICONS.clap : ICONS.leaf; b.title = `Passer au thème ${t === 'jardin' ? 'Plateau' : 'Jardin'}`; b.setAttribute('aria-label', b.title); }
}
const initialTheme = store.theme || (matchMedia('(prefers-color-scheme: light)').matches ? 'jardin' : 'plateau');

// ---------------- Coquille ----------------
const NAV = [
  { href: '#/', label: 'Intentions', icon: 'intention', match: /^\/(intentions?|$)/ },
  { href: '#/techniques', label: 'Techniques', icon: 'grid', match: /^\/(techniques|t\/)/ },
  { href: '#/composer', label: 'Composeur', icon: 'sliders', match: /^\/composer/ },
  { href: '#/decoupage', label: 'Découpage', icon: 'film', match: /^\/(decoupage|import)/ },
];
function shell() {
  document.body.innerHTML = `
  <header class="top">
    <a class="brand" href="#/">${LOGO}<span><b>Le jardin du Chef Op</b><small>intentions → image</small></span></a>
    <span class="spacer"></span>
    <nav class="nav-desk" aria-label="Navigation principale">${NAV.map(n => `<a href="${n.href}">${n.label}</a>`).join('')}<a href="#/labo">Labo 3D</a></nav>
    <button class="icon-btn install" id="installBtn" title="Installer l'application" aria-label="Installer l'application">${ICONS.install}</button>
    <a class="icon-btn" href="#/labo" title="Labo lumière 3D" aria-label="Labo lumière 3D" id="labBtn">${ICONS.cube}</a>
    <a class="icon-btn" href="#/favoris" title="Favoris" aria-label="Favoris">${ICONS.star}</a>
    <button class="icon-btn" id="themeBtn"></button>
  </header>
  <main id="view" tabindex="-1"></main>
  <nav class="nav-mob" aria-label="Navigation">${NAV.map(n => `<a href="${n.href}">${ICONS[n.icon]}<span>${n.label}</span></a>`).join('')}</nav>
  <button class="fab" id="fab" aria-expanded="false" aria-controls="fabPop" title="Force des liens : légende" aria-label="Afficher la légende des indicateurs de force">${ICONS.info}</button>
  <div class="fab-pop" id="fabPop" role="dialog" aria-labelledby="fabTitle" hidden>
    <header><h3 id="fabTitle">Indicateurs de force</h3><button class="icon-btn" id="fabClose" aria-label="Fermer">${ICONS.x}</button></header>
    <p>Les points sur les cartes indiquent à quel point une technique sert une intention.</p>
    <table class="force-table">
      <thead><tr><th>Points</th><th>Force</th><th>Sens</th></tr></thead>
      <tbody>
        <tr><td><span class="dots"><i class="on"></i><i></i><i></i></span></td><td>1</td><td><b>Lien faible</b> : peut aider ou colorer l'intention, sans la porter seule.</td></tr>
        <tr><td><span class="dots"><i class="on"></i><i class="on"></i><i></i></span></td><td>2</td><td><b>Lien net</b> : outil courant et efficace pour cette intention.</td></tr>
        <tr><td><span class="dots"><i class="on"></i><i class="on"></i><i class="on"></i></span></td><td>3</td><td><b>Lien fort</b> : l'un des moyens les plus directs, presque un classique.</td></tr>
      </tbody>
    </table>
    <p class="muted">Sur les fiches, la même valeur apparaît en barre (« Intentions servies »). Dans le composeur, les forces s'additionnent pour donner l'intention produite.</p>
  </div>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>
  <dialog id="dlg"></dialog>`;
  applyTheme(document.documentElement.dataset.theme);
  $('#themeBtn').onclick = () => { const t = document.documentElement.dataset.theme === 'jardin' ? 'plateau' : 'jardin'; store.theme = t; applyTheme(t); toast(`Thème ${THEMES[t]}`); };
  document.addEventListener('click', e => {
    const f = e.target.closest('[data-fav]');
    if (f) {
      e.preventDefault(); e.stopPropagation();
      const on = store.toggleFav(f.dataset.fav);
      $$(`[data-fav="${f.dataset.fav}"]`).forEach(b => { b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
      toast(on ? 'Ajouté aux favoris' : 'Retiré des favoris');
    }
    const s = e.target.closest('[data-share]');
    if (s) { e.preventDefault(); share(document.title); }
  });
  // Bulle « force des liens »
  const fab = $('#fab'), pop = $('#fabPop');
  const setPop = open => { pop.hidden = !open; fab.setAttribute('aria-expanded', open); fab.classList.toggle('on', open); if (open) $('#fabClose').focus(); };
  fab.onclick = e => { e.stopPropagation(); setPop(pop.hidden); };
  $('#fabClose').onclick = () => { setPop(false); fab.focus(); };
  document.addEventListener('click', e => { if (!pop.hidden && !pop.contains(e.target)) setPop(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !pop.hidden) { setPop(false); fab.focus(); } });
  window.addEventListener('hashchange', () => setPop(false));
  // Installation PWA
  let deferred;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; $('#installBtn').classList.add('show'); });
  $('#installBtn').onclick = async () => { if (!deferred) return; deferred.prompt(); await deferred.userChoice; deferred = null; $('#installBtn').classList.remove('show'); };
}

// ---------------- Routeur ----------------
let cleanup = null;
const routes = [
  [/^\/$/, home],
  [/^\/intentions$/, intentionsView],
  [/^\/intention\/([\w-]+)$/, intentionView],
  [/^\/techniques$/, techniquesView],
  [/^\/t\/([\w-]+)$/, techniqueView],
  [/^\/favoris$/, favorisView],
  [/^\/a-propos$/, aproposView],
  [/^\/composer$/, tools.composerView],
  [/^\/labo$/, tools.laboView],
  [/^\/decoupage$/, tools.decoupageView],
  [/^\/decoupage\/([\w-]+)$/, tools.projetView],
  [/^\/import$/, tools.importView],
];
function route() {
  const raw = location.hash.slice(1) || '/';
  const [path, qs = ''] = raw.split('?');
  const q = new URLSearchParams(qs);
  if (cleanup) { try { cleanup(); } catch { } cleanup = null; }
  const view = $('#view');
  let found = false;
  for (const [re, fn] of routes) {
    const m = path.match(re);
    if (m) { found = true; const r = fn(view, q, ...m.slice(1)); cleanup = typeof r === 'function' ? r : null; break; }
  }
  if (!found) view.innerHTML = `<div class="hero"><h1>Page introuvable</h1><p><a href="#/">Retour à l'accueil</a></p></div>`;
  $$('.nav-desk a, .nav-mob a').forEach(a => {
    const n = NAV.find(n => n.href === a.getAttribute('href'));
    a.classList.toggle('on', n ? n.match.test(path) : a.getAttribute('href') === '#' + path);
  });
  $('#labBtn')?.classList.toggle('on', path === '/labo');
  if (!history.state?.keepScroll) window.scrollTo(0, 0);
}

// ---------------- Accueil ----------------
function home(v) {
  setTitle('');
  v.innerHTML = `
  <section class="hero">
    <span class="eyebrow">Traduire une intention en image</span>
    <h1>Que veut raconter le réalisateur&nbsp;?</h1>
    <p>Partez d'une intention (solitude, menace, tendresse…) pour trouver les cadrages, mouvements et lumières qui la servent, puis transmettez des consignes claires à chaque poste.</p>
  </section>
  <div class="search" role="search">${ICONS.search}<input type="search" id="q" placeholder="Chercher une intention ou une technique : « oppression », « Rembrandt », « plongée »…" autocomplete="off" aria-label="Rechercher"></div>
  <div class="results" id="res"></div>

  <div class="entries">
    <a class="entry" href="#/intentions">${ICONS.intention.replace('<svg', '<svg class="ico"')}<h3>Par intention</h3><p>${INTENTIONS.length} intentions artistiques reliées aux techniques.</p></a>
    <a class="entry" href="#/techniques">${ICONS.grid.replace('<svg', '<svg class="ico"')}<h3>Par technique</h3><p>${TECHNIQUES.length} fiches : cadre, mouvement, lumière.</p></a>
    <a class="entry" href="#/composer">${ICONS.sliders.replace('<svg', '<svg class="ico"')}<h3>Composeur</h3><p>Combinez un plan et lisez l'intention qu'il produit.</p></a>
    <a class="entry" href="#/labo">${ICONS.cube.replace('<svg', '<svg class="ico"')}<h3>Labo lumière 3D</h3><p>Placez les projecteurs autour d'un visage.</p></a>
    <a class="entry" href="#/decoupage">${ICONS.film.replace('<svg', '<svg class="ico"')}<h3>Découpage</h3><p>Vos plans de projet, à partager et imprimer.</p></a>
    <a class="entry" href="#/favoris">${ICONS.star.replace('<svg', '<svg class="ico"')}<h3>Favoris</h3><p>Vos fiches marquées, disponibles hors ligne.</p></a>
    <a class="entry" href="#/a-propos">${ICONS.info.replace('<svg', '<svg class="ico"')}<h3>Mode d'emploi</h3><p>Installer l'app, lire les fiches, les postes.</p></a>
  </div>

  <section class="section">
    <h2>Toutes les intentions <small>touchez-en une pour voir comment la traduire</small></h2>
    ${FAMILLES.map(f => `<div class="famille"><h3 style="color:${famColor(f.id)}">${f.nom} <small>${f.desc}</small></h3>
      <div class="chips">${INTENTIONS.filter(i => i.famille === f.id).map(i => intChip(i)).join('')}</div></div>`).join('')}
  </section>
  <footer class="foot">Fonctionne hors ligne une fois installé · aucune donnée ne quitte votre appareil · <a href="#/a-propos">Mode d'emploi</a></footer>`;
  const q = $('#q', v), res = $('#res', v);
  q.addEventListener('input', () => {
    const r = recherche(q.value);
    res.innerHTML = r.map(({ type, item }) => type === 'intention'
      ? `<a class="result" href="#/intention/${item.id}"><span class="dot" style="width:8px;height:8px;border-radius:50%;background:${famColor(item.famille)}"></span><b>${esc(item.nom)}</b><span class="kind">Intention</span></a>`
      : `<a class="result" href="#/t/${item.id}"><span class="dot" style="width:8px;height:8px;border-radius:2px;background:${C[item.cat].couleur}"></span><span><b>${esc(item.nom)}</b> <span class="muted">· ${esc(item.en)}</span></span><span class="kind">${C[item.cat].court}</span></a>`).join('')
      || (q.value.trim() ? `<p class="muted">Aucun résultat pour « ${esc(q.value)} ».</p>` : '');
  });
}

// ---------------- Intentions ----------------
function intentionsView(v) {
  setTitle('Intentions');
  v.innerHTML = `<section class="hero"><span class="eyebrow">Par intention</span><h1>Intentions artistiques</h1>
    <p>Ce que le réalisateur veut faire ressentir. Chaque intention est reliée aux techniques qui la servent, avec la force du lien.</p></section>
    ${FAMILLES.map(f => `<section class="section"><h2 style="color:${famColor(f.id)}">${f.nom} <small>${f.desc}</small></h2>
      <div class="grid">${INTENTIONS.filter(i => i.famille === f.id).map(i => {
        const top = PAR_INTENTION[i.id].slice(0, 3).map(x => x.t.nom.replace(/\s*\(.*\)/, '')).join(' · ');
        return `<div class="card-w"><a class="card" href="#/intention/${i.id}" style="--c:${famColor(i.famille)}"><div class="body">
          <span class="tag" style="--c:${famColor(i.famille)}">${PAR_INTENTION[i.id].length} techniques</span>
          <h3>${esc(i.nom)}</h3><p>${esc(i.desc)}</p><p class="muted" style="font-size:12.5px">${esc(top)}</p></div></a>${favBtn(i.id)}</div>`;
      }).join('')}</div></section>`).join('')}`;
}

function intentionView(v, q, id) {
  const it = I[id];
  if (!it) { v.innerHTML = '<p>Intention inconnue.</p>'; return; }
  setTitle(it.nom);
  const list = PAR_INTENTION[id];
  const strongOnly = q.get('tout') !== '1';
  const shown = strongOnly ? list.filter(x => x.f >= 2) : list;
  const sel = suggest(id);
  v.innerHTML = `
  <a class="crumb" href="#/intentions">${ICONS.back.replace('<svg', '<svg width="14" height="14"')} Intentions</a>
  <section class="hero" style="padding-top:12px">
    <span class="eyebrow" style="color:${famColor(it.famille)}">${famNom(it.famille)}</span>
    <h1>${esc(it.nom)}</h1>
    <p class="mono muted" style="font-size:14px;margin-top:6px">${esc(it.en)}</p>
    <p>${esc(it.desc)}</p>
    <div class="actions">
      <a class="btn primary" href="#/composer?${encodeSel(sel)}">${ICONS.sliders} Composer un plan</a>
      ${favBtn(id, 'btn')}<button class="btn" data-share>${ICONS.share} Partager</button>
    </div>
  </section>
  <div class="cols" style="margin-top:0">
    <div class="panel"><h2>Questions à poser au réalisateur</h2><ul class="questions">${it.questions.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
    <div class="panel"><h2>Nuances et contraires</h2>
      ${it.oppose.length ? `<p class="muted" style="margin:0 0 8px;font-size:14px">À l'opposé (attention aux choix qui tirent dans ce sens) :</p><div class="chips">${it.oppose.map(o => intChip(I[o], 'sm')).join('')}</div>` : ''}
      <p class="muted" style="margin:14px 0 8px;font-size:14px">Intentions voisines (partagent les mêmes techniques) :</p>
      <div class="chips">${voisines(id).map(o => intChip(o, 'sm')).join('')}</div></div>
  </div>
  <section class="section">
    <h2>Comment la traduire <small>${shown.length} technique${shown.length > 1 ? 's' : ''} · les points indiquent la force du lien</small></h2>
    <div class="chips" style="margin-bottom:14px">
      <a class="chip sm ${strongOnly ? 'on' : ''}" href="#/intention/${id}">Liens forts</a>
      <a class="chip sm ${!strongOnly ? 'on' : ''}" href="#/intention/${id}?tout=1">Tous les liens (${list.length})</a>
    </div>
    ${GROUPES.map(g => {
      const items = shown.filter(x => C[x.t.cat].groupe === g.id);
      if (!items.length) return '';
      return `<div class="groupe-block"><h3 class="groupe-titre">${g.nom} <small>${g.desc}</small></h3>
        ${CATEGORIES.filter(c => c.groupe === g.id).map(c => {
          const its = items.filter(x => x.t.cat === c.id);
          if (!its.length) return '';
          return `<section class="rail-block" style="--c:${c.couleur}">
            <header class="rail-head"><span class="dot"></span><h4>${c.nom}</h4><span class="rail-count">${its.length}</span>
              <span class="rail-nav"><button class="icon-btn" data-rail="-1" aria-label="Précédent">${ICONS.back}</button><button class="icon-btn" data-rail="1" aria-label="Suivant">${ICONS.back.replace('<svg', '<svg style="transform:scaleX(-1)"')}</button></span></header>
            <div class="rail" tabindex="0" aria-label="${esc(c.nom)}">${its.map(x => techCard(x.t, x.f)).join('')}</div>
          </section>`;
        }).join('')}</div>`;
    }).join('')}
  </section>`;
  v.querySelectorAll('.rail-block').forEach(b => {
    const rail = b.querySelector('.rail'), btns = b.querySelectorAll('[data-rail]');
    const upd = () => { btns[0].disabled = rail.scrollLeft < 4; btns[1].disabled = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4; b.classList.toggle('no-nav', rail.scrollWidth <= rail.clientWidth + 4); };
    btns.forEach(btn => btn.onclick = () => rail.scrollBy({ left: +btn.dataset.rail * rail.clientWidth * 0.85, behavior: 'smooth' }));
    rail.addEventListener('scroll', upd, { passive: true }); new ResizeObserver(upd).observe(rail); upd();
  });
}
function voisines(id) {
  const mine = new Set(PAR_INTENTION[id].filter(x => x.f >= 2).map(x => x.t.id));
  return INTENTIONS.filter(i => i.id !== id && !I[id].oppose.includes(i.id)).map(i => ({ i, n: PAR_INTENTION[i.id].filter(x => x.f >= 2 && mine.has(x.t.id)).length }))
    .sort((a, b) => b.n - a.n).slice(0, 5).filter(x => x.n > 1).map(x => x.i);
}

// ---------------- Techniques ----------------
function techniquesView(v, q) {
  setTitle('Techniques');
  v.innerHTML = `<section class="hero"><span class="eyebrow">Par technique</span><h1>Encyclopédie de l'image</h1>
    <p>${TECHNIQUES.length} fiches classées en ${CATEGORIES.length} familles. Chaque fiche explique l'effet produit, les consignes par poste et les pièges.</p></section>
    <div class="filters" role="toolbar" aria-label="Catégories">${CATEGORIES.map(c => `<a class="chip sm" style="--c:${c.couleur}" href="#cat-${c.id}" data-jump="${c.id}"><span class="dot"></span>${c.nom}</a>`).join('')}</div>
    ${GROUPES.map(g => `<h2 style="font-size:14px;font-family:var(--f-mono);text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:30px 0 0">${g.nom}</h2>` +
      CATEGORIES.filter(c => c.groupe === g.id).map(c => `<section class="cat-block" id="cat-${c.id}" style="--c:${c.couleur}">
        <h2><span class="dot"></span>${c.nom}</h2><p>${TECHNIQUES.filter(t => t.cat === c.id).length} fiches</p>
        <div class="grid">${TECHNIQUES.filter(t => t.cat === c.id).map(t => techCard(t)).join('')}</div></section>`).join('')).join('')}`;
  v.querySelectorAll('[data-jump]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); $('#cat-' + a.dataset.jump).scrollIntoView({ behavior: 'smooth' }); }));
  const c = q.get('cat'); if (c) setTimeout(() => $('#cat-' + c)?.scrollIntoView(), 50);
}

function techniqueView(v, q, id) {
  const t = T[id];
  if (!t) { v.innerHTML = '<p>Technique inconnue.</p>'; return; }
  setTitle(t.nom);
  const c = C[t.cat];
  const effets = Object.entries(t.effets).sort((a, b) => b[1] - a[1]);
  const isLight = !!t.rig;
  const v3 = viewForTechnique(t);
  const tabs = isLight ? [['plan', 'Plan de feu'], ['3d', 'Rendu 3D']] : v3 ? [['illus', 'Schéma'], ['3d', 'Rendu 3D']] : null;
  const addHref = `#/composer?${encodeSel({ ...store.composer, [t.cat]: t.id })}`;
  v.innerHTML = `
  <a class="crumb" href="#/techniques?cat=${t.cat}">${ICONS.back.replace('<svg', '<svg width="14" height="14"')} ${c.nom}</a>
  <div class="fiche-head">
    <div class="visual wide" id="vis">
      ${tabs ? `<div class="visual-tabs" role="tablist">${tabs.map(([k, l], n) => `<button role="tab" data-tab="${k}" class="${n === 0 ? 'on' : ''}">${l}</button>`).join('')}</div>` : ''}
      <div id="visBody">${illustration(t)}</div>
    </div>
    <div class="fiche-title">
      <span class="eyebrow" style="color:${c.couleur}">${c.nom}${t.abbr ? ` · ${t.abbr}` : ''}</span>
      <h1>${esc(t.nom)}</h1>
      <div class="en">${esc(t.en)}</div>
      <p class="lead">${esc(t.resume)}</p>
      <div class="actions">
        <a class="btn primary" href="${addHref}">${ICONS.sliders} Ajouter au composeur</a>
        ${isLight ? `<a class="btn" href="#/labo?p=${t.id}">${ICONS.cube} Ouvrir dans le labo</a>` : ''}
        ${favBtn(id, 'btn')}<button class="btn" data-share>${ICONS.share} Partager</button>
      </div>
    </div>
  </div>
  <div class="cols">
    <div class="panel"><h2>Ce que ça raconte</h2><p style="margin:0">${esc(t.desc)}</p></div>
    <div class="panel"><h2>Intentions servies</h2><div class="bars">${effets.map(([i, f]) => `<a class="bar" href="#/intention/${i}" style="--c:${famColor(I[i].famille)}"><span>${esc(I[i].nom)}</span><span class="track"><span class="fill" style="display:block;width:${f / 3 * 100}%"></span></span></a>`).join('')}</div></div>
    <div class="panel"><h2>Sur le plateau</h2><ul class="postes">${(t.plateau || []).map(([p, txt]) => `<li><span class="poste">${esc(p)}</span><span>${esc(txt)}</span></li>`).join('')}</ul></div>
    <div class="panel"><h2>Pièges</h2><p class="warn">${esc(t.pieges)}</p>
      <h2 style="margin-top:18px">Se combine avec</h2><div class="chips">${(t.combos || []).map(x => techChip(T[x], 'sm')).join('')}</div></div>
  </div>`;
  let lab = null;
  const body = $('#visBody', v);
  async function showTab(k) {
    $$('[data-tab]', v).forEach(b => b.classList.toggle('on', b.dataset.tab === k));
    if (lab) { lab.dispose(); lab = null; }
    if (k === '3d') {
      body.innerHTML = `<div class="stage mini-stage"><div class="loading">Chargement du rendu 3D…</div><span class="hint">glisser pour tourner autour</span></div>`;
      const st = $('.stage', body);
      try {
        const { createLab } = await import('./lab3d.js');
        st.querySelector('.loading')?.remove();
        lab = createLab(st, { rig: isLight ? t.rig : T.loop.rig, mini: true, view: v3 || { elev: 0, mm: 85, frame: 0.5 } });
        if (t.id === 'debulle') st.style.transform = 'rotate(-12deg) scale(1.2)';
      } catch (e) { st.innerHTML = `<div class="loading">Rendu 3D indisponible sur cet appareil.</div>`; console.error(e); }
    } else body.innerHTML = k === 'plan' ? plot(t.rig, t.nom) : illustration(t);
  }
  $$('[data-tab]', v).forEach(b => b.onclick = () => showTab(b.dataset.tab));
  if (isLight && q.get('vue') === '3d') showTab('3d');
  return () => { lab?.dispose(); };
}

// ---------------- Favoris ----------------
function favorisView(v) {
  setTitle('Favoris');
  const f = store.favs();
  const ints = INTENTIONS.filter(i => f.has(i.id)), techs = TECHNIQUES.filter(t => f.has(t.id));
  v.innerHTML = `<section class="hero"><span class="eyebrow">Sur cet appareil</span><h1>Favoris</h1><p>Les intentions et fiches que vous avez marquées d'une étoile. Elles restent sur votre téléphone, sans compte.</p></section>
    ${!ints.length && !techs.length ? `<div class="empty">Aucun favori pour l'instant. Touchez l'étoile ${ICONS.star.replace('<svg', '<svg width="16" height="16" style="vertical-align:-3px"')} sur une fiche pour la retrouver ici.</div>` : ''}
    ${ints.length ? `<section class="section"><h2>Intentions</h2><div class="chips">${ints.map(i => intChip(i)).join('')}</div></section>` : ''}
    ${techs.length ? `<section class="section"><h2>Techniques</h2><div class="grid">${techs.map(t => techCard(t)).join('')}</div></section>` : ''}`;
}

// ---------------- À propos ----------------
function aproposView(v) {
  setTitle("Mode d'emploi");
  v.innerHTML = `<section class="hero"><span class="eyebrow">Mode d'emploi</span><h1>Le jardin du Chef Op</h1>
    <p>Un outil de poche pour traduire les intentions d'un réalisateur en choix d'image concrets, et en consignes claires pour les techniciens.</p></section>
    <div class="cols">
      <div class="panel"><h2>Trois façons d'entrer</h2><ul class="questions">
        <li><b>Par intention</b> : le réalisateur dit « je veux de l'oppression » → les techniques qui la servent, classées par force.</li>
        <li><b>Par technique</b> : l'encyclopédie des cadrages, mouvements et lumières, avec leurs effets.</li>
        <li><b>Composeur</b> : combinez valeur, angle, optique, mouvement et lumière ; l'outil calcule l'intention produite, signale les tensions et rédige le brief par poste.</li></ul></div>
      <div class="panel"><h2>Installer sur le téléphone</h2><ul class="questions">
        <li><b>Android (Chrome)</b> : menu ⋮ → « Installer l'application » (ou le bouton ${ICONS.install.replace('<svg', '<svg width="15" height="15" style="vertical-align:-3px"')} en haut).</li>
        <li><b>iPhone (Safari)</b> : bouton Partager → « Sur l'écran d'accueil ».</li>
        <li>Une fois installé, le site fonctionne <b>hors ligne</b> (sur le plateau, en sous-sol…).</li></ul></div>
      <div class="panel"><h2>Lire une fiche</h2><ul class="questions">
        <li><b>Intentions servies</b> : la barre indique la force du lien (1 à 3).</li>
        <li><b>Sur le plateau</b> : consignes par poste (Cadre, Machino, Électro, Point, Réal, Déco…).</li>
        <li><b>Pièges</b> : ce qui fait rater l'effet.</li>
        <li>Les fiches lumière ont un <b>plan de feu</b> (vue de dessus, caméra en bas) et un <b>rendu 3D</b> manipulable.</li></ul></div>
      <div class="panel"><h2>Vos données</h2><ul class="questions">
        <li>Aucun compte, aucune base de données : favoris et découpages sont enregistrés dans le navigateur de l'appareil.</li>
        <li>Pour les transférer : exportez un découpage (fichier .json) ou partagez-le par lien.</li>
        <li>Vider les données du navigateur efface vos découpages : pensez à exporter.</li></ul></div>
    </div>
    <p class="muted" style="font-size:13px;margin-top:24px">Rendu 3D : three.js (licence MIT). Polices : Inter Tight, Fraunces, IBM Plex Mono (licence OFL). Illustrations générées en SVG.</p>`;
}

// ---------------- Démarrage ----------------
document.documentElement.dataset.theme = initialTheme;
shell();
window.addEventListener('hashchange', route);
route();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => { }));
}
