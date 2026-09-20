// Autor: Arthur de Senna Nardi Cortina

// Ponto de entrada do backend do Sistema de Acompanhamento de Demandas.

// Nesta etapa (Reunião 3), o objetivo definido pela orientadora é apenas comprovar
// que o ambiente Node.js com TypeScript está configurado corretamente e que existe
// um servidor básico rodando localmente, respondendo a uma requisição simples.


import express, { Request, Response } from 'express';

const app = express();

// Porta onde o servidor vai rodar localmente
const PORTA = 3000;

// Rota inicial, só para comprovar que o servidor está de pé e respondendo.
// Ao acessar http://localhost:3000 no navegador, essa mensagem deve aparecer.

app.get('/', (req: Request, res: Response) => {
  res.send('Servidor do Sistema de Acompanhamento de Demandas está no ar! (PI-II - Time 8)');
});

app.listen(PORTA, () => {
  console.log(`Servidor rodando em http://localhost:${PORTA}`);
});
