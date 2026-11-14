// Autor: Arthur de Senna Nardi Cortina
//
// Ponto de entrada da API do Sistema de Acompanhamento de Demandas (Reunião 5).
//
// Este arquivo liga as peças: lê o arquivo .env, cria o pool de conexões com o Oracle, configura
// o Express e registra as rotas de cada integrante. As rotas ficam na pasta src/rotas (um arquivo
// por tela/integrante) e o acesso ao banco em src/db.ts.
//
// Padrão das respostas (todas em JSON):
//   - lista de registros  -> um array JSON            ex.: [ {...}, {...} ]
//   - um registro só      -> um objeto JSON           ex.: { "id": 1, ... }
//   - erro                -> { "mensagem": "..." }    com o código HTTP adequado
//
// Códigos HTTP usados: 200 (sucesso), 201 (criado), 400 (dados inválidos ou regra de negócio),
// 401 (não autenticado), 403 (sem permissão para o perfil), 404 (não encontrado) e 500 (erro inesperado).
// Todas as rotas, exceto POST /login e GET /, exigem o token do usuário (veja autenticacao.ts).

import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { closePool, initPool } from "./db";

import { registrarRotasLogin } from "./rotas/login";
import { registrarRotasFeriados } from "./rotas/feriados";
import { registrarRotasDashboard } from "./rotas/dashboard";
import { registrarRotasListagem } from "./rotas/listagemDemandas";
import { registrarRotasHistorico } from "./rotas/historicoDemanda";
import { registrarRotasCancelamento } from "./rotas/cancelamentoDemanda";
import { registrarRotasDetalhes } from "./rotas/detalhesDemanda";
import { registrarRotasStatus } from "./rotas/statusDemanda";
import { registrarRotasCadastro } from "./rotas/cadastroDemanda";
import { registrarRotasEdicao } from "./rotas/edicaoDemanda";

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

// cors: permite que as telas (que rodam em outra porta) chamem esta API no navegador
app.use(cors());

// express.json(): faz o Express entender o JSON enviado no corpo (req.body). Precisa vir antes das rotas.
app.use(express.json());

// Rota inicial: confirma que a API está no ar e lista as rotas disponíveis
app.get("/", (req: Request, res: Response) => {
  return res.status(200).json({
    mensagem: "API do Sistema de Acompanhamento de Demandas no ar! (PI-II - Time 8)",
    rotas: [
      "POST /login",
      "GET /usuarios",
      "GET /feriados/verificar",
      "GET /projetos",
      "GET /dashboard",
      "GET /demandas",
      "POST /demandas",
      "GET /demandas/:id",
      "PUT /demandas/:id",
      "PATCH /demandas/:id/status",
      "POST /demandas/:id/cancelar",
      "GET /demandas/:id/comentarios",
      "POST /demandas/:id/comentarios",
      "GET /demandas/:id/historico",
    ],
  });
});

// Registra as rotas de cada integrante (cada função está no arquivo indicado)
registrarRotasLogin(app); // Gabriel Passarela - src/rotas/login.ts
registrarRotasFeriados(app); // Gabriel Passarela - src/rotas/feriados.ts
registrarRotasDashboard(app); // Arthur de Senna - src/rotas/dashboard.ts
registrarRotasListagem(app); // Murilo Cunha - src/rotas/listagemDemandas.ts
registrarRotasHistorico(app); // Murilo Cunha - src/rotas/historicoDemanda.ts
registrarRotasCancelamento(app); // Murilo Cunha - src/rotas/cancelamentoDemanda.ts
registrarRotasDetalhes(app); // Joao Victor - src/rotas/detalhesDemanda.ts
registrarRotasStatus(app); // Joao Victor - src/rotas/statusDemanda.ts
registrarRotasCadastro(app); // Kevin Lima - src/rotas/cadastroDemanda.ts
registrarRotasEdicao(app); // Kevin Lima - src/rotas/edicaoDemanda.ts

// Se nenhuma rota acima respondeu, o caminho não existe: devolve 404 em JSON
app.use((req: Request, res: Response) => {
  return res.status(404).json({ mensagem: "Rota não encontrada." });
});

// Tratamento de erros: sem ele, um JSON mal formatado no corpo da requisição faria o Express
// responder com uma página HTML de erro. Aqui garantimos que o erro também saia em JSON.
app.use((erro: Error, req: Request, res: Response, next: NextFunction) => {
  if (erro instanceof SyntaxError) {
    return res.status(400).json({ mensagem: "O corpo da requisição não é um JSON válido." });
  }

  console.error(erro);
  return res.status(500).json({ mensagem: "Erro inesperado no servidor." });
});

// Prepara o pool de conexões com o Oracle ANTES de abrir a porta HTTP.
// Se o banco estiver inacessível (VPN desligada, senha errada...), o servidor avisa e encerra.
async function iniciarServidor() {
  try {
    await initPool();
    console.log("Conexão com o Oracle estabelecida.");

    app.listen(PORT, () => {
      console.log(`Servidor ativo na porta ${PORT} -> http://localhost:${PORT}`);
    });

    // SIGINT = Ctrl+C no terminal; SIGTERM = pedido de término enviado pelo sistema
    process.on("SIGINT", encerrarServidor);
    process.on("SIGTERM", encerrarServidor);
  } catch (erro) {
    console.error("Falha ao iniciar o servidor (confira o arquivo .env, a VPN e o banco):", erro);
    process.exit(1);
  }
}

// Fecha o pool de conexões antes de encerrar o programa
async function encerrarServidor() {
  try {
    await closePool();
    console.log("Pool de conexões encerrado.");
    process.exit(0);
  } catch (erro) {
    console.error("Falha ao encerrar o pool:", erro);
    process.exit(1);
  }
}

iniciarServidor();
