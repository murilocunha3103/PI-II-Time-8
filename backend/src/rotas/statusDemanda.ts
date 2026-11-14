// Autor: Joao Victor Nunes Soares
//
// Rota de atualização do status da demanda, o ciclo de vida (Reunião 5, item 2.2.4):
//   PATCH /demandas/:id/status
//   Corpo (JSON): { "status": "Em andamento" }
//
// Ciclo de vida permitido (guardado no banco, na tabela transicao_status):
//   Aberta -> Em andamento -> Em revisão -> Concluída     e     Em revisão -> Em andamento
// Não é possível concluir direto de Em andamento, nem voltar de Em andamento para Aberta.
// O cancelamento NÃO é feito aqui: tem rota própria (POST /demandas/:id/cancelar).
//
// Permissões por perfil (arquivo permissoes.ts):
//   - Administrador e Líder de Projeto: qualquer mudança prevista no ciclo de vida;
//   - Membro da Equipe: só nas demandas atribuídas a ele, e só Aberta -> Em andamento e
//     Em andamento -> Em revisão.
//
// Toda mudança de status é registrada no histórico (campo STATUS), indicando quem alterou, e a data
// da última atualização da demanda é atualizada automaticamente.
//
// Códigos: 200 (status alterado), 400 (mudança fora do ciclo de vida), 403 (sem permissão),
// 404 (demanda não encontrada).

import { Express, Request, Response } from "express";
import { exigirLogin } from "../autenticacao";
import { buscarDemanda, carregarStatus, montarDemanda, usuarioEnxergaProjeto } from "../consultas";
import { getConn } from "../db";
import { registrarHistorico } from "../historico";
import { verificarMudancaStatus } from "../permissoes";
import { Linha, STATUS, UsuarioLogado } from "../tipos";
import { encontrarPorNome, textoOuVazio } from "../utilitarios";

export function registrarRotasStatus(app: Express) {
  app.patch("/demandas/:id/status", exigirLogin, async (req: Request, res: Response) => {
    const usuario = req.usuario as UsuarioLogado;
    const id = Number(req.params.id);

    // Lê o novo status enviado no corpo (o "|| {}" evita erro se vier sem corpo)
    const { status } = req.body || {};
    const statusTexto = textoOuVazio(status);

    if (statusTexto === "") {
      return res.status(400).json({ mensagem: "O novo status é obrigatório." });
    }

    let conn;
    try {
      conn = await getConn();

      // 1. O status informado precisa existir na tabela de apoio status_demanda
      const listaStatus = await carregarStatus(conn);
      const novoStatus = encontrarPorNome(listaStatus, statusTexto);

      if (novoStatus === null) {
        return res.status(400).json({ mensagem: "Status inválido. Valores aceitos: " + listaStatus.map((i) => i.nome).join(", ") + "." });
      }

      // 2. A demanda precisa existir e estar em um projeto que o usuário enxerga (senão, 404)
      const demanda = await buscarDemanda(conn, id);
      if (demanda === null || !(await usuarioEnxergaProjeto(conn, usuario, demanda.projetoId))) {
        return res.status(404).json({ mensagem: "Demanda não encontrada." });
      }

      // 3. Regras do ciclo de vida
      if (novoStatus.id === STATUS.CANCELADA) {
        return res.status(400).json({ mensagem: "Para cancelar a demanda use a opção Cancelar demanda." });
      }

      if (novoStatus.id === demanda.statusId) {
        return res.status(400).json({ mensagem: `A demanda já está com o status ${demanda.status}.` });
      }

      // A mudança existe no ciclo de vida? Consulta a tabela transicao_status do banco.
      const transicao = await conn.execute(
        `SELECT COUNT(*) AS "total" FROM transicao_status
          WHERE id_status_origem = :statusAtual AND id_status_destino = :statusNovo`,
        { statusAtual: demanda.statusId, statusNovo: novoStatus.id }
      );
      if (((transicao.rows ?? []) as Linha[])[0].total === 0) {
        return res.status(400).json({
          mensagem: `Não é possível mudar o status de ${demanda.status} para ${novoStatus.nome}, pois isso não está previsto no ciclo de vida da demanda.`,
        });
      }

      // 4. O PERFIL do usuário pode fazer essa mudança?
      const permissao = verificarMudancaStatus(usuario, demanda.responsavelId, demanda.statusId, novoStatus.id);
      if (!permissao.permitido) {
        return res.status(403).json({ mensagem: permissao.motivo });
      }

      // 5. Altera o status e registra o histórico na MESMA transação (ou grava os dois, ou nenhum).
      //    O "AND id_status = :statusAtual" evita sobrescrever uma mudança feita por outra pessoa.
      const atualizacao = await conn.execute(
        `UPDATE demanda
            SET id_status = :statusNovo, data_atualizacao = SYSTIMESTAMP
          WHERE id_demanda = :id AND id_status = :statusAtual`,
        { statusNovo: novoStatus.id, id, statusAtual: demanda.statusId }
      );

      if (atualizacao.rowsAffected === 0) {
        await conn.rollback();
        return res.status(400).json({ mensagem: "A demanda foi alterada por outra pessoa. Atualize a página e tente de novo." });
      }

      await registrarHistorico(conn, {
        demandaId: id,
        usuarioId: usuario.id,
        campo: "STATUS",
        valorAnterior: demanda.status,
        valorNovo: novoStatus.nome,
      });

      await conn.commit(); // confirma a transação

      // 6. Responde 200 com a demanda já atualizada
      const atualizada = (await buscarDemanda(conn, id)) as Linha;
      return res.status(200).json(montarDemanda(atualizada));
    } catch (erro) {
      console.error(erro);
      if (conn) await conn.rollback(); // desfaz tudo se algo deu errado
      return res.status(500).json({ mensagem: "Erro ao atualizar o status da demanda!" });
    } finally {
      if (conn) await conn.close();
    }
  });
}
