"""Critérios de aceite da spec 0002 — autenticação por JWT."""

import pytest
from fastapi.testclient import TestClient

from tests.conftest import VALID_PASSWORD

BASE = "/api/v1/auth"
CONTA = {"email": "ana@exemplo.com", "name": "Ana", "password": VALID_PASSWORD}


def _set_cookie(response) -> str:  # noqa: ANN001
    return next(
        (h for h in response.headers.get_list("set-cookie") if h.startswith("refresh_token=")),
        "",
    )


@pytest.mark.integration
def test_registro_devolve_201_sem_expor_a_senha(client: TestClient) -> None:
    response = client.post(f"{BASE}/register", json=CONTA)

    assert response.status_code == 201
    corpo = response.json()
    assert corpo["email"] == "ana@exemplo.com"
    assert "password" not in corpo
    assert "password_hash" not in corpo
    assert VALID_PASSWORD not in response.text


@pytest.mark.integration
def test_email_ja_cadastrado_devolve_409(client: TestClient) -> None:
    client.post(f"{BASE}/register", json=CONTA)

    response = client.post(f"{BASE}/register", json=CONTA)

    assert response.status_code == 409
    assert response.headers["content-type"].startswith("application/problem+json")
    assert response.json()["type"].endswith("/conflict")


@pytest.mark.integration
@pytest.mark.parametrize(
    ("campo", "valor"),
    [("password", "curta"), ("email", "não-é-email"), ("name", "")],
)
def test_entrada_invalida_devolve_422_com_o_campo(
    client: TestClient, campo: str, valor: str
) -> None:
    response = client.post(f"{BASE}/register", json={**CONTA, campo: valor})

    assert response.status_code == 422
    corpo = response.json()
    assert corpo["type"].endswith("/validation")
    assert any(erro["field"] == campo for erro in corpo["errors"])


@pytest.mark.integration
def test_login_devolve_access_token_no_corpo(client: TestClient) -> None:
    client.post(f"{BASE}/register", json=CONTA)

    response = client.post(
        f"{BASE}/login", json={"email": CONTA["email"], "password": VALID_PASSWORD}
    )

    assert response.status_code == 200
    corpo = response.json()
    assert corpo["access_token"]
    assert corpo["token_type"] == "Bearer"
    assert corpo["expires_in"] == 900


@pytest.mark.integration
def test_o_refresh_vai_em_cookie_httponly_e_nao_no_corpo(client: TestClient) -> None:
    client.post(f"{BASE}/register", json=CONTA)

    response = client.post(
        f"{BASE}/login", json={"email": CONTA["email"], "password": VALID_PASSWORD}
    )

    cookie = _set_cookie(response)
    assert "HttpOnly" in cookie
    assert "SameSite=lax" in cookie.lower().replace("samesite=lax", "SameSite=lax")
    assert "Path=/api/v1/auth" in cookie
    assert "refresh_token" not in response.json()


@pytest.mark.integration
def test_senha_errada_e_email_inexistente_dao_a_mesma_resposta(client: TestClient) -> None:
    client.post(f"{BASE}/register", json=CONTA)

    senha_errada = client.post(
        f"{BASE}/login", json={"email": CONTA["email"], "password": "outra-senha-longa"}
    )
    email_inexistente = client.post(
        f"{BASE}/login", json={"email": "ninguem@exemplo.com", "password": VALID_PASSWORD}
    )

    assert senha_errada.status_code == email_inexistente.status_code == 401
    assert senha_errada.json() == email_inexistente.json()


@pytest.mark.integration
def test_refresh_emite_par_novo_e_rotaciona_o_cookie(client: TestClient) -> None:
    client.post(f"{BASE}/register", json=CONTA)
    login = client.post(f"{BASE}/login", json={"email": CONTA["email"], "password": VALID_PASSWORD})
    cookie_do_login = client.cookies.get("refresh_token")

    response = client.post(f"{BASE}/refresh")

    assert response.status_code == 200
    assert response.json()["access_token"] != login.json()["access_token"]
    assert client.cookies.get("refresh_token") != cookie_do_login


@pytest.mark.integration
def test_reusar_um_refresh_ja_rotacionado_derruba_a_sessao(client: TestClient) -> None:
    client.post(f"{BASE}/register", json=CONTA)
    client.post(f"{BASE}/login", json={"email": CONTA["email"], "password": VALID_PASSWORD})
    roubado = client.cookies.get("refresh_token")

    client.post(f"{BASE}/refresh")
    sucessor = client.cookies.get("refresh_token")

    client.cookies.set("refresh_token", roubado or "", path="/api/v1/auth")
    reuso = client.post(f"{BASE}/refresh")

    assert reuso.status_code == 401

    client.cookies.set("refresh_token", sucessor or "", path="/api/v1/auth")
    assert client.post(f"{BASE}/refresh").status_code == 401, "o sucessor legítimo também cai"


@pytest.mark.integration
def test_refresh_sem_cookie_devolve_401(client: TestClient) -> None:
    response = client.post(f"{BASE}/refresh")

    assert response.status_code == 401
    assert response.json()["type"].endswith("/unauthorized")


@pytest.mark.integration
def test_logout_devolve_204_revoga_e_limpa_o_cookie(client: TestClient) -> None:
    client.post(f"{BASE}/register", json=CONTA)
    client.post(f"{BASE}/login", json={"email": CONTA["email"], "password": VALID_PASSWORD})

    response = client.post(f"{BASE}/logout")

    assert response.status_code == 204
    assert 'refresh_token=""' in _set_cookie(response) or "refresh_token=;" in _set_cookie(response)
    assert client.post(f"{BASE}/refresh").status_code == 401


@pytest.mark.integration
def test_logout_sem_sessao_ainda_devolve_204(client: TestClient) -> None:
    assert client.post(f"{BASE}/logout").status_code == 204


@pytest.mark.integration
def test_me_devolve_o_usuario_do_token(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.get(f"{BASE}/me", headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["email"] == "ana@exemplo.com"


@pytest.mark.integration
@pytest.mark.parametrize(
    "headers",
    [{}, {"Authorization": "Bearer forjado"}, {"Authorization": "Basic abc"}],
    ids=["sem header", "token forjado", "esquema errado"],
)
def test_me_sem_bearer_valido_devolve_401(client: TestClient, headers: dict[str, str]) -> None:
    response = client.get(f"{BASE}/me", headers=headers)

    assert response.status_code == 401
    assert response.headers["content-type"].startswith("application/problem+json")
