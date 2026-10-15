"""Criar conta, entrar e sair."""

from __future__ import annotations

import pytest
from sqlalchemy import select

from api.modelos import Usuario, db


def test_cria_conta_e_ja_abre_sessao(cliente):
    resposta = cliente.post(
        "/api/conta",
        json={"nome_usuario": "maria", "email": "maria@exemplo.br", "senha": "chuvadeverao"},
    )
    assert resposta.status_code == 201

    usuario = resposta.get_json()["usuario"]
    assert usuario["nome_usuario"] == "maria"
    assert usuario["email"] == "maria@exemplo.br"

    # Quem acabou de se cadastrar não deve ter que entrar em seguida.
    eu = cliente.get("/api/eu").get_json()
    assert eu["usuario"]["nome_usuario"] == "maria"


def test_resposta_nunca_devolve_a_senha(cliente):
    resposta = cliente.post(
        "/api/conta",
        json={"nome_usuario": "joao", "email": "joao@exemplo.br", "senha": "segredoforte1"},
    )
    corpo = resposta.get_data(as_text=True)
    assert "segredoforte1" not in corpo
    assert "senha" not in resposta.get_json()["usuario"]


def test_senha_e_guardada_como_hash(cliente, app):
    cliente.post(
        "/api/conta",
        json={"nome_usuario": "ana", "email": "ana@exemplo.br", "senha": "minhasenhaboa"},
    )
    with app.app_context():
        usuario = db.session.scalar(select(Usuario).where(Usuario.nome_usuario == "ana"))
        assert usuario is not None
        assert usuario.senha_hash != "minhasenhaboa"
        assert "minhasenhaboa" not in usuario.senha_hash
        assert usuario.senha_hash.startswith("scrypt:")


def test_nome_de_usuario_e_normalizado(cliente, app):
    cliente.post(
        "/api/conta",
        json={"nome_usuario": "  JoÃo.Silva ", "email": "js@exemplo.br", "senha": "umasenhaaqui"},
    )
    with app.app_context():
        usuario = db.session.scalar(select(Usuario).where(Usuario.email == "js@exemplo.br"))
        # Sem acento e em minúsculas, para "João" e "joao" não virarem duas contas.
        assert usuario.nome_usuario == "joao.silva"


def test_email_e_guardado_em_minusculas(cliente, app):
    cliente.post(
        "/api/conta",
        json={"nome_usuario": "pedro", "email": "  Pedro@Exemplo.BR  ", "senha": "umasenhaaqui"},
    )
    with app.app_context():
        assert db.session.scalar(select(Usuario).where(Usuario.email == "pedro@exemplo.br"))


@pytest.mark.parametrize(
    "campo,valor",
    [
        ("nome_usuario", "ab"),
        ("nome_usuario", "a" * 21),
        ("nome_usuario", "com espaço"),
        ("nome_usuario", "_comecaerrado"),
        ("email", "semarroba.br"),
        ("email", "sem@dominio"),
        ("email", ""),
        ("senha", "curta"),
        ("senha", "12345678"),
    ],
)
def test_recusa_dados_invalidos_dizendo_qual_campo(cliente, campo, valor):
    base = {"nome_usuario": "valido", "email": "valido@exemplo.br", "senha": "umasenhaboa"}
    base[campo] = valor

    resposta = cliente.post("/api/conta", json=base)
    assert resposta.status_code == 400
    corpo = resposta.get_json()
    assert corpo["campo"] == campo
    # A mensagem é para a pessoa ler, então precisa existir e ser frase.
    assert len(corpo["erro"]) > 10


def test_recusa_email_repetido(cliente, conta):
    resposta = cliente.post(
        "/api/conta",
        json={"nome_usuario": "outro", "email": conta["email"].upper(), "senha": "outrasenha1"},
    )
    assert resposta.status_code == 409
    assert resposta.get_json()["campo"] == "email"


def test_recusa_nome_de_usuario_repetido(cliente, conta):
    resposta = cliente.post(
        "/api/conta",
        json={"nome_usuario": "DANILO", "email": "outro@exemplo.br", "senha": "outrasenha1"},
    )
    assert resposta.status_code == 409
    assert resposta.get_json()["campo"] == "nome_usuario"


def test_entra_com_email_ou_com_nome_de_usuario(cliente, conta):
    for identificador in (conta["email"], conta["nome_usuario"], "DANILO"):
        cliente.delete("/api/sessao")
        resposta = cliente.post(
            "/api/sessao", json={"identificador": identificador, "senha": conta["senha"]}
        )
        assert resposta.status_code == 200, identificador
        assert resposta.get_json()["usuario"]["nome_usuario"] == "danilo"


def test_senha_errada_e_conta_inexistente_dao_a_mesma_resposta(cliente, conta):
    """Mensagens diferentes revelariam quais e-mails têm conta no sistema."""
    senha_errada = cliente.post(
        "/api/sessao", json={"identificador": conta["email"], "senha": "naoehessa"}
    )
    inexistente = cliente.post(
        "/api/sessao", json={"identificador": "ninguem@exemplo.br", "senha": "naoehessa"}
    )

    assert senha_errada.status_code == inexistente.status_code == 401
    assert senha_errada.get_json()["erro"] == inexistente.get_json()["erro"]


def test_sair_encerra_a_sessao(cliente, conta):
    assert cliente.get("/api/eu").get_json()["usuario"] is not None

    cliente.delete("/api/sessao")
    assert cliente.get("/api/eu").get_json()["usuario"] is None


def test_eu_sem_sessao_responde_200_com_usuario_nulo(cliente):
    # 200 e não 401: "não tem ninguém logado" é resposta normal, não erro.
    resposta = cliente.get("/api/eu")
    assert resposta.status_code == 200
    assert resposta.get_json()["usuario"] is None


def test_entrar_sem_dados_nao_quebra(cliente):
    assert cliente.post("/api/sessao", json={}).status_code == 400
    assert cliente.post("/api/conta", json={}).status_code == 400
