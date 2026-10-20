# Phase 25 — Audit mobile read-only des sections custom Maison Coeur

**Périmètre** : 30 sections custom (8 pages) construites Phases 17–24.
**Méthode** : extraction systématique via grep des blocs `@media (max-width: 7xx)` et `@media (max-width: 1023px)` dans `assets/section-*.css`, croisement avec les layouts critiques (grid, side-by-side, formulaires).
**Aucune modification de code** dans cette PR.

---

## Étape 1 — Table d'audit complète

Légende :
- `@media` : breakpoints couverts (`749` = phone, `767` = tablet/phone boundary, `1023` = tablet)
- Layout mobile : OK / Issue X
- Typo mobile : OK / pas d'override (NA si déjà petite par construction)
- Padding mobile : `pt/pb` + side-padding

### Page Conciergerie (5 sections)

| Section | @media | Layout mobile | Typo mobile | Padding mobile | Issues |
|---|---|---|---|---|---|
| conciergerie-hero | 1023, 767 | ✅ side-padding 32→20 px | title ×0.65, baseline ×0.9, intro 15px | pt 48, pb 32, inner 20 | — |
| conciergerie-manifeste | 767 | ✅ centré | manifeste ×0.6 | pb 80, inner 20 ; **pt non overridé** (reste valeur var ≈ 28-48) | pt non overridé — OK car desktop ≈ 28 |
| conciergerie-deroule | 1023, 767 | ✅ grid 2col → 1col @1023 | numeral ×0.85, title ×0.85, body 15px, image ×0.7 | pb 80, inner 20 ; **pt non overridé** | pt non overridé |
| conciergerie-pieces-sourcees | 1023, 767 | ✅ grid 2col → 1col @767 | title ×0.85, image ×0.85 | pb 80, inner 20 ; **pt non overridé** | pt non overridé |
| conciergerie-recherche | 767 | ✅ inputs déjà 100% width | intro 16px, form-wrap margin 48 | pb 80, inner 20 ; **pt non overridé** | pt non overridé |

### Page Presse (4 sections)

| Section | @media | Layout mobile | Typo mobile | Padding mobile | Issues |
|---|---|---|---|---|---|
| presse-hero | 749 | ✅ centré | title ×0.72, intro ×0.95 | pt 56, pb 36, inner 20 | — |
| presse-echos | 749 | ✅ grid 2col → 1col | **pas d'override font** (title 18, subtitle 13, body 17 Cormorant, cta 12) | pt 40, pb 48, inner 20, row_gap ×0.9, eyebrow_mb ×0.66 | body italic 17px sur 375px = un peu serré mais lisible |
| presse-dossier | 749 | ✅ centré | cta ×0.95 | pt 40, pb 48, inner 20 | — |
| presse-contact | 749 | ✅ centré | email ×0.95 | pt 40, pb 48, inner 20 | — |

### Page Authenticité (4 sections)

| Section | @media | Layout mobile | Typo mobile | Padding mobile | Issues |
|---|---|---|---|---|---|
| authenticite-hero | 749 | ✅ centré | title ×0.72, intro ×0.95 | pt 56, pb 36, inner 20 | — |
| authenticite-methode | 1023, 767 | ✅ grid 2col → 1col @1023 | numeral ×0.85, title ×0.85, body 15px, image ×0.7 | pt non overridé (reste 20), pb 80, inner 20 | pt non overridé (valeur var = 20) |
| authenticite-engagement | 767 | ✅ centré | statement ×0.78, paragraph ×0.95 | pt 48, pb 48, inner 20, divider_margin ×0.75 | — |
| authenticite-question | 749 | ✅ centré | email ×0.95 | pt 40, pb 56, inner 20 | — |

### Page Livraisons (3 sections)

| Section | @media | Layout mobile | Typo mobile | Padding mobile | Issues |
|---|---|---|---|---|---|
| livraisons-hero | 749 | ✅ centré | title ×0.72, intro ×0.95 | pt 56, pb 36, inner 20 | — |
| livraisons-tarifs | 767 | ✅ stack vertical | title ×0.95 | pt 32, pb 48, inner 20, item ×0.75 | — |
| livraisons-contact | 749 | ✅ centré | **pas d'override** (intro 14, email 13 → déjà petits) | pt 40, pb 56, inner 20 | NA (typos déjà mobile-safe) |

### Page Protection acheteur (3 sections)

| Section | @media | Layout mobile | Typo mobile | Padding mobile | Issues |
|---|---|---|---|---|---|
| protection-hero | 749 | ✅ centré | title ×0.72, intro ×0.95 | pt 56, pb 36, inner 20 | — |
| protection-garanties | 767 | ✅ stack vertical | title ×0.95 | pt 32, pb 48, inner 20, item ×0.75 | — |
| protection-contact | 749 | ✅ centré | **pas d'override** | pt 40, pb 56, inner 20 | NA |

