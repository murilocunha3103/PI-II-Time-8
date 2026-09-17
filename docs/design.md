<!-- Autor: Arthur de Senna, Gabriel Passarela, João Victor Nunes, Kevin Eziquiel e Murilo Xavier -->

# Padrão Visual do Grupo

> Este documento define as regras visuais que as telas do sistema devem seguir,
> pensadas com técnicas reais de UI/UX (psicologia das cores, hierarquia tipográfica,
> contraste de formas) para dar identidade própria ao projeto.

**Regra geral: antes de estilizar algo, olhe aqui. Se não tiver certeza de qual cor ou
tamanho usar, pergunta no grupo antes de inventar um valor novo.**

---

## 1. Conceito

Pensamos o sistema como uma espécie de **quadro de ordens de serviço** — um jeito mais
"documento de trabalho" do que "aplicativo genérico" de mostrar demandas. Essa ideia
guiou todas as decisões abaixo: paleta em tons terrosos (como papel e carimbo), formas
retas em vez de arredondadas, e uma fonte monoespaçada nos títulos e etiquetas, como se
cada demanda tivesse um número de protocolo.

---

## 2. Cores

As cores já estão prontas em `frontend/css/base/variables.css`. Aqui vai o que cada
uma significa e por que foi escolhida.

### Cores gerais do sistema

| O que é | Variável | Por quê |
|---|---|---|
| Cor principal (botão de ação, links, destaque) | `var(--cor-primaria)` | Terracota/ferrugem. Transmite ação e urgência sem ser um vermelho de alarme. |
| Cor principal escura (hover) | `var(--cor-primaria-escura)` | Mesma cor, mais escura, pra dar feedback visual ao passar o mouse. |
| Fundo da página | `var(--cor-fundo)` | Tom creme/papel, reforça a ideia de "documento/ficha de trabalho". |
| Fundo de cards/painéis | `var(--cor-fundo-card)` | Branco levemente quente, destaca do fundo creme sem ficar um branco "hospitalar". |
| Texto normal | `var(--cor-texto)` | Preto levemente amarronzado (tinta), combina com o restante da paleta. |
| Texto secundário/legenda | `var(--cor-texto-claro)` | Cinza com leve tom quente. |
| Bordas finas (divisórias, campos de formulário) | `var(--cor-borda)` | Bege/areia suave, discreta. |
| Bordas fortes (contorno de cards e caixas principais) | `var(--cor-borda-forte)` | Usa a própria cor de texto (tinta), com 2px de espessura, no lugar de sombra suave — dá um contorno gráfico, tipo "documento carimbado". |

### Cores de prioridade da demanda

Tons terrosos e mais escuros, o que também ajuda no contraste do texto branco em cima:

| Prioridade | Variável | Cor |
|---|---|---|
| Crítica | `var(--cor-prioridade-critica)` | Vermelho-tijolo |
| Alta | `var(--cor-prioridade-alta)` | Laranja queimado |
| Média | `var(--cor-prioridade-media)` | Ocre/mostarda escuro |
| Baixa | `var(--cor-prioridade-baixa)` | Verde-oliva |

### Cores de status da demanda

Status usa uma família de cores **fria** (azul-petróleo, ameixa, verde-floresta, vinho),
enquanto prioridade usa uma família **quente** (vermelho, laranja, ocre, oliva). Essa
separação por temperatura de cor cria uma leitura rápida: só de bater o olho na cor,
já dá pra saber se está olhando pra urgência (quente) ou pra andamento (frio).

| Status | Variável | Cor |
|---|---|---|
| Aberta | `var(--cor-status-aberta)` | Cinza quente |
| Em andamento | `var(--cor-status-andamento)` | Azul-petróleo |
| Em revisão | `var(--cor-status-revisao)` | Ameixa (roxo acinzentado) |
| Concluída | `var(--cor-status-concluida)` | Verde-floresta |
| Cancelada | `var(--cor-status-cancelada)` | Vinho, e o texto fica riscado |

Nas telas que mostram prioridade ou status (dashboard, listagem de demandas, detalhes
da demanda), essas cores aparecem em etiquetas — nunca como texto solto sem destaque.

---

## 3. Tipografia

