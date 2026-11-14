// Autor: Arthur de Senna Nardi Cortina
//
// Rota do Dashboard (Reunião 5):
//   GET /dashboard
//
// Devolve os indicadores da tela inicial, calculados a partir dos dados do banco: total de
// demandas, quantidade por status, por prioridade e por tipo, as demandas críticas em aberto e as
// demandas próximas do prazo de finalização.
//
// Cada usuário só vê os números dos projetos que enxerga: o Administrador, todos; o Líder de Projeto
// e o Membro da Equipe, apenas os projetos aos quais estão vinculados.
//
// CRITÉRIOS ADOTADOS PELA EQUIPE:
//   - "Em aberto": demanda com status Aberta (registrada e ainda não iniciada). Logo,
//     "críticas em aberto" = prioridade Crítica + status Aberta.
//   - "Próximas do prazo": demanda ainda não finalizada (status diferente de Concluída e Cancelada)
//     com prazo entre hoje e os próximos 7 dias, inclusive.
//
// Filtros opcionais pela URL:
//   /dashboard?prioridade=Alta      /dashboard?responsavel=2 (id do usuário)
//   /dashboard?projeto=1 (id)       /dashboard?busca=login (título, descrição ou nome do responsável)

import { Express, Request, Response } from "express";
import { exigirLogin } from "../autenticacao";
import { clausulaVisibilidade, COLUNAS_DEMANDA, carregarPrioridades, carregarStatus, carregarTipos, filtroBusca, JOINS_DEMANDA, montarDemanda } from "../consultas";
import { getConn } from "../db";
import { Binds, Linha, PRIORIDADE_CRITICA, STATUS, UsuarioLogado } from "../tipos";
import { encontrarPorNome, lerNumeroInteiro, prepararBusca, textoOuVazio } from "../utilitarios";

const DIAS_PROXIMO_PRAZO = 7;

export function registrarRotasDashboard(app: Express) {
  app.get("/dashboard", exigirLogin, async (req: Request, res: Response) => {
    const usuario = req.usuario as UsuarioLogado;

    // 1. Lê os filtros opcionais da URL (req.query)
    const prioridadeTexto = textoOuVazio(req.query.prioridade);
    const responsavelTexto = textoOuVazio(req.query.responsavel);
    const projetoTexto = textoOuVazio(req.query.projeto);
    const busca = prepararBusca(textoOuVazio(req.query.busca));

    // 2. Valida os filtros numéricos (a prioridade é validada depois, com a lista do banco)
    let responsavelId: number | null = null;
    if (responsavelTexto !== "") {
      responsavelId = lerNumeroInteiro(responsavelTexto);
      if (responsavelId === null) {
        return res.status(400).json({ mensagem: "O responsável deve ser informado pelo id (número inteiro)." });
      }
    }

    let projetoId: number | null = null;
    if (projetoTexto !== "") {
      projetoId = lerNumeroInteiro(projetoTexto);
      if (projetoId === null) {
        return res.status(400).json({ mensagem: "O projeto deve ser informado pelo id (número inteiro)." });
      }
    }

    let conn;
    try {
      conn = await getConn();

      // As tabelas de apoio dão os nomes e garantem que todo status, prioridade e tipo apareça
      // na resposta, mesmo com zero demandas
      const listaStatus = await carregarStatus(conn);
      const listaPrioridades = await carregarPrioridades(conn);
      const listaTipos = await carregarTipos(conn);

      // 3. Monta o WHERE: cada filtro preenchido acrescenta uma condição e um bind
      const binds: Binds = {};
      let filtros = clausulaVisibilidade(usuario, binds);

      if (prioridadeTexto !== "") {
        const prioridade = encontrarPorNome(listaPrioridades, prioridadeTexto);
        if (prioridade === null) {
          return res.status(400).json({
            mensagem: "Prioridade inválida. Valores aceitos: " + listaPrioridades.map((item) => item.nome).join(", ") + ".",
          });
        }
        filtros += " AND d.id_prioridade = :prioridadeId";
        binds.prioridadeId = prioridade.id;
      }

      if (responsavelId !== null) {
        filtros += " AND d.id_responsavel = :responsavelId";
        binds.responsavelId = responsavelId;
      }

      if (projetoId !== null) {
        filtros += " AND d.id_projeto = :projetoId";
        binds.projetoId = projetoId;
      }

      filtros += filtroBusca(busca, binds);

      // 4. Busca as demandas filtradas. A coluna "proximaDoPrazo" já vem calculada pelo banco:
      //    1 se a demanda não está finalizada e o prazo cai entre hoje e hoje + 7 dias.
      const resultado = await conn.execute(
        `SELECT ${COLUNAS_DEMANDA},
                CASE WHEN s.finalizado = 'N'
                      AND d.prazo BETWEEN TRUNC(SYSDATE) AND TRUNC(SYSDATE) + ${DIAS_PROXIMO_PRAZO}
                     THEN 1 ELSE 0 END AS "proximaDoPrazo"
           ${JOINS_DEMANDA}
          WHERE 1 = 1 ${filtros}
          ORDER BY d.id_demanda`,
        binds
      );
      const demandas = (resultado.rows ?? []) as Linha[];

      // 5. Conta tudo. Os contadores começam em zero para cada item das tabelas de apoio.
      const porStatus: Record<string, number> = {};
      const porPrioridade: Record<string, number> = {};
      const porTipo: Record<string, number> = {};
      listaStatus.forEach((item) => (porStatus[item.nome] = 0));
      listaPrioridades.forEach((item) => (porPrioridade[item.nome] = 0));
      listaTipos.forEach((item) => (porTipo[item.nome] = 0));

      const criticasEmAberto: Linha[] = [];
      const proximasDoPrazo: Linha[] = [];

      demandas.forEach((demanda) => {
        porStatus[demanda.status]++;
        porPrioridade[demanda.prioridade]++;
        porTipo[demanda.tipo]++;

        if (demanda.prioridadeId === PRIORIDADE_CRITICA && demanda.statusId === STATUS.ABERTA) {
          criticasEmAberto.push(demanda);
        }

        if (demanda.proximaDoPrazo === 1) {
          proximasDoPrazo.push(demanda);
        }
      });

      // As que vencem primeiro aparecem primeiro (as datas AAAA-MM-DD podem ser comparadas como texto)
      proximasDoPrazo.sort((a, b) => a.prazo.localeCompare(b.prazo) || a.id - b.id);

      // 6. Responde 200 com os indicadores e a explicação dos critérios adotados
      return res.status(200).json({
        totalDemandas: demandas.length,
        porStatus,
        porPrioridade,
        porTipo,
        criticasEmAberto: {
          quantidade: criticasEmAberto.length,
          demandas: criticasEmAberto.map(montarDemanda),
        },
        proximasDoPrazo: {
          quantidade: proximasDoPrazo.length,
          demandas: proximasDoPrazo.map(montarDemanda),
        },
        criterios: {
          emAberto: "Demanda com status Aberta (ainda não iniciada). Críticas em aberto = prioridade Crítica + status Aberta.",
          proximasDoPrazo:
            "Demanda não finalizada (status diferente de Concluída e Cancelada) com prazo entre hoje e os próximos " +
            DIAS_PROXIMO_PRAZO +
            " dias, inclusive.",
        },
      });
    } catch (erro) {
      console.error(erro);
      return res.status(500).json({ mensagem: "Erro ao consultar o dashboard!" });
    } finally {
      if (conn) await conn.close();
    }
  });
}
