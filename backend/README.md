# Backend — API do Sistema de Acompanhamento de Demandas

API feita com **Node.js + TypeScript + Express** (Reunião 4). Os dados ficam guardados
**em memória**: ao reiniciar o servidor, tudo que foi cadastrado pelas rotas POST é
perdido e os dados de teste voltam ao início. A conexão com o banco de dados vem em uma
etapa futura — quando isso acontecer, as rotas continuam as mesmas e só muda a forma de
acessar os dados.

## Como executar

Pré-requisito: Node.js na versão LTS (`node --version` e `npm --version` para conferir).

```
cd backend
npm install
npm run dev
```

Quando aparecer `Servidor rodando na porta 3000`, a API está no ar em
`http://localhost:3000`. Abra esse endereço no navegador para ver a lista de rotas.

| Comando | O que faz |
|---|---|
| `npm run dev` | Inicia o servidor e reinicia sozinho a cada arquivo salvo |
| `npm run build` | Compila o TypeScript para JavaScript (pasta `dist/`, ignorada pelo Git) |
| `npm start` | Executa o servidor já compilado |

## Estrutura de pastas

```
backend/
├── package.json            dependências e comandos do projeto
├── tsconfig.json           configuração do TypeScript
├── testes/                 requisições prontas de cada integrante (arquivos .http)
└── src/
    ├── server.ts           ponto de entrada: configura o Express e registra as rotas
    ├── tipos.ts            tipos (Usuario, Projeto, Demanda...) e listas de valores válidos
    ├── utilitarios.ts      funções auxiliares usadas por várias rotas
    ├── dados/
    │   └── dados.ts        DADOS DE TESTE em memória (usuários, projetos, demandas, comentários)
    └── rotas/              um arquivo por tela/integrante
        ├── login.ts              Gabriel Passarela
        ├── dashboard.ts          Arthur de Senna
        ├── listagemDemandas.ts   Murilo Cunha
        ├── cadastroDemanda.ts    Kevin Lima
        └── detalhesDemanda.ts    Joao Victor
```

Cada integrante mexe só no arquivo da própria tela dentro de `src/rotas/`. O
`server.ts` apenas chama a função `registrarRotas...` de cada arquivo.

## Rotas

| Método | Rota | O que faz | Integrante |
|---|---|---|---|
| POST | `/login` | Confere e-mail e senha e devolve o usuário e o perfil | Gabriel Passarela |
| GET | `/usuarios` | Lista os usuários, sem as senhas | Gabriel Passarela |
| GET | `/dashboard` | Indicadores: totais, por status/prioridade/tipo, críticas em aberto e próximas do prazo | Arthur de Senna |
| GET | `/demandas` | Lista demandas, com filtros, busca e ordenação | Murilo Cunha |
| POST | `/demandas` | Cadastra uma demanda, validando os dados no servidor | Kevin Lima |
| GET | `/projetos` | Lista os projetos | Kevin Lima |
| GET | `/demandas/:id` | Devolve uma demanda específica | Joao Victor |
| GET | `/demandas/:id/comentarios` | Lista os comentários da demanda | Joao Victor |
| POST | `/demandas/:id/comentarios` | Registra um comentário na demanda | Joao Victor |

Não existe rota de exclusão (`DELETE`): a exclusão física não é permitida no projeto.
Demandas serão **canceladas** (mudança de status) em uma etapa futura.

### Parâmetros de `GET /demandas`

| Parâmetro | Exemplo | Descrição |
|---|---|---|
| `status` | `?status=Aberta` | Aberta, Em andamento, Em revisão, Concluída ou Cancelada |
| `prioridade` | `?prioridade=Crítica` | Crítica, Alta, Média ou Baixa |
| `tipo` | `?tipo=Defeito` | Tarefa, Defeito, Melhoria ou Documentação |
| `responsavel` | `?responsavel=2` | id do usuário responsável |
| `projeto` | `?projeto=1` | id do projeto |
| `busca` | `?busca=login` | Procura no título ou na descrição |
| `ordenarPor` | `?ordenarPor=prazo` | `prioridade`, `dataCriacao`, `prazo` ou `status` |
| `ordem` | `?ordem=desc` | `asc` (padrão) ou `desc` |

