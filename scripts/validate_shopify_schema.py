#!/usr/bin/env python3
"""Validate Shopify schema settings in .liquid section files.

Rules checked (any failure causes Shopify GitHub Sync to reject the commit):
  1. range.unit            : <= 3 characters
  2. range.step            : <= 1 decimal place
  3. range increments      : (max - min) / step <= 100
  4. range divisibility    : (max - min) / step must be an integer
  5. range default on step : (default - min) / step must be an integer
  6. section/block name    : <= 25 characters
  7. template block refs   : every block "type" in templates/*.json must
                             exist in the matching section's schema "blocks"
  8. global block registry : same as 7 but against the union of all
                             declared block types across sections — guards
                             against the Phase 14/15.10 failure mode where a
                             template references a type that exists nowhere.
  9. range.unit not empty  : if `unit` is declared, it must be non-empty.
                             Shopify rejects `"unit": ""` with "unit can't
                             be blank" (Phase 15.11.1 failure mode). Omitting
                             the `unit` key entirely is allowed.
 10. text default not blank: text/textarea/richtext/html/inline_richtext/
                             liquid/url/video_url + picker (page, blog,
                             article, collection, collection_list, product,
                             product_list, link_list) settings cannot have
                             `"default": ""`. Shopify rejects with 'default
                             can't be blank' (Phase 16.3 failure mode).
                             Omitting the `default` key entirely is allowed.

Usage:
    python3 scripts/validate_shopify_schema.py sections/foo.liquid [...]
    python3 scripts/validate_shopify_schema.py --all          # walk sections + templates
    python3 scripts/validate_shopify_schema.py --all -v       # verbose cross-check + rule 10 hits
    python3 scripts/validate_shopify_schema.py --self-test    # run rule 10 self-test (4 cases)

Exit codes: 0 = all good, 1 = violations found, 2 = bad invocation.
"""

import json
import re
import sys
from pathlib import Path

SCHEMA_RE = re.compile(r'{%\s*schema\s*%}(.*?){%\s*endschema\s*%}', re.DOTALL)
# Strip C-style block comments (used as banners in templates/*.json by Shopify Sync)
JSON_BLOCK_COMMENT_RE = re.compile(r'/\*.*?\*/', re.DOTALL)
EPS = 1e-9

# Setting types where Shopify rejects `"default": ""` (rule 10).
# Free-text and resource-picker types share the same "default can't be blank"
# error. Number/checkbox/select/range/color/font_picker/etc. don't.
TEXT_DEFAULT_TYPES = frozenset({
    'text', 'textarea', 'richtext', 'html', 'inline_richtext', 'liquid',
    'url', 'video_url',
    'page', 'blog', 'article',
    'collection', 'collection_list',
    'product', 'product_list',
    'link_list',
})


def loads_loose_json(text: str):
    """Parse JSON that may have C-style /* ... */ banner comments."""
    cleaned = JSON_BLOCK_COMMENT_RE.sub('', text)
    return json.loads(cleaned)


def extract_schemas(path: Path):
    content = path.read_text(encoding='utf-8')
    return [m.group(1) for m in SCHEMA_RE.finditer(content)]


def check_range(setting: dict, where: str) -> list[str]:
    errs = []
    sid = setting.get('id', '<no-id>')
    tag = f"{where} » id={sid}"

    if 'unit' in setting:
        unit = setting.get('unit')
        if unit is None or unit == '':
            errs.append(
                f"{tag}: unit is declared but empty — Shopify rejects "
                f"\"unit\": \"\" with 'unit can't be blank'. "
                f"Either omit the key or set a non-empty value (e.g. '%', 'px')."
            )
        elif len(unit) > 3:
            errs.append(f"{tag}: unit '{unit}' is {len(unit)} chars (max 3)")

    min_v = setting.get('min')
    max_v = setting.get('max')
    step = setting.get('step')
    default = setting.get('default')

    if min_v is None or max_v is None or step is None:
        errs.append(f"{tag}: range missing min/max/step")
        return errs

    step_str = repr(step) if isinstance(step, float) else str(step)
    if '.' in step_str and len(step_str.split('.')[1]) > 1:
        errs.append(f"{tag}: step {step} has more than 1 decimal")

    if step == 0:
        errs.append(f"{tag}: step is zero")
        return errs

    span = max_v - min_v
    increments = span / step
    if increments > 100 + EPS:
        errs.append(
            f"{tag}: {increments:g} increments (max 100) — "
            f"increase step from {step}"
        )
    if abs(round(increments) - increments) > EPS:
        errs.append(
            f"{tag}: (max - min) / step = {span}/{step} = {increments:g} "
            f"is not an integer (step must evenly divide the range)"
        )

    if default is not None:
        offset = default - min_v
        from_min = offset / step
        if abs(round(from_min) - from_min) > EPS:
            errs.append(
                f"{tag}: default {default} is not on a step "
                f"(({default} - {min_v}) / {step} = {from_min:g})"
            )

    return errs


