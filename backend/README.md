# Backend — API do Sistema de Acompanhamento de Demandas

API feita com **Node.js + TypeScript + Express**, conectada ao **Oracle Database** pelo driver `oracledb`
(Reunião 5). Os dados ficam no banco: o que for cadastrado continua lá depois de reiniciar o servidor.

## Como executar

Pré-requisitos: Node.js LTS, banco Oracle criado com os scripts da pasta `database/` e arquivo `.env` configurado
(veja o [README do projeto](../README.md), passos 3 e 4).

```
cd backend
npm install
npm run dev
```

Quando aparecer `Conexão com o Oracle estabelecida.` e `Servidor ativo na porta 3000`, a API está no ar em
`http://localhost:3000`. Abra esse endereço no navegador para ver a lista de rotas.

| Comando | O que faz |
|---|---|
| `npm run dev` | Inicia o servidor e reinicia sozinho a cada arquivo salvo |
| `npm run build` | Compila o TypeScript para JavaScript (pasta `dist/`, ignorada pelo Git) |
| `npm start` | Executa o servidor já compilado |

## Configuração (arquivo `.env`)

Copie `.env.example` para `.env` e preencha. Variáveis: `ORACLE_HOST`, `ORACLE_PORT`, `ORACLE_SERVICE`, `ORACLE_USER`,
`ORACLE_PASSWORD`, `PORT` e `TOKEN_SECRET` (chave que assina os tokens de login). O `.env` nunca vai para o GitHub.

## Estrutura de pastas

```
backend/
├── package.json, tsconfig.json
├── .env.example            modelo da configuração (sem senhas)
├── testes/                 requisições prontas de cada integrante (arquivos .http)
└── src/
    ├── server.ts           ponto de entrada: abre o pool do Oracle, configura o Express e registra as rotas
    ├── db.ts               conexão com o Oracle (pool de conexões), fornecido pela disciplina (Aula 10)
    ├── tipos.ts            tipos e constantes (ids dos perfis e dos status)
    ├── utilitarios.ts      funções auxiliares (validação de texto, número e data, busca)
    ├── autenticacao.ts     login: hash da senha, token assinado e o middleware exigirLogin
    ├── permissoes.ts       regras dos 3 perfis (quem pode o quê)
    ├── consultas.ts        consultas usadas por várias rotas (demanda, projetos que o usuário enxerga, tabelas de apoio)
    ├── historico.ts        gravação do histórico de alterações
    ├── servicoFeriados.ts  verificação de feriado nacional (API externa + lista de contingência)
    ├── validacaoDemanda.ts validações do cadastro e da edição de demandas
    └── rotas/              um arquivo por tela/integrante
        ├── login.ts                Gabriel Passarela   POST /login, GET /usuarios
        ├── feriados.ts             Gabriel Passarela   GET /feriados/verificar
        ├── dashboard.ts            Arthur de Senna     GET /dashboard
        ├── listagemDemandas.ts     Murilo Cunha        GET /demandas
        ├── historicoDemanda.ts     Murilo Cunha        GET /demandas/:id/historico
        ├── cancelamentoDemanda.ts  Murilo Cunha        POST /demandas/:id/cancelar
        ├── detalhesDemanda.ts      Joao Victor         GET /demandas/:id e comentários
        ├── statusDemanda.ts        Joao Victor         PATCH /demandas/:id/status
        ├── cadastroDemanda.ts      Kevin Lima          POST /demandas, GET /projetos
        └── edicaoDemanda.ts        Kevin Lima          PUT /demandas/:id
```

## Autenticação

1. `POST /login` com e-mail e senha devolve um **token**.
2. Todas as outras rotas (menos `GET /` e `POST /login`) exigem o cabeçalho `Authorization: Bearer <token>`.
3. Sem token, ou com token inválido ou vencido (vale 8 horas), a API responde **401**.

A senha é guardada no banco só como hash (SHA-256). O token é assinado com `TOKEN_SECRET`: se alguém alterar o conteúdo, a
assinatura deixa de bater e o token é recusado.

## Rotas

| Método | Rota | O que faz | Quem pode |
|---|---|---|---|
| POST | `/login` | Confere e-mail e senha; devolve o token e o usuário | todos |
| GET | `/usuarios` | Lista usuários (`?projeto=ID` filtra pelos vinculados ao projeto) | logado |
| GET | `/projetos` | Lista os projetos que o usuário enxerga | logado |
| GET | `/feriados/verificar?data=AAAA-MM-DD` | Informa se a data é feriado nacional | logado |
| GET | `/dashboard` | Indicadores (totais, por status, prioridade e tipo, críticas em aberto, próximas do prazo) | logado |
| GET | `/demandas` | Lista demandas, com filtros, busca e ordenação | logado |
| POST | `/demandas` | Cadastra uma demanda | Administrador e Líder |
| GET | `/demandas/:id` | Devolve uma demanda e o que o usuário pode fazer com ela (`acoes`) | logado |
| PUT | `/demandas/:id` | Edita a demanda (inclui responsável, prioridade e prazo) | Administrador e Líder |
| PATCH | `/demandas/:id/status` | Muda o status, seguindo o ciclo de vida | conforme o perfil |
| POST | `/demandas/:id/cancelar` | Cancela a demanda (lógico: ela não é apagada) | Administrador e Líder |
| GET | `/demandas/:id/comentarios` | Lista os comentários | logado |
| POST | `/demandas/:id/comentarios` | Registra um comentário (o autor é o usuário logado) | logado |
| GET | `/demandas/:id/historico` | Histórico de alterações, do mais recente para o mais antigo | logado |

