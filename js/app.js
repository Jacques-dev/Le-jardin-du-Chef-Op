// Le jardin du Chef Op — application (routeur + vues de consultation)
import { INTENTIONS, FAMILLES, TECHNIQUES, CATEGORIES, GROUPES, T, I, C, PAR_INTENTION, recherche, ESSENTIELS, PHOTOS, VIDEOS } from './data/index.js';
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
  { href: '#/', label: 'Accueil', icon: 'home', match: /^\/$/ },
  { href: '#/intentions', label: 'Intentions', icon: 'intention', match: /^\/(intentions?|intention\/)/ },
  { href: '#/techniques', label: 'Techniques', icon: 'grid', match: /^\/(techniques|t\/)/ },
  { href: '#/composer', label: 'Composeur', icon: 'sliders', match: /^\/composer/ },
  { href: '#/labo', label: 'Labo 3D', icon: 'cube', match: /^\/labo/ },
  { href: '#/decoupage', label: 'Découpage', icon: 'film', match: /^\/(decoupage|import)/ },
];
const NAV_MOB = [
  { href: '#/', label: 'Accueil', icon: 'home', match: /^\/$/ },
  { href: '#/intentions', label: 'Intentions', icon: 'intention', match: /^\/(intentions?|intention\/)/ },
  { href: '#/techniques', label: 'Techniques', icon: 'grid', match: /^\/(techniques|t\/)/ },
  { href: '#/composer', label: 'Composeur', icon: 'sliders', match: /^\/composer/ },
  { href: '#/favoris', label: 'Favoris', icon: 'star', match: /^\/favoris/ },
];

