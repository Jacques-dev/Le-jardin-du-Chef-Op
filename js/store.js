// Stockage local (aucun compte, aucune base de données : tout reste sur l'appareil)
const P = 'jco.';
const safeGet = (k, d) => { try { const v = localStorage.getItem(P + k); return v == null ? d : JSON.parse(v); } catch { return d; } };
const safeSet = (k, v) => { try { localStorage.setItem(P + k, JSON.stringify(v)); return true; } catch { return false; } };

export const store = {
  get theme() { return safeGet('theme', null); },
  set theme(v) { safeSet('theme', v); },

  favs() { return new Set(safeGet('favs', [])); },
  isFav(id) { return this.favs().has(id); },
  toggleFav(id) { const f = this.favs(); f.has(id) ? f.delete(id) : f.add(id); safeSet('favs', [...f]); return f.has(id); },

  get composer() { return safeGet('composer', {}); },
  set composer(v) { safeSet('composer', v); },

  get labView() { return safeGet('labView', null); },
  set labView(v) { safeSet('labView', v); },

  projects() { return safeGet('projects', []); },
  saveProjects(p) { return safeSet('projects', p); },
  project(id) { return this.projects().find(p => p.id === id); },
  upsertProject(pr) {
    const all = this.projects(); const i = all.findIndex(p => p.id === pr.id);
    pr.updated = Date.now();
    if (i >= 0) all[i] = pr; else all.unshift(pr);
    this.saveProjects(all); return pr;
  },
  deleteProject(id) { this.saveProjects(this.projects().filter(p => p.id !== id)); },
};

export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
