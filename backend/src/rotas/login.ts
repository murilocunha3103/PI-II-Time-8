// Autor: Gabriel Passarela Silva
//
// Rotas da tela de Login (Reunião 5):
//   POST /login     -> confere e-mail e senha no banco; se estiverem certos, devolve o usuário e um token
//   GET  /usuarios  -> lista os usuários que o usuário logado pode ver (usada nos filtros e na
//                      escolha do responsável da demanda)
//
// Em nenhuma das duas a senha (nem o hash dela) é devolvida na resposta.
//
// Como o login funciona: a senha digitada NÃO é comparada em texto. A API calcula o hash SHA-256 dela
// (função gerarHashSenha) e compara com o hash guardado na coluna senha_hash do banco. Se bater, a API
// gera um token (função gerarToken). A tela guarda o token e o envia nas próximas requisições para
// provar quem é o usuário.
//
// Códigos HTTP usados:
//   200 -> login feito / lista devolvida
//   400 -> e-mail ou senha ausentes
//   401 -> e-mail ou senha incorretos (credenciais inválidas)

import { Express, Request, Response } from "express";
import { exigirLogin, gerarHashSenha, gerarToken } from "../autenticacao";
import { usuarioEnxergaProjeto } from "../consultas";
import { getConn } from "../db";
import { ehAdministrador } from "../permissoes";
import { Binds, Linha, UsuarioLogado } from "../tipos";
import { lerNumeroInteiro, textoOuVazio } from "../utilitarios";

export function registrarRotasLogin(app: Express) {
  // POST /login - corpo (JSON) esperado: { "email": "...", "senha": "..." }
  app.post("/login", async (req: Request, res: Response) => {
    // Lê os dados do corpo. O "|| {}" evita erro se a requisição vier sem corpo.
    const { email, senha } = req.body || {};

    // O e-mail é guardado em minúsculas no banco; por isso comparamos em minúsculas
    const emailInformado = textoOuVazio(email).toLowerCase();
    // A senha NÃO recebe trim(): espaços fazem parte da senha
    const senhaInformada = typeof senha === "string" ? senha : "";

    // 1. Campos obrigatórios (senão, 400)
    if (emailInformado === "" || senhaInformada === "") {
      return res.status(400).json({ mensagem: "E-mail e senha são obrigatórios." });
    }

    let conn;
    try {
      conn = await getConn();

      // 2. Procura no banco um usuário com esse e-mail E esse hash de senha
      const resultado = await conn.execute(
        `SELECT u.id_usuario AS "id", u.nome AS "nome", u.email AS "email", p.nome AS "perfil"
           FROM usuario u
           JOIN perfil p ON p.id_perfil = u.id_perfil
          WHERE u.email = :email AND u.senha_hash = :senhaHash`,
        { email: emailInformado, senhaHash: gerarHashSenha(senhaInformada) }
      );
      const usuario = ((resultado.rows ?? []) as Linha[])[0];

      // 3. Não achou: as credenciais estão erradas (401). A mensagem é a mesma para e-mail
      //    inexistente e senha errada, para não revelar quais e-mails estão cadastrados.
      if (!usuario) {
        return res.status(401).json({ mensagem: "E-mail ou senha inválidos." });
      }

      // 4. Achou: devolve o token e os dados do usuário, sem a senha
      return res.status(200).json({
        mensagem: "Login realizado com sucesso.",
        token: gerarToken(usuario.id),
        usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil },
      });
    } catch (erro) {
      console.error(erro);
      return res.status(500).json({ mensagem: "Erro ao fazer o login!" });
    } finally {
      if (conn) await conn.close();
    }
  });

  // GET /usuarios - lista os usuários, sem expor as senhas.
  //   - Administrador: todos os usuários.
  //   - Líder e Membro: só os usuários que participam de algum projeto em comum com ele.
  //   - Com ?projeto=ID: só os usuários vinculados àquele projeto (o projeto precisa estar
  //     entre os que o usuário enxerga). Usada para escolher o responsável de uma demanda.
  app.get("/usuarios", exigirLogin, async (req: Request, res: Response) => {
    const usuarioLogado = req.usuario as UsuarioLogado;
    const projetoTexto = textoOuVazio(req.query.projeto);

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

      const binds: Binds = {};
      let filtro = "";

      if (projetoId !== null) {
        // Só vale para projetos que o usuário enxerga; senão, 404
        if (!(await usuarioEnxergaProjeto(conn, usuarioLogado, projetoId))) {
          return res.status(404).json({ mensagem: "Projeto não encontrado." });
        }
        filtro = "WHERE u.id_usuario IN (SELECT pu.id_usuario FROM projeto_usuario pu WHERE pu.id_projeto = :projetoId)";
        binds.projetoId = projetoId;
      } else if (!ehAdministrador(usuarioLogado)) {
        filtro = `WHERE u.id_usuario IN (
                    SELECT pu2.id_usuario FROM projeto_usuario pu2
                     WHERE pu2.id_projeto IN (SELECT pu1.id_projeto FROM projeto_usuario pu1 WHERE pu1.id_usuario = :eu))`;
        binds.eu = usuarioLogado.id;
      }

      const resultado = await conn.execute(
        `SELECT u.id_usuario AS "id", u.nome AS "nome", u.email AS "email", p.nome AS "perfil"
           FROM usuario u
           JOIN perfil p ON p.id_perfil = u.id_perfil
          ${filtro}
          ORDER BY u.nome`,
        binds
      );

      return res.status(200).json(resultado.rows ?? []);
    } catch (erro) {
      console.error(erro);
      return res.status(500).json({ mensagem: "Erro ao listar os usuários!" });
    } finally {
      if (conn) await conn.close();
    }
  });
}
