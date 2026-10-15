"""Configuração da API, lida do ambiente.

Nada de segredo fica no código. Em desenvolvimento há padrões seguros que
funcionam sem nenhuma variável definida; em produção a aplicação se recusa a
subir sem SECRET_KEY, que é o que protege o cookie de sessão.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field


def _lista(nome: str, padrao: str) -> list[str]:
    bruto = os.environ.get(nome, padrao)
    return [item.strip() for item in bruto.split(",") if item.strip()]


def _booleano(nome: str, padrao: bool) -> bool:
    bruto = os.environ.get(nome)
    if bruto is None:
        return padrao
    return bruto.strip().lower() in {"1", "true", "sim", "yes", "on"}


@dataclass
class Configuracao:
    ambiente: str = field(default_factory=lambda: os.environ.get("AMBIENTE", "desenvolvimento"))
    secret_key: str = ""
    database_uri: str = ""

    # Origens do front que podem falar com a API levando o cookie junto.
    origens_permitidas: list[str] = field(default_factory=list)

    # Em produção o cookie precisa de HTTPS. Com a API num subdomínio do site
    # (api.14bits.com.br), "Lax" basta e é mais seguro que "None".
    cookie_seguro: bool = False
    cookie_samesite: str = "Lax"
    cookie_dominio: str | None = None

    @property
    def em_producao(self) -> bool:
        return self.ambiente == "producao"


def carregar() -> Configuracao:
    cfg = Configuracao()

    cfg.secret_key = os.environ.get("SECRET_KEY", "")
    if not cfg.secret_key:
        if cfg.em_producao:
            raise RuntimeError(
                "SECRET_KEY não definida. Sem ela o cookie de sessão pode ser forjado."
            )
        # Fixa em desenvolvimento para a sessão sobreviver ao reinício do servidor.
        cfg.secret_key = "chave-apenas-de-desenvolvimento-nao-usar-em-producao"

    # O Railway entrega DATABASE_URL começando com "postgres://", que o
    # SQLAlchemy 2 não aceita mais.
    uri = os.environ.get("DATABASE_URL", "")
    if uri.startswith("postgres://"):
        uri = uri.replace("postgres://", "postgresql+psycopg://", 1)
    elif uri.startswith("postgresql://"):
        uri = uri.replace("postgresql://", "postgresql+psycopg://", 1)
    cfg.database_uri = uri or "sqlite:///14bits.db"

    cfg.origens_permitidas = _lista(
        "ORIGENS_PERMITIDAS", "http://localhost:5173,http://127.0.0.1:5173"
    )

    cfg.cookie_seguro = _booleano("COOKIE_SEGURO", cfg.em_producao)
    cfg.cookie_samesite = os.environ.get("COOKIE_SAMESITE", "Lax")
    cfg.cookie_dominio = os.environ.get("COOKIE_DOMINIO") or None

    # Cookie entre sites só funciona com SameSite=None, e aí HTTPS é obrigatório.
    if cfg.cookie_samesite.lower() == "none" and not cfg.cookie_seguro:
        raise RuntimeError("COOKIE_SAMESITE=None exige COOKIE_SEGURO=1 (HTTPS).")

    return cfg
