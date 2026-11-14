// Autor: Murilo Xavier Sarra da Cunha
//
// Rota da tela de Listagem de Demandas (Reunião 5):
//   GET /demandas
//
// Lista as demandas lidas do banco de dados, com título, tipo, prioridade, status, projeto,
// responsável, data de criação e prazo. Aceita parâmetros na URL (query string) para filtrar,
// buscar e ordenar:
//
//   FILTROS (podem ser combinados):
//     status       -> Aberta | Em andamento | Em revisão | Concluída | Cancelada
//     prioridade   -> Crítica | Alta | Média | Baixa
//     tipo         -> Tarefa | Defeito | Melhoria | Documentação
//     responsavel  -> id do usuário responsável (ex.: 2)
//     projeto      -> id do projeto (ex.: 1)
//   BUSCA:
//     busca        -> procura o texto no título, na descrição ou no nome do responsável
//   ORDENAÇÃO:
//     ordenarPor   -> prioridade | dataCriacao | prazo | status
//     ordem        -> asc (padrão) | desc
//
//   Exemplos:
//     /demandas
//     /demandas?status=Aberta&prioridade=Crítica
//     /demandas?busca=login
//     /demandas?projeto=1&ordenarPor=prazo
//
// Cada usuário só enxerga as demandas dos projetos aos quais tem acesso (o Administrador enxerga
// todas; Líder e Membro, só as dos projetos em que estão vinculados).
// Valores inválidos nos filtros devolvem erro 400.

import { Express, Request, Response } from "express";
import { exigirLogin } from "../autenticacao";
import { clausulaVisibilidade, COLUNAS_DEMANDA, carregarPrioridades, carregarStatus, carregarTipos, filtroBusca, JOINS_DEMANDA, montarDemanda } from "../consultas";
import { getConn } from "../db";
import { Binds, Linha, UsuarioLogado } from "../tipos";
import { encontrarPorNome, lerNumeroInteiro, prepararBusca, textoOuVazio } from "../utilitarios";

// Para ordenar, cada opção da URL corresponde a uma coluna do banco. Prioridade e status usam a
// coluna "ordem" das tabelas de apoio (não dá para ordenar pelo nome: "Alta" viria antes de "Crítica").
const COLUNAS_ORDENACAO = [
  { nome: "prioridade", coluna: "pr.ordem" },
  { nome: "dataCriacao", coluna: "d.data_criacao" },
  { nome: "prazo", coluna: "d.prazo" },
  { nome: "status", coluna: "s.ordem" },
];

export function registrarRotasListagem(app: Express) {
  app.get("/demandas", exigirLogin, async (req: Request, res: Response) => {
    const usuario = req.usuario as UsuarioLogado;

    // 1. Lê os parâmetros que vieram na URL (req.query)
    const statusTexto = textoOuVazio(req.query.status);
    const prioridadeTexto = textoOuVazio(req.query.prioridade);
    const tipoTexto = textoOuVazio(req.query.tipo);
    const responsavelTexto = textoOuVazio(req.query.responsavel);
    const projetoTexto = textoOuVazio(req.query.projeto);
    const busca = prepararBusca(textoOuVazio(req.query.busca));
    const ordenarPorTexto = textoOuVazio(req.query.ordenarPor);
    const ordemTexto = textoOuVazio(req.query.ordem).toLowerCase();

    // 2. Valida o que não depende do banco
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

    let colunaOrdenacao: { nome: string; coluna: string } | null = null;
    if (ordenarPorTexto !== "") {
      colunaOrdenacao = encontrarPorNome(COLUNAS_ORDENACAO, ordenarPorTexto);
      if (colunaOrdenacao === null) {
        return res.status(400).json({
          mensagem: "Campo de ordenação inválido. Valores aceitos: " + COLUNAS_ORDENACAO.map((c) => c.nome).join(", ") + ".",
        });
      }
    }

    if (ordemTexto !== "" && ordemTexto !== "asc" && ordemTexto !== "desc") {
      return res.status(400).json({ mensagem: "Ordem inválida. Valores aceitos: asc ou desc." });
    }
    const direcao = ordemTexto === "desc" ? "DESC" : "ASC";

    let conn;
    try {
      conn = await getConn();

      // 3. Valida status, prioridade e tipo contra as tabelas de apoio do banco
      const binds: Binds = {};
      let filtros = clausulaVisibilidade(usuario, binds);

      if (statusTexto !== "") {
        const lista = await carregarStatus(conn);
        const item = encontrarPorNome(lista, statusTexto);
        if (item === null) {
          return res.status(400).json({ mensagem: "Status inválido. Valores aceitos: " + lista.map((i) => i.nome).join(", ") + "." });
        }
        filtros += " AND d.id_status = :statusId";
        binds.statusId = item.id;
      }

      if (prioridadeTexto !== "") {
        const lista = await carregarPrioridades(conn);
        const item = encontrarPorNome(lista, prioridadeTexto);
        if (item === null) {
          return res.status(400).json({ mensagem: "Prioridade inválida. Valores aceitos: " + lista.map((i) => i.nome).join(", ") + "." });
        }
        filtros += " AND d.id_prioridade = :prioridadeId";
        binds.prioridadeId = item.id;
      }

      if (tipoTexto !== "") {
        const lista = await carregarTipos(conn);
        const item = encontrarPorNome(lista, tipoTexto);
        if (item === null) {
          return res.status(400).json({ mensagem: "Tipo inválido. Valores aceitos: " + lista.map((i) => i.nome).join(", ") + "." });
        }
        filtros += " AND d.id_tipo = :tipoId";
        binds.tipoId = item.id;
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

      // 4. Ordenação. Demandas sem prazo ficam sempre no final. O id desempata, para o resultado
      //    sair sempre na mesma ordem. Sem ordenarPor, mantém a ordem de cadastro (por id).
      let ordenacao = "ORDER BY d.id_demanda";
      if (colunaOrdenacao !== null) {
        const nulosPorUltimo = colunaOrdenacao.nome === "prazo" ? " NULLS LAST" : "";
        ordenacao = `ORDER BY ${colunaOrdenacao.coluna} ${direcao}${nulosPorUltimo}, d.id_demanda ${direcao}`;
      }

      // 5. Executa a consulta e responde 200 com a lista (um array, que pode vir vazio)
      const resultado = await conn.execute(`SELECT ${COLUNAS_DEMANDA} ${JOINS_DEMANDA} WHERE 1 = 1 ${filtros} ${ordenacao}`, binds);
      const demandas = (resultado.rows ?? []) as Linha[];

      return res.status(200).json(demandas.map(montarDemanda));
    } catch (erro) {
      console.error(erro);
      return res.status(500).json({ mensagem: "Erro ao listar as demandas!" });
    } finally {
      if (conn) await conn.close();
    }
  });
}
