// Autor: Arthur de Senna Nardi Cortina
//
// Autenticação da API (Reunião 5).
//
// Como funciona:
//  1. O usuário faz login (POST /login). Se e-mail e senha conferem, a API devolve um TOKEN.
//  2. A tela guarda o token e o envia em todas as outras requisições, no cabeçalho
//     "Authorization: Bearer <token>".
//  3. Em cada rota protegida, o middleware exigirLogin confere o token, descobre quem é o usuário
//     (e qual o perfil dele) e coloca esses dados em req.usuario. Sem token válido, responde 401.
//
// O token é "assinado": ele carrega o id do usuário e a validade, mais uma assinatura gerada com
// uma chave secreta que só o servidor conhece (TOKEN_SECRET, no arquivo .env). Se alguém alterar o
// token, a assinatura deixa de bater e ele é recusado. Só usamos o módulo "crypto" do próprio Node.js.

import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import { getConn } from "./db";
import { Linha, UsuarioLogado } from "./tipos";

// Chave secreta usada para assinar os tokens. Em produção ela vem do .env.
const SEGREDO = process.env.TOKEN_SECRET ?? "segredo-apenas-para-desenvolvimento-pi2-time8";
const VALIDADE_EM_SEGUNDOS = 8 * 60 * 60; // o token vale por 8 horas

// Gera o "hash" SHA-256 da senha. O banco guarda só o hash (coluna senha_hash), nunca a senha.
// O mesmo cálculo foi usado no script database/02_dados_teste.sql (STANDARD_HASH ... 'SHA256').
export function gerarHashSenha(senha: string): string {
  return crypto.createHash("sha256").update(senha, "utf8").digest("hex");
}

// Cria o token de um usuário: "corpo.assinatura"
export function gerarToken(usuarioId: number): string {
  const dados = { id: usuarioId, exp: Math.floor(Date.now() / 1000) + VALIDADE_EM_SEGUNDOS };
  const corpo = Buffer.from(JSON.stringify(dados)).toString("base64url");
  const assinatura = crypto.createHmac("sha256", SEGREDO).update(corpo).digest("base64url");
  return corpo + "." + assinatura;
}

// Confere o token. Se for válido (assinatura correta e dentro da validade), devolve o id do
// usuário. Se não for, devolve null.
export function lerToken(token: string): number | null {
  const partes = token.split(".");

  if (partes.length !== 2) {
    return null;
  }

  const corpo = partes[0];
  const assinatura = Buffer.from(partes[1]);
  const esperada = Buffer.from(crypto.createHmac("sha256", SEGREDO).update(corpo).digest("base64url"));

  // timingSafeEqual compara sem "vazar" informação pelo tempo de resposta
  if (assinatura.length !== esperada.length || !crypto.timingSafeEqual(assinatura, esperada)) {
    return null;
  }

  try {
    const dados = JSON.parse(Buffer.from(corpo, "base64url").toString("utf8"));

    if (typeof dados.id !== "number" || typeof dados.exp !== "number") {
      return null;
    }

    if (dados.exp < Math.floor(Date.now() / 1000)) {
      return null; // token vencido
    }

    return dados.id;
  } catch {
    return null;
  }
}

// Middleware: roda ANTES da rota. Se o token for válido, preenche req.usuario e deixa a requisição
// seguir (next). Se não for, responde 401 e a rota nem chega a ser executada.
export async function exigirLogin(req: Request, res: Response, next: NextFunction) {
  const cabecalho = req.headers.authorization ?? "";
  const token = cabecalho.startsWith("Bearer ") ? cabecalho.slice(7).trim() : "";
  const usuarioId = token === "" ? null : lerToken(token);

  if (usuarioId === null) {
    return res.status(401).json({ mensagem: "Sessão inválida ou expirada. Faça login novamente." });
  }

  let conn;
  try {
    conn = await getConn();
    // Busca o usuário no banco a cada requisição, para sempre usar o perfil atual dele
    const resultado = await conn.execute(
      `SELECT u.id_usuario AS "id", u.nome AS "nome", u.email AS "email",
              u.id_perfil AS "perfilId", p.nome AS "perfil"
         FROM usuario u
         JOIN perfil p ON p.id_perfil = u.id_perfil
        WHERE u.id_usuario = :id`,
      { id: usuarioId }
    );
    const linha = ((resultado.rows ?? []) as Linha[])[0];

    if (!linha) {
      return res.status(401).json({ mensagem: "Sessão inválida ou expirada. Faça login novamente." });
    }

    const usuario: UsuarioLogado = {
      id: linha.id,
      nome: linha.nome,
      email: linha.email,
      perfilId: linha.perfilId,
      perfil: linha.perfil,
    };
    req.usuario = usuario;
    next();
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ mensagem: "Erro ao verificar o usuário logado!" });
  } finally {
    if (conn) await conn.close();
  }
}
