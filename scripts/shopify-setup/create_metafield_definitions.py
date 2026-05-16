#!/usr/bin/env python3
"""
Création idempotente des 5 metafield definitions Maison Coeur dans
le namespace `maison_coeur` (ownerType: PRODUCT).

Définitions créées :
  - epoque         (single_line_text_field, choices, storefront public)
  - origine        (single_line_text_field, choices, storefront public)
  - matiere        (list.single_line_text_field, choices, storefront public)
  - couleur        (list.single_line_text_field, choices, storefront public)
  - wishlist_count (number_integer, storefront public, default 0)

Idempotence : si une définition existe déjà (erreur "TAKEN"), elle est
ignorée et loguée comme SKIPPED. Les autres définitions continuent.

Usage :
  python3 scripts/shopify-setup/create_metafield_definitions.py

Prérequis :
  scripts/shopify-setup/.env contient SHOPIFY_STORE et SHOPIFY_ACCESS_TOKEN
  (token Admin API avec scope write_metaobject_definitions).
"""

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ENV_PATH = Path(__file__).parent / ".env"
API_VERSION = "2026-01"


# --------------------------------------------------------------------- #
# .env loader (parsing minimal, pas de dépendance python-dotenv)        #
# --------------------------------------------------------------------- #
def load_env(path: Path) -> dict:
    env = {}
    if not path.exists():
        sys.exit(f"❌ Fichier {path} introuvable.")
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        env[key.strip()] = value.strip().strip('"').strip("'")
    return env


env = load_env(ENV_PATH)
STORE = env.get("SHOPIFY_STORE")
TOKEN = env.get("SHOPIFY_ACCESS_TOKEN")
if not STORE or not TOKEN:
    sys.exit("❌ SHOPIFY_STORE ou SHOPIFY_ACCESS_TOKEN manquant dans .env.")

ENDPOINT = f"https://{STORE}/admin/api/{API_VERSION}/graphql.json"


