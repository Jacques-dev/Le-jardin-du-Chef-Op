# Le jardin du Chef Op

Site web installable (PWA) pour chefs opérateurs : traduire les intentions d'un réalisateur en cadrages, mouvements et lumières, avec des consignes par poste pour les techniciens.

- **Sans compte, sans base de données** : favoris et découpages restent dans le navigateur de l'appareil.
- **Hors ligne** une fois installé (service worker).
- **Deux thèmes** : Plateau (sombre) et Jardin (herbier), bouton en haut à droite.

## Contenu

- 41 intentions (5 familles) et 111 techniques (11 catégories) reliées par ~560 liens pondérés. Détail complet : `CARTOGRAPHIE.md`.
- Vues : par intention, par technique, composeur de plan, labo lumière 3D, découpage (projets), favoris.
- Illustrations 100 % générées en SVG (`js/illus.js`) + tête 3D procédurale éclairée par three.js (`js/lab3d.js`).

## Lancer en local

Les modules ES exigent un serveur HTTP (pas d'ouverture directe du fichier) :

```
python -m http.server 8000
```
puis ouvrir http://localhost:8000

## Mettre en ligne (gratuit)

Le dossier est statique : GitHub Pages, Netlify ou Cloudflare Pages suffisent (HTTPS requis pour l'installation sur téléphone).
GitHub Pages : pousser le dépôt, puis Settings → Pages → branche `main`, dossier `/ (root)`.

## Modifier le contenu

- Données : `js/data/intentions.js`, `cadre.js`, `compo.js`, `mouvements.js`, `lumiere.js`.
  - `effets: { intention: 1..3 }` crée les liens ; `combos` relie les fiches ; `rig` décrit un plan de feu (utilisé pour le SVG et la 3D).
- Après toute modification : `node outils/generer-sw.mjs` (met à jour le cache hors ligne) et, si besoin, `node outils/generer-cartographie.mjs`.

## Structure

```
index.html  manifest.webmanifest  sw.js
css/app.css            thèmes + composants
js/app.js              routeur, accueil, intentions, techniques, fiches
js/tools.js            composeur, labo 3D, découpage
js/setup.js            analyse d'un plan, rig combiné, encodage des liens
js/illus.js            générateurs SVG
js/lab3d.js            scène 3D (lumières, flou optique)
js/env.js              décors 3D du labo : studio, rue, nature, intérieur
vendor/three.bundle.js three.js r186 (MIT), réduit
fonts/                 Inter Tight, Fraunces, IBM Plex Mono (OFL)
```
