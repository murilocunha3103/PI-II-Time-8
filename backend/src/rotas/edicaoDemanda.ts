// Autor: Gabriel Passarela Silva
//
// Rota de Edição de demanda (Reunião 5, itens 2.1, 2.2.5 e 2.2.8 do Documento de Visão):
//   PUT /demandas/:id
//
// Edita os dados de uma demanda já cadastrada, incluindo atribuir ou alterar o RESPONSÁVEL, alterar a
// PRIORIDADE e definir ou alterar o PRAZO de finalização. O status NÃO é editado aqui (tem rota
// própria: PATCH /demandas/:id/status), e o projeto da demanda não pode ser trocado.
//
// Corpo (JSON): { "titulo", "descricao", "tipo", "prioridade", "responsavelId", "prazo" }
// (responsavelId e prazo podem ir em branco para remover o responsável ou o prazo).
//
// Regras:
//   - só o Administrador e o Líder de Projeto editam (o Membro da Equipe não);
//   - demandas Concluídas ou Canceladas não podem mais ser editadas;
//   - os mesmos campos e validações do cadastro (arquivo validacaoDemanda.ts);
//   - a data da última atualização da demanda é atualizada automaticamente;
//   - mudanças de responsável, prioridade e prazo são registradas no histórico, indicando quem
//     alterou, na MESMA transação da alteração (ou grava tudo, ou não grava nada);
//   - se nada mudou, a demanda é devolvida sem alteração e sem registro no histórico.
//
// Códigos: 200 (demanda devolvida), 400 (dados inválidos), 403 (sem permissão), 404 (não encontrada).

import { Express, Request, Response } from "express";
import { exigirLogin } from "../autenticacao";
import { buscarDemanda, carregarPrioridades, carregarTipos, montarDemanda, usuarioEnxergaProjeto } from "../consultas";
import { getConn } from "../db";
import { registrarHistorico } from "../historico";
import { podeCriarOuEditar } from "../permissoes";
import { Linha, STATUS, UsuarioLogado } from "../tipos";
import { encontrarPorNome, textoOuVazio } from "../utilitarios";
import { validarDescricao, validarPrazo, validarResponsavel, validarTitulo } from "../validacaoDemanda";