def check_text_default(setting: dict, where: str) -> list[str]:
    """Rule 10: text-like settings cannot have `"default": ""`.

    Shopify rejects with 'setting with id=X default can't be blank' on push.
    Omitting the `default` key entirely is fine; the field stays empty by
    default but no validation error fires.
    """
    stype = setting.get('type')
    if stype not in TEXT_DEFAULT_TYPES:
        return []
    if 'default' not in setting:
        return []
    default = setting['default']
    if isinstance(default, str) and default == '':
        sid = setting.get('id', '<no-id>')
        return [
            f"{where} » id={sid}: type '{stype}' has \"default\": \"\" — "
            f"Shopify rejects with 'default can't be blank'. Either set a "
            f"non-empty value or omit the \"default\" key entirely."
        ]
    return []


def check_name(name, where: str) -> list[str]:
    if name is None:
        return []
    # Skip locale references (t:...) — Shopify resolves these at runtime
    if isinstance(name, str) and name.startswith('t:'):
        return []
    if len(name) > 25:
        return [f"{where}: name '{name}' is {len(name)} chars (max 25)"]
    return []


def walk(schema: dict, file_label: str):
    yield ('name', schema.get('name'), file_label)
    for s in schema.get('settings', []):
        if s.get('type') == 'range':
            yield ('range', s, f"{file_label} » settings")
        if s.get('type') in TEXT_DEFAULT_TYPES:
            yield ('text_default', s, f"{file_label} » settings")
    for block in schema.get('blocks', []):
        bname = block.get('name')
        btype = block.get('type', '<block>')
        yield ('name', bname, f"{file_label} » block '{btype}'")
        for s in block.get('settings', []):
            if s.get('type') == 'range':
                yield ('range', s, f"{file_label} » block '{btype}'")
            if s.get('type') in TEXT_DEFAULT_TYPES:
                yield ('text_default', s, f"{file_label} » block '{btype}'")


def validate_file(path: Path, verbose: bool = False) -> list[str]:
    errs = []
    schemas = extract_schemas(path)
    if not schemas:
        return errs
    for i, raw in enumerate(schemas):
        try:
            schema = json.loads(raw)
        except json.JSONDecodeError as e:
            errs.append(f"{path.name}: JSON parse error in schema #{i + 1}: {e}")
            continue
        label = path.name + (f" (schema #{i + 1})" if len(schemas) > 1 else "")
        for kind, payload, where in walk(schema, label):
            if kind == 'name':
                errs.extend(check_name(payload, where))
            elif kind == 'range':
                errs.extend(check_range(payload, where))
            elif kind == 'text_default':
                hits = check_text_default(payload, where)
                if verbose and 'default' in payload:
                    sid = payload.get('id', '<no-id>')
                    stype = payload.get('type')
                    mark = '✗' if hits else '✓'
                    print(f"  rule 10 » {where} » id={sid} (type={stype}) [{mark}]")
                errs.extend(hits)
    return errs


def section_block_types(path: Path) -> set:
    """Return the set of block 'type' values declared in a section schema."""
    types = set()
    for raw in extract_schemas(path):
        try:
            schema = json.loads(raw)
        except json.JSONDecodeError:
            continue
        for block in schema.get('blocks', []):
            t = block.get('type')
            if t:
                types.add(t)
    return types


def global_block_registry(sections_dir: Path) -> dict:
    """Map block_type -> set of section files declaring it.

    Used by the global cross-check (rule 8): even if the section a template
    references is missing, we want to know whether the block type exists
    *anywhere* in the theme. The output is also surfaced in verbose mode
    to make it obvious where each type lives.
    """
    registry: dict = {}
    if not sections_dir.is_dir():
        return registry
    for sec_file in sorted(sections_dir.glob('*.liquid')):
        for btype in section_block_types(sec_file):
            registry.setdefault(btype, set()).add(sec_file.name)
    return registry