O projeto usa uma dupla de fontes, uma técnica clássica de identidade visual: uma fonte
pra "voz de marca" (títulos, menu, etiquetas) e outra pra leitura confortável (texto
corrido).

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
```

- **Work Sans** (`var(--fonte-padrao)`) → texto normal, parágrafos, campos de formulário.
- **Space Mono** (`var(--fonte-destaque)`) → nome do sistema no menu, títulos de página
  e as etiquetas de prioridade/status. Uma fonte monoespaçada remete a "número de
  protocolo/ticket", reforçando o conceito da seção 1.

Tamanhos de texto (já disponíveis em `variables.css`):

| Uso | Variável |
|---|---|
| Título da página (ex: "Demandas", "Dashboard") | `var(--tamanho-titulo-grande)` |
| Título de seção dentro da página | `var(--tamanho-titulo-medio)` |
| Título pequeno (ex: título de um card) | `var(--tamanho-titulo-pequeno)` |
| Texto normal | `var(--tamanho-texto)` |
| Texto pequeno, legendas, datas | `var(--tamanho-texto-pequeno)` |

---

## 4. Formas e espessura de linha

- Cantos de botões, campos de formulário e etiquetas: `var(--raio-interativo)` (`3px`)
  — quase reto.
- Cantos de cards, tabelas e caixas principais: `var(--raio-container)` (`0px`, reto)
  — reforça a ideia de "documento", não de "app fofinho".
- Badges de prioridade/status são retangulares, com o canto pequeno
  (`var(--raio-interativo)`), parecendo uma etiqueta/carimbo.
- Cards e caixas principais (login, tabela, formulário, detalhes) usam borda de 2px na
  cor `var(--cor-borda-forte)` — um contorno gráfico e decidido, em vez de sombra.
- Campos de formulário e divisórias internas usam borda fina (1px) em
  `var(--cor-borda)`. A borda grossa fica reservada só pros contêineres principais,
  criando uma hierarquia visual: grosso = "isso é uma seção", fino = "isso é um campo".

---

## 5. Espaçamento

Não use números soltos tipo `padding: 13px`. Use sempre uma das variáveis prontas,
pra manter o "respiro" das telas parecido:
var(--espaco-pequeno) → 8px
var(--espaco-medio) → 16px
var(--espaco-grande) → 24px
var(--espaco-extra-grande) → 32px

---

## 6. Regras de aparência por elemento

Estas não são classes prontas de CSS — cada um escreve o próprio CSS na sua tela. São
regras de como cada elemento deve parecer, pra ficar parecido entre as 5 telas.

### Menu superior
- Fonte `var(--fonte-destaque)` (monoespaçada) no nome do sistema, em maiúsculas, com
  espaçamento entre letras (`letter-spacing`).
- Mesma barra (cor, altura, links) nas 5 telas — isso é o que garante a sensação de
  sistema único.

### Botões
- Cantos levemente arredondados (`var(--raio-interativo)`).
- Ação principal (ex: "Salvar", "Entrar", "Nova demanda"): fundo `var(--cor-primaria)`,
  texto branco.
- Ação secundária (ex: "Cancelar"): fundo transparente, borda `var(--cor-borda)`.
- Ação destrutiva (ex: "Cancelar demanda"): fundo `var(--cor-prioridade-critica)`, texto
  branco.

### Formulários (telas de login e cadastro de demanda)
- Cada campo tem um `<label>` em cima dele, não do lado.
- Campos (`input`, `select`, `textarea`) com borda fina (`var(--cor-borda)`) e canto
  `var(--raio-interativo)`.
- Espaçamento de `var(--espaco-medio)` ou `var(--espaco-grande)` entre um campo e outro.

### Tabela (tela de listagem de demandas)
- Cabeçalho (`<thead>`) com fundo `var(--cor-fundo)` e texto em
  `var(--cor-texto-claro)`.
- A tabela inteira tem borda de 2px (`var(--cor-borda-forte)`), sem cantos arredondados.
- Prioridade e status aparecem como etiqueta retangular colorida, nunca como texto
  solto.

### Cards / caixas de conteúdo (dashboard, login, detalhes)
- Fundo `var(--cor-fundo-card)`, contorno de 2px (`var(--cor-borda-forte)`), sem
  sombra.
- Cantos retos (`var(--raio-container)`).

---

## 7. Layout geral

- O conteúdo de cada página não deve ocupar a tela inteira de ponta a ponta em telas
  grandes — deixe uma largura máxima (algo em torno de `600px` a `1100px`, dependendo
  da tela) centralizada, com espaçamento nas laterais.
- No dashboard, os indicadores (total de demandas, abertas, em andamento etc.,
  conforme o item 2.4 do Documento de Visão) ficam organizados em cards, não em uma
  lista de texto corrido.

---

## 8. Quem é responsável por qual tela

Preencham esta tabela antes de começar a desenvolver:

| Tela | Responsável |
|---|---|
| Login | |
| Dashboard | |
| Listagem de Demandas | |
| Cadastro/Edição de Demanda | |
| Detalhes da Demanda | |

---

## 9. Checklist rápido antes de considerar sua tela pronta

- [ ] Usei as cores de `variables.css`, não cores digitadas na mão
- [ ] Usei os tamanhos de espaçamento de `variables.css`
- [ ] Coloquei o link das fontes (Work Sans + Space Mono) no `<head>` da minha página
- [ ] Nome do sistema no menu está com a fonte monoespaçada
- [ ] Cards/tabela/caixa principal usam borda de 2px, sem cantos arredondados
- [ ] Etiquetas de prioridade/status são retangulares, não em formato pílula
- [ ] Minha tela tem a mesma barra de navegação das outras 4 telas
