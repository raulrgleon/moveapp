#!/usr/bin/env python3
"""Bulk-migrate hardcoded API error responses to jsonErrorFromRequest."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "src" / "app" / "api"

# (exact error string, error key, status)
REPLACEMENTS: list[tuple[str, str, int]] = [
    ('"Unauthorized"', "unauthorized", 401),
    ('"Forbidden"', "forbidden", 403),
    ('"Not found"', "notFound", 404),
    ('"No move found"', "noMove", 404),
    ('"No move"', "noMove", 404),
    ('"Move not found"', "noMove", 404),
    ('"Failed to save changes"', "saveFailed", 500),
    ('"Failed to save documents"', "saveFailed", 500),
    ('"Failed to save inventory"', "saveFailed", 500),
    ('"Delete failed"', "deleteFailed", 500),
    ('"File not found"', "fileNotFound", 404),
    ('"File missing on server"', "fileMissingOnServer", 404),
    ('"Weather API not configured"', "configurationMissing", 500),
    ('"OpenAI not configured"', "configurationMissing", 500),
    ('"Stripe not configured"', "configurationMissing", 503),
    ('"Stripe is not configured"', "configurationMissing", 503),
    ('"Failed to fetch weather"', "failed", 500),
    ('"Failed to fetch route weather"', "failed", 500),
    ('"Failed"', "failed", 500),
    ('"Invalid body"', "invalidInput", 400),
    ('"checks object required"', "checksRequired", 400),
    ('"Valid email required"', "validEmailRequired", 400),
    ('"Cannot invite yourself"', "inviteSelf", 400),
    ('"Already invited"', "alreadyInvited", 409),
    ('"Only the move owner can invite collaborators"', "ownerOnly", 403),
    ('"Only the move owner can update collaborators"', "ownerOnly", 403),
    ('"Only the move owner can resend invitations"', "ownerOnly", 403),
    ('"Owner only"', "ownerOnly", 403),
    ('"id required"', "idRequired", 400),
    ('"ID required"', "idRequired", 400),
    ('"Task not found"', "taskNotFound", 404),
    ('"File required"', "invalidInput", 400),
    ('"dataUrl required"', "invalidInput", 400),
    ('"Title required"', "invalidInput", 400),
    ('"Question required"', "invalidInput", 400),
    ('"Messages required"', "messagesRequired", 400),
    ('"Invalid message"', "invalidMessage", 400),
]

PATTERN = re.compile(
    r'return NextResponse\.json\(\{ error: ({error}) \}, \{ status: (\d+) \}\);'
)


def ensure_import(content: str) -> str:
    if "jsonErrorFromRequest" in content:
        return content
    if 'from "@/lib/api-errors"' in content:
        return re.sub(
            r'from "@/lib/api-errors"',
            'from "@/lib/api-errors"',
            content.replace(
                'from "@/lib/api-errors"',
                'import { jsonErrorFromRequest } from "@/lib/api-errors";\n// dup',
                1,
            ).replace("// dup\n", ""),
        )
    # Add import after last next/server import
    m = re.search(r'(import .+ from "next/server";\n)', content)
    if m:
        insert_at = m.end()
        return (
            content[:insert_at]
            + 'import { jsonErrorFromRequest } from "@/lib/api-errors";\n'
            + content[insert_at:]
        )
    return 'import { jsonErrorFromRequest } from "@/lib/api-errors";\n' + content


def migrate_file(path: Path) -> bool:
    text = path.read_text()
    original = text
    changed = False

    for err_str, key, status in REPLACEMENTS:
        old = f'return NextResponse.json({{ error: {err_str} }}, {{ status: {status} }});'
        new = f'return jsonErrorFromRequest(req, "{key}", {status});'
        if old in text:
            text = text.replace(old, new)
            changed = True

    if not changed:
        return False

    if "jsonErrorFromRequest" in text and 'from "@/lib/api-errors"' not in text:
        text = ensure_import(text)

    # Ensure handler has req parameter - rename request -> req in common patterns
    if "jsonErrorFromRequest(req," in text and "function GET(" in text:
        text = re.sub(
            r"export async function (GET|POST|PATCH|PUT|DELETE)\(request: NextRequest\)",
            r"export async function \1(req: NextRequest)",
            text,
        )
        text = text.replace("request.", "req.")
        text = text.replace("(request)", "(req)")

    if text != original:
        path.write_text(text)
        return True
    return False


def main() -> None:
    updated = 0
    for path in sorted(ROOT.rglob("route.ts")):
        if migrate_file(path):
            print(f"updated: {path.relative_to(ROOT.parent.parent.parent)}")
            updated += 1
    print(f"done: {updated} files")


if __name__ == "__main__":
    main()
