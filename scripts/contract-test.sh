#!/usr/bin/env bash
# Valida o backend em execução contra contract/openapi.yaml.
#
# Sobe nada: espera a api já de pé (make up). Usa Schemathesis, que gera casos a
# partir do próprio contrato — inclusive os que ninguém lembraria de escrever.
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:${API_PORT:-8000}}"
SPEC="${SPEC:-contract/openapi.yaml}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT"

[[ -f "$SPEC" ]] || { echo "✗ contrato não encontrado: $SPEC"; exit 1; }

echo "→ aguardando $BASE_URL/api/v1/health/ready"
for i in $(seq 1 30); do
  if curl -fsS "$BASE_URL/api/v1/health/ready" >/dev/null 2>&1; then
    echo "  api pronta"
    break
  fi
  [[ $i -eq 30 ]] && { echo "✗ api não respondeu em 60s. Rode 'make up' antes."; exit 1; }
  sleep 2
done

echo "→ validando o contrato contra $BASE_URL"

# Argumentos comuns. O caminho do contrato entra separado porque dentro do
# container ele fica montado em /contract.
ARGS=(
  --url "$BASE_URL"
  --checks all
  --max-examples 40
  --exclude-path /api/v1/auth/logout
)

if command -v schemathesis >/dev/null 2>&1; then
  schemathesis run "$SPEC" "${ARGS[@]}"
elif command -v uvx >/dev/null 2>&1; then
  uvx --from schemathesis schemathesis run "$SPEC" "${ARGS[@]}"
else
  echo "  (schemathesis local não encontrado — usando o container)"
  docker run --rm --network host \
    -v "$ROOT/$(dirname "$SPEC"):/contract:ro" \
    schemathesis/schemathesis:stable \
    run "/contract/$(basename "$SPEC")" "${ARGS[@]}"
fi

echo "✓ o backend cumpre o contrato"