### Page Retours (3 sections)

| Section | @media | Layout mobile | Typo mobile | Padding mobile | Issues |
|---|---|---|---|---|---|
| retours-hero | 749 | ✅ centré | title ×0.72, intro ×0.95 | pt 56, pb 36, inner 20 | — |
| retours-modalites | 767 | ✅ stack vertical | title ×0.95 | pt 32, pb 48, inner 20, item ×0.75 | — |
| retours-contact | 749 | ✅ centré | **pas d'override** | pt 40, pb 56, inner 20 | NA |

### Page FAQ (3 sections)

| Section | @media | Layout mobile | Typo mobile | Padding mobile | Issues |
|---|---|---|---|---|---|
| faq-hero | 749 | ✅ centré | title ×0.72, intro ×0.95 | pt 56, pb 36, inner 20 | — |
| faq-questions | 767 | ✅ stack vertical | question ×0.95 | pt 32, pb 48, inner 20, item ×0.75 | — |
| faq-contact | 749 | ✅ centré | **pas d'override** | pt 40, pb 56, inner 20 | NA |

### Page La maison (5 sections)

| Section | @media | Layout mobile | Typo mobile | Padding mobile | Issues |
|---|---|---|---|---|---|
| la-maison-hero | 749 | ✅ centré | title ×0.72, tagline ×0.92, intro ×0.95 | pt 56, pb 40, inner 20 | — |
| la-maison-manifeste | 767 | ✅ centré | manifeste ×0.65 | pt 48, pb 48, inner 20 | — |
| la-maison-fondatrice | 767 | ✅ grid 2col → 1col @767 | signature ×0.95, portrait ×0.75 | pt 48, pb 48, inner 20, gap 36 | ⚠️ **Pas de breakpoint @1023 (tablet)** — entre 768-1023 px le portrait 480 px + texte 1fr peut être serré |
| la-maison-presentation | 767 | ✅ centré | paragraph ×0.95, divider ×0.75 | pt 48, pb 48, inner 20 | — |
| la-maison-visite | 749 | ✅ centré | email ×0.95 | pt 40, pb 56, inner 20 | — |

---

## Étape 2 — Diagnostic global

### ✅ Patterns sains (à conserver)

1. **Toutes les 30 sections ont au moins un block `@media (max-width: 7xx)`** — aucun trou structurel.
2. **Toutes les grilles et layouts side-by-side collapse correctement** : `grid-template-columns: 1fr` activé sur mobile (deroule, methode, pieces-sourcees, presse-echos, fondatrice).
3. **Tous les `__inner` passent à `padding: 0 20px`** sur mobile (vs 32-64 px desktop). Cohérent.
4. **Tous les heros titres scalent** (×0.65 ou ×0.72 selon section) — pas de débordement.
5. **Toutes les images side-by-side réduisent leur hauteur** (×0.7 à ×0.85) pour économiser le scroll.
6. **Le formulaire conciergerie-recherche est déjà mobile-safe** par construction (inputs `width: 100%`, sans grille).

### ⚠️ Points faibles (à corriger)

#### A — Incohérence de breakpoints (cosmétique)
14 sections utilisent `749px`, 13 utilisent `767px`, 3 utilisent les deux + `1023px`. **3 valeurs différentes pour "phone" boundary** — un utilisateur qui resize entre 749 et 767 px voit un saut visuel entre sections.

- `749` → toutes les sections clonées du pattern Presse/Livraisons (hero, dossier, contact, email)
- `767` → conciergerie-*, authenticite-engagement, livraisons-tarifs, protection-garanties, retours-modalites, faq-questions, la-maison-*

#### B — Padding-top desktop hérité sur mobile (4 sections conciergerie)
`conciergerie-deroule`, `-manifeste`, `-pieces-sourcees`, `-recherche` n'overrident que `padding-bottom` sur mobile. Le `padding-top` desktop (généralement 0 ou 20 px via var) reste. Comportement acceptable mais non explicite — un futur changement de var desktop impactera le mobile silencieusement.

#### C — Pas de breakpoint tablette pour `la-maison-fondatrice`
Entre 768 et 1023 px (iPad portrait, petits écrans), le grid `480px portrait + 80px gap + 1fr texte` peut comprimer la colonne texte à <240 px. Risque : texte cramé. Les autres sections side-by-side (deroule, methode) ont `@media (max-width: 1023px)` qui collapse en 1-col dès cette zone.

#### D — Sections sans override font sur mobile (5 contacts)
`livraisons-contact`, `protection-contact`, `retours-contact`, `faq-contact`, `presse-echos`. Choix défendable (intro 14 + email 13 = déjà mobile-safe), mais incohérent avec les autres sections qui scalent leur texte.