export function registrarRotasEdicao(app: Express) {
  app.put("/demandas/:id", exigirLogin, async (req: Request, res: Response) => {
    const usuario = req.usuario as UsuarioLogado;
    const id = Number(req.params.id);

    // 1. Permissão do perfil
    if (!podeCriarOuEditar(usuario)) {
      return res.status(403).json({ mensagem: "Apenas o Administrador e o Líder de Projeto podem editar demandas." });
    }

    const { titulo, descricao, tipo, prioridade, responsavelId, prazo } = req.body || {};
    const tituloLido = textoOuVazio(titulo);
    const descricaoLida = textoOuVazio(descricao);

    let conn;
    try {
      conn = await getConn();

      // 2. A demanda precisa existir e estar em um projeto que o usuário enxerga (senão, 404)
      const demanda = await buscarDemanda(conn, id);
      if (demanda === null || !(await usuarioEnxergaProjeto(conn, usuario, demanda.projetoId))) {
        return res.status(404).json({ mensagem: "Demanda não encontrada." });
      }

      // 3. Demanda finalizada (Concluída ou Cancelada) é somente leitura
      if (demanda.statusId === STATUS.CONCLUIDA || demanda.statusId === STATUS.CANCELADA) {
        return res.status(400).json({ mensagem: `Uma demanda ${demanda.status} não pode mais ser editada.` });
      }

      // 4. Valida os campos, juntando os problemas numa lista
      const erros: string[] = [];

      const erroTitulo = validarTitulo(tituloLido);
      if (erroTitulo !== null) erros.push(erroTitulo);

      const erroDescricao = validarDescricao(descricaoLida);
      if (erroDescricao !== null) erros.push(erroDescricao);

      const listaTipos = await carregarTipos(conn);
      const tipoEscolhido = encontrarPorNome(listaTipos, tipo);
      if (tipoEscolhido === null) {
        erros.push("Tipo inválido ou ausente. Valores aceitos: " + listaTipos.map((i) => i.nome).join(", ") + ".");
      }

      const listaPrioridades = await carregarPrioridades(conn);
      const prioridadeEscolhida = encontrarPorNome(listaPrioridades, prioridade);
      if (prioridadeEscolhida === null) {
        erros.push("Prioridade inválida ou ausente. Valores aceitos: " + listaPrioridades.map((i) => i.nome).join(", ") + ".");
      }

      // Responsável e prazo: só são conferidos de novo se mudaram em relação ao que já está gravado
      const verificacaoResponsavel = await validarResponsavel(conn, responsavelId, demanda.projetoId, demanda.responsavelId);
      if (verificacaoResponsavel.erro !== null) erros.push(verificacaoResponsavel.erro);

      const verificacaoPrazo = await validarPrazo(conn, prazo, demanda.prazo);
      if (verificacaoPrazo.erro !== null) erros.push(verificacaoPrazo.erro);

      if (erros.length > 0 || tipoEscolhido === null || prioridadeEscolhida === null) {
        return res.status(400).json({ mensagem: "Dados inválidos. Corrija os problemas abaixo e tente novamente.", erros });
      }

      // 5. O que mudou? (comparamos o que veio com o que está no banco)
      const novoResponsavel = verificacaoResponsavel.id;
      const novoPrazo = verificacaoPrazo.prazo;

      const mudouDados = tituloLido !== demanda.titulo || descricaoLida !== demanda.descricao || tipoEscolhido.id !== demanda.tipoId;
      const mudouPrioridade = prioridadeEscolhida.id !== demanda.prioridadeId;
      const mudouResponsavel = novoResponsavel !== demanda.responsavelId;
      const mudouPrazo = novoPrazo !== demanda.prazo;

      if (!mudouDados && !mudouPrioridade && !mudouResponsavel && !mudouPrazo) {
        return res.status(200).json(montarDemanda(demanda)); // nada mudou
      }

      // 6. Atualiza a demanda. A data da última atualização vira "agora" automaticamente.
      await conn.execute(
        `UPDATE demanda
            SET titulo = :titulo, descricao = :descricao, id_tipo = :tipoId, id_prioridade = :prioridadeId,
                id_responsavel = :responsavelId, prazo = TO_DATE(:prazo, 'YYYY-MM-DD'),
                data_atualizacao = SYSTIMESTAMP
          WHERE id_demanda = :id`,
        {
          titulo: tituloLido,
          descricao: descricaoLida,
          tipoId: tipoEscolhido.id,
          prioridadeId: prioridadeEscolhida.id,
          responsavelId: novoResponsavel,
          prazo: novoPrazo,
          id,
        }
      );

      // 7. Registra no histórico o que mudou (na mesma transação)
      if (mudouPrioridade) {
        await registrarHistorico(conn, {
          demandaId: id,
          usuarioId: usuario.id,
          campo: "PRIORIDADE",
          valorAnterior: demanda.prioridade,
          valorNovo: prioridadeEscolhida.nome,
        });
      }

      if (mudouResponsavel) {
        // O histórico guarda o NOME do responsável (antes e depois); o novo nome vem do banco
        let nomeNovoResponsavel: string | null = null;
        if (novoResponsavel !== null) {
          const busca = await conn.execute(`SELECT nome AS "nome" FROM usuario WHERE id_usuario = :id`, { id: novoResponsavel });
          nomeNovoResponsavel = ((busca.rows ?? []) as Linha[])[0].nome;
        }

        await registrarHistorico(conn, {
          demandaId: id,
          usuarioId: usuario.id,
          campo: "RESPONSAVEL",
          valorAnterior: demanda.responsavelNome,
          valorNovo: nomeNovoResponsavel,
        });
      }

      if (mudouPrazo) {
        await registrarHistorico(conn, {
          demandaId: id,
          usuarioId: usuario.id,
          campo: "PRAZO",
          valorAnterior: demanda.prazo,
          valorNovo: novoPrazo,
        });
      }

      await conn.commit(); // confirma a transação

      // 8. Responde 200 com a demanda já atualizada
      const atualizada = (await buscarDemanda(conn, id)) as Linha;
      return res.status(200).json(montarDemanda(atualizada));
    } catch (erro) {
      console.error(erro);
      if (conn) await conn.rollback(); // desfaz tudo se algo deu errado
      return res.status(500).json({ mensagem: "Erro ao editar a demanda!" });
    } finally {
      if (conn) await conn.close();
    }
  });
}
s