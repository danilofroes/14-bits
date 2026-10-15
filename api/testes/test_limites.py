"""O limitador de tentativas.

Vive em arquivo separado porque o conftest desliga o limitador para os demais
testes — sem isso, qualquer suíte que crie várias contas seguidas esbarraria
nele.
"""

from __future__ import annotations

from api.extensoes import limiter


def test_tentativas_de_senha_sao_limitadas(cliente, conta):
    """Força bruta precisa esbarrar em alguma parede."""
    limiter.enabled = True
    limiter.reset()
    try:
        respostas = [
            cliente.post(
                "/api/sessao", json={"identificador": conta["email"], "senha": f"errada{n}"}
            ).status_code
            for n in range(15)
        ]
    finally:
        limiter.enabled = False
        limiter.reset()

    assert 401 in respostas, "as primeiras tentativas deveriam ser recusadas normalmente"
    assert 429 in respostas, "em algum momento o limitador precisa entrar"


def test_resposta_do_limite_explica_o_que_fazer(cliente, conta):
    limiter.enabled = True
    limiter.reset()
    try:
        ultima = None
        for n in range(15):
            ultima = cliente.post(
                "/api/sessao", json={"identificador": conta["email"], "senha": f"errada{n}"}
            )
        assert ultima.status_code == 429
        assert "minutos" in ultima.get_json()["erro"]
    finally:
        limiter.enabled = False
        limiter.reset()
