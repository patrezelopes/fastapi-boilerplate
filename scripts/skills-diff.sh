#!/usr/bin/env bash
# Acusa divergência do kit .claude/ contra o boilerplate de referência.
#
# As skills comuns são duplicadas nos seis repositórios por decisão (ver docs/SPEC.md).
# O preço dessa decisão é a divergência silenciosa; este script é o antídoto.
set -euo pipefail

REF_REPO="${REF_REPO:-https://github.com/patrezelopes/fastapi-boilerplate.git}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

cd "$ROOT"

# Arquivos que são comuns aos seis repositórios. O resto é específico da stack.
COMMON=(
  ".claude/rules"
  ".claude/commands"
  ".claude/agents"
  ".claude/skills/spec-driven"
  ".claude/skills/clean-architecture"
  ".claude/skills/quality-gates"
  ".claude/skills/monorepo-navigation"
  ".claude/skills/api-contract"
  "specs/0000-template"
  "contract/openapi.yaml"
)

echo "→ clonando a referência"
git clone --quiet --depth 1 "$REF_REPO" "$TMP/ref" 2>/dev/null || {
  echo "✗ não foi possível clonar $REF_REPO"; exit 1;
}

status=0
for path in "${COMMON[@]}"; do
  if [[ ! -e "$TMP/ref/$path" ]]; then
    echo "  ⚠ ausente na referência: $path"
    continue
  fi
  if [[ ! -e "$path" ]]; then
    echo "  ✗ ausente aqui: $path"
    status=1
    continue
  fi
  if ! diff -rq "$TMP/ref/$path" "$path" >/dev/null 2>&1; then
    echo "  ✗ divergente: $path"
    diff -ru "$TMP/ref/$path" "$path" | sed 's/^/      /' | head -40
    status=1
  fi
done

if [[ $status -eq 0 ]]; then
  echo "✓ o kit está em dia com a referência"
else
  echo ""
  echo "Divergência encontrada. Se a mudança foi deliberada, leve-a à referência"
  echo "e aos outros repositórios. Se não foi, reconcilie."
fi
exit $status
