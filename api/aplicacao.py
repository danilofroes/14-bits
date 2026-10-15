"""Fábrica da aplicação Flask.

Roda local com SQLite e em produção com o Postgres do Railway, sem mudar
código — só variáveis de ambiente. Ver `api/LEIAME.md`.
"""

from __future__ import annotations

from datetime import timedelta

from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS

from . import configuracao
from .extensoes import limiter
from .modelos import db
from .rotas.autenticacao import bp as bp_autenticacao
from .rotas.progresso import bp as bp_progresso

# Sessão longa de propósito: o curso dura semanas e ninguém deveria precisar
# digitar a senha de novo entre uma aula e outra.
DURACAO_SESSAO = timedelta(days=90)


def criar_app(cfg: configuracao.Configuracao | None = None) -> Flask:
    load_dotenv()
    cfg = cfg or configuracao.carregar()

    app = Flask(__name__)
    app.config.update(
        SECRET_KEY=cfg.secret_key,
        SQLALCHEMY_DATABASE_URI=cfg.database_uri,
        SQLALCHEMY_ENGINE_OPTIONS={"pool_pre_ping": True},
        JSON_SORT_KEYS=False,
        PERMANENT_SESSION_LIFETIME=DURACAO_SESSAO,
        SESSION_COOKIE_NAME="14bits_sessao",
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SECURE=cfg.cookie_seguro,
        SESSION_COOKIE_SAMESITE=cfg.cookie_samesite,
        SESSION_COOKIE_DOMAIN=cfg.cookie_dominio,
    )

    db.init_app(app)
    limiter.init_app(app)

    # `supports_credentials` é o que permite o cookie de sessão atravessar do
    # front para a API. Sem origem explícita o navegador recusa.
    CORS(
        app,
        resources={r"/api/*": {"origins": cfg.origens_permitidas}},
        supports_credentials=True,
    )

    app.register_blueprint(bp_autenticacao, url_prefix="/api")
    app.register_blueprint(bp_progresso, url_prefix="/api")

    @app.get("/api/saude")
    def saude():
        return jsonify({"ok": True, "ambiente": cfg.ambiente})

    @app.errorhandler(404)
    def nao_encontrado(_e):
        return jsonify({"erro": "Endereço não existe nesta API."}), 404

    @app.errorhandler(429)
    def demasiadas(_e):
        return (
            jsonify({"erro": "Tentativas demais. Espere alguns minutos e tente de novo."}),
            429,
        )

    @app.errorhandler(500)
    def erro_interno(_e):
        db.session.rollback()
        return jsonify({"erro": "Algo deu errado aqui do nosso lado."}), 500

    with app.app_context():
        db.create_all()

    return app


app = criar_app()
