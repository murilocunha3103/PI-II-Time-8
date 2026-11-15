// Autor: Gabriel Passarela Silva
//
// Rotas da tela de Cadastro de Demanda (Reunião 5):
//   POST /demandas  -> cadastra uma nova demanda no banco, validando os dados no servidor
//   GET  /projetos  -> lista os projetos que o usuário enxerga (para escolher o projeto no cadastro)
//
// Corpo (JSON) esperado no POST /demandas:
//   {
//     "titulo": "Corrigir erro no login",          (obrigatório)
//     "descricao": "Descrição da demanda",          (obrigatório)
//     "tipo": "Defeito",                            (obrigatório: Tarefa | Defeito | Melhoria | Documentação)
//     "prioridade": "Alta",                         (obrigatório: Crítica | Alta | Média | Baixa)
//     "projetoId": 1,                               (obrigatório: um projeto que o usuário enxerga)
//     "responsavelId": 4,                           (opcional: usuário vinculado ao projeto)
//     "prazo": "2026-11-30"                         (opcional: AAAA-MM-DD, não pode ser no passado nem feriado)
//   }
//
// O status ("Aberta"), a data de criação e a de atualização são definidos AUTOMATICAMENTE pelo banco
// (valores DEFAULT das colunas), mesmo que venham no corpo da requisição: eles são ignorados.
//
// Permissão: só o Administrador e o Líder de Projeto criam demandas (o Membro da Equipe não).
//
// Códigos HTTP: 201 (demanda criada), 400 (dados inválidos, com a lista de problemas),
// 403 (sem permissão), 200 (lista de projetos).

import { Express, Request, Response } from "express";
import oracledb from "oracledb";
import { exigirLogin } from "../autenticacao";
import { buscarDemanda, carregarPrioridades, carregarTipos, montarDemanda, usuarioEnxergaProjeto } from "../consultas";
import { getConn } from "../db";
import { ehAdministrador, podeCriarOuEditar } from "../permissoes";
import { Binds, Linha, UsuarioLogado } from "../tipos";
import { encontrarPorNome, lerNumeroInteiro, textoOuVazio } from "../utilitarios";
import { validarDescricao, validarPrazo, validarResponsavel, validarTitulo } from "../validacaoDemanda";

export function registrarRotasCadastro(app: Express) {
  // GET /projetos - lista os projetos. O Administrador vê todos; Líder e Membro, só os vinculados.
  app.get("/projetos", exigirLogin, async (req: Request, res: Response) => {
    const usuario = req.usuario as UsuarioLogado;

    let conn;
    try {
      conn = await getConn();

      const binds: Binds = {};
      let filtro = "";

      if (!ehAdministrador(usuario)) {
        filtro = "WHERE p.id_projeto IN (SELECT pu.id_projeto FROM projeto_usuario pu WHERE pu.id_usuario = :usuarioId)";
        binds.usuarioId = usuario.id;
      }

      const resultado = await conn.execute(
        `SELECT p.id_projeto AS "id", p.nome AS "nome", p.descricao AS "descricao"
           FROM projeto p
           ${filtro}
          ORDER BY p.id_projeto`,
        binds
      );

      return res.status(200).json(resultado.rows ?? []);
    } catch (erro) {
      console.error(erro);
      return res.status(500).json({ mensagem: "Erro ao listar os projetos!" });
    } finally {
      if (conn) await conn.close();
    }
  });

  // POST /demandas - cadastra uma demanda
  app.post("/demandas", exigirLogin, async (req: Request, res: Response) => {
    const usuario = req.usuario as UsuarioLogado;

    // 1. Permissão do perfil
    if (!podeCriarOuEditar(usuario)) {
      return res.status(403).json({ mensagem: "Apenas o Administrador e o Líder de Projeto podem criar demandas." });
    }

    // 2. Lê o corpo da requisição. O "|| {}" evita erro se vier sem corpo nenhum.
    const { titulo, descricao, tipo, prioridade, projetoId, responsavelId, prazo } = req.body || {};
    const tituloLido = textoOuVazio(titulo);
    const descricaoLida = textoOuVazio(descricao);
    const idDoProjeto = lerNumeroInteiro(projetoId);

    let conn;
    try {
      conn = await getConn();

      // 3. Valida tudo e vai juntando os problemas numa lista, para a pessoa ver todos os erros de
      //    uma vez (mesma ideia da variável "formularioValido" das telas)
      const erros: string[] = [];

      const erroTitulo = validarTitulo(tituloLido);
      if (erroTitulo !== null) erros.push(erroTitulo);

      const erroDescricao = validarDescricao(descricaoLida);
      if (erroDescricao !== null) erros.push(erroDescricao);

      // Tipo e prioridade precisam existir nas tabelas de apoio do banco
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

      // O projeto é obrigatório e precisa ser um projeto que o usuário enxerga
      let projetoValido = false;
      if (idDoProjeto === null) {
        erros.push("O projeto (projetoId) é obrigatório.");
      } else if (!(await usuarioEnxergaProjeto(conn, usuario, idDoProjeto))) {
        erros.push("O projeto informado não existe.");
      } else {
        projetoValido = true;
      }

      // Responsável (opcional) e prazo (opcional) só são conferidos se o projeto for válido
      let responsavelEscolhido: number | null = null;
      if (projetoValido && idDoProjeto !== null) {
        const verificacao = await validarResponsavel(conn, responsavelId, idDoProjeto, null);
        responsavelEscolhido = verificacao.id;
        if (verificacao.erro !== null) erros.push(verificacao.erro);
      }

      const verificacaoPrazo = await validarPrazo(conn, prazo, null);
      if (verificacaoPrazo.erro !== null) erros.push(verificacaoPrazo.erro);

      // 4. Se houve qualquer problema, responde 400 e NÃO cria a demanda
      if (erros.length > 0 || tipoEscolhido === null || prioridadeEscolhida === null || idDoProjeto === null) {
        return res.status(400).json({ mensagem: "Dados inválidos. Corrija os problemas abaixo e tente novamente.", erros });
      }

      // 5. Insere a demanda. Não informamos o status nem as datas: o banco preenche sozinho com os
      //    valores DEFAULT (status 1 = Aberta, data de criação e de atualização = agora).
      //    "RETURNING ... INTO" devolve o id gerado pelo banco para a nova demanda.
      const insercao = await conn.execute(
        `INSERT INTO demanda (titulo, descricao, id_tipo, id_prioridade, id_projeto, id_responsavel, prazo)
         VALUES (:titulo, :descricao, :tipoId, :prioridadeId, :projetoId, :responsavelId, TO_DATE(:prazo, 'YYYY-MM-DD'))
         RETURNING id_demanda INTO :idNovo`,
        {
          titulo: tituloLido,
          descricao: descricaoLida,
          tipoId: tipoEscolhido.id,
          prioridadeId: prioridadeEscolhida.id,
          projetoId: idDoProjeto,
          responsavelId: responsavelEscolhido,
          prazo: verificacaoPrazo.prazo,
          idNovo: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        },
        { autoCommit: true }
      );
      const idNovo = (insercao.outBinds as { idNovo: number[] }).idNovo[0];

      // 6. Responde 201 (criado) com a demanda gravada
      const criada = (await buscarDemanda(conn, idNovo)) as Linha;
      return res.status(201).json(montarDemanda(criada));
    } catch (erro) {
      console.error(erro);
      return res.status(500).json({ mensagem: "Erro ao cadastrar a demanda!" });
    } finally {
      if (conn) await conn.close();
    }
  });
}