Não existe rota de exclusão (`DELETE`): a exclusão física é proibida no projeto. Cada usuário só enxerga as demandas dos
projetos aos quais tem acesso; fora deles, a API responde 404.

### Formato das respostas

* Lista de registros: um array JSON. Um registro: um objeto JSON.
* Erro: `{ "mensagem": "..." }`. Nos formulários, também vem `"erros": ["...", "..."]` com todos os problemas.
* Códigos: **200** sucesso, **201** criado, **400** dados inválidos ou regra de negócio, **401** sem login, **403** perfil sem permissão, **404** não encontrado, **500** erro inesperado.

### Uma demanda

```json
{
  "id": 1, "titulo": "...", "descricao": "...",
  "tipo": "Defeito", "prioridade": "Crítica", "status": "Aberta",
  "projeto": { "id": 1, "nome": "..." },
  "responsavel": { "id": 4, "nome": "Gabriel Passarela" },
  "dataCriacao": "2026-11-03T10:15:00", "dataAtualizacao": "2026-11-05T09:00:00", "prazo": "2026-11-10"
}
```

`responsavel` e `prazo` podem ser `null`. Em `GET /demandas/:id` vem também `acoes: { podeEditar, podeCancelar, statusPermitidos }`.

### Parâmetros de `GET /demandas`

| Parâmetro | Valores | Observação |
|---|---|---|
| `status` | Aberta, Em andamento, Em revisão, Concluída, Cancelada | ignora acento e maiúscula |
| `prioridade` | Crítica, Alta, Média, Baixa | idem |
| `tipo` | Tarefa, Defeito, Melhoria, Documentação | idem |
| `responsavel` | id do usuário | |
| `projeto` | id do projeto | |
| `busca` | texto | procura no título, na descrição e no nome do responsável |
| `ordenarPor` | prioridade, dataCriacao, prazo, status | demandas sem prazo ficam sempre no final |
| `ordem` | asc (padrão) ou desc | |

### Dashboard: critérios adotados pela equipe

* **Em aberto**: demanda com status Aberta. **Críticas em aberto** = prioridade Crítica + status Aberta.
* **Próximas do prazo**: demanda não finalizada (diferente de Concluída e Cancelada) com prazo entre hoje e os próximos 7 dias.
* Filtros opcionais: `prioridade`, `responsavel` (id), `projeto` (id) e `busca`.

## Ciclo de vida do status

```
Aberta → Em andamento → Em revisão → Concluída
                ↑______________|   (Em revisão pode voltar para Em andamento)
Qualquer status ainda não finalizado → Cancelada (rota própria)
```

Não se conclui direto de Em andamento e não se volta de Em andamento para Aberta. As mudanças permitidas ficam na tabela
`transicao_status` do banco. O **Membro da Equipe** só faz Aberta → Em andamento e Em andamento → Em revisão, e só nas
demandas atribuídas a ele. Cada mudança vai para o histórico, com o nome de quem a fez.

## Regras de negócio da API

* O status de uma demanda nova é sempre **Aberta**, e as datas de criação e de atualização são do banco.
* O **responsável** é opcional e precisa estar vinculado ao projeto da demanda.
* O **prazo** é opcional, não pode estar no passado e **não pode ser feriado nacional** (API externa BrasilAPI; sem internet, a API usa uma lista local de feriados nacionais).
* Demandas Concluídas ou Canceladas não podem mais ser editadas nem canceladas.
* Alterações e histórico são gravados na **mesma transação**: ou grava tudo, ou nada.

## Como testar

Os arquivos da pasta `testes/` trazem requisições prontas (formato `.http`, da extensão REST Client; também servem de
roteiro para o Thunder Client). Para testar no Thunder Client: faça `POST /login`, copie o `token` da resposta e, nas
outras requisições, abra a aba **Auth → Bearer** e cole o token.

Usuários de teste (senhas): Administrador `arthur@dominio.com` / `Admin@123`; Líder `murilo@dominio.com` e `joao@dominio.com` /
`Lider@123`; Membro `gabriel@dominio.com` e `kevin@dominio.com` / `Membro@123`.
