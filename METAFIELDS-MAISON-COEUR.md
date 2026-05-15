# Metafields Maison Coeur — Setup Shopify Admin

Définitions à créer manuellement dans **Shopify Admin → Paramètres → Métachamps personnalisés** pour activer les fonctionnalités Phase 16.6 (collection) et au-delà.

Toutes les définitions utilisent le namespace `maison_coeur`.

---

## Collection metafields

| Key | Type | Usage | Statut Phase 16.6 |
|---|---|---|---|
| `intro_editorial` | `multi_line_text_field` | Intro éditoriale 1-2 phrases affichée sous le titre de la page collection. Surcharge `intro_default_text` du Customizer si renseignée. | **CÂBLÉ** — actif dès que le metafield est créé et rempli côté admin. |

### Comment créer

1. Admin Shopify → **Paramètres → Métachamps personnalisés → Collections**.
2. Cliquer **Ajouter une définition**.
3. Nom : `Intro éditoriale`. Namespace and key : `maison_coeur.intro_editorial`. Type : `Texte sur plusieurs lignes`. Caractères max : 280 (suggéré).
4. **Enregistrer**.
5. Aller sur chaque collection (Catalogue → Collections → [Miroirs, etc.]) et remplir le champ "Intro éditoriale" dans la section Métachamps en bas de page.

---

## Product metafields (Phase 16.7 — filtres custom)

| Key | Type | Usage | Statut Phase 16.6 |
|---|---|---|---|
| `periode` | `single_line_text_field` | Filtre "Période" (XVIIIe, XIXe, XXe, contemporain) | **PRÉPARÉ** — UI ajoutée en 16.7 |
| `origine` | `single_line_text_field` | Filtre "Origine" (France, Italie, Scandinavie, Allemagne, Espagne, Royaume-Uni, autres) | **PRÉPARÉ** — UI ajoutée en 16.7 |
| `matiere` | `multi_line_text_field` | Filtre "Matière" — plusieurs valeurs séparées (bois, bois doré, marbre, laiton, verre, céramique, tissu, métal) | **PRÉPARÉ** — UI ajoutée en 16.7 |
| `couleur` | `multi_line_text_field` | Filtre "Couleur" — plusieurs valeurs séparées (noir, blanc, beige, doré, argenté, brun, vert, bleu, rouge) | **PRÉPARÉ** — UI ajoutée en 16.7 |
| `wishlist_count` | `number_integer` | Compteur d'ajouts à MA SÉLECTION — utilisé pour le tri "Demandés". Incrémenté à chaque clic sur le cœur d'une vignette. | **PRÉPARÉ** — incrémentation et tri ajoutés en 16.7 |

### Phase 16.6 (actuelle) — ce qui fonctionne sans metafields

- En-tête éditorial : breadcrumb + eyebrow + titre + intro Customizer (ou Shopify description en fallback)
- Grille 4 colonnes desktop / 2 mobile, format 4:5 portrait
- Cœur wishlist au survol (localStorage Option A, déjà en place)
- Zoom hover image (102 % par défaut)
- Sidebar filtres Shopify natifs (sidebar verticale Dawn activée — affichera les filtres déjà configurés dans **Shopify Admin → Online Store → Search & Discovery → Filtres**)
- Tri Shopify natif (Nouveautés, Prix croissant/décroissant, Meilleures ventes — Shopify natif)

### Phase 16.7 (à venir) — ce qui s'activera quand les metafields seront créés

- Sidebar custom Période / Origine / Matière / Couleur (lecture metafields produit)
- Curseur de prix double poignée (dual-range slider)
- Tri "Demandés" (basé sur `wishlist_count`)
- Bouton "Charger plus" AJAX en remplacement de la pagination numérotée

---

## Labels filtres "Availability" / "Price"

Les libellés des filtres Shopify natifs (`Availability`, `Price`, `Vendor`, etc.) sont configurables dans :

**Shopify Admin → Boutique en ligne → Navigation → Search & Discovery → Filtres**

Renommer chaque filtre en français directement dans l'admin :
- `Availability` → `Disponibilité`
- `Price` → `Prix`
- `Vendor` → `Fournisseur` (à masquer si non utilisé)

Le thème consomme ces labels tels que définis en admin — pas de modif Liquid nécessaire.

---

## Tri par défaut

Pour que le tri par défaut soit "Nouveautés" sur toutes les collections :

**Shopify Admin → Catalogue → Collections → [chaque collection]** → **Tri par défaut** → choisir `Date d'ajout, le plus récent en premier`.

Le thème respecte le tri par défaut configuré sur chaque collection (`collection.default_sort_by`).

---

## Récapitulatif des actions admin requises

- [ ] Créer la définition metafield `collection.maison_coeur.intro_editorial` (Phase 16.6)
- [ ] Renommer les filtres Shopify Search & Discovery en français
- [ ] Définir tri par défaut "Date d'ajout, plus récent en premier" sur chaque collection
- [ ] (Phase 16.7) Créer les 5 metafields produit (`periode`, `origine`, `matiere`, `couleur`, `wishlist_count`)
- [ ] (Phase 16.7) Remplir les metafields produit sur chaque pièce
