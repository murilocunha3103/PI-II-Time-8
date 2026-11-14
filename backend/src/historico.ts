// Autor: Arthur de Senna Nardi Cortina
//
// Registro do histórico de alterações (item 2.2.7 do Documento de Visão).
//
// Toda rota que altera uma demanda (status, responsável, prioridade, prazo ou cancelamento) chama
// registrarHistorico DENTRO da mesma transação da alteração: ou grava a alteração E o histórico,
// ou não grava nada (a rota faz commit no final ou rollback se der erro).
//
// Os valores anterior e novo são guardados como TEXTO (uma "fotografia" do momento). Nunca existe
// rota para apagar ou editar o histórico.

import { Connection } from "oracledb";

export type CampoHistorico = "STATUS" | "RESPONSAVEL" | "PRIORIDADE" | "PRAZO" | "CANCELAMENTO";

export interface DadosHistorico {
  demandaId: number;
  usuarioId: number; // quem fez a alteração
  campo: CampoHistorico;
  valorAnterior: string | null;
  valorNovo: string | null;
}

// Insere um registro de histórico. Sem autoCommit: quem chama é que confirma a transação.
export async function registrarHistorico(conn: Connection, dados: DadosHistorico): Promise<void> {
  await conn.execute(
    `INSERT INTO historico_demanda (id_demanda, id_usuario, campo_alterado, valor_anterior, valor_novo)
     VALUES (:demandaId, :usuarioId, :campo, :valorAnterior, :valorNovo)`,
    {
      demandaId: dados.demandaId,
      usuarioId: dados.usuarioId,
      campo: dados.campo,
      valorAnterior: dados.valorAnterior,
      valorNovo: dados.valorNovo,
    }
  );
}
