# Padrão Visual do Grupo

> Este documento define as regras visuais que as telas do sistema devem seguir,

**Regra geral: antes de estilizar algo, olhe aqui. Se não tiver certeza de qual cor ou
tamanho usar, pergunta no grupo antes de inventar um valor novo.**

---

## 1. Cores

As cores já estão prontas em `frontend/css/base/variables.css`, então na prática você
só usa `var(--nome-da-cor)` no seu CSS. Aqui vai o que cada uma significa:

### Cores gerais do sistema

| O que é | Variável |
|---|---|
| Cor principal (usar em botões de ação principal, links, títulos de destaque) | `var(--cor-primaria)` |
| Cor principal mais escura (usar no hover de botões, por exemplo) | `var(--cor-primaria-escura)` |
| Fundo da página | `var(--cor-fundo)` |
| Fundo de caixas/painéis/cards | `var(--cor-fundo-card)` |
| Texto normal | `var(--cor-texto)` |
| Texto secundário, legendas, datas | `var(--cor-texto-claro)` |
| Bordas e linhas divisórias | `var(--cor-borda)` |

### Cores de prioridade da demanda

O Documento de Visão define 4 prioridades (item 2.2.2). Cada uma tem uma cor fixa —
use sempre a mesma cor para a mesma prioridade em qualquer lugar do sistema (tabela,
dashboard, tela de detalhes):

| Prioridade | Variável |
|---|---|
| Crítica | `var(--cor-prioridade-critica)` (vermelho) |
| Alta | `var(--cor-prioridade-alta)` (laranja) |
| Média | `var(--cor-prioridade-media)` (amarelo) |
| Baixa | `var(--cor-prioridade-baixa)` (verde) |

### Cores de status da demanda

O Documento de Visão define 5 status (item 2.2.3). Mesma lógica das prioridades:

| Status | Variável |
|---|---|
| Aberta | `var(--cor-status-aberta)` (cinza) |
| Em andamento | `var(--cor-status-andamento)` (azul) |
| Em revisão | `var(--cor-status-revisao)` (amarelo) |
| Concluída | `var(--cor-status-concluida)` (verde) |
| Cancelada | `var(--cor-status-cancelada)` (vermelho, e o texto deve ficar riscado) |

Nas telas que mostram prioridade ou status (dashboard, listagem de demandas, detalhes
da demanda), use essas cores em pequenas etiquetas/selos, não deixe o texto solto sem
destaque visual — quem olhar rápido precisa identificar a urgência pela cor.

---

## 2. Tipografia

Fonte do projeto: **Inter** (do Google Fonts). Todas as páginas devem importar ela no
`<head>`, antes do link do `main.css`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Tamanhos de texto (já disponíveis em `variables.css`):

| Uso | Variável |
|---|---|
| Título da página (ex: "Demandas", "Dashboard") | `var(--tamanho-titulo-grande)` |
| Título de seção dentro da página | `var(--tamanho-titulo-medio)` |
| Título pequeno (ex: título de um card) | `var(--tamanho-titulo-pequeno)` |
| Texto normal | `var(--tamanho-texto)` |
| Texto pequeno, legendas, datas | `var(--tamanho-texto-pequeno)` |

---

## 3. Espaçamento

Não use números soltos tipo `padding: 13px`. Use sempre uma das variáveis prontas,
pra manter o "respiro" das telas parecido:

```
var(--espaco-pequeno)       → 8px
var(--espaco-medio)         → 16px
var(--espaco-grande)        → 24px
var(--espaco-extra-grande)  → 32px
```

---

## 4. Regras de aparência por elemento

Estas não são classes prontas de CSS — cada um escreve o próprio CSS na sua tela.
São regras de como cada elemento deve parecer, pra ficar parecido entre as 5 telas.

### Botões
- Cantos arredondados (algo entre `4px` e `8px` de `border-radius`).
- Botão de ação principal (ex: "Salvar", "Entrar", "Nova demanda") usa
  `var(--cor-primaria)` de fundo, texto branco.
- Botão secundário (ex: "Cancelar") usa fundo transparente ou branco, com borda
  `var(--cor-borda)`.
- Botão de ação destrutiva (ex: "Cancelar demanda") usa
  `var(--cor-prioridade-critica)` de fundo, texto branco.

### Formulários (telas de login e cadastro de demanda)
- Cada campo tem um `<label>` em cima dele, não do lado.
- Os campos (`input`, `select`, `textarea`) têm borda fina na cor `var(--cor-borda)`
  e cantos arredondados, pra combinar com os botões.
- Deixe um espaçamento (`var(--espaco-medio)` ou `var(--espaco-grande)`) entre um
  campo e outro, pra não ficar tudo grudado.

### Tabela (tela de listagem de demandas)
- O cabeçalho da tabela (`<thead>`) deve se destacar um pouco do restante (ex: fundo
  levemente diferente ou texto em `var(--cor-texto-claro)`).
- Prioridade e status devem aparecer como uma etiqueta colorida (uma `<span>` com
  fundo colorido, conforme a tabela de cores da seção 1), não como texto solto.

### Cards / caixas de conteúdo (dashboard e tela de detalhes)
- Fundo `var(--cor-fundo-card)`, cantos arredondados, um espaçamento interno
  confortável (`var(--espaco-grande)`).
- Uma sombra bem leve ajuda a diferenciar o card do fundo da página (opcional).

### Cabeçalho / menu do sistema
- Todas as 5 telas devem ter, no topo, uma barra com o nome do sistema e links para
  navegar entre as telas (Dashboard / Demandas).
- Usar a mesma barra (mesma cor, mesma altura, mesmos links) nas 5 páginas — isso é o
  que mais dá a sensação de "sistema único".

---

## 5. Layout geral

- O conteúdo de cada página não deve ocupar a tela inteira de ponta a ponta em telas
  grandes — deixe uma largura máxima (algo em torno de `1000px` a `1200px`) centralizada,
  com um espaçamento nas laterais.
- No dashboard, os números/indicadores (total de demandas, abertas, em andamento etc.,
  conforme o item 2.4 do Documento de Visão) devem ficar organizados em blocos/cards,
  não em uma lista de texto corrido.

---

## 6. Quem é responsável por qual tela

Preencham esta tabela antes de começar a desenvolver:

| Tela | Responsável |
|---|---|
| Login | |
| Dashboard | |
| Listagem de Demandas | |
| Cadastro/Edição de Demanda | |
| Detalhes da Demanda | |

---

## 7. Checklist rápido antes de considerar sua tela pronta

- [ ] Usei as cores de `variables.css`, não cores digitadas na mão
- [ ] Usei os tamanhos de espaçamento de `variables.css`
- [ ] Minha tela tem a mesma barra de navegação das outras 4 telas
- [ ] Se minha tela mostra prioridade ou status, usei as etiquetas coloridas certas
- [ ] Botões seguem o padrão (principal, secundário, destrutivo) descrito aqui
