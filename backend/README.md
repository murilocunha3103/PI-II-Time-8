# Backend

Ambiente inicial do backend, configurado na Reunião 3.

## O que já está pronto

- Projeto Node.js inicializado (`package.json`), com Express e TypeScript como
  dependências.
- Configuração do TypeScript (`tsconfig.json`).
- Um servidor básico em `src/server.ts`, que sobe na porta `3000` e responde uma
  mensagem simples pra comprovar que está funcionando.

## Como rodar

1. Ter o Node.js instalado (versão LTS).
2. Dentro da pasta `backend/`, instalar as dependências:
   ```
   npm install
   ```
3. Rodar o servidor em modo desenvolvimento:
   ```
   npm run dev
   ```
4. Abrir `http://localhost:3000` no navegador. Deve aparecer a mensagem de que o
   servidor está no ar.

## O que ainda não existe (fases futuras)

- Conexão com o banco de dados (pasta `database/`, ainda vazia).
- Rotas de verdade para demandas, usuários e projetos, conforme o Documento de Visão.
- Autenticação/login de fato (a tela de login segue sendo só visual por enquanto).

Essas partes vão sendo construídas nas próximas reuniões, conforme o conteúdo for
sendo visto em aula.
