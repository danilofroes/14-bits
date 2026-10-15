"""Criar conta, entrar, sair e saber quem está logado."""

from __future__ import annotations

from flask import Blueprint, jsonify, request, session
from sqlalchemy import func, select
from werkzeug.security import check_password_hash, generate_password_hash

from ..extensoes import limiter
from ..modelos import Progresso, Usuario, agora, db
from ..validacao import (
    ErroDeValidacao,
    normalizar_nome_usuario,
    validar_email,
    validar_nome_usuario,
    validar_senha,
)

bp = Blueprint("autenticacao", __name__)

CHAVE_SESSAO = "usuario_id"


def usuario_atual() -> Usuario | None:
    identificador = session.get(CHAVE_SESSAO)
    if not identificador:
        return None
    return db.session.get(Usuario, identificador)


def _abrir_sessao(usuario: Usuario) -> None:
    session.clear()
    session[CHAVE_SESSAO] = usuario.id
    session.permanent = True
    usuario.ultimo_acesso = agora()
    db.session.commit()


def _erro(mensagem: str, *, campo: str | None = None, status: int = 400):
    corpo: dict = {"erro": mensagem}
    if campo:
        corpo["campo"] = campo
    return jsonify(corpo), status


@bp.post("/conta")
@limiter.limit("10 per hour")
def criar_conta():
    dados = request.get_json(silent=True) or {}

    try:
        nome_usuario = validar_nome_usuario(dados.get("nome_usuario", ""))
        email = validar_email(dados.get("email", ""))
        senha = validar_senha(dados.get("senha", ""))
    except ErroDeValidacao as e:
        return _erro(e.mensagem, campo=e.campo)

    # Comparação case-insensitive para não criar duas contas "iguais".
    ja_existe_nome = db.session.scalar(
        select(Usuario).where(func.lower(Usuario.nome_usuario) == nome_usuario)
    )
    if ja_existe_nome:
        return _erro("Esse nome de usuário já está em uso.", campo="nome_usuario", status=409)

    ja_existe_email = db.session.scalar(
        select(Usuario).where(func.lower(Usuario.email) == email)
    )
    if ja_existe_email:
        return _erro("Já existe uma conta com esse e-mail.", campo="email", status=409)

    usuario = Usuario(
        nome_usuario=nome_usuario,
        email=email,
        senha_hash=generate_password_hash(senha),
    )
    usuario.progresso = Progresso(concluidas={})

    db.session.add(usuario)
    db.session.commit()

    _abrir_sessao(usuario)
    return jsonify({"usuario": usuario.como_json()}), 201


@bp.post("/sessao")
@limiter.limit("10 per 5 minutes")
def entrar():
    dados = request.get_json(silent=True) or {}

    # Aceita e-mail ou nome de usuário no mesmo campo: ninguém lembra qual usou.
    identificador = str(dados.get("identificador", "")).strip()
    senha = str(dados.get("senha", ""))

    if not identificador or not senha:
        return _erro("Informe seu e-mail ou nome de usuário e a senha.")

    alvo = identificador.lower()
    usuario = db.session.scalar(
        select(Usuario).where(
            (func.lower(Usuario.email) == alvo)
            | (func.lower(Usuario.nome_usuario) == normalizar_nome_usuario(identificador))
        )
    )

    # Mesma mensagem para conta inexistente e senha errada: dizer qual dos dois
    # falhou entrega quais e-mails têm conta no sistema.
    generico = "E-mail, nome de usuário ou senha não conferem."

    if usuario is None:
        # Gasta o mesmo tempo de um hash real para a resposta não denunciar,
        # pelo relógio, que a conta não existe.
        check_password_hash(
            "scrypt:32768:8:1$placeholder$" + "0" * 128,
            senha,
        )
        return _erro(generico, status=401)

    if not check_password_hash(usuario.senha_hash, senha):
        return _erro(generico, status=401)

    _abrir_sessao(usuario)
    return jsonify({"usuario": usuario.como_json()})


@bp.delete("/sessao")
def sair():
    session.clear()
    return jsonify({"ok": True})


@bp.get("/eu")
def eu():
    usuario = usuario_atual()
    if usuario is None:
        return jsonify({"usuario": None}), 200
    return jsonify({"usuario": usuario.como_json()})
