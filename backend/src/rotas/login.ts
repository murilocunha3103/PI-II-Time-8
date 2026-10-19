// Autor: Gabriel Passarela Silva
//
// Rotas da tela de Login (Reunião 4):
//   POST /login     -> confere e-mail e senha e devolve os dados do usuário e o perfil
//   GET  /usuarios  -> lista os usuários pré-cadastrados
//
// Em nenhuma das duas a senha é devolvida na resposta.
//
// Códigos HTTP usados:
//   200 -> login feito / lista devolvida
//   400 -> e-mail ou senha ausentes
//   401 -> e-mail ou senha incorretos (credenciais inválidas)



import { Express, Request, Response } from "express";
import { usuarios } from "../dados/dados";
import { Usuario } from "../tipos";
import { textoOuVazio } from "../utilitarios";

// Devolve os dados públicos do usuário, SEM a senha
function removerSenha(usuario: Usuario) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    perfil: usuario.perfil
  };
}

export function registrarRotasLogin(app: Express) {
  // POST /login - corpo (JSON) 
  app.post("/login", (req: Request, res: Response) => {
    // Lê os dados do corpo. O "|| {}" evita erro se a requisição vier sem corpo.
    const { email, senha } = req.body || {};

    const emailInformado = textoOuVazio(email).toLowerCase();
    // A senha NÃO recebe trim(): espaços fazem parte da senha
    const senhaInformada = typeof senha === "string" ? senha : "";

    // 1. Campos obrigatórios (senão, 400)
    if (emailInformado === "" || senhaInformada === "") {
      return res.status(400).json({ mensagem: "E-mail e senha são obrigatórios." });
    }

    // 2. Procura um usuário com esse e-mail E essa senha
    const usuario = usuarios.find((item) => item.email.toLowerCase() === emailInformado && item.senha === senhaInformada);

    // 3. Não achou: as credenciais estão erradas (401). A mensagem é a mesma para
    //    e-mail inexistente e senha errada, para não revelar quais e-mails existem.
    if (!usuario) {
      return res.status(401).json({ mensagem: "E-mail ou senha inválidos." });
    }

    // 4. Achou: devolve os dados do usuário e o perfil, sem a senha
    return res.status(200).json({
      mensagem: "Login realizado com sucesso.",
      usuario: removerSenha(usuario)
    });
  });

  // GET /usuarios - lista os usuários, sem expor as senhas
  app.get("/usuarios", (req: Request, res: Response) => {
    return res.status(200).json(usuarios.map(removerSenha));
  });
}
