// Autor: Joao Victor Nunes Soares
//
// Rotas da tela de Detalhes da Demanda (Reunião 5):
//   GET  /demandas/:id               -> devolve todos os campos de uma demanda (lida do banco)
//   GET  /demandas/:id/comentarios   -> lista os comentários da demanda
//   POST /demandas/:id/comentarios   -> registra um novo comentário na demanda
//
// O ":id" na rota é um parâmetro de rota: em /demandas/3, req.params.id vale "3".
//
// Na resposta do GET /demandas/:id, além dos dados da demanda, vai um campo "acoes" que diz o que
// ESTE usuário pode fazer com a demanda (editar, cancelar e para quais status pode mudar). A tela
// usa esse campo para mostrar só os botões permitidos para o perfil dele.
//
// Cada usuário só enxerga demandas dos projetos aos quais tem acesso; fora disso, a resposta é 404.
//
// Códigos HTTP: 200 (consulta feita), 201 (comentário criado), 400 (comentário inválido),
// 401 (sem login), 404 (demanda não encontrada).

import { Express, Request, Response } from "express";
import oracledb from "oracledb";
import { exigirLogin } from "../autenticacao";
import { buscarDemanda, montarDemanda, usuarioEnxergaProjeto } from "../consultas";
import { getConn } from "../db";
import { podeCancelar, podeCriarOuEditar, verificarMudancaStatus } from "../permissoes";
import { Linha, STATUS, UsuarioLogado } from "../tipos";
import { textoOuVazio } from "../utilitarios";

const TAMANHO_MAXIMO_COMENTARIO = 1000;