def validate_templates(repo_root: Path, verbose: bool = False) -> list[str]:
    """Cross-check: every block.type in templates/*.json must exist in the
    referenced section's schema (rule 7) AND in the global block registry
    (rule 8). Catches the Phase 14 / 15.10 failure modes where a template
    references a type the live schema doesn't declare."""
    errs = []
    templates_dir = repo_root / 'templates'
    sections_dir = repo_root / 'sections'
    if not templates_dir.is_dir() or not sections_dir.is_dir():
        return errs

    registry = global_block_registry(sections_dir)

    for tpl in sorted(templates_dir.glob('*.json')):
        try:
            data = loads_loose_json(tpl.read_text(encoding='utf-8'))
        except json.JSONDecodeError as e:
            errs.append(f"{tpl.name}: JSON parse error: {e}")
            continue

        sections = data.get('sections', {})
        if not isinstance(sections, dict):
            continue

        for sec_id, sec in sections.items():
            if not isinstance(sec, dict):
                continue
            sec_type = sec.get('type')
            if not sec_type:
                continue
            section_file = sections_dir / f"{sec_type}.liquid"
            section_exists = section_file.exists()
            allowed = section_block_types(section_file) if section_exists else set()
            blocks = sec.get('blocks', {}) or {}

            if verbose and blocks:
                print(
                    f"  {tpl.name} » section '{sec_id}' "
                    f"(type={sec_type}, schema={'✓' if section_exists else '—'})"
                )

            for block_id, block in blocks.items():
                if not isinstance(block, dict):
                    continue
                btype = block.get('type')
                if btype is None:
                    continue
                if btype.startswith('@'):
                    if verbose:
                        print(f"    · {block_id} → @reserved ({btype})")
                    continue

                ok_section = (not section_exists) or (btype in allowed)
                ok_global = btype in registry

                if verbose:
                    where = ', '.join(sorted(registry.get(btype, []))) or '<unknown>'
                    mark = '✓' if (ok_section and ok_global) else '✗'
                    print(f"    · {block_id} → type '{btype}' [{mark}] declared in: {where}")

                if section_exists and btype not in allowed:
                    errs.append(
                        f"{tpl.name} » section '{sec_id}' (type={sec_type}) "
                        f"» block '{block_id}': type '{btype}' is not "
                        f"declared in {section_file.name} schema blocks"
                    )
                elif not ok_global:
                    errs.append(
                        f"{tpl.name} » section '{sec_id}' (type={sec_type}) "
                        f"» block '{block_id}': type '{btype}' is not "
                        f"declared in any section schema (global registry miss)"
                    )
    return errs


def run_self_test() -> int:
    """Rule 10 self-test (4 cases). Returns 0 if all pass, 1 otherwise."""
    cases = [
        ("text type with empty default → ERROR",
         {"type": "text", "id": "a", "default": ""}, True),
        ("text type without default key → OK",
         {"type": "text", "id": "b"}, False),
        ("text type with valid default → OK",
         {"type": "text", "id": "c", "default": "Valeur valide"}, False),
        ("checkbox type with empty default → OK (type not text-like)",
         {"type": "checkbox", "id": "d", "default": ""}, False),
    ]
    print("Rule 10 self-test:")
    failed = 0
    for desc, setting, should_error in cases:
        errs = check_text_default(setting, "self-test")
        actually_errored = len(errs) > 0
        if actually_errored == should_error:
            print(f"  ✓ {desc}")
        else:
            failed += 1
            print(f"  ✗ {desc} (expected error={should_error}, got {actually_errored})")
            for e in errs:
                print(f"      ↳ {e}")
    if failed:
        print(f"\n❌ Self-test failed: {failed}/{len(cases)} case(s)")
        return 1
    print(f"\n✅ Self-test: {len(cases)}/{len(cases)} case(s) passed")
    return 0


def main(argv: list[str]) -> int:
    if not argv:
        print("Usage: validate_shopify_schema.py <file.liquid> [...] [-v|--verbose] [--self-test]", file=sys.stderr)
        return 2

    verbose = False
    self_test_mode = False
    cleaned = []
    for arg in argv:
        if arg in ('-v', '--verbose'):
            verbose = True
        elif arg == '--self-test':
            self_test_mode = True
        else:
            cleaned.append(arg)

    if self_test_mode:
        return run_self_test()

    argv = cleaned or ['--all']

    # Determine repo root from script location for the cross-check
    script_dir = Path(__file__).resolve().parent
    repo_root = script_dir.parent

    all_errs = []
    files_checked = 0

    if argv == ['--all']:
        targets = sorted((repo_root / 'sections').glob('*.liquid'))
    else:
        targets = [Path(arg) for arg in argv]

    if verbose:
        print("Rule 10 (text default not blank) — settings with `default` key:")

    for p in targets:
        if not p.exists():
            print(f"WARN: {p} does not exist", file=sys.stderr)
            continue
        files_checked += 1
        all_errs.extend(validate_file(p, verbose=verbose))

    if verbose:
        print("\nTemplate ↔ schema cross-check:")
    template_errs = validate_templates(repo_root, verbose=verbose)
    all_errs.extend(template_errs)

    if all_errs:
        print(f"\n❌ {len(all_errs)} violation(s) across {files_checked} file(s):\n")
        for e in all_errs:
            print(f"  - {e}")
        return 1

    print(
        f"✅ {files_checked} section file(s) pass Shopify schema validation; "
        f"templates/*.json block references verified"
    )
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
