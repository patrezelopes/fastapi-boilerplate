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

# Sem credencial, toda rota protegida devolve 401 e o Schemathesis nunca chega a
# validar um 200 delas contra o schema. Foi assim que uma resposta de /users com
# a paginação achatada — quando o contrato a declara aninhada em `meta` — passou
# batido em duas stacks, e só o e2e pegou.
echo "→ obtendo uma sessão para as rotas protegidas"

CONTA="contrato.$(date +%s)$RANDOM@exemplo.com"
SENHA="senha-bem-longa-123"

curl -fsS -X POST "$BASE_URL/api/v1/auth/register" \
  -H 'content-type: application/json' \
  -d "{\"email\":\"$CONTA\",\"name\":\"Teste de Contrato\",\"password\":\"$SENHA\"}" \
  >/dev/null || {
    echo "✗ não consegui cadastrar a conta de teste"
    echo "  a base pode não estar migrada — rode 'make migrate' antes"
    exit 1
  }

TOKEN="$(
  curl -fsS -X POST "$BASE_URL/api/v1/auth/login" \
    -H 'content-type: application/json' \
    -d "{\"email\":\"$CONTA\",\"password\":\"$SENHA\"}" \
  | sed -n 's/.*"access_token"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p'
)"

[[ -n "$TOKEN" ]] || { echo "✗ não consegui obter o access token"; exit 1; }

echo "→ validando o contrato contra $BASE_URL"

# Argumentos comuns. O caminho do contrato entra separado porque dentro do
# container ele fica montado em /contract.
ARGS=(
  --url "$BASE_URL"
  --checks all
  --max-examples 40
  --exclude-path /api/v1/auth/logout
  --header "Authorization: Bearer $TOKEN"
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
