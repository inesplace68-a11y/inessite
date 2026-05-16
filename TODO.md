# TODO — Inessite

## ✅ Bande blanche page collection — RÉSOLU (Phase 16.16, commit à venir)

**Cause racine identifiée** :
- Header `.mc-hd-wrap` : fond `#F5F0E8` (crème sombre) — `assets/maison-coeur.css:1022`
- Body : fond `var(--mc-bg)` = `#F7F5F1` (crème clair) — `assets/maison-coeur.css:49`
- Wrapper section product-grid : `<div class="section-{id}-padding gradient color-">`
  (`sections/main-collection-product-grid.liquid:610`) → la classe `.gradient`
  applique `background: rgb(var(--color-background))` qui résout à `#FFFFFF`
  (blanc pur, scheme-1 dans `config/settings_data.json` ligne 147).
- L'override `.color-scheme-1 { background-color: var(--mc-bg) }` (maison-coeur.css:67-71)
  ne s'applique **pas** parce que `color_scheme` est `""` dans les deux templates
  (collection.json + collection.gallery.json) → la classe générée est `color-` sans
  suffixe, donc pas de `.color-scheme-1`. Le wrapper est en blanc pur.

**Fix Phase 16.16** :
- Règle CSS scopée dans le bloc `{% style %}` de
  `sections/main-collection-product-grid.liquid`, scope
  `#shopify-section-{{ section.id }} > .section-{{ section.id }}-padding`
  (sélecteur ID + classe descendante, spécificité supérieure à `.gradient` seul).
- Force `background: #F5F0E8` pour matcher le crème du header.
- **Ne touche aucune autre section** : `#shopify-section-{id}` est unique par
  instance Shopify, donc home / PDP / panier / footer sont intacts.
- **Pas de !important**, pas de règle sur `body` / `main` / `.shopify-section`.

**Leçon Phase 16.13 (revertée)** : ne jamais appliquer `background-color !important`
sur `body`, `main`, `#MainContent`, `.shopify-section`, `.page-width`, `.container`,
`.section`, `.section-padding` — ces classes sont partagées par toutes les pages
et la règle globale casse les hero images et autres sections à background custom.

**Si Ines change la couleur de fond de la page collection plus tard** :
- Modifier la ligne `background: #F5F0E8;` dans
  `sections/main-collection-product-grid.liquid` (chercher "Phase 16.16").
- Aligner aussi `.mc-hd-wrap` dans `assets/maison-coeur.css:1022` si on veut
  garder la continuité avec le header.
