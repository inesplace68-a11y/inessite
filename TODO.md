# TODO — Inessite

## Bande blanche subtile page collection (entre menu nav et barre filtres)

**Statut** : à attaquer plus tard, après les priorités produit.

**Historique** :
- Phase 16.13 (commit `7348937`, reverté par `c451bbd`) a tenté une règle CSS globale
  `body, main, #MainContent, .shopify-section, .page-width, .container, .section, .section-padding { background-color: var(--mc-cream, #F5F0E8) !important }`.
  Trop agressive : a écrasé l'image de fond du hero "Reflets du temps" sur la home → rectangle crème massif.

**Stratégie correcte pour la prochaine tentative** :

1. `curl` sur l'URL live de la page collection (ex. `/collections/all`)
   et inspecter le HTML rendu de la zone entre `</header>` (menu nav) et
   `<div class="mc-collection-toolbar">` (barre filtres).
2. Identifier l'**élément exact** qui produit la transition de teinte —
   très probablement un wrapper de `section_group` ou la classe
   `.gradient` appliquée à la section `main-collection-product-grid`
   (`assets/base.css:2934` → `.gradient { background: rgb(var(--color-background)) }`
   et `color-scheme-1.background = #FFFFFF` dans `config/settings_data.json`).
3. Override CSS **chirurgical** sur ce sélecteur SPÉCIFIQUE uniquement.
   Exemples de pistes à privilégier (à confirmer par inspection HTML) :
   - `.shopify-section--main-collection-product-grid > .gradient`
   - `.shopify-section--main-collection-banner > .gradient`
   - Ou : neutraliser `.gradient` uniquement à l'intérieur d'un
     `body:has(.shopify-section--main-collection-product-grid)` (scope page collection).
4. **Ne JAMAIS** appliquer `background-color !important` à `body`,
   `main`, `#MainContent`, `.shopify-section` (sans qualificatif),
   `.page-width`, `.container`, `.section`, `.section-padding` — ces
   classes sont partagées par toutes les pages (home, PDP, panier, etc.)
   et la règle globale casse les hero images et autres sections à
   background custom.
5. Tester systématiquement sur **home + PDP + panier + collection**
   avant de pousser, pas seulement sur collection.

**Note schemas** : les corrections de min sur `nav_to_content_gap_desktop/_mobile`
(min `8`→`0` et min `4`→`0`) dans `sections/main-collection-banner.liquid`
ont aussi été revertées par `c451bbd`. Si on veut remettre ces valeurs à 0
dans `templates/collection.json` (ou laisser le customizer Shopify les
mettre à 0), il faudra **re-baisser les mins du schema** sans réintroduire
la règle CSS agressive.
