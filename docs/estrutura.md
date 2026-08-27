# Como está organizado o projeto

Este documento explica como as pastas do projeto estão organizadas e como cada pessoa
do grupo deve trabalhar dentro delas. Leia antes de começar a mexer em qualquer arquivo.

---

## 1. As 4 pastas principais

```
PI-II-Time-8/
├── frontend/     → tudo que o usuário vê: as telas em HTML e CSS
├── backend/       → ainda vazia. Vai receber a API (Node.js), arquivos do backend, etc...
├── database/       → ainda vazia. Vai receber a criação das tabelas do banco de
│                      dados, mais pra frente
└── docs/            → os documentos do grupo (este arquivo, o de design e o de commits e outros se necessário)
```

---

## 2. Dentro da pasta `frontend/`

```
frontend/
├── pages/            → as telas do sistema, uma por arquivo .html
│   ├── login.html
│   ├── dashboard.html
│   ├── demandas-lista.html
│   ├── demanda-form.html
│   └── demanda-detalhes.html
│
├── css/
│   ├── base/
│   │   ├── variables.css    → cores, fontes e espaçamentos do projeto (já preenchido)
│   │   └── reset.css         → ajuste básico que deixa todo navegador igual (já pronto)
│   ├── pages/                 → 1 arquivo CSS pra cada tela
│   │   ├── login.css
│   │   ├── dashboard.css
│   │   ├── demandas-lista.css
│   │   ├── demanda-form.css
│   │   └── demanda-detalhes.css
│   └── main.css                → junta o variables.css e o reset.css, é linkado em toda página
│
├── js/                → vazia por enquanto. Vai receber os scripts de Java Script
└── assets/
    ├── img/            → imagens que a gente for usar (logo, ícones de tela, etc.)
    └── icons/          → ícones separados, se precisar
```

---

## 3. Como cada tela usa o CSS

Todo arquivo `.html` da pasta `pages/` já vem com esses dois links no `<head>`,
não precisa mexer nisso:

```html
<link rel="stylesheet" href="../css/main.css">
<link rel="stylesheet" href="../css/pages/login.css">
```

- `main.css` traz as cores/fontes/espaçamentos padrão (não precisa editar ele).
- `css/pages/login.css` (ou o nome da sua tela) é onde você escreve o CSS da sua
  página. Esse arquivo já existe, só está vazio esperando você preencher.

Quando for escolher uma cor ou um espaçamento, dê uma olhada em
`frontend/css/base/variables.css` antes — se já existir uma variável pra aquilo, use
ela (`var(--cor-primaria)`, por exemplo) em vez de inventar uma cor nova. Isso mantém
as 5 telas parecidas entre si. As regras de quando usar cada cor/tamanho estão em
[`design.md`](./design.md).

---

## 4. Como visualizar sua tela no navegador

Não precisa instalar nada nem rodar comando nenhum:

1. Abra a pasta do projeto no VS Code.
2. Clique com o botão direito no seu arquivo `.html` (dentro de `frontend/pages/`) e
   escolha **"Open with Live Server"** (se tiver a extensão instalada) — ou simplesmente
   dê dois cliques no arquivo `.html` pra abrir direto no navegador.
3. Depois de qualquer alteração salva, é só atualizar a página (F5).

---

## 5. Fluxo de trabalho (resumido)

1. Antes de começar, atualize sua cópia do projeto:
   ```bash
   git checkout main
   git pull origin main
   ```
2. Crie uma branch só sua, com o nome da sua tela:
   ```bash
   git checkout -b tela-login
   ```
   (troque `tela-login` pelo nome da tela que você ficou responsável, ex:
   `tela-dashboard`, `tela-demandas-lista`)
3. Edite só o `.html` e o `.css` da sua tela.
4. Salve o trabalho com commits (veja o guia completo de como escrever a mensagem em
   [`convencao-commits.md`](./convencao-commits.md)):
   ```bash
   git add frontend/pages/login.html frontend/css/pages/login.css
   git commit -m "feat: cria estrutura da tela de login"
   ```
5. Envie sua branch para o GitHub:
   ```bash
   git push origin tela-login
   ```
6. No site do GitHub, abra um Pull Request da sua branch para a `main` e peça pra
   alguém do grupo dar uma olhada antes de aceitar.
7. Depois que o Pull Request for aceito (merge feito), todo mundo do grupo roda de novo:
   ```bash
   git checkout main
   git pull origin main
   ```
   pra já ficar com a tela nova atualizada.
8. Não esqueça de atualizar o card da sua tarefa no GitHub Projects (status e tempo
   gasto), como pede o item 6 da Reunião 2.

---

## 6. Antes de considerar sua tela pronta

- [ ] Usei as variáveis de `variables.css` para cores e espaçamentos, sempre que fez
      sentido e segui o arquivo de design do projeto
- [ ] Testei minha tela abrindo no navegador
- [ ] Fiz commit(s) e o Pull Request pra `main`
- [ ] Atualizei meu card no GitHub Projects
