// Autor: Arthur de Senna Nardi Cortina (arquivo-base da estrutura da equipe)
//
// ARQUIVO-BASE (esqueleto com versão PROVISÓRIA): as rotas da tela de Login serão implementadas por
// Gabriel Passarela Silva, que vai SUBSTITUIR todo o conteúdo deste arquivo na branch dela:
//   POST /login
//   GET /usuarios
//
// Como TODAS as rotas do sistema exigem um usuário logado (token), este esqueleto já traz uma versão
// mínima do POST /login. Ela serve só para quem está desenvolvendo (Arthur, Murilo e João) conseguir
// fazer login e testar as próprias rotas antes de a Gabriel entregar a dela. A versão da Gabriel é a
// definitiva (com validações, comentários e a rota GET /usuarios).

import { Express, Request, Response } from "express";
import { gerarHashSenha, gerarToken } from "../autenticacao";
import { getConn } from "../db";
import { Linha } from "../tipos";

export function registrarRotasLogin(app: Express) {
  // POST /login (PROVISÓRIO) - corpo: { "email": "...", "senha": "..." }
  app.post("/login", async (req: Request, res: Response) => {
    const { email, senha } = req.body || {};

    if (typeof email !== "string" || typeof senha !== "string" || email.trim() === "" || senha === "") {
      return res.status(400).json({ mensagem: "E-mail e senha são obrigatórios." });
    }

    let conn;
    try {
      conn = await getConn();
      const resultado = await conn.execute(
        `SELECT u.id_usuario AS "id", u.nome AS "nome", u.email AS "email", p.nome AS "perfil"
           FROM usuario u
           JOIN perfil p ON p.id_perfil = u.id_perfil
          WHERE u.email = :email AND u.senha_hash = :senhaHash`,
        { email: email.trim().toLowerCase(), senhaHash: gerarHashSenha(senha) }
      );
      const usuario = ((resultado.rows ?? []) as Linha[])[0];

      if (!usuario) {
        return res.status(401).json({ mensagem: "E-mail ou senha inválidos." });
      }

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
}