function shell() {
  document.body.innerHTML = `
  <header class="top">
    <a class="brand" href="#/">${LOGO}<span><b>Le jardin du Chef Op</b><small>intentions → image</small></span></a>
    <span class="spacer"></span>
    <nav class="nav-desk" aria-label="Navigation principale">${NAV.map(n => `<a href="${n.href}">${n.label}</a>`).join('')}</nav>
    <button class="icon-btn install" id="installBtn" title="Installer l'application" aria-label="Installer l'application">${ICONS.install}</button>
    <a class="icon-btn" href="#/favoris" title="Favoris" aria-label="Favoris" id="favNavBtn">${ICONS.star}</a>
    <button class="icon-btn" id="themeBtn"></button>
  </header>
  <main id="view" tabindex="-1"></main>
  <nav class="nav-mob" aria-label="Navigation">${NAV_MOB.map(n => `<a href="${n.href}">${ICONS[n.icon]}<span>${n.label}</span></a>`).join('')}</nav>
  <button class="fab" id="fab" aria-expanded="false" aria-controls="fabPop" title="Aide & Lexique" aria-label="Afficher l'aide et le lexique">${ICONS.info}</button>
  <div class="fab-pop" id="fabPop" role="dialog" aria-labelledby="fabTitle" hidden>
    <header style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px">
      <div style="display:flex;gap:4px">
        <button class="chip sm on" id="fabTabForce" type="button">Force des liens</button>
        <button class="chip sm" id="fabTabLex" type="button">Mini-lexique</button>
      </div>
      <button class="icon-btn" id="fabClose" aria-label="Fermer" style="width:28px;height:28px">${ICONS.x}</button>
    </header>
    <div id="fabPaneForce">
      <p style="margin:4px 0 8px;font-size:13px">Les points indiquent à quel point une technique sert une intention :</p>
      <table class="force-table">
        <thead><tr><th>Points</th><th>Force</th><th>Sens</th></tr></thead>
        <tbody>
          <tr><td><span class="dots"><i class="on"></i><i></i><i></i></span></td><td>1</td><td><b>Appoint</b> : peut aider ou colorer l'intention.</td></tr>
          <tr><td><span class="dots"><i class="on"></i><i class="on"></i><i></i></span></td><td>2</td><td><b>Direct</b> : outil courant et très efficace.</td></tr>
          <tr><td><span class="dots"><i class="on"></i><i class="on"></i><i class="on"></i></span></td><td>3</td><td><b>Majeur</b> : l'un des moyens les plus directs et classiques.</td></tr>
        </tbody>
      </table>
    </div>
    <div id="fabPaneLex" hidden>
      <p class="muted" style="margin:4px 0 8px;font-size:12.5px">Repères clés pour débuter :</p>
      <ul style="padding-left:16px;margin:0;font-size:12.5px;line-height:1.5">
        <li><b>Plongée / Contre-plongée</b> : vue du dessus (fragilité) ou du dessous (puissance).</li>
        <li><b>Focale (mm)</b> : 24mm = grand angle / espace déformé ; 85mm = portrait serré / fond flou.</li>
        <li><b>Éclairage 3 points</b> : Clé (principale), Débouchage (ombres), et Liseré (détache le sujet).</li>
        <li><b>Lumière douce vs dure</b> : ombres floues et bienveillantes vs ombres tranchées et dramatiques.</li>
        <li><b>Low key</b> : scène sombre à fort contraste (polar, mystère).</li>
      </ul>
    </div>
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

  // Bulle « aide et lexique »
  const fab = $('#fab'), pop = $('#fabPop');
  const setPop = open => { pop.hidden = !open; fab.setAttribute('aria-expanded', open); fab.classList.toggle('on', open); if (open) $('#fabClose').focus(); };
  fab.onclick = e => { e.stopPropagation(); setPop(pop.hidden); };
  $('#fabClose').onclick = () => { setPop(false); fab.focus(); };
  document.addEventListener('click', e => { if (!pop.hidden && !pop.contains(e.target)) setPop(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !pop.hidden) { setPop(false); fab.focus(); } });
  window.addEventListener('hashchange', () => setPop(false));

  const tF = $('#fabTabForce'), tL = $('#fabTabLex'), pF = $('#fabPaneForce'), pL = $('#fabPaneLex');
  if (tF && tL) {
    tF.onclick = () => { tF.classList.add('on'); tL.classList.remove('on'); pF.hidden = false; pL.hidden = true; };
    tL.onclick = () => { tL.classList.add('on'); tF.classList.remove('on'); pL.hidden = false; pF.hidden = true; };
  }

  // Installation PWA
  let deferred;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; $('#installBtn').classList.add('show'); });
  $('#installBtn').onclick = async () => { if (!deferred) return; deferred.prompt(); await deferred.userChoice; deferred = null; $('#installBtn').classList.remove('show'); };
}

// ---------------- Retour sur la fiche cliquée ----------------
let fiche = null;        // { path, id, top, railLeft } : la carte cliquée et sa position dans la fenêtre
let prevPath = null;     // chemin quitté, renseigné en fin de route()
let scrollAfter = null;  // défilement posé par une vue, exécuté par route() après le rendu
const CHROME = 120;      // même décalage que .cat-block { scroll-margin-top }

// Capture : on lit la position avant toute modification du DOM, le hashchange n'a pas encore eu lieu.
document.addEventListener('click', e => {
  const w = e.target.closest?.('a.card[href^="#/t/"]')?.closest('.card-w');
  if (!w) return;
  const rail = w.closest('.rail');
  fiche = {
    path: location.hash.slice(1).split('?')[0] || '/',
    id: w.dataset.t,
    top: w.getBoundingClientRect().top,
    railLeft: rail ? rail.scrollLeft : null,
  };
}, true);

// Rend une fonction de repositionnement sur la carte d'où l'on vient, ou null.
function retourFiche(v, q, path) {
  const exact = !!fiche && fiche.path === path && !!prevPath?.startsWith('/t/');
  const id = q.get('t') || (exact ? fiche.id : null);
  if (!id) return null;
  const el = $(`.card-w[data-t="${id}"]`, v);
  if (!el) return null;
  const memeCarte = exact && fiche.id === id;
  const top = memeCarte ? fiche.top : CHROME;
  return () => {
    const rail = el.closest('.rail');
    if (rail) rail.scrollLeft = memeCarte && fiche.railLeft != null ? fiche.railLeft
      : Math.max(0, rail.scrollLeft + el.getBoundingClientRect().left - rail.getBoundingClientRect().left - 8);
    let n = 0;
    const cale = () => {                                 // content-visibility : les hauteurs réelles
      const d = el.getBoundingClientRect().top - top;    // arrivent sur deux ou trois frames
      if (Math.abs(d) > 1) window.scrollTo(0, Math.max(0, window.scrollY + d));
      if (++n < 4) requestAnimationFrame(cale);
    };
    cale();
  };
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
  scrollAfter = null;
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
  if (scrollAfter) { const f = scrollAfter; scrollAfter = null; f(); }
  else if (!history.state?.keepScroll) window.scrollTo(0, 0);
  prevPath = path;
}

// ---------------- Accueil ----------------
function home(v) {
  setTitle('');

  // 6 fiches fondamentales sélectionnées
  const bases = ['gp', 'pe', 'plongee', 'trois-points', 'lumiere-douce', 'camera-epaule']
    .map(id => T[id]).filter(Boolean);

  v.innerHTML = `
  <section class="hero home-hero">
    <span class="eyebrow">Guide d'image du Chef Opérateur</span>
    <h1>Traduire une émotion en choix d'image</h1>
    <p class="hero-lead">Découvrez comment transformer les intentions d'un réalisateur en cadrages, mouvements de caméra et ambiances de lumière sans jargon intimidant.</p>
  </section>

  <div class="search" role="search">${ICONS.search}<input type="search" id="q" placeholder="Chercher une émotion ou une technique : « solitude », « plongée », « lumière douce »…" autocomplete="off" aria-label="Rechercher"></div>
  <div class="results" id="res"></div>

  <section class="section">
    <div class="section-head">
      <h2>Par quoi souhaitez-vous commencer&nbsp;?</h2>
      <p class="muted">Deux parcours simples pour concevoir vos images pas à pas.</p>
    </div>
    <div class="entry-cards">
      <a class="entry-card featured" href="#/intentions">
        <div class="entry-icon" style="--c:var(--f-emotion)">${ICONS.intention}</div>
        <span class="entry-tag" style="--c:var(--f-emotion)">Le point de départ</span>
        <h3>Partir d'une émotion</h3>
        <p>Le réalisateur veut de l'oppression, de la tendresse ou du mystère ? Voyez instantanément les techniques qui créent cet effet.</p>
        <span class="entry-link">Explorer les émotions →</span>
      </a>
      <a class="entry-card" href="#/techniques">
        <div class="entry-icon" style="--c:var(--c-valeur)">${ICONS.grid}</div>
        <span class="entry-tag" style="--c:var(--c-valeur)">Encyclopédie</span>
        <h3>Toutes les techniques</h3>
        <p>Les 109 cadrages, angles, optiques et plans de lumière détaillés avec conseils de plateau.</p>
        <span class="entry-link">Explorer les fiches →</span>
      </a>
    </div>
  </section>

  <section class="section">
    <div class="section-head">
      <h2>Quelle ambiance voulez-vous raconter&nbsp;?</h2>
      <p class="muted">Choisissez une famille d'émotions pour découvrir les choix visuels adaptés.</p>
    </div>
    <div class="emotion-families">
      ${FAMILLES.map(f => {
        const topInts = INTENTIONS.filter(i => i.famille === f.id).slice(0, 4);
        return `<div class="emotion-card" style="--c:${famColor(f.id)}">
          <div class="emotion-head">
            <span class="dot"></span>
            <h3>${esc(f.nom)}</h3>
          </div>
          <p class="emotion-desc">${esc(f.desc)}</p>
          <div class="emotion-chips">
            ${topInts.map(i => intChip(i, 'sm')).join('')}
          </div>
        </div>`;
      }).join('')}
    </div>
    <div class="center-action">
      <a class="btn" href="#/intentions">Voir les 38 intentions artistiques classées →</a>
    </div>
  </section>

  <section class="section">
    <div class="section-head">
      <h2>Les fondamentaux de l'image <small>6 fiches essentielles pour bien débuter</small></h2>
      <p class="muted">Des techniques simples et éprouvées pour donner du sens à chaque plan.</p>
    </div>
    <div class="grid">
      ${bases.map(t => techCard(t)).join('')}
    </div>
    <div class="center-action">
      <a class="btn" href="#/techniques">Découvrir toute l'encyclopédie des 109 techniques →</a>
    </div>
  </section>

  <footer class="foot">
    <p>Fonctionne hors ligne une fois installé · Aucune donnée ne quitte votre appareil · <a href="#/a-propos">Mode d'emploi & Guide</a></p>
  </footer>`;

  const q = $('#q', v), res = $('#res', v);
  q.addEventListener('input', () => {
    const val = q.value.trim();
    if (!val) { res.innerHTML = ''; return; }
    const r = recherche(val);
    res.innerHTML = r.map(({ type, item }) => type === 'intention'
      ? `<a class="result" href="#/intention/${item.id}"><span class="dot" style="width:9px;height:9px;border-radius:50%;background:${famColor(item.famille)}"></span><div><b>${esc(item.nom)}</b> <span class="muted">(${famNom(item.famille)})</span></div><span class="kind">Intention</span></a>`
      : `<a class="result" href="#/t/${item.id}"><span class="dot" style="width:9px;height:9px;border-radius:3px;background:${C[item.cat].couleur}"></span><div><b>${esc(item.nom)}</b> <span class="muted">· ${esc(item.en)}</span></div><span class="kind">${C[item.cat].court}</span></a>`).join('')
      || `<p class="muted" style="padding:8px 12px">Aucun résultat trouvé pour « ${esc(val)} ».</p>`;
  });
}

// ---------------- Intentions ----------------
function intentionsView(v) {
  setTitle('Intentions');
  v.innerHTML = `<section class="hero"><span class="eyebrow">Par intention</span><h1>Intentions artistiques</h1>
    <p>Ce que vous ou le réalisateur souhaitez faire ressentir au spectateur. Touchez une émotion pour voir exactement comment la construire.</p></section>
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

  // Top 3 recommandations variées (image, mouvement, lumière)
  const topCadre = list.find(x => C[x.t.cat].groupe === 'image');
  const topMouv = list.find(x => C[x.t.cat].groupe === 'mouvement');
  const topLum = list.find(x => C[x.t.cat].groupe === 'lumiere');
  const top3 = [topCadre, topMouv, topLum].filter(Boolean);
  if (top3.length < 3) {
    for (const item of list) {
      if (!top3.some(x => x.t.id === item.t.id)) top3.push(item);
      if (top3.length >= 3) break;
    }
  }

  let activeGroupe = q.get('groupe') || 'tout';

  function renderList(grp) {
    let items = shown;
    if (grp !== 'tout') items = shown.filter(x => C[x.t.cat].groupe === grp);
    const container = $('#techniquesGrid', v);
    if (!container) return;
    if (!items.length) {
      container.innerHTML = `<div class="empty">Aucune technique dans cette catégorie pour cette intention.</div>`;
      return;
    }
    container.innerHTML = `<div class="grid">${items.map(x => techCard(x.t, x.f)).join('')}</div>`;
  }

  v.innerHTML = `
  <a class="crumb" href="#/intentions">${ICONS.back.replace('<svg', '<svg width="14" height="14"')} Toutes les intentions</a>
  <section class="hero" style="padding-top:12px">
    <div style="display:flex;align-items:center;gap:8px">
      <span class="eyebrow" style="color:${famColor(it.famille)}">${famNom(it.famille)}</span>
      <span class="muted" style="font-size:12px">·</span>
      <span class="mono muted" style="font-size:13px">${esc(it.en)}</span>
    </div>
    <h1>${esc(it.nom)}</h1>
    <p class="hero-lead">${esc(it.desc)}</p>
    <div class="actions">
      <a class="btn primary" href="#/composer?${encodeSel(sel)}">${ICONS.sliders} Composer un plan</a>
      ${favBtn(id, 'btn')}
      <button class="btn" data-share>${ICONS.share} Partager</button>
    </div>
  </section>

  <!-- Encart Top 3 Recommandations : synthèse immédiate -->
  <div class="top-reco-box">
    <h3>${ICONS.spark} Les 3 choix clés recommandés</h3>
    <p class="lead-reco">Pour produire cette intention de façon immédiate et efficace, voici le trio recommandé :</p>
    <div class="grid">${top3.map(x => techCard(x.t, x.f)).join('')}</div>
  </div>

  <div class="cols" style="margin-top:0">
    <div class="panel">
      <h2>Questions à poser au réalisateur</h2>
      <ul class="questions">${it.questions.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
    </div>
    <div class="panel">
      <h2>Nuances et contraires</h2>
      ${it.oppose.length ? `<p class="muted" style="margin:0 0 8px;font-size:13.5px">À l'opposé (attention aux choix qui tirent dans ce sens) :</p><div class="chips">${it.oppose.map(o => intChip(I[o], 'sm')).join('')}</div>` : ''}
      <p class="muted" style="margin:14px 0 8px;font-size:13.5px">Intentions voisines (partagent les mêmes techniques) :</p>
      <div class="chips">${voisines(id).map(o => intChip(o, 'sm')).join('')}</div>
    </div>
  </div>

  <section class="section" style="margin-top:28px">
    <div class="section-head">
      <h2>Toutes les techniques adaptées <small>${shown.length} technique${shown.length > 1 ? 's' : ''}</small></h2>
      <p class="muted">Filtrer par domaine pour trouver les outils de cadrage, mouvement ou lumière correspondants.</p>
    </div>

    <div class="tabs-filter" role="tablist">
      <button class="tab-btn ${activeGroupe === 'tout' ? 'on' : ''}" data-grp="tout" type="button">Toutes (${shown.length})</button>
      <button class="tab-btn ${activeGroupe === 'image' ? 'on' : ''}" data-grp="image" type="button">🎬 Cadrage & Optique (${shown.filter(x => C[x.t.cat].groupe === 'image').length})</button>
      <button class="tab-btn ${activeGroupe === 'mouvement' ? 'on' : ''}" data-grp="mouvement" type="button">🎥 Mouvement (${shown.filter(x => C[x.t.cat].groupe === 'mouvement').length})</button>
      <button class="tab-btn ${activeGroupe === 'lumiere' ? 'on' : ''}" data-grp="lumiere" type="button">💡 Lumière & Couleur (${shown.filter(x => C[x.t.cat].groupe === 'lumiere').length})</button>
    </div>

    <div class="toggle-strength">
      <a class="chip sm ${strongOnly ? 'on' : ''}" href="#/intention/${id}${activeGroupe !== 'tout' ? '?groupe=' + activeGroupe : ''}">Liens forts (≥ 2 pts)</a>
      <a class="chip sm ${!strongOnly ? 'on' : ''}" href="#/intention/${id}?tout=1${activeGroupe !== 'tout' ? '&groupe=' + activeGroupe : ''}">Tous les liens (${list.length})</a>
    </div>

    <div id="techniquesGrid"></div>
  </section>`;

  renderList(activeGroupe);

  $$('.tab-btn[data-grp]', v).forEach(btn => {
    btn.onclick = () => {
      $$('.tab-btn[data-grp]', v).forEach(b => b.classList.remove('on'));
      btn.classList.add('on');
      activeGroupe = btn.dataset.grp;
      renderList(activeGroupe);
    };
  });

  scrollAfter = retourFiche(v, q, '/intention/' + id);
}

function voisines(id) {
  const mine = new Set(PAR_INTENTION[id].filter(x => x.f >= 2).map(x => x.t.id));
  return INTENTIONS.filter(i => i.id !== id && !I[id].oppose.includes(i.id)).map(i => ({ i, n: PAR_INTENTION[i.id].filter(x => x.f >= 2 && mine.has(x.t.id)).length }))
    .sort((a, b) => b.n - a.n).slice(0, 5).filter(x => x.n > 1).map(x => x.i);
}

// ---------------- Techniques ----------------
function techniquesView(v, q) {
  setTitle('Techniques');
  let selectedCat = q.get('cat') || 'tout';

  function filterTechs() {
    return TECHNIQUES.filter(t => {
      if (selectedCat === 'tout') return true;
      if (selectedCat.startsWith('grp:')) return C[t.cat].groupe === selectedCat.slice(4);
      return t.cat === selectedCat;
    });
  }

  function render() {
    const list = filterTechs();
    const activeCats = CATEGORIES.filter(c => {
      if (selectedCat === 'tout') return list.some(t => t.cat === c.id);
      if (selectedCat.startsWith('grp:')) return c.groupe === selectedCat.slice(4) && list.some(t => t.cat === c.id);
      return c.id === selectedCat;
    });

    v.innerHTML = `
    <section class="hero"><span class="eyebrow">Encyclopédie de l'image</span><h1>Techniques audiovisuelles</h1>
      <p>Cadrages, optiques, mouvements de caméra et plans de lumière. Chaque fiche détaille l'effet produit et les consignes de tournage.</p></section>
      
    <div class="tech-filters-bar">
      <div class="tech-filter-item">
        <label for="catSelect">Filtrer par catégorie :</label>
        <select id="catSelect" class="tech-filter-select">
          <option value="tout" ${selectedCat === 'tout' ? 'selected' : ''}>— Toutes les catégories (${TECHNIQUES.length} fiches) —</option>
          ${GROUPES.map(g => {
            const grpTechs = TECHNIQUES.filter(t => C[t.cat].groupe === g.id);
            const grpLabel = g.nom === 'Image' ? '🎬 Image & Cadre' : g.nom === 'Mouvement' ? '🎥 Mouvements' : '💡 Lumière & Ambiance';
            return `
            <optgroup label="${grpLabel}">
              <option value="grp:${g.id}" ${selectedCat === 'grp:' + g.id ? 'selected' : ''}>Tout « ${grpLabel} » (${grpTechs.length} fiches)</option>
              ${CATEGORIES.filter(c => c.groupe === g.id).map(c => {
                const count = TECHNIQUES.filter(t => t.cat === c.id).length;
                return `<option value="${c.id}" ${selectedCat === c.id ? 'selected' : ''}>${esc(c.nom)} (${count} fiche${count > 1 ? 's' : ''})</option>`;
              }).join('')}
            </optgroup>`;
          }).join('')}
        </select>
      </div>
    </div>

    ${!list.length ? `<div class="empty">Aucune fiche technique ne correspond à cette catégorie.</div>` : ''}

    ${activeCats.map(c => {
      const catTechs = list.filter(t => t.cat === c.id);
      if (!catTechs.length) return '';
      return `<section class="cat-block" id="cat-${c.id}" style="--c:${c.couleur}">
        <h2><span class="dot"></span>${c.nom}</h2><p class="muted">${catTechs.length} fiche${catTechs.length > 1 ? 's' : ''}</p>
        <div class="grid">${catTechs.map(t => techCard(t)).join('')}</div>
      </section>`;
    }).join('')}`;

    const catSelect = $('#catSelect', v);

    catSelect.onchange = () => {
      selectedCat = catSelect.value;
      const url = new URL(location.href);
      if (selectedCat !== 'tout') url.hash = `#/techniques?cat=${selectedCat}`;
      else url.hash = `#/techniques`;
      history.replaceState({ keepScroll: true }, '', url.hash);
      render();
    };
  }

  render();
  scrollAfter = retourFiche(v, q, '/techniques');
}

