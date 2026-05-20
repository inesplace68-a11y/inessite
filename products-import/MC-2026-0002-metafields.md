# Metafields — MC-2026-0002

Produit : **Paire de bougeoirs en étain à fût torsadé sur piédouche perlé — seconde moitié du XXe siècle**
Handle : `paire-bougeoirs-etain-fut-torsade-xxe`

À saisir manuellement dans **Shopify Admin → Produits → MC-2026-0002 → Metafields** après l'import du CSV.

Namespace : `custom`

| Key | Type | Valeur |
|---|---|---|
| `reference_inventaire` | single_line_text | MC-2026-0002 |
| `hauteur_cm` | number_decimal | 21.5 |
| `largeur_cm` | number_decimal | 7.5 |
| `profondeur_cm` | number_decimal | 7.5 |
| `materiaux` | single_line_text_list | `["Étain"]` |
| `hauteur_assise_cm` | number_decimal | *(laisser vide — non applicable)* |
| `authenticite_provenance` | multi_line_text | Paire de bougeoirs en étain, seconde moitié du XXe siècle. Travail à la main d'un atelier non identifié, témoignant d'une exécution soignée par la torsion légèrement différente sur chaque pièce. Pièce sélectionnée par Maison Coeur, accompagnée d'une attestation à l'acquisition. |
| `etat_condition` | multi_line_text | Bel état général. Patine sombre homogène sur l'ensemble des deux pièces, typique de l'étain ancien. Aucun choc ni déformation structurelle. Légères variations de torsion entre les deux fûts — caractéristique du travail à la main. |

## Rendu PDP attendu

- **Cartel dimensions** : `H 21,5 CM · L 7,5 CM · P 7,5 CM` (pas de segment ASSISE car `hauteur_assise_cm` vide).
- **Cartel matériaux** : `ÉTAIN`.
- **Onglet AUTHENTICITÉ & PROVENANCE** : texte spécifique remplace le Customizer global.
- **Onglet ÉTAT & CONDITION** : texte spécifique remplace le Customizer global.
- **Bloc Réf.** : `Réf. MC-2026-0002`.
