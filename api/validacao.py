"""Regras de validação do cadastro.

As mensagens são escritas para a pessoa que está cadastrando, não para quem
programou: dizem o que fazer, não o que falhou. É a mesma regra do resto do
app — ver docs/PLANEJAMENTO.md §6.2.
"""

from __future__ import annotations

import re
import unicodedata

NOME_USUARIO_MIN = 3
NOME_USUARIO_MAX = 20
SENHA_MIN = 8
SENHA_MAX = 128

_NOME_USUARIO = re.compile(r"^[a-z0-9][a-z0-9._-]*$")

# Validação de e-mail deliberadamente frouxa: o objetivo é pegar erro de
# digitação, não implementar a RFC 5322. Quem decide se o endereço existe é o
# envio, não a expressão regular.
_EMAIL = re.compile(r"^[^@\s]+@[^@\s.]+\.[^@\s]{2,}$")

# Senhas que aparecem em qualquer lista de vazamento. A checagem é por valor
# exato: não vale irritar a pessoa por usar "senha" dentro de uma frase longa.
_SENHAS_OBVIAS = {
    "12345678",
    "123456789",
    "1234567890",
    "senha123",
    "password",
    "qwertyui",
    "11111111",
    "abcd1234",
    "14bits123",
}


class ErroDeValidacao(ValueError):
    """Erro que pode ser mostrado direto para a pessoa."""

    def __init__(self, campo: str, mensagem: str) -> None:
        super().__init__(mensagem)
        self.campo = campo
        self.mensagem = mensagem


def normalizar_nome_usuario(bruto: str) -> str:
    """Minúsculas, sem acento — para `Joao` e `joão` não virarem contas diferentes."""
    sem_acento = unicodedata.normalize("NFKD", bruto.strip())
    sem_acento = "".join(c for c in sem_acento if not unicodedata.combining(c))
    return sem_acento.lower()


def validar_nome_usuario(bruto: str) -> str:
    nome = normalizar_nome_usuario(bruto)

    if not nome:
        raise ErroDeValidacao("nome_usuario", "Escolha um nome de usuário.")
    if len(nome) < NOME_USUARIO_MIN:
        raise ErroDeValidacao(
            "nome_usuario", f"O nome de usuário precisa de pelo menos {NOME_USUARIO_MIN} letras."
        )
    if len(nome) > NOME_USUARIO_MAX:
        raise ErroDeValidacao(
            "nome_usuario", f"O nome de usuário pode ter no máximo {NOME_USUARIO_MAX} letras."
        )
    if not _NOME_USUARIO.match(nome):
        raise ErroDeValidacao(
            "nome_usuario",
            "Use apenas letras, números, ponto, hífen e underline, começando por letra ou número.",
        )
    return nome


def validar_email(bruto: str) -> str:
    email = bruto.strip().lower()

    if not email:
        raise ErroDeValidacao("email", "Informe seu e-mail.")
    if len(email) > 255:
        raise ErroDeValidacao("email", "Esse e-mail é longo demais.")
    if not _EMAIL.match(email):
        raise ErroDeValidacao("email", "Esse e-mail não parece completo. Confira se está certo.")
    return email


def validar_senha(bruto: str) -> str:
    senha = bruto or ""

    if len(senha) < SENHA_MIN:
        raise ErroDeValidacao("senha", f"A senha precisa de pelo menos {SENHA_MIN} caracteres.")
    if len(senha) > SENHA_MAX:
        raise ErroDeValidacao("senha", "Essa senha é longa demais.")
    if senha.lower() in _SENHAS_OBVIAS:
        raise ErroDeValidacao(
            "senha", "Essa senha é das mais usadas no mundo. Escolha outra, mesmo que simples."
        )
    if senha.strip() == "":
        raise ErroDeValidacao("senha", "A senha não pode ser só espaços.")
    return senha