Os parâmetros podem ser combinados: `/demandas?status=Aberta&prioridade=Crítica&ordenarPor=prazo`.
Status, prioridade e tipo não diferenciam maiúscula/minúscula nem acento.

## Padrão das respostas

Todas as respostas são em **JSON**:

* **Lista de registros** → um array: `[ {...}, {...} ]` (pode vir vazio: `[]`)
* **Um registro** → um objeto: `{ "id": 1, ... }`
* **Erro** → `{ "mensagem": "texto explicando o problema" }`. No `POST /demandas`, vem
  também a lista `erros` com todos os problemas encontrados.

| Código | Quando é usado |
|---|---|
| 200 | Consulta feita com sucesso |
| 201 | Registro criado (POST de demanda ou de comentário) |
| 400 | Dados inválidos (campo ausente, valor fora do permitido, JSON mal formatado) |
| 401 | Credenciais inválidas (e-mail ou senha incorretos) |
| 404 | Registro ou rota não encontrada |

As validações da API **não dependem** das validações feitas nas telas: mesmo uma
requisição que não venha do sistema (por exemplo, feita pelo Thunder Client) é conferida.

## Critérios do dashboard

A Reunião 4 pede que a equipe defina e explique estes dois critérios:

* **"Em aberto"**: demanda com status **Aberta**, ou seja, registrada e ainda não
  iniciada. Portanto, **críticas em aberto** = prioridade Crítica + status Aberta. É o
  alerta de "algo crítico que ninguém começou a resolver". Demandas críticas que já estão
  Em andamento ou Em revisão estão sendo tratadas e aparecem nas contagens normais.
* **"Próximas do prazo"**: demanda **ainda não finalizada** (status diferente de
  Concluída e Cancelada) com prazo **entre hoje e os próximos 7 dias**, inclusive.

## Dados de teste

Os dados estão em `src/dados/dados.ts`: 5 usuários, 3 projetos, 18 demandas e 8
comentários, com tipos, prioridades, status e prazos variados. Os prazos são calculados
a partir da data de hoje, então sempre há demandas próximas do prazo e atrasadas,
independente do dia em que o servidor for iniciado.

### Usuários (para testar o `POST /login`)

| id | Nome | E-mail | Senha | Perfil |
|---|---|---|---|---|
| 1 | Arthur de Senna | arthur@dominio.com | `Admin@123` | Administrador |
| 2 | Murilo Cunha | murilo@dominio.com | `Lider@123` | Líder de Projeto |
| 3 | Joao Victor | joao@dominio.com | `Lider@123` | Líder de Projeto |
| 4 | Gabriel Passarela | gabriel@dominio.com | `Membro@123` | Membro da Equipe |
| 5 | Kevin Lima | kevin@dominio.com | `Membro@123` | Membro da Equipe |

As senhas aparecem aqui e no código só porque são **dados de teste**. A API nunca as
devolve nas respostas, e num sistema real elas seriam guardadas criptografadas.

### Projetos

| id | Nome |
|---|---|
| 1 | Sistema de Acompanhamento de Demandas |
| 2 | Portal do Aluno |
| 3 | App de Biblioteca |

## Como testar as rotas

Nesta etapa as telas ainda não chamam a API: as rotas são testadas diretamente.

* **Rotas GET:** pelo navegador (ex.: `http://localhost:3000/demandas`) ou pelo Thunder Client.
* **Rotas POST:** pelo Thunder Client (extensão do VS Code), Postman ou Insomnia. Em
  requisições com corpo, usar o formato **JSON** (aba *Body* → *JSON*).

A pasta `testes/` tem um arquivo `.http` por integrante com as requisições prontas
(válidas e com erro), cada uma com o código HTTP esperado. Os arquivos são texto simples:
é só copiar o método, a URL e o corpo para o Thunder Client.

## O que ainda não existe (próximas etapas)

Banco de dados, integração das telas com a API (`fetch`), edição de demandas, alteração
de status, responsável ou prioridade, regras do ciclo de vida, cancelamento, histórico de
alterações, controle de permissões por perfil e verificação de feriado por API externa.
