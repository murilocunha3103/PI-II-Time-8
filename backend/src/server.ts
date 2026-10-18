// Autor: Arthur de Senna Nardi Cortina

// Ponto de entrada da API do Sistema de Acompanhamento de Demandas (Reunião 4).

// Este arquivo só liga as peças: configura o Express e "registra" as rotas de cada
// integrante. As rotas em si ficam na pasta src/rotas (um arquivo por tela) e os dados
// de teste em src/dados. Assim, cada pessoa mexe só no seu arquivo e não atrapalha os outros.

// Padrão das respostas da API (todas em JSON):
//   - lista de registros  -> um array JSON            ex.: [ {...}, {...} ]
//   - um registro só      -> um objeto JSON           ex.: { "id": 1, ... }
//   - erro                -> { "mensagem": "..." }    com o código HTTP adequado

// Códigos HTTP usados: 200 (sucesso), 201 (registro criado), 400 (dados inválidos),
// 401 (credenciais inválidas) e 404 (registro não encontrado).

import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';

import { registrarRotasLogin } from './rotas/login';
import { registrarRotasDashboard } from './rotas/dashboard';
import { registrarRotasListagem } from './rotas/listagemDemandas';
import { registrarRotasCadastro } from './rotas/cadastroDemanda';
import { registrarRotasDetalhes } from './rotas/detalhesDemanda';

const app = express();
const PORT = 3000;

// cors: permite que as telas (que rodam em outra porta) chamem esta API no navegador.
// Vai ser necessário quando o frontend passar a usar fetch.
app.use(cors());

// express.json(): faz o Express entender JSON enviado no corpo (req.body) das
// requisições POST. Precisa vir ANTES das rotas.
app.use(express.json());

// Rota inicial: confirma que a API está no ar e lista as rotas disponíveis
app.get('/', (req: Request, res: Response) => {
  return res.status(200).json({
    mensagem: 'API do Sistema de Acompanhamento de Demandas no ar! (PI-II - Time 8)',
    rotas: [
      'POST /login',
      'GET /usuarios',
      'GET /dashboard',
      'GET /demandas',
      'POST /demandas',
      'GET /projetos',
      'GET /demandas/:id',
      'GET /demandas/:id/comentarios',
      'POST /demandas/:id/comentarios',
    ],
  });
});

// Registra as rotas de cada integrante (cada função está no arquivo indicado)
registrarRotasLogin(app); // Gabriel Passarela - src/rotas/login.ts
registrarRotasDashboard(app); // Arthur de Senna - src/rotas/dashboard.ts
registrarRotasListagem(app); // Murilo Cunha - src/rotas/listagemDemandas.ts
registrarRotasCadastro(app); // Kevin Lima - src/rotas/cadastroDemanda.ts
registrarRotasDetalhes(app); // Joao Victor - src/rotas/detalhesDemanda.ts

// Se nenhuma rota acima respondeu, o caminho não existe: devolve 404 em JSON
app.use((req: Request, res: Response) => {
  return res.status(404).json({ mensagem: 'Rota não encontrada.' });
});

// Tratamento de erros: sem isto, um JSON mal formatado no corpo da requisição faria o
// Express responder com uma página HTML de erro. Aqui garantimos que o erro também
// saia em JSON. (O Express só reconhece este tipo de função se ela tiver 4 parâmetros.)
app.use((erro: Error, req: Request, res: Response, next: NextFunction) => {
  if (erro instanceof SyntaxError) {
    return res.status(400).json({ mensagem: 'O corpo da requisição não é um JSON válido.' });
  }

  return res.status(500).json({ mensagem: 'Erro inesperado no servidor.' });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT} -> http://localhost:${PORT}`);
});
