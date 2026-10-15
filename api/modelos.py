"""Tabelas da API.

Princípio que guia este arquivo: **guardar o mínimo**.

O público do curso inclui adolescentes, então cada campo guardado precisa se
justificar. Por isso aqui só existe o necessário para a conta funcionar
(identificar, autenticar, sincronizar) — e nada além.

Em particular, **as reflexões não sobem para o servidor**. São texto livre que
a pessoa escreve sobre a própria vida, e ficam só no aparelho dela.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime, timezone

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import JSON, DateTime, ForeignKey, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


db = SQLAlchemy(model_class=Base)


def agora() -> datetime:
    return datetime.now(timezone.utc)


def novo_id() -> str:
    return str(uuid.uuid4())


class Usuario(db.Model):
    __tablename__ = "usuarios"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=novo_id)

    # Guardados em minúsculas para a unicidade não depender de maiúsculas.
    nome_usuario: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)

    # Hash com scrypt (padrão do Werkzeug 3). A senha em si nunca é guardada.
    senha_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=agora)
    ultimo_acesso: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=agora)

    progresso: Mapped[Progresso | None] = relationship(
        back_populates="usuario", cascade="all, delete-orphan", uselist=False
    )

    def como_json(self) -> dict:
        return {
            "id": self.id,
            "nome_usuario": self.nome_usuario,
            "email": self.email,
            "criado_em": self.criado_em.isoformat(),
        }


class Progresso(db.Model):
    """Progresso sincronizado.

    Guarda **só as lições concluídas**. XP, ofensiva e totais são derivados
    disso no servidor — ver `calculos.py`. Além de guardar menos, isso impede
    que um cliente adulterado mande 9999 de XP.
    """

    __tablename__ = "progressos"

    usuario_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("usuarios.id", ondelete="CASCADE"), primary_key=True
    )

    # { "trilha/licao": { "xp": 12, "em": "2026-10-15" } }
    concluidas: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=agora, onupdate=agora
    )

    usuario: Mapped[Usuario] = relationship(back_populates="progresso")


def hoje_iso() -> str:
    return date.today().isoformat()
