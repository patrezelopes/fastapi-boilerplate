#!/usr/bin/env bash
# Roda o roteiro Playwright contra um dos três SPAs, usando a stack do compose.
#
#   ./scripts/e2e.sh react     (ou vue, angular)
#   make e2e FRONT=vue
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

[[ -f .env ]] || { echo "✗ .env não encontrado. Rode 'cp .env.example .env'."; exit 1; }

# shellcheck disable=SC1091
set -a; source .env; set +a
WEB_PORT="${WEB_PORT:-5173}"
WEB_URL="http://localhost:${WEB_PORT}"

# Os três web mapeiam a mesma porta do host. Sem derrubar os outros, trocar de
# frontend falha com "port is already allocated" — que foi como `make e2e-all`
# quebrou na primeira vez.
echo "→ liberando a porta $WEB_PORT"
for outro in react vue angular; do
  [[ "$outro" == "$FRONT" ]] && continue
  docker compose --profile "$outro" rm -sf "web-$outro" >/dev/null 2>&1 || true
done

echo "→ subindo a stack com FRONT=$FRONT"
COMPOSE_PROFILES="$FRONT" docker compose up -d --wait

echo "→ aplicando migrations"
docker compose exec -T api alembic upgrade head >/dev/null

echo "→ Playwright contra $FRONT em $WEB_URL"
cd "$ROOT/e2e"
WEB_URL="$WEB_URL" npx playwright test "$@"

echo "✓ e2e passou em $FRONT"
