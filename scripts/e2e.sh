#!/usr/bin/env bash
# Roda o roteiro Playwright contra um dos três SPAs.
#
#   ./scripts/e2e.sh react     (ou vue, angular)
#
# Espera o backend já de pé (`make up && make migrate`). Sobe o dev server do
# frontend escolhido, roda o roteiro e derruba tudo ao sair.
#
# O roteiro é único: o mesmo arquivo roda contra os três. Se ele precisar
# ramificar por framework, o comportamento divergiu — conserte o SPA, não o teste.
set -euo pipefail

FRONT="${1:-react}"
# consome o nome do frontend; o que sobrar é repassado ao Playwright
[[ $# -gt 0 ]] && shift
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

case "$FRONT" in
  react|vue|angular) ;;
  *) echo "✗ frontend inválido: '$FRONT'. Use react, vue ou angular."; exit 1 ;;
esac

API_PORT="${API_PORT:-8000}"
WEB_PORT="${WEB_PORT:-5300}"
API_URL="http://localhost:${API_PORT}"
WEB_URL="http://localhost:${WEB_PORT}"

echo "→ conferindo o backend em $API_URL"
curl -fsS "$API_URL/api/v1/health/ready" >/dev/null 2>&1 || {
  echo "✗ backend fora do ar. Rode 'make up && make migrate' antes."; exit 1;
}

echo "→ subindo o frontend $FRONT em $WEB_URL"
cd "$ROOT/frontend/$FRONT"

if [[ "$FRONT" == "angular" ]]; then
  VITE_API_TARGET="$API_URL" npx ng serve --port "$WEB_PORT" --host 127.0.0.1 >/tmp/e2e-$FRONT.log 2>&1 &
else
  VITE_API_TARGET="$API_URL" PORT="$WEB_PORT" npx vite --host 127.0.0.1 --strictPort >/tmp/e2e-$FRONT.log 2>&1 &
fi
WEB_PID=$!

cleanup() {
  echo "→ derrubando o dev server"
  kill "$WEB_PID" 2>/dev/null || true
  wait "$WEB_PID" 2>/dev/null || true
}
trap cleanup EXIT

for _ in $(seq 1 60); do
  curl -fsS "$WEB_URL" >/dev/null 2>&1 && break
  sleep 1
done

curl -fsS "$WEB_URL/api/v1/health" >/dev/null 2>&1 || {
  echo "✗ o proxy /api do dev server não respondeu. Log em /tmp/e2e-$FRONT.log"
  tail -20 "/tmp/e2e-$FRONT.log"
  exit 1
}

echo "→ Playwright contra $FRONT"
cd "$ROOT/e2e"
WEB_URL="$WEB_URL" npx playwright test "$@"

echo "✓ e2e passou em $FRONT"