function techniqueView(v, q, id) {
  const t = T[id];
  if (!t) { v.innerHTML = '<p>Technique inconnue.</p>'; return; }
  setTitle(t.nom);
  const c = C[t.cat];
  const effets = Object.entries(t.effets).sort((a, b) => b[1] - a[1]);
  const isLight = !!t.rig;
  const v3 = viewForTechnique(t);
  const hasPhoto = PHOTOS.has(t.id);
  const hasVideo = VIDEOS?.has(t.id);

  const tabs = [];
  if (hasVideo) tabs.push(['video', 'Démo vidéo']);
  if (hasPhoto) tabs.push(['photo', 'Rendu cinéma']);
  if (isLight) tabs.push(['plan', 'Plan de feu']);
  else tabs.push(['illus', 'Schéma']);
  if (isLight || v3) tabs.push(['3d', 'Rendu 3D']);

  const addHref = `#/composer?${encodeSel({ ...store.composer, [t.cat]: t.id })}`;
  const isEssentiel = ESSENTIELS.has(t.id);

  let activeTab = q.get('vue_poste') === '1' ? 'plateau' : 'effet';
  const initialVis = hasVideo
    ? `<video src="videos/techniques/${t.id}.mp4" autoplay loop muted playsinline controls class="fiche-video fiche-photo"></video>`
    : (hasPhoto
      ? `<img src="images/techniques/${t.id}.jpg" alt="${esc(t.nom)}" class="fiche-photo">`
      : (isLight ? plot(t.rig, t.nom) : illustration(t)));

  v.innerHTML = `
  <a class="crumb" href="#/techniques?cat=${t.cat}">${ICONS.back.replace('<svg', '<svg width="14" height="14"')} ${c.nom}</a>
  <div class="fiche-head">
    <div class="visual wide" id="vis">
      ${tabs.length > 1 ? `<div class="visual-tabs" role="tablist">${tabs.map(([k, l], n) => `<button role="tab" data-tab="${k}" class="${n === 0 ? 'on' : ''}">${l}</button>`).join('')}</div>` : ''}
      <div id="visBody">${initialVis}</div>
    </div>
    <div class="fiche-title">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <span class="eyebrow" style="color:${c.couleur};margin-bottom:0">${c.nom}${t.abbr ? ` · ${t.abbr}` : ''}</span>
        ${isEssentiel ? `<span class="badge-essentiel" style="position:static">${ICONS.spark} Fondamental</span>` : ''}
      </div>
      <h1>${esc(t.nom)}</h1>
      <div class="en">${esc(t.en)}</div>
      <p class="lead">${esc(t.resume)}</p>
      <div class="actions">
        <a class="btn primary" href="${addHref}">${ICONS.sliders} Ajouter au composeur</a>
        ${isLight ? `<a class="btn" href="#/labo?p=${t.id}">${ICONS.cube} Ouvrir dans le labo 3D</a>` : ''}
        ${favBtn(id, 'btn')}
        <button class="btn" data-share>${ICONS.share} Partager</button>
      </div>
    </div>
  </div>

  <!-- Sélecteur d'onglets : Comprendre l'effet vs Fiche Plateau Technicien -->
  <div class="view-tabs" role="tablist">
    <button class="view-tab ${activeTab === 'effet' ? 'on' : ''}" data-vtab="effet" type="button">${ICONS.spark} Comprendre l'effet</button>
    <button class="view-tab ${activeTab === 'plateau' ? 'on' : ''}" data-vtab="plateau" type="button">${ICONS.pro} Sur le plateau & Techniciens (${(t.plateau || []).length})</button>
  </div>

  <!-- ONGLET 1 : COMPRENDRE L'EFFET -->
  <div id="paneEffet" ${activeTab !== 'effet' ? 'hidden' : ''}>
    <div class="cols">
      <div class="panel">
        <h2>Ce que ça raconte à l'image</h2>
        <p style="margin:0;font-size:15px;line-height:1.6">${esc(t.desc)}</p>
      </div>
      <div class="panel">
        <h2>Intentions artistiques servies</h2>
        <div class="bars">${effets.map(([i, f]) => `<a class="bar" href="#/intention/${i}" style="--c:${famColor(I[i].famille)}"><span>${esc(I[i].nom)}</span><span class="track"><span class="fill" style="display:block;width:${f / 3 * 100}%"></span></span></a>`).join('')}</div>
      </div>
    </div>
    <div class="cols" style="margin-top:14px">
      <div class="panel">
        <h2>Pièges à éviter</h2>
        <p class="warn">${esc(t.pieges)}</p>
      </div>
      <div class="panel">
        <h2>Se combine idéalement avec</h2>
        <div class="chips">${(t.combos || []).map(x => techChip(T[x], 'sm')).join('') || '<span class="muted">Aucune combinaison spécifique</span>'}</div>
      </div>
    </div>
    <div class="center-action" style="margin-top:20px">
      <button class="btn" id="toPlateauBtn" type="button">${ICONS.pro} Voir les consignes techniques pour chaque poste (Électro, Machino...) →</button>
    </div>
  </div>

  <!-- ONGLET 2 : SUR LE PLATEAU & TECHNICIENS -->
  <div id="panePlateau" ${activeTab !== 'plateau' ? 'hidden' : ''}>
    <div class="panel">
      <h2>Consignes par poste technique</h2>
      <p class="muted" style="margin:0 0 16px;font-size:13.5px">Brief clair à transmettre à chaque technicien de l'équipe pour préparer et caler le plan.</p>
      <ul class="postes">${(t.plateau || []).map(([p, txt]) => `<li><span class="poste">${esc(p)}</span><span>${esc(txt)}</span></li>`).join('')}</ul>
    </div>
    ${isLight ? `
    <div class="panel" style="margin-top:14px">
      <h2>Plan de feu & Implantation</h2>
      <p class="muted" style="margin:0 0 12px;font-size:13.5px">Vue de dessus de l'implantation des sources de lumière et de la caméra.</p>
      <div style="max-width:540px;margin:0 auto">${plot(t.rig, t.nom)}</div>
    </div>` : ''}
  </div>`;

  // Gestion des onglets
  const pEff = $('#paneEffet', v), pPlat = $('#panePlateau', v);
  const btnEff = $('[data-vtab="effet"]', v), btnPlat = $('[data-vtab="plateau"]', v);
  const switchVTab = (k) => {
    activeTab = k;
    btnEff.classList.toggle('on', k === 'effet');
    btnPlat.classList.toggle('on', k === 'plateau');
    pEff.hidden = k !== 'effet';
    pPlat.hidden = k !== 'plateau';
  };
  btnEff.onclick = () => switchVTab('effet');
  btnPlat.onclick = () => switchVTab('plateau');
  $('#toPlateauBtn', v).onclick = () => { switchVTab('plateau'); pPlat.scrollIntoView({ behavior: 'smooth' }); };

  let lab = null;
  const body = $('#visBody', v);
  async function showTab(k) {
    $$('[data-tab]', v).forEach(b => b.classList.toggle('on', b.dataset.tab === k));
    if (k === 'video') {
      body.innerHTML = `<video src="videos/techniques/${t.id}.mp4" autoplay loop muted playsinline controls class="fiche-video fiche-photo"></video>`;
    } else if (k === 'photo') {
      body.innerHTML = `<img src="images/techniques/${t.id}.jpg" alt="${esc(t.nom)}" class="fiche-photo">`;
    } else if (k === '3d') {
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
function favorisView(v, q) {
  setTitle('Favoris');
  const f = store.favs();
  const ints = INTENTIONS.filter(i => f.has(i.id)), techs = TECHNIQUES.filter(t => f.has(t.id));
  v.innerHTML = `<section class="hero"><span class="eyebrow">Sur cet appareil</span><h1>Favoris</h1><p>Les intentions et fiches que vous avez marquées d'une étoile. Elles restent sur votre téléphone, sans compte.</p></section>
    ${!ints.length && !techs.length ? `<div class="empty">Aucun favori pour l'instant. Touchez l'étoile ${ICONS.star.replace('<svg', '<svg width="16" height="16" style="vertical-align:-3px"')} sur une fiche pour la retrouver ici.</div>` : ''}
    ${ints.length ? `<section class="section"><h2>Intentions</h2><div class="chips">${ints.map(i => intChip(i)).join('')}</div></section>` : ''}
    ${techs.length ? `<section class="section"><h2>Techniques</h2><div class="grid">${techs.map(t => techCard(t)).join('')}</div></section>` : ''}`;
  scrollAfter = retourFiche(v, q, '/favoris');
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

const isDev = ['localhost', '127.0.0.1'].includes(location.hostname) && !location.search.includes('sw=1');
if ('serviceWorker' in navigator) {
  if (isDev) {
    navigator.serviceWorker.getRegistrations().then(regs => {
      for (const reg of regs) reg.unregister();
    });
    if ('caches' in window) {
      caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
    }
  } else if (location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => { }));
  }
}
