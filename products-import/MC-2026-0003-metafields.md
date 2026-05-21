# Metafields — MC-2026-0003

Produit : **Vase amphore à quatre anses — Willy Biron, Bouffioulx, Belgique, circa 1960**
Handle : `vase-amphore-quatre-anses-willy-biron-bouffioulx`

À saisir manuellement dans **Shopify Admin → Produits → MC-2026-0003 → Metafields** après l'import du CSV.

Namespace : `custom`

| Key | Type | Valeur |
|---|---|---|
| `reference_inventaire` | single_line_text | MC-2026-0003 |
| `hauteur_cm` | number_decimal | 24 |
| `largeur_cm` | number_decimal | 13 |
| `profondeur_cm` | number_decimal | 13 |
| `materiaux` | single_line_text_list | `["Grès"]` |
| `hauteur_assise_cm` | number_decimal | *(laisser vide — non applicable)* |
| `authenticite_provenance` | multi_line_text | Vase amphore en grès signé « Biron W » au culot et numéroté « 1 » dans un cercle. Pièce de Willy Biron (1917-1980), atelier familial fondé en 1935 à Bouffioulx, capitale belge du grès d'art depuis le XVIIe siècle. La forme amphore à quatre anses, plus sculpturale que la production utilitaire courante de l'atelier (cruches, pichets), correspond à un modèle de répertoire spécifique. Pièce sélectionnée et authentifiée par Maison Coeur, accompagnée d'une attestation à l'acquisition. |
| `etat_condition` | multi_line_text | Bel état d'origine. Émaillage rosé-brun et noir mat homogène, sans éclat ni fêlure. Légères irrégularités de cuisson sur les bandes noires, caractéristiques du grès haute température artisanal. Talon en terre cuite brute préservé, signature et numéro de modèle parfaitement lisibles. L'ensemble est solide et stable. |

## Rendu PDP attendu

- **Cartel dimensions** : `H 24 CM · L 13 CM · P 13 CM` (pas de segment ASSISE car `hauteur_assise_cm` vide).
- **Cartel matériaux** : `GRÈS`.
- **Onglet AUTHENTICITÉ & PROVENANCE** : texte spécifique remplace le Customizer global.
- **Onglet ÉTAT & CONDITION** : texte spécifique remplace le Customizer global.
- **Bloc Réf.** : `Réf. MC-2026-0003`.