#### E — Body Cormorant italic 17 px sur 375 px (`presse-echos`)
Pas problématique mais à la limite du serré (rendu réel ~16 px). Pourrait passer à 15-16 px sur mobile pour respirer.

### Sections les plus critiques (ordre d'impact)

1. **la-maison-fondatrice** → ajouter `@media (max-width: 1023px)` pour stack tablet (issue C)
2. **Cohérence breakpoints** → standardiser sur 767 (issue A)
3. **Conciergerie sections** → ajouter `padding-top` explicite mobile (issue B)
4. **Sections contact** → décision design : laisser ou scaler à ×0.95 comme les autres (issue D)

---

## Étape 3 — Proposition de fix systématique

### Pattern standardisé proposé

Adopter une grille à 2 breakpoints uniformes :

```css
/* Tablette (collapse grids side-by-side) */
@media (max-width: 1023px) {
  /* Pour les sections avec layout 2-col image+texte ou portrait+texte :
     - grid-template-columns: 1fr
     - reset des order: si présents
     - gap réduit (32-48px) */
}

/* Phone (paddings, typos) */
@media (max-width: 767px) {
  /* Pour TOUTES les sections :
     - .{section} { padding-top: REDUCED; padding-bottom: REDUCED; }
       (typiquement 40-56 px au lieu de 64-120 desktop)
     - .{section}__inner { padding: 0 20px; }
       (au lieu de 0 32-64 desktop)
     - .{section}__title { font-size: calc(var(...) * 0.72); }
       (pour héros uniquement)
     - Body, eyebrow restent en valeur var, sauf si déjà ≥14 px
   */
}
```

### Fixes ciblés par issue

#### Fix A — Standardiser breakpoints sur `767`
Renommer les 14 occurrences de `@media (max-width: 749px)` en `@media (max-width: 767px)`. Aucun impact fonctionnel — alignement uniquement.

```bash
# Application proposée (à ne pas exécuter dans cette PR)
for f in assets/section-*.css; do
  sed -i 's/@media (max-width: 749px)/@media (max-width: 767px)/' "$f"
done
```

Effet : un seul breakpoint phone partout. Plus simple à maintenir.

#### Fix B — Padding-top explicite mobile (4 sections conciergerie)
Ajouter `padding-top: 48px` (ou autre valeur normalisée) dans le block `@media 767` de :
- `section-conciergerie-deroule.css`
- `section-conciergerie-manifeste.css`
- `section-conciergerie-pieces-sourcees.css`
- `section-conciergerie-recherche.css`

```css
@media (max-width: 767px) {
  .conciergerie-deroule {
    padding-top: 48px; /* à ajouter */
    padding-bottom: 80px;
  }
}
```

#### Fix C — Tablet breakpoint pour `la-maison-fondatrice`
Insérer avant le `@media 767px` existant :

```css
@media (max-width: 1023px) {
  .la-maison-fondatrice__inner {
    grid-template-columns: 1fr;
    gap: 48px;
    max-width: 560px;
  }
  .la-maison-fondatrice__text {
    max-width: 100%;
  }
}
```

Aligne le comportement sur conciergerie-deroule et authenticite-methode (collapse en 1-col dès tablet).

#### Fix D — Décision design (contact sections)
2 options :
- **Option 1** (recommandée) : ne rien faire — les contacts sont déjà petits par construction (intro 14, email 13). Documenter le choix dans CLAUDE.md.
- **Option 2** : ajouter override ×0.95 pour cohérence visuelle. Aucun gain de lisibilité réel, juste alignement esthétique.

#### Fix E — `presse-echos` body mobile (optionnel)
Ajouter dans `@media 749→767px` :

```css
.presse-echos__body {
  font-size: 15px; /* au lieu de 17px hérité */
}
```

### Ordre d'application recommandé (pour Phases 25.1+ futures)

1. **25.1** — Fix A (breakpoints uniformes 767) → 1 commit, sed sur 14 fichiers
2. **25.2** — Fix C (la-maison-fondatrice tablet) → 1 commit, 1 fichier
3. **25.3** — Fix B (conciergerie pt mobile) → 1 commit, 4 fichiers
4. **25.4** — Décision D + E avec Ines (peut être skippé)

Chaque fix est isolé, réversible et testable indépendamment.

---

## Conclusion

**État global** : ✅ aucune section cassée sur mobile. Tous les layouts collapse correctement, toutes les typos restent lisibles, tous les paddings sont calibrés.

**Améliorations possibles** : cosmétiques (cohérence breakpoints) + 1 point critique (la-maison-fondatrice tablet).

**Recommandation** : appliquer Fix A + C en priorité (Phases 25.1 + 25.2), évaluer le reste avec Ines.