export function registrarRotasDetalhes(app: Express) {
  // GET /demandas/:id - devolve uma demanda específica, com as ações permitidas ao usuário
  app.get("/demandas/:id", exigirLogin, async (req: Request, res: Response) => {
    const usuario = req.usuario as UsuarioLogado;
    // req.params.id chega como texto; Number(...) converte para número
    const id = Number(req.params.id);

    let conn;
    try {
      conn = await getConn();

      const demanda = await buscarDemanda(conn, id);

      // Se não existe ou está em um projeto que o usuário não enxerga, a resposta é 404
      if (demanda === null || !(await usuarioEnxergaProjeto(conn, usuario, demanda.projetoId))) {
        return res.status(404).json({ mensagem: "Demanda não encontrada." });
      }

      // Para quais status a demanda pode ir, segundo o ciclo de vida guardado no banco
      // (tabela transicao_status)? O cancelamento fica de fora: ele tem rota e botão próprios.
      const destinos = await conn.execute(
        `SELECT s.id_status AS "id", s.nome AS "nome"
           FROM transicao_status t
           JOIN status_demanda s ON s.id_status = t.id_status_destino
          WHERE t.id_status_origem = :statusAtual AND t.id_status_destino <> :cancelada
          ORDER BY s.ordem`,
        { statusAtual: demanda.statusId, cancelada: STATUS.CANCELADA }
      );

      // Desses, fica só o que o PERFIL do usuário permite (o Membro, por exemplo, só pode
      // Aberta -> Em andamento e Em andamento -> Em revisão, nas demandas dele)
      const statusPermitidos = ((destinos.rows ?? []) as Linha[])
        .filter((destino) => verificarMudancaStatus(usuario, demanda.responsavelId, demanda.statusId, destino.id).permitido)
        .map((destino) => ({ id: destino.id, nome: destino.nome }));

      // Demanda Concluída ou Cancelada está finalizada: não pode mais ser editada nem cancelada
      const finalizada = demanda.statusId === STATUS.CONCLUIDA || demanda.statusId === STATUS.CANCELADA;

      return res.status(200).json({
        ...montarDemanda(demanda),
        acoes: {
          podeEditar: podeCriarOuEditar(usuario) && !finalizada,
          podeCancelar: podeCancelar(usuario) && !finalizada,
          statusPermitidos,
        },
      });
    } catch (erro) {
      console.error(erro);
      return res.status(500).json({ mensagem: "Erro ao buscar a demanda!" });
    } finally {
      if (conn) await conn.close();
    }
  });

  // GET /demandas/:id/comentarios - lista os comentários da demanda, do mais antigo para o mais novo
  app.get("/demandas/:id/comentarios", exigirLogin, async (req: Request, res: Response) => {
    const usuario = req.usuario as UsuarioLogado;
    const id = Number(req.params.id);

    let conn;
    try {
      conn = await getConn();

      const demanda = await buscarDemanda(conn, id);
      if (demanda === null || !(await usuarioEnxergaProjeto(conn, usuario, demanda.projetoId))) {
        return res.status(404).json({ mensagem: "Demanda não encontrada." });
      }

      const resultado = await conn.execute(
        `SELECT c.id_comentario AS "id", c.id_demanda AS "demandaId", c.texto AS "texto",
                TO_CHAR(c.data_hora, 'YYYY-MM-DD"T"HH24:MI:SS') AS "dataHora",
                c.id_usuario AS "usuarioId", u.nome AS "usuarioNome", p.nome AS "usuarioPerfil"
           FROM comentario c
           JOIN usuario u ON u.id_usuario = c.id_usuario
           JOIN perfil p ON p.id_perfil = u.id_perfil
          WHERE c.id_demanda = :id
          ORDER BY c.data_hora, c.id_comentario`,
        { id }
      );

      const comentarios = ((resultado.rows ?? []) as Linha[]).map((linha) => ({
        id: linha.id,
        demandaId: linha.demandaId,
        texto: linha.texto,
        dataHora: linha.dataHora,
        usuario: { id: linha.usuarioId, nome: linha.usuarioNome, perfil: linha.usuarioPerfil },
      }));

      return res.status(200).json(comentarios);
    } catch (erro) {
      console.error(erro);
      return res.status(500).json({ mensagem: "Erro ao listar os comentários!" });
    } finally {
      if (conn) await conn.close();
    }
  });

  // POST /demandas/:id/comentarios - registra um comentário.
  // Corpo (JSON) esperado: { "texto": "..." }. Quem comentou é o usuário logado (vem do token).
  app.post("/demandas/:id/comentarios", exigirLogin, async (req: Request, res: Response) => {
    const usuario = req.usuario as UsuarioLogado;
    const id = Number(req.params.id);

    // Lê o corpo da requisição. O "|| {}" evita erro se vier sem corpo nenhum.
    const { texto } = req.body || {};
    const textoComentario = textoOuVazio(texto);

    // Valida o texto (a API não confia no que recebe, mesmo que a tela já valide)
    if (textoComentario === "") {
      return res.status(400).json({ mensagem: "O texto do comentário é obrigatório e não pode ficar vazio." });
    }

    if (textoComentario.length > TAMANHO_MAXIMO_COMENTARIO) {
      return res.status(400).json({ mensagem: "O comentário pode ter no máximo " + TAMANHO_MAXIMO_COMENTARIO + " caracteres." });
    }

    let conn;
    try {
      conn = await getConn();

      const demanda = await buscarDemanda(conn, id);
      if (demanda === null || !(await usuarioEnxergaProjeto(conn, usuario, demanda.projetoId))) {
        return res.status(404).json({ mensagem: "Demanda não encontrada." });
      }

      // Insere o comentário. A data e a hora são preenchidas pelo próprio banco (DEFAULT SYSTIMESTAMP).
      // "RETURNING ... INTO" devolve o id que o banco gerou (coluna IDENTITY) para o novo comentário.
      const insercao = await conn.execute(
        `INSERT INTO comentario (id_demanda, id_usuario, texto)
         VALUES (:demandaId, :usuarioId, :texto)
         RETURNING id_comentario INTO :idNovo`,
        {
          demandaId: id,
          usuarioId: usuario.id,
          texto: textoComentario,
          idNovo: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        },
        { autoCommit: true }
      );
      const idNovo = (insercao.outBinds as { idNovo: number[] }).idNovo[0];

      // Lê o comentário gravado, para devolver a data e a hora registradas pelo banco
      const busca = await conn.execute(
        `SELECT TO_CHAR(c.data_hora, 'YYYY-MM-DD"T"HH24:MI:SS') AS "dataHora"
           FROM comentario c WHERE c.id_comentario = :idNovo`,
        { idNovo }
      );
      const dataHora = ((busca.rows ?? []) as Linha[])[0].dataHora;

      return res.status(201).json({
        id: idNovo,
        demandaId: id,
        texto: textoComentario,
        dataHora,
        usuario: { id: usuario.id, nome: usuario.nome, perfil: usuario.perfil },
      });
    } catch (erro) {
      console.error(erro);
      return res.status(500).json({ mensagem: "Erro ao registrar o comentário!" });
    } finally {
      if (conn) await conn.close();
    }
  });
}
