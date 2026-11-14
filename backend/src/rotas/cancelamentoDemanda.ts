// Autor: Murilo Xavier Sarra da Cunha
//
// Rota de Cancelamento de demanda (Reunião 5, itens 2.2.4 e 2.2.8 do Documento de Visão):
//   POST /demandas/:id/cancelar
//
// O cancelamento é LÓGICO: a demanda NÃO é apagada do banco, apenas muda o status para
// "Cancelada". Assim o histórico e os comentários são preservados (não existe DELETE de demanda).
//
// Regras:
//   - só o Administrador e o Líder de Projeto podem cancelar (o Membro da Equipe não);
//   - só dá para cancelar demandas ainda não concluídas e ainda não canceladas. Essa regra vem da
//     tabela transicao_status do banco: ela só tem a mudança "para Cancelada" a partir de
//     Aberta, Em andamento e Em revisão;
//   - o cancelamento é registrado no histórico (campo CANCELAMENTO), indicando quem cancelou.
//
// Códigos: 200 (cancelada), 400 (já concluída ou cancelada), 403 (sem permissão), 404 (não encontrada).

import { Express, Request, Response } from "express";
import { exigirLogin } from "../autenticacao";
import { buscarDemanda, montarDemanda, usuarioEnxergaProjeto } from "../consultas";
import { getConn } from "../db";
import { registrarHistorico } from "../historico";
import { podeCancelar } from "../permissoes";
import { Linha, STATUS, UsuarioLogado } from "../tipos";

export function registrarRotasCancelamento(app: Express) {
  app.post("/demandas/:id/cancelar", exigirLogin, async (req: Request, res: Response) => {
    const usuario = req.usuario as UsuarioLogado;
    const id = Number(req.params.id);

    let conn;
    try {
      conn = await getConn();

      // 1. A demanda precisa existir e estar em um projeto que o usuário enxerga (senão, 404)
      const demanda = await buscarDemanda(conn, id);
      if (demanda === null || !(await usuarioEnxergaProjeto(conn, usuario, demanda.projetoId))) {
        return res.status(404).json({ mensagem: "Demanda não encontrada." });
      }

      // 2. Confere a permissão do perfil
      if (!podeCancelar(usuario)) {
        return res.status(403).json({ mensagem: "Apenas o Administrador e o Líder de Projeto podem cancelar demandas." });
      }

      // 3. Confere no banco se o ciclo de vida permite ir do status atual para Cancelada
      const transicao = await conn.execute(
        `SELECT COUNT(*) AS "total" FROM transicao_status
          WHERE id_status_origem = :statusAtual AND id_status_destino = :cancelada`,
        { statusAtual: demanda.statusId, cancelada: STATUS.CANCELADA }
      );
      if (((transicao.rows ?? []) as Linha[])[0].total === 0) {
        return res.status(400).json({ mensagem: `Não é possível cancelar uma demanda com status ${demanda.status}.` });
      }

      // 4. Altera o status e registra o histórico na MESMA transação: ou grava os dois ou nenhum.
      //    O "AND id_status = :statusAtual" evita sobrescrever uma mudança feita por outra pessoa
      //    no mesmo instante.
      const atualizacao = await conn.execute(
        `UPDATE demanda
            SET id_status = :cancelada, data_atualizacao = SYSTIMESTAMP
          WHERE id_demanda = :id AND id_status = :statusAtual`,
        { cancelada: STATUS.CANCELADA, id, statusAtual: demanda.statusId }
      );

      if (atualizacao.rowsAffected === 0) {
        await conn.rollback();
        return res.status(400).json({ mensagem: "A demanda foi alterada por outra pessoa. Atualize a página e tente de novo." });
      }

      await registrarHistorico(conn, {
        demandaId: id,
        usuarioId: usuario.id,
        campo: "CANCELAMENTO",
        valorAnterior: demanda.status,
        valorNovo: "Cancelada",
      });

      await conn.commit(); // confirma a transação

      // 5. Responde 200 com a demanda já atualizada
      const atualizada = (await buscarDemanda(conn, id)) as Linha;
      return res.status(200).json(montarDemanda(atualizada));
    } catch (erro) {
      console.error(erro);
      if (conn) await conn.rollback(); // desfaz tudo se algo deu errado
      return res.status(500).json({ mensagem: "Erro ao cancelar a demanda!" });
    } finally {
      if (conn) await conn.close();
    }
  });
}
