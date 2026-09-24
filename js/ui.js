// Petits composants partagés
import { C, I, FAMILLES } from './data/index.js';
import { illustration } from './illus.js';
import { ICONS } from './icons.js';
import { store } from './store.js';

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const famColor = id => `var(--f-${id})`;
export const famNom = id => FAMILLES.find(f => f.id === id)?.nom || '';

export function favBtn(id, cls = 'fav-btn') {
  const on = store.isFav(id);
  return `<button class="${cls} ${on ? 'on' : ''}" data-fav="${id}" aria-pressed="${on}" aria-label="${on ? 'Retirer des favoris' : 'Ajouter aux favoris'}" title="Favori">${ICONS.star}${cls === 'btn' ? ' Favori' : ''}</button>`;
}
export function setTitle(t) { document.title = t ? `${t} · Le jardin du Chef Op` : 'Le jardin du Chef Op'; }

export function techCard(t, force = 0) {
  const c = C[t.cat];
  return `<div class="card-w" data-t="${t.id}"><a class="card" href="#/t/${t.id}" style="--c:${c.couleur}">
    <div class="thumb">${illustration(t)}</div>
    <div class="body"><span class="tag" style="--c:${c.couleur}">${c.court}</span><h3>${esc(t.nom)}</h3><span class="en">${esc(t.en)}</span><p>${esc(t.resume)}</p></div>
    ${force ? `<span class="strength" title="Force du lien : ${force}/3">${[1, 2, 3].map(k => `<i class="${k <= force ? 'on' : ''}"></i>`).join('')}</span>` : ''}
  </a>${favBtn(t.id)}</div>`;
}

export function intChip(i, extra = '') {
  return `<a class="chip ${extra}" href="#/intention/${i.id}" style="--c:${famColor(i.famille)}"><span class="dot"></span>${esc(i.nom)}</a>`;
}
export function techChip(t, extra = '') {
  return `<a class="chip ${extra}" href="#/t/${t.id}" style="--c:${C[t.cat].couleur}"><span class="dot"></span>${esc(t.nom)}</a>`;
}

let toastT;
export function toast(msg) {
  const el = $('#toast'); el.textContent = msg; el.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2200);
}

export async function share(title, url = location.href) {
  if (navigator.share) { try { await navigator.share({ title, url }); return; } catch (e) { if (e.name === 'AbortError') return; } }
  try { await navigator.clipboard.writeText(url); toast('Lien copié dans le presse-papiers'); }
  catch { prompt('Copiez ce lien :', url); }
}

// Boîte de dialogue simple : champs texte / select
export function ask({ title, fields = [], ok = 'Valider', danger = false, text = '' }) {
  return new Promise(res => {
    const d = $('#dlg');
    d.innerHTML = `<form method="dialog"><h3>${esc(title)}</h3>${text ? `<p class="muted">${esc(text)}</p>` : ''}
      ${fields.map((f, k) => `<label style="display:grid;gap:5px;margin:10px 0"><span class="muted" style="font-size:13px">${esc(f.label)}</span>
        ${f.options ? `<select name="f${k}">${f.options.map(o => `<option value="${esc(o.value)}" ${o.value === f.value ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select>`
          : f.area ? `<textarea name="f${k}" placeholder="${esc(f.placeholder || '')}">${esc(f.value || '')}</textarea>`
          : `<input type="text" name="f${k}" value="${esc(f.value || '')}" placeholder="${esc(f.placeholder || '')}">`}</label>`).join('')}
      <div class="row"><button class="btn" value="cancel" type="submit">Annuler</button><button class="btn ${danger ? 'danger' : 'primary'}" value="ok" type="submit">${esc(ok)}</button></div></form>`;
    d.onclose = () => {
      if (d.returnValue !== 'ok') return res(null);
      res(fields.map((f, k) => d.querySelector(`[name=f${k}]`).value));
    };
    d.returnValue = '';
    d.showModal();
    d.querySelector('input,select,textarea')?.focus();
  });
}

export function download(name, content, type = 'application/json') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name; document.body.append(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
