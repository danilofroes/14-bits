from __future__ import annotations

import pytest

from api.aplicacao import criar_app
from api.configuracao import Configuracao
from api.extensoes import limiter
from api.modelos import db


@pytest.fixture
def app():
    cfg = Configuracao(
        ambiente="teste",
        secret_key="chave-de-teste",
        database_uri="sqlite:///:memory:",
        origens_permitidas=["http://localhost:5173"],
        cookie_seguro=False,
        cookie_samesite="Lax",
    )
    aplicacao = criar_app(cfg)

    # O limitador atrapalharia os testes que criam várias contas seguidas.
    # Ele tem teste próprio, em `test_limites.py`.
    limiter.enabled = False

    yield aplicacao

    with aplicacao.app_context():
        db.session.remove()
        db.drop_all()


@pytest.fixture
def cliente(app):
    return app.test_client()


@pytest.fixture
def conta(cliente):
    """Cria uma conta e devolve os dados usados, já com a sessão aberta."""
    dados = {
        "nome_usuario": "danilo",
        "email": "danilo@exemplo.br",
        "senha": "voodopassaro14",
    }
    resposta = cliente.post("/api/conta", json=dados)
    assert resposta.status_code == 201, resposta.get_json()
    return dados
