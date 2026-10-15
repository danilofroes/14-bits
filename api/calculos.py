"""Cálculos derivados do progresso.

Duas razões para o servidor recalcular XP e ofensiva em vez de aceitar o que o
cliente manda:

1. **Guardar menos.** Só as lições concluídas precisam existir no banco; todo o
   resto sai delas.
2. **Não dar para burlar.** Um cliente adulterado pode mandar 9999 de XP; não
   pode inventar lições que não existem no curso.

As regras aqui espelham `src/progresso/store.ts` e `src/engine/motor.ts` no
front. Se uma mudar, a outra muda junto.
"""

from __future__ import annotations

from datetime import date, timedelta

# Uma entrada maior que isso é adulteração, não aprendizado.
XP_MAXIMO_POR_LICAO = 100


def _data_de(valor: str | None) -> date | None:
    if not valor:
        return None
    try:
        return date.fromisoformat(valor)
    except ValueError:
        return None


def limpar_concluidas(bruto: object) -> dict[str, dict]:
    """Descarta qualquer coisa fora do formato esperado, sem reclamar.

    Progresso é dado de conveniência: uma entrada corrompida não deve impedir a
    pessoa de entrar na conta. O que não dá para entender, some.
    """
    if not isinstance(bruto, dict):
        return {}

    limpo: dict[str, dict] = {}
    for chave, valor in bruto.items():
        if not isinstance(chave, str) or "/" not in chave or len(chave) > 120:
            continue
        if not isinstance(valor, dict):
            continue

        xp = valor.get("xp")
        if not isinstance(xp, int) or isinstance(xp, bool):
            continue
        if xp < 0 or xp > XP_MAXIMO_POR_LICAO:
            continue

        quando = _data_de(valor.get("em"))
        if quando is None:
            continue

        limpo[chave] = {"xp": xp, "em": quando.isoformat()}

    return limpo


def mesclar(local: dict[str, dict], servidor: dict[str, dict]) -> dict[str, dict]:
    """Une os dois progressos.

    Em caso de conflito fica o **maior XP** (a pessoa já mostrou que consegue)
    e a **data mais antiga** (foi quando ela realmente fez a lição, e é isso que
    conta para a ofensiva).
    """
    resultado = dict(servidor)

    for chave, entrada in local.items():
        atual = resultado.get(chave)
        if atual is None:
            resultado[chave] = entrada
            continue

        data_antiga = min(_data_de(atual["em"]) or date.max, _data_de(entrada["em"]) or date.max)
        resultado[chave] = {
            "xp": max(atual["xp"], entrada["xp"]),
            "em": data_antiga.isoformat(),
        }

    return resultado


def xp_total(concluidas: dict[str, dict]) -> int:
    return sum(entrada["xp"] for entrada in concluidas.values())


def dias_de_estudo(concluidas: dict[str, dict]) -> list[date]:
    """Dias distintos em que houve conclusão, do mais recente para o mais antigo."""
    dias = {_data_de(e["em"]) for e in concluidas.values()}
    return sorted((d for d in dias if d is not None), reverse=True)


def ofensiva(concluidas: dict[str, dict]) -> tuple[int, str | None]:
    """Sequência de dias seguidos de estudo, terminando no dia mais recente.

    Devolve (tamanho, último dia). Espelha `proximaOfensiva` do front: mesmo dia
    não soma, dia seguinte soma, buraco recomeça.
    """
    dias = dias_de_estudo(concluidas)
    if not dias:
        return 0, None

    sequencia = 1
    for anterior, seguinte in zip(dias, dias[1:]):
        if anterior - seguinte == timedelta(days=1):
            sequencia += 1
        else:
            break

    return sequencia, dias[0].isoformat()


def resumo(concluidas: dict[str, dict]) -> dict:
    """O formato que o front consome — o mesmo do store local."""
    tamanho, ultimo = ofensiva(concluidas)
    return {
        "concluidas": concluidas,
        "xpTotal": xp_total(concluidas),
        "ofensiva": tamanho,
        "ultimoDia": ultimo,
    }
