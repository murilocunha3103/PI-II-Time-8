// Autor: Murilo Xavier Sarra da Cunha
//
// Rota do Histórico de alterações da demanda (Reunião 5, item 2.2.7 do Documento de Visão):
//   GET /demandas/:id/historico
//
// Devolve, do mais recente para o mais antigo, as alterações registradas na demanda: mudanças de
// status, de responsável, de prioridade, de prazo e o cancelamento, indicando QUEM alterou e
// QUANDO. Cada registro já vem com uma frase pronta para a tela, no formato do Documento de Visão:
//   "João alterou o status da demanda de Aberta para Em andamento."
//
// O histórico é gravado pelas rotas que alteram a demanda (status, edição e cancelamento) e nunca
// é apagado: não existe rota para excluir ou editar registros do histórico.

import { Express, Request, Response } from "express";
import { exigirLogin } from "../autenticacao";
import { buscarDemanda, usuarioEnxergaProjeto } from "../consultas";
import { getConn } from "../db";
import { Linha, UsuarioLogado } from "../tipos";
import { dataParaBR } from "../utilitarios";

// Monta a frase do histórico a partir do registro do banco
function montarMensagem(registro: Linha): string {
  const nome = registro.usuarioNome;
  const anterior = registro.valorAnterior;
  const novo = registro.valorNovo;

  if (registro.campo === "STATUS") {
    return `${nome} alterou o status da demanda de ${anterior} para ${novo}.`;
  }

  if (registro.campo === "CANCELAMENTO") {
    return `${nome} cancelou a demanda (status anterior: ${anterior}).`;
  }

  if (registro.campo === "PRIORIDADE") {
    return `${nome} alterou a prioridade da demanda de ${anterior} para ${novo}.`;
  }

  if (registro.campo === "RESPONSAVEL") {
    if (anterior === null) {
      return `${nome} atribuiu a demanda a ${novo}.`;
    }
    if (novo === null) {
      return `${nome} removeu o responsável (${anterior}) da demanda.`;
    }
    return `${nome} alterou o responsável da demanda de ${anterior} para ${novo}.`;
  }

  if (registro.campo === "PRAZO") {
    if (anterior === null) {
      return `${nome} definiu o prazo da demanda para ${dataParaBR(novo)}.`;
    }
    if (novo === null) {
      return `${nome} removeu o prazo da demanda (era ${dataParaBR(anterior)}).`;
    }
    return `${nome} alterou o prazo da demanda de ${dataParaBR(anterior)} para ${dataParaBR(novo)}.`;
  }

  return `${nome} alterou a demanda.`;
}

export function registrarRotasHistorico(app: Express) {
  app.get("/demandas/:id/historico", exigirLogin, async (req: Request, res: Response) => {
    const usuario = req.usuario as UsuarioLogado;
    const id = Number(req.params.id);

    let conn;
    try {
      conn = await getConn();

      // A demanda precisa existir e estar em um projeto que o usuário enxerga (senão, 404)
      const demanda = await buscarDemanda(conn, id);
      if (demanda === null || !(await usuarioEnxergaProjeto(conn, usuario, demanda.projetoId))) {
        return res.status(404).json({ mensagem: "Demanda não encontrada." });
      }

      const resultado = await conn.execute(
        `SELECT h.id_historico AS "id", h.campo_alterado AS "campo",
                h.valor_anterior AS "valorAnterior", h.valor_novo AS "valorNovo",
                TO_CHAR(h.data_hora, 'YYYY-MM-DD"T"HH24:MI:SS') AS "dataHora",
                h.id_usuario AS "usuarioId", u.nome AS "usuarioNome"
           FROM historico_demanda h
           JOIN usuario u ON u.id_usuario = h.id_usuario
          WHERE h.id_demanda = :id
          ORDER BY h.data_hora DESC, h.id_historico DESC`,
        { id }
      );
      const registros = (resultado.rows ?? []) as Linha[];

      return res.status(200).json(
        registros.map((registro) => ({
          id: registro.id,
          campo: registro.campo,
          valorAnterior: registro.valorAnterior,
          valorNovo: registro.valorNovo,
          dataHora: registro.dataHora,
          usuario: { id: registro.usuarioId, nome: registro.usuarioNome },
          mensagem: montarMensagem(registro),
        }))
      );
    } catch (erro) {
      console.error(erro);
      return res.status(500).json({ mensagem: "Erro ao consultar o histórico!" });
    } finally {
      if (conn) await conn.close();
    }
  });
}
