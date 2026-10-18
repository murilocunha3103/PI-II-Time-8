// Autor: Murilo Xavier Sarra da Cunha
//
// Rota da tela de Listagem de Demandas (Reunião 4):
//   GET /demandas
//
// Lista as demandas com título, tipo, prioridade, status, projeto, responsável, data de
// criação e prazo de finalização. Aceita parâmetros na URL (query string) para filtrar,
// buscar e ordenar:
//
//   FILTROS (podem ser combinados):
//     status        -> Aberta | Em andamento | Em revisão | Concluída | Cancelada
//     prioridade    -> Crítica | Alta | Média | Baixa
//     tipo          -> Tarefa | Defeito | Melhoria | Documentação
//     responsavel   -> id do usuário responsável (ex.: 2)
//     projeto       -> id do projeto (ex.: 1)
//   BUSCA:
//     busca         -> procura o texto no título ou na descrição
//   ORDENAÇÃO:
//     ordenarPor    -> prioridade | dataCriacao | prazo | status
//     ordem         -> asc (padrão) | desc
//
//   Exemplos:
//     /demandas
//     /demandas?status=Aberta&prioridade=Crítica
//     /demandas?busca=login
//     /demandas?projeto=1&ordenarPor=prazo
//     /demandas?ordenarPor=prioridade&ordem=desc
//
// Os valores de status, prioridade e tipo não diferenciam maiúscula/minúscula nem acento
// ("critica" funciona igual a "Crítica"). Valores inválidos devolvem erro 400.

import { Express, Request, Response } from "express";
import { demandas, montarDemandaDetalhada } from "../dados/dados";
import { PRIORIDADES_VALIDAS, STATUS_VALIDOS, TIPOS_VALIDOS } from "../tipos";
import { encontrarValorValido, lerNumeroInteiro, semAcento, textoOuVazio } from "../utilitarios";

// Para ordenar por prioridade e por status não dá para usar a ordem alfabética
// ("Alta" viria antes de "Crítica"). Por isso, cada valor ganha um número que
// representa a posição dele. Em ordem crescente (asc), a prioridade vai da mais
// urgente para a menos urgente, e o status segue o fluxo da demanda.
const POSICAO_PRIORIDADE: Record<string, number> = { "Crítica": 1, "Alta": 2, "Média": 3, "Baixa": 4 };
const POSICAO_STATUS: Record<string, number> = {
  "Aberta": 1,
  "Em andamento": 2,
  "Em revisão": 3,
  "Concluída": 4,
  "Cancelada": 5
};

const CAMPOS_ORDENACAO = ["prioridade", "dataCriacao", "prazo", "status"];
const ORDENS_VALIDAS = ["asc", "desc"];

