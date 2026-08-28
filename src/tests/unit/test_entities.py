from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest

from app.entities.health_status import HealthStatus
from app.entities.refresh_token import RefreshToken
from app.use_cases.check_health import CheckHealthUseCase
from app.use_cases.page import Page
from tests.conftest import FakeHealthRepository, make_user

MOMENT = datetime(2026, 1, 1, 12, 0, tzinfo=UTC)


def _token(*, revoked: bool = False, ttl_hours: int = 1) -> RefreshToken:
    return RefreshToken(
        id=uuid4(),
        user_id=uuid4(),
        family_id=uuid4(),
        expires_at=MOMENT + timedelta(hours=ttl_hours),
        created_at=MOMENT,
        revoked_at=MOMENT if revoked else None,
        token_hash="x" * 64,
    )


@pytest.mark.unit
def test_with_profile_altera_so_o_que_foi_pedido() -> None:
    original = make_user()

    alterado = original.with_profile(name="Outra")

    assert alterado.name == "Outra"
    assert alterado.email == original.email
    assert alterado.id == original.id


@pytest.mark.unit
@pytest.mark.parametrize(
    ("revoked", "ttl_hours", "ativo"), [(False, 1, True), (True, 1, False), (False, -1, False)]
)
def test_token_ativo_depende_de_revogacao_e_validade(
    revoked: bool, ttl_hours: int, ativo: bool
) -> None:
    assert _token(revoked=revoked, ttl_hours=ttl_hours).is_active_at(MOMENT) is ativo


@pytest.mark.unit
def test_token_no_instante_da_expiracao_ja_expirou() -> None:
    token = _token(ttl_hours=1)

    assert token.has_expired_at(MOMENT + timedelta(hours=1)) is True
    assert token.has_expired_at(MOMENT) is False


@pytest.mark.unit
@pytest.mark.parametrize(
    ("total", "per_page", "paginas"), [(0, 20, 0), (1, 20, 1), (20, 20, 1), (21, 20, 2), (5, 0, 0)]
)
def test_total_de_paginas_arredonda_para_cima(total: int, per_page: int, paginas: int) -> None:
    assert Page(items=[], page=1, per_page=per_page, total=total).total_pages == paginas


@pytest.mark.unit
def test_liveness_nao_depende_do_banco() -> None:
    use_case = CheckHealthUseCase(FakeHealthRepository(alive=True, ready=False))

    assert use_case.execute_liveness() == HealthStatus(alive=True, ready=True)


@pytest.mark.unit
def test_readiness_reflete_o_estado_do_banco() -> None:
    use_case = CheckHealthUseCase(FakeHealthRepository(alive=True, ready=False))

    assert use_case.execute_readiness() == HealthStatus(alive=True, ready=False)
