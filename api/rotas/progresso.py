"""Leitura e sincronização do progresso."""

from __future__ import annotations

from flask import Blueprint, jsonify, request

from ..calculos import limpar_concluidas, mesclar, resumo
from ..modelos import Progresso, db
from .autenticacao import usuario_atual

bp = Blueprint("progresso", __name__)


def _sem_sessao():
    return jsonify({"erro": "Entre na sua conta para sincronizar o progresso."}), 401


def _registro(usuario) -> Progresso:
    if usuario.progresso is None:
        usuario.progresso = Progresso(concluidas={})
        db.session.commit()
    return usuario.progresso


@bp.get("/progresso")
def ler():
    usuario = usuario_atual()
    if usuario is None:
        return _sem_sessao()
    return jsonify(resumo(_registro(usuario).concluidas))


@bp.put("/progresso")
def sincronizar():
    """Mescla o progresso do aparelho com o da conta e devolve o resultado.

    É mesclagem, não substituição: quem estudou no celular e depois entrou no
    computador da Nave não pode perder o que fez. Ver `calculos.mesclar`.
    """
    usuario = usuario_atual()
    if usuario is None:
        return _sem_sessao()

    dados = request.get_json(silent=True) or {}
    local = limpar_concluidas(dados.get("concluidas"))

    registro = _registro(usuario)
    mesclado = mesclar(local, limpar_concluidas(registro.concluidas))

    registro.concluidas = mesclado
    # Reatribuir o dicionário inteiro é o que faz o SQLAlchemy perceber a
    # mudança: alterar um JSON no lugar não marca o objeto como sujo.
    db.session.commit()

    return jsonify(resumo(mesclado))