export function registrarRotasListagem(app: Express) {
  app.get("/demandas", (req: Request, res: Response) => {
    // 1. Lê os parâmetros que vieram na URL (req.query)
    const statusTexto = textoOuVazio(req.query.status);
    const prioridadeTexto = textoOuVazio(req.query.prioridade);
    const tipoTexto = textoOuVazio(req.query.tipo);
    const responsavelTexto = textoOuVazio(req.query.responsavel);
    const projetoTexto = textoOuVazio(req.query.projeto);
    const busca = semAcento(textoOuVazio(req.query.busca)).toLowerCase();
    const ordenarPorTexto = textoOuVazio(req.query.ordenarPor);
    const ordemTexto = textoOuVazio(req.query.ordem);

    // 2. Valida cada parâmetro que foi preenchido. Se algum for inválido, a API
    //    responde 400 com uma mensagem clara e não executa a consulta.
    let statusFiltro: string | null = null;
    if (statusTexto !== "") {
      statusFiltro = encontrarValorValido(statusTexto, STATUS_VALIDOS);

      if (statusFiltro === null) {
        return res.status(400).json({ mensagem: "Status inválido. Valores aceitos: " + STATUS_VALIDOS.join(", ") + "." });
      }
    }

    let prioridadeFiltro: string | null = null;
    if (prioridadeTexto !== "") {
      prioridadeFiltro = encontrarValorValido(prioridadeTexto, PRIORIDADES_VALIDAS);

      if (prioridadeFiltro === null) {
        return res
          .status(400)
          .json({ mensagem: "Prioridade inválida. Valores aceitos: " + PRIORIDADES_VALIDAS.join(", ") + "." });
      }
    }

    let tipoFiltro: string | null = null;
    if (tipoTexto !== "") {
      tipoFiltro = encontrarValorValido(tipoTexto, TIPOS_VALIDOS);

      if (tipoFiltro === null) {
        return res.status(400).json({ mensagem: "Tipo inválido. Valores aceitos: " + TIPOS_VALIDOS.join(", ") + "." });
      }
    }

    let responsavelFiltro: number | null = null;
    if (responsavelTexto !== "") {
      responsavelFiltro = lerNumeroInteiro(responsavelTexto);

      if (responsavelFiltro === null) {
        return res.status(400).json({ mensagem: "O responsável deve ser informado pelo id (número inteiro)." });
      }
    }

    let projetoFiltro: number | null = null;
    if (projetoTexto !== "") {
      projetoFiltro = lerNumeroInteiro(projetoTexto);

      if (projetoFiltro === null) {
        return res.status(400).json({ mensagem: "O projeto deve ser informado pelo id (número inteiro)." });
      }
    }

    let campoOrdenacao: string | null = null;
    if (ordenarPorTexto !== "") {
      campoOrdenacao = encontrarValorValido(ordenarPorTexto, CAMPOS_ORDENACAO);

      if (campoOrdenacao === null) {
        return res
          .status(400)
          .json({ mensagem: "Campo de ordenação inválido. Valores aceitos: " + CAMPOS_ORDENACAO.join(", ") + "." });
      }
    }

    let ordem = "asc";
    if (ordemTexto !== "") {
      const ordemEncontrada = encontrarValorValido(ordemTexto, ORDENS_VALIDAS);

      if (ordemEncontrada === null) {
        return res.status(400).json({ mensagem: "Ordem inválida. Valores aceitos: asc ou desc." });
      }

      ordem = ordemEncontrada;
    }

    // 3. Aplica os filtros e a busca. Uma demanda só entra no resultado se passar em
    //    TODOS os critérios informados (os que não foram informados são ignorados).
    const resultado = demandas.map(montarDemandaDetalhada).filter((demanda) => {
      const textoParaBusca = semAcento(demanda.titulo + " " + demanda.descricao).toLowerCase();

      const bateComBusca = busca === "" || textoParaBusca.includes(busca);
      const bateComStatus = statusFiltro === null || demanda.status === statusFiltro;
      const bateComPrioridade = prioridadeFiltro === null || demanda.prioridade === prioridadeFiltro;
      const bateComTipo = tipoFiltro === null || demanda.tipo === tipoFiltro;
      const bateComResponsavel =
        responsavelFiltro === null || (demanda.responsavel !== null && demanda.responsavel.id === responsavelFiltro);
      const bateComProjeto = projetoFiltro === null || demanda.projeto.id === projetoFiltro;

      return bateComBusca && bateComStatus && bateComPrioridade && bateComTipo && bateComResponsavel && bateComProjeto;
    });

    // 4. Ordena o resultado, se foi pedido. Sem ordenarPor, mantém a ordem de cadastro (por id).
    if (campoOrdenacao !== null) {
      resultado.sort((a, b) => {
        let comparacao = 0;

        if (campoOrdenacao === "prioridade") {
          comparacao = POSICAO_PRIORIDADE[a.prioridade] - POSICAO_PRIORIDADE[b.prioridade];
        } else if (campoOrdenacao === "status") {
          comparacao = POSICAO_STATUS[a.status] - POSICAO_STATUS[b.status];
        } else if (campoOrdenacao === "dataCriacao") {
          comparacao = a.dataCriacao.localeCompare(b.dataCriacao);
        } else if (campoOrdenacao === "prazo") {
          // Demandas sem prazo definido ficam sempre no final da lista
          if (a.prazo === null && b.prazo === null) {
            return 0;
          }
          if (a.prazo === null) {
            return 1;
          }
          if (b.prazo === null) {
            return -1;
          }

          comparacao = a.prazo.localeCompare(b.prazo);
        }

        // Em caso de empate, desempata pelo id para o resultado ficar sempre igual
        if (comparacao === 0) {
          comparacao = a.id - b.id;
        }

        return ordem === "desc" ? -comparacao : comparacao;
      });
    }

    // 5. Responde 200 com a lista (um array JSON, que pode vir vazio)
    return res.status(200).json(resultado);
  });
}
