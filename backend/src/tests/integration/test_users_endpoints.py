"""Critérios de aceite da spec 0003 — CRUD de usuários protegido."""

from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from tests.conftest import VALID_PASSWORD

BASE = "/api/v1/users"


def _criar(client: TestClient, headers: dict[str, str], *, email: str, name: str) -> dict:
    response = client.post(
        BASE, headers=headers, json={"email": email, "name": name, "password": VALID_PASSWORD}
    )
    assert response.status_code == 201
    return response.json()


@pytest.mark.integration
@pytest.mark.parametrize(
    ("metodo", "caminho"),
    [
        ("get", BASE),
        ("post", BASE),
        ("get", f"{BASE}/{uuid4()}"),
        ("patch", f"{BASE}/{uuid4()}"),
        ("delete", f"{BASE}/{uuid4()}"),
    ],
)
def test_todas_as_operacoes_exigem_bearer(client: TestClient, metodo: str, caminho: str) -> None:
    corpo = {"json": {"name": "X"}} if metodo in {"post", "patch"} else {}

    response = getattr(client, metodo)(caminho, **corpo)

    assert response.status_code == 401
    assert response.headers["content-type"].startswith("application/problem+json")


@pytest.mark.integration
def test_listagem_traz_items_e_meta(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.get(BASE, headers=auth_headers)

    assert response.status_code == 200
    corpo = response.json()
    assert corpo["meta"] == {"page": 1, "per_page": 20, "total": 1, "total_pages": 1}
    assert len(corpo["items"]) == 1


@pytest.mark.integration
def test_a_listagem_nunca_expoe_o_hash_da_senha(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    response = client.get(BASE, headers=auth_headers)

    assert "password" not in response.text
    assert set(response.json()["items"][0]) == {
        "id",
        "email",
        "name",
        "created_at",
        "updated_at",
    }


@pytest.mark.integration
def test_pagina_alem_do_fim_devolve_lista_vazia(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    response = client.get(BASE, headers=auth_headers, params={"page": 99})

    assert response.status_code == 200
    assert response.json()["items"] == []
    assert response.json()["meta"]["total"] == 1


@pytest.mark.integration
@pytest.mark.parametrize("per_page", [0, 101, -1])
def test_per_page_fora_do_limite_devolve_422(
    client: TestClient, auth_headers: dict[str, str], per_page: int
) -> None:
    response = client.get(BASE, headers=auth_headers, params={"per_page": per_page})

    assert response.status_code == 422
    assert any(erro["field"] == "per_page" for erro in response.json()["errors"])


@pytest.mark.integration
def test_pagina_zero_devolve_422(client: TestClient, auth_headers: dict[str, str]) -> None:
    assert client.get(BASE, headers=auth_headers, params={"page": 0}).status_code == 422


@pytest.mark.integration
def test_busca_casa_parte_do_nome_ou_do_email(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    _criar(client, auth_headers, email="bruno@outro.com", name="Bruno")

    por_nome = client.get(BASE, headers=auth_headers, params={"q": "BRU"})
    por_email = client.get(BASE, headers=auth_headers, params={"q": "outro"})
    sem_resultado = client.get(BASE, headers=auth_headers, params={"q": "ninguém"})

    assert por_nome.json()["meta"]["total"] == 1
    assert por_email.json()["meta"]["total"] == 1
    assert sem_resultado.json()["meta"]["total"] == 0


@pytest.mark.integration
def test_criacao_devolve_201(client: TestClient, auth_headers: dict[str, str]) -> None:
    criado = _criar(client, auth_headers, email="bruno@exemplo.com", name="Bruno")

    assert criado["email"] == "bruno@exemplo.com"
    assert "password" not in criado


@pytest.mark.integration
def test_criar_com_email_existente_devolve_409(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    response = client.post(
        BASE,
        headers=auth_headers,
        json={"email": "ana@exemplo.com", "name": "Outra", "password": VALID_PASSWORD},
    )

    assert response.status_code == 409


@pytest.mark.integration
def test_obtem_usuario_por_id(client: TestClient, auth_headers: dict[str, str]) -> None:
    criado = _criar(client, auth_headers, email="bruno@exemplo.com", name="Bruno")

    response = client.get(f"{BASE}/{criado['id']}", headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["id"] == criado["id"]


@pytest.mark.integration
def test_id_inexistente_devolve_404(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.get(f"{BASE}/{uuid4()}", headers=auth_headers)

    assert response.status_code == 404
    assert response.json()["type"].endswith("/not-found")


@pytest.mark.integration
def test_id_que_nao_e_uuid_devolve_422(client: TestClient, auth_headers: dict[str, str]) -> None:
    assert client.get(f"{BASE}/abc", headers=auth_headers).status_code == 422


@pytest.mark.integration
def test_atualizacao_parcial_preserva_o_resto(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    criado = _criar(client, auth_headers, email="bruno@exemplo.com", name="Bruno")

    response = client.patch(
        f"{BASE}/{criado['id']}", headers=auth_headers, json={"name": "Bruno Silva"}
    )

    assert response.status_code == 200
    assert response.json()["name"] == "Bruno Silva"
    assert response.json()["email"] == "bruno@exemplo.com"


@pytest.mark.integration
def test_patch_com_corpo_vazio_devolve_422(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    criado = _criar(client, auth_headers, email="bruno@exemplo.com", name="Bruno")

    response = client.patch(f"{BASE}/{criado['id']}", headers=auth_headers, json={})

    assert response.status_code == 422


@pytest.mark.integration
def test_patch_com_email_de_outra_pessoa_devolve_409(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    criado = _criar(client, auth_headers, email="bruno@exemplo.com", name="Bruno")

    response = client.patch(
        f"{BASE}/{criado['id']}", headers=auth_headers, json={"email": "ana@exemplo.com"}
    )

    assert response.status_code == 409


@pytest.mark.integration
def test_patch_em_id_inexistente_devolve_404(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    response = client.patch(f"{BASE}/{uuid4()}", headers=auth_headers, json={"name": "X"})

    assert response.status_code == 404


@pytest.mark.integration
def test_remocao_devolve_204_e_depois_404(client: TestClient, auth_headers: dict[str, str]) -> None:
    criado = _criar(client, auth_headers, email="bruno@exemplo.com", name="Bruno")

    assert client.delete(f"{BASE}/{criado['id']}", headers=auth_headers).status_code == 204
    assert client.get(f"{BASE}/{criado['id']}", headers=auth_headers).status_code == 404


@pytest.mark.integration
def test_remover_id_inexistente_devolve_404(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    assert client.delete(f"{BASE}/{uuid4()}", headers=auth_headers).status_code == 404


@pytest.mark.integration
def test_parametro_de_consulta_desconhecido_devolve_422(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    # Ignorar em silêncio é o que faz um `?perPage=5` devolver vinte itens sem
    # ninguém perceber o erro de digitação.
    response = client.get(f"{BASE}?perPage=5", headers=auth_headers)

    assert response.status_code == 422
    assert response.json()["errors"][0]["field"] == "perPage"


@pytest.mark.integration
def test_page_acima_do_teto_devolve_422(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.get(f"{BASE}?page=1093245913781162817355776", headers=auth_headers)

    assert response.status_code == 422


@pytest.mark.integration
def test_termo_de_busca_com_caractere_de_controle_devolve_422_e_nao_500(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    response = client.get(f"{BASE}?q=busca%00nula", headers=auth_headers)

    assert response.status_code == 422


@pytest.mark.integration
def test_patch_com_campo_explicitamente_nulo_devolve_422(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    criado = _criar(client, auth_headers, email="nula@exemplo.com", name="Nula")

    # Ausente significa "não mexa"; `null` é violação do schema, porque não
    # existe "apagar o e-mail".
    response = client.patch(
        f"{BASE}/{criado['id']}", headers=auth_headers, json={"email": None, "name": "Outra"}
    )

    assert response.status_code == 422


@pytest.mark.integration
def test_patch_com_campo_ausente_segue_inalterado(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    criado = _criar(client, auth_headers, email="mantem@exemplo.com", name="Mantem")

    response = client.patch(
        f"{BASE}/{criado['id']}", headers=auth_headers, json={"name": "Mantem Lima"}
    )

    assert response.status_code == 200
    assert response.json()["email"] == "mantem@exemplo.com"


@pytest.mark.integration
def test_corpo_com_campo_desconhecido_devolve_422(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    response = client.post(
        BASE,
        headers=auth_headers,
        json={
            "email": "typo@exemplo.com",
            "name": "Typo",
            "password": "senha-bem-longa-123",
            "passwrod": "x",
        },
    )

    assert response.status_code == 422


@pytest.mark.integration
@pytest.mark.parametrize(
    ("campo", "valor"),
    [
        ("name", "   "),
        ("name", "Ana\x00"),
        ("password", "senha-com\nquebra-longa"),
        ("email", "ana@exemplo.test"),
        ("email", "ana@com"),
    ],
)
def test_entrada_fora_do_contrato_devolve_422(
    client: TestClient, auth_headers: dict[str, str], campo: str, valor: str
) -> None:
    corpo = {
        "email": "valido@exemplo.com",
        "name": "Valido",
        "password": "senha-bem-longa-123",
    }
    corpo[campo] = valor

    response = client.post(BASE, headers=auth_headers, json=corpo)

    assert response.status_code == 422, response.text


@pytest.mark.integration
def test_nome_com_caractere_c1_e_aceito_porque_o_contrato_o_aceita(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    # U+0080..U+009F e controle para muitas bibliotecas, mas o padrao do
    # contrato so recusa \x00-\x1f e \x7f. Recusar aqui deixaria a API mais
    # restrita que o contrato.
    response = client.post(
        BASE,
        headers=auth_headers,
        json={
            "email": "c1@exemplo.com",
            "name": "Ana\x9aSouza",
            "password": "senha-bem-longa-123",
        },
    )

    assert response.status_code == 201, response.text
