#!/usr/bin/env python3
"""
select_org.py — interactively choose an "org" record from a JSON file and print its id.

Works with:
- A JSON array of records (the format you provided), or
- NDJSON (one JSON object per line)

Usage:
  python select_org.py /path/to/identities.json
"""

from __future__ import annotations
import argparse
import json
import os
import sys
from typing import Any, Iterable, List, Dict

def eprint(*args: Any, **kwargs: Any) -> None:
    print(*args, file=sys.stderr, **kwargs)

def load_records(path: str) -> List[Dict[str, Any]]:
    if not os.path.exists(path):
        raise FileNotFoundError(f"No such file: {path}")

    with open(path, "r", encoding="utf-8") as f:
        data = f.read().strip()

    if not data:
        return []

    # Try JSON array first
    try:
        parsed = json.loads(data)
        if isinstance(parsed, list):
            return [r for r in parsed if isinstance(r, dict)]
        elif isinstance(parsed, dict):
            # single object — normalize to list
            return [parsed]
    except json.JSONDecodeError:
        pass

    # Fallback: NDJSON
    records: List[Dict[str, Any]] = []
    for i, line in enumerate(data.splitlines(), start=1):
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
        except json.JSONDecodeError as ex:
            raise ValueError(f"Invalid JSON on line {i}: {ex}") from ex
        if isinstance(obj, dict):
            records.append(obj)
    return records

def pick_org(orgs: List[Dict[str, Any]]) -> Dict[str, Any]:
    # Pretty list
    print("\nFound the following org records:\n")
    for idx, org in enumerate(orgs, start=1):
        name = org.get("name") or "(no name)"
        did = org.get("did") or ""
        oid = org.get("id") or ""
        did_disp = did if len(did) <= 60 else did[:57] + "..."
        oid_disp = oid if len(oid) <= 60 else oid[:57] + "..."
        print(f"  [{idx}] {name}")
        if did_disp:
            print(f"       did: {did_disp}")
        if oid_disp:
            print(f"        id: {oid_disp}")
    print("\nChoose a record by number. Press Enter for [1]. Type 'q' to quit.")

    while True:
        choice = input("> ").strip().lower()
        if choice == "":
            return orgs[0]
        if choice in {"q", "quit", "exit"}:
            eprint("Aborted by user.")
            sys.exit(1)
        if choice.isdigit():
            i = int(choice)
            if 1 <= i <= len(orgs):
                return orgs[i - 1]
        eprint(f"Please enter a number between 1 and {len(orgs)}, or 'q' to quit.")

def main(argv: Iterable[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description='Interactively choose an "org" record from a JSON file and print its id.'
    )
    parser.add_argument("path", help="Path to JSON file (array of records or NDJSON).")
    parser.add_argument(
        "--non-interactive",
        action="store_true",
        help='If only one "org" is present, select it automatically without prompting.',
    )
    args = parser.parse_args(list(argv) if argv is not None else None)

    try:
        records = load_records(args.path)
    except Exception as ex:
        eprint(f"Error reading {args.path}: {ex}")
        return 2

    orgs = [r for r in records if (isinstance(r, dict) and r.get("type") == "org")]

    if not orgs:
        eprint('No records of type "org" found.')
        return 1

    if args.non_interactive and len(orgs) == 1:
        chosen = orgs[0]
    else:
        chosen = pick_org(orgs)

    org_id = chosen.get("id")
    if not org_id:
        eprint('Selected record has no "id" field.')
        return 1

    # Per requirements: return/print only the id of the selected record.
    print(org_id)
    open('selected_org_id.txt', 'w').write(org_id)
    return 0

if __name__ == "__main__":
    raise SystemExit(main())