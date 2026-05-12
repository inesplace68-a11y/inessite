#!/usr/bin/env python3
"""Validate Shopify schema settings in .liquid section files.

Six rules checked (any failure causes Shopify GitHub Sync to reject the commit):
  1. range.unit            : <= 3 characters
  2. range.step            : <= 1 decimal place
  3. range increments      : (max - min) / step <= 100
  4. range divisibility    : (max - min) / step must be an integer
  5. range default on step : (default - min) / step must be an integer
  6. section/block name    : <= 25 characters

Usage:
    python3 scripts/validate_shopify_schema.py sections/foo.liquid [sections/bar.liquid ...]

Exit codes: 0 = all good, 1 = violations found, 2 = bad invocation.
"""

import json
import re
import sys
from pathlib import Path

SCHEMA_RE = re.compile(r'{%\s*schema\s*%}(.*?){%\s*endschema\s*%}', re.DOTALL)
EPS = 1e-9


def extract_schemas(path: Path):
    content = path.read_text(encoding='utf-8')
    return [m.group(1) for m in SCHEMA_RE.finditer(content)]


def check_range(setting: dict, where: str) -> list[str]:
    errs = []
    sid = setting.get('id', '<no-id>')
    tag = f"{where} » id={sid}"

    unit = setting.get('unit')
    if unit is not None and len(unit) > 3:
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


def check_name(name, where: str) -> list[str]:
    if name is None:
        return []
    if len(name) > 25:
        return [f"{where}: name '{name}' is {len(name)} chars (max 25)"]
    return []


def walk(schema: dict, file_label: str):
    yield ('name', schema.get('name'), file_label)
    for s in schema.get('settings', []):
        if s.get('type') == 'range':
            yield ('range', s, f"{file_label} » settings")
    for block in schema.get('blocks', []):
        bname = block.get('name')
        btype = block.get('type', '<block>')
        yield ('name', bname, f"{file_label} » block '{btype}'")
        for s in block.get('settings', []):
            if s.get('type') == 'range':
                yield ('range', s, f"{file_label} » block '{btype}'")


def validate_file(path: Path) -> list[str]:
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
    return errs


def main(argv: list[str]) -> int:
    if not argv:
        print("Usage: validate_shopify_schema.py <file.liquid> [...]", file=sys.stderr)
        return 2

    all_errs = []
    files_checked = 0
    for arg in argv:
        p = Path(arg)
        if not p.exists():
            print(f"WARN: {arg} does not exist", file=sys.stderr)
            continue
        files_checked += 1
        all_errs.extend(validate_file(p))

    if all_errs:
        print(f"\n❌ {len(all_errs)} violation(s) across {files_checked} file(s):\n")
        for e in all_errs:
            print(f"  - {e}")
        return 1

    print(f"✅ {files_checked} file(s) pass Shopify schema validation")
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