# --------------------------------------------------------------------- #
# GraphQL helper                                                        #
# --------------------------------------------------------------------- #
def graphql(query: str, variables: dict | None = None) -> dict:
    payload = json.dumps({"query": query, "variables": variables or {}}).encode("utf-8")
    req = urllib.request.Request(
        ENDPOINT,
        data=payload,
        headers={
            "X-Shopify-Access-Token": TOKEN,
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        sys.exit(f"❌ HTTP {e.code} {e.reason}\n{body}")
    except urllib.error.URLError as e:
        sys.exit(f"❌ Erreur réseau : {e}")


# --------------------------------------------------------------------- #
# Definitions à créer                                                   #
# --------------------------------------------------------------------- #
EPOQUE_CHOICES = [
    "XVIIIe siècle", "XIXe siècle", "Art Nouveau", "Art Déco",
    "Mid-Century", "XXe siècle", "Contemporain",
]
ORIGINE_CHOICES = [
    "France", "Italie", "Scandinavie", "Allemagne", "Royaume-Uni",
    "Espagne", "Autriche", "États-Unis", "Japon", "Autre",
]
MATIERE_CHOICES = [
    "Bois", "Bois doré", "Bois sculpté", "Marbre", "Pierre", "Albâtre",
    "Plâtre", "Laiton", "Bronze", "Verre", "Cristal", "Céramique",
    "Porcelaine", "Faïence", "Cuir", "Tissu", "Velours", "Soie",
    "Métal patiné",
]
COULEUR_CHOICES = [
    "Noir", "Blanc", "Crème", "Beige", "Brun", "Doré", "Argenté",
    "Bronze", "Rouge", "Bordeaux", "Bleu", "Bleu nuit", "Vert", "Gris",
    "Anthracite", "Rose", "Multicolore",
]


def choices_validation(values: list[str]) -> list[dict]:
    return [{"name": "choices", "value": json.dumps(values, ensure_ascii=False)}]


DEFINITIONS = [
    {
        "name": "Époque",
        "namespace": "maison_coeur",
        "key": "epoque",
        "description": "Époque historique de la pièce",
        "type": "single_line_text_field",
        "ownerType": "PRODUCT",
        "pin": True,
        "access": {"storefront": "PUBLIC_READ"},
        "validations": choices_validation(EPOQUE_CHOICES),
    },
    {
        "name": "Origine",
        "namespace": "maison_coeur",
        "key": "origine",
        "description": "Pays ou région d'origine",
        "type": "single_line_text_field",
        "ownerType": "PRODUCT",
        "pin": True,
        "access": {"storefront": "PUBLIC_READ"},
        "validations": choices_validation(ORIGINE_CHOICES),
    },
    {
        "name": "Matière",
        "namespace": "maison_coeur",
        "key": "matiere",
        "description": "Matières principales (sélection multiple possible)",
        "type": "list.single_line_text_field",
        "ownerType": "PRODUCT",
        "pin": True,
        "access": {"storefront": "PUBLIC_READ"},
        "validations": choices_validation(MATIERE_CHOICES),
    },
    {
        "name": "Couleur",
        "namespace": "maison_coeur",
        "key": "couleur",
        "description": "Couleurs dominantes (sélection multiple possible)",
        "type": "list.single_line_text_field",
        "ownerType": "PRODUCT",
        "pin": True,
        "access": {"storefront": "PUBLIC_READ"},
        "validations": choices_validation(COULEUR_CHOICES),
    },
    {
        "name": "Wishlist count",
        "namespace": "maison_coeur",
        "key": "wishlist_count",
        "description": "Nombre d'ajouts à la wishlist (technique, alimenté par mc-wishlist.js)",
        "type": "number_integer",
        "ownerType": "PRODUCT",
        "pin": False,
        "access": {"storefront": "PUBLIC_READ"},
        # number_integer ne supporte pas "choices" ; pas de validation custom.
    },
]


# --------------------------------------------------------------------- #
# Mutation                                                              #
# --------------------------------------------------------------------- #
MUTATION = """
mutation CreateDef($definition: MetafieldDefinitionInput!) {
  metafieldDefinitionCreate(definition: $definition) {
    createdDefinition {
      id
      namespace
      key
      name
      type { name }
      ownerType
      validations { name value }
    }
    userErrors {
      field
      message
      code
    }
  }
}
"""


def short_label(d: dict) -> str:
    return f"{d['namespace']}.{d['key']} ({d['type']})"


def create_one(definition: dict) -> tuple[str, str | None, list[dict]]:
    """
    Retourne (status, id_or_None, userErrors_or_GraphQLErrors).
    status ∈ {"CREATED", "SKIPPED_TAKEN", "ERROR"}.
    """
    result = graphql(MUTATION, {"definition": definition})

    if "errors" in result:
        return ("ERROR", None, result["errors"])

    payload = result.get("data", {}).get("metafieldDefinitionCreate", {})
    user_errors = payload.get("userErrors", []) or []
    created = payload.get("createdDefinition")

    if created:
        return ("CREATED", created["id"], [])

    # Cas idempotent : déjà existant.
    if any(err.get("code") == "TAKEN" for err in user_errors):
        return ("SKIPPED_TAKEN", None, user_errors)

    return ("ERROR", None, user_errors)


def main() -> int:
    print("━" * 72)
    print(f"  Création metafield definitions sur {STORE}")
    print(f"  API {API_VERSION} • namespace maison_coeur • ownerType PRODUCT")
    print("━" * 72)
    print()

    summary = {"CREATED": 0, "SKIPPED_TAKEN": 0, "ERROR": 0}
    exit_code = 0

    for d in DEFINITIONS:
        label = short_label(d)
        print(f"→ {label}")
        status, gid, errors = create_one(d)
        if status == "CREATED":
            print(f"  ✅ CREATED  id={gid}")
        elif status == "SKIPPED_TAKEN":
            print("  ⚠️  SKIPPED  (existe déjà — code TAKEN)")
        else:
            print("  ❌ ERROR")
            for err in errors:
                msg = err.get("message", str(err))
                code = err.get("code", "")
                field = err.get("field", "")
                print(f"     • [{code}] {field}: {msg}")
            exit_code = 1
        summary[status] += 1
        print()

    print("━" * 72)
    print(
        f"  Résumé : {summary['CREATED']} créées, "
        f"{summary['SKIPPED_TAKEN']} skipped, {summary['ERROR']} erreurs"
    )
    print("━" * 72)
    return exit_code


if __name__ == "__main__":
    sys.exit(main())
