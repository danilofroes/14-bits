"""Sincronização de progresso: mesclagem e valores derivados."""

from __future__ import annotations

from api.calculos import limpar_concluidas, mesclar, ofensiva, xp_total


def licao(chave: str, xp: int, em: str) -> dict:
    return {chave: {"xp": xp, "em": em}}


class TestExigeSessao:
    def test_ler_sem_conta_responde_401(self, cliente):
        assert cliente.get("/api/progresso").status_code == 401

    def test_gravar_sem_conta_responde_401(self, cliente):
        assert cliente.put("/api/progresso", json={"concluidas": {}}).status_code == 401


class TestSincronizacao:
    def test_conta_nova_comeca_zerada(self, cliente, conta):
        corpo = cliente.get("/api/progresso").get_json()
        assert corpo == {"concluidas": {}, "xpTotal": 0, "ofensiva": 0, "ultimoDia": None}

    def test_envia_progresso_local_e_recebe_totais(self, cliente, conta):
        corpo = cliente.put(
            "/api/progresso",
            json={"concluidas": licao("t1/a", 20, "2026-10-15")},
        ).get_json()

        assert corpo["xpTotal"] == 20
        assert corpo["ofensiva"] == 1
        assert corpo["ultimoDia"] == "2026-10-15"

    def test_progresso_persiste_entre_requisicoes(self, cliente, conta):
        cliente.put("/api/progresso", json={"concluidas": licao("t1/a", 20, "2026-10-15")})
        cliente.delete("/api/sessao")
        cliente.post(
            "/api/sessao", json={"identificador": conta["email"], "senha": conta["senha"]}
        )

        corpo = cliente.get("/api/progresso").get_json()
        assert corpo["xpTotal"] == 20

    def test_sincronizar_mescla_em_vez_de_substituir(self, cliente, conta):
        """Quem estudou no celular e depois no computador da Nave não perde nada."""
        cliente.put("/api/progresso", json={"concluidas": licao("t1/a", 20, "2026-10-15")})

        corpo = cliente.put(
            "/api/progresso", json={"concluidas": licao("t1/b", 15, "2026-10-16")}
        ).get_json()

        assert set(corpo["concluidas"]) == {"t1/a", "t1/b"}
        assert corpo["xpTotal"] == 35

    def test_enviar_vazio_nao_apaga_o_que_ja_existia(self, cliente, conta):
        """Um aparelho novo, ainda sem progresso, não pode zerar a conta."""
        cliente.put("/api/progresso", json={"concluidas": licao("t1/a", 20, "2026-10-15")})

        corpo = cliente.put("/api/progresso", json={"concluidas": {}}).get_json()
        assert corpo["xpTotal"] == 20


class TestMesclagem:
    def test_conflito_fica_com_o_maior_xp(self):
        local = licao("t1/a", 25, "2026-10-15")
        servidor = licao("t1/a", 12, "2026-10-15")
        assert mesclar(local, servidor)["t1/a"]["xp"] == 25

    def test_conflito_fica_com_a_data_mais_antiga(self):
        # A data serve à ofensiva, então o que vale é quando a pessoa fez de fato.
        local = licao("t1/a", 10, "2026-10-20")
        servidor = licao("t1/a", 10, "2026-10-15")
        assert mesclar(local, servidor)["t1/a"]["em"] == "2026-10-15"

    def test_mesclagem_e_simetrica_no_conjunto_de_chaves(self):
        a = licao("t1/a", 10, "2026-10-15")
        b = licao("t1/b", 10, "2026-10-16")
        assert set(mesclar(a, b)) == set(mesclar(b, a))


class TestValoresDerivados:
    def test_xp_total_e_a_soma_das_licoes(self):
        concluidas = {**licao("t1/a", 20, "2026-10-15"), **licao("t1/b", 15, "2026-10-16")}
        assert xp_total(concluidas) == 35

    def test_ofensiva_conta_dias_seguidos(self):
        concluidas = {
            **licao("t1/a", 10, "2026-10-13"),
            **licao("t1/b", 10, "2026-10-14"),
            **licao("t1/c", 10, "2026-10-15"),
        }
        assert ofensiva(concluidas) == (3, "2026-10-15")

    def test_duas_licoes_no_mesmo_dia_contam_um_dia_so(self):
        concluidas = {**licao("t1/a", 10, "2026-10-15"), **licao("t1/b", 10, "2026-10-15")}
        assert ofensiva(concluidas) == (1, "2026-10-15")

    def test_buraco_na_sequencia_recomeca_a_contagem(self):
        concluidas = {
            **licao("t1/a", 10, "2026-10-10"),
            **licao("t1/b", 10, "2026-10-11"),
            # pulou o dia 12
            **licao("t1/c", 10, "2026-10-13"),
            **licao("t1/d", 10, "2026-10-14"),
        }
        assert ofensiva(concluidas) == (2, "2026-10-14")

    def test_sem_licao_nenhuma_a_ofensiva_e_zero(self):
        assert ofensiva({}) == (0, None)


class TestLimpeza:
    """O servidor recalcula tudo, então lixo do cliente precisa sumir sem quebrar."""

    def test_descarta_xp_absurdo(self):
        assert limpar_concluidas(licao("t1/a", 999_999, "2026-10-15")) == {}

    def test_descarta_xp_negativo(self):
        assert limpar_concluidas(licao("t1/a", -5, "2026-10-15")) == {}

    def test_descarta_data_invalida(self):
        assert limpar_concluidas(licao("t1/a", 10, "ontem")) == {}

    def test_descarta_chave_sem_trilha(self):
        assert limpar_concluidas({"semabarra": {"xp": 10, "em": "2026-10-15"}}) == {}

    def test_descarta_booleano_disfarcado_de_xp(self):
        # True é int em Python; sem a checagem viraria 1 de XP.
        assert limpar_concluidas({"t1/a": {"xp": True, "em": "2026-10-15"}}) == {}

    def test_aceita_entrada_valida_no_meio_do_lixo(self):
        bruto = {
            "t1/boa": {"xp": 20, "em": "2026-10-15"},
            "t1/ruim": {"xp": "muito", "em": "2026-10-15"},
            "lixo": "nem dicionario e",
        }
        assert limpar_concluidas(bruto) == {"t1/boa": {"xp": 20, "em": "2026-10-15"}}

    def test_nao_quebra_com_tipos_inesperados(self):
        for entrada in (None, [], "texto", 42):
            assert limpar_concluidas(entrada) == {}

    def test_xp_adulterado_nao_entra_pela_api(self, cliente, conta):
        corpo = cliente.put(
            "/api/progresso", json={"concluidas": licao("t1/a", 999_999, "2026-10-15")}
        ).get_json()
        assert corpo["xpTotal"] == 0
