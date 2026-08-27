# Convenção de Commits

Este documento explica como escrever as mensagens de commit no nosso projeto. Isso
importa por dois motivos: primeiro, porque o Documento de Visão da disciplina (item
4.2 e 4.6) avalia a produção de código e o esforço de cada um pelo GitHub — uma
mensagem de commit clara mostra o que você fez.Segundo, porque com 5 pessoas
commitando no mesmo repositório, um histórico bagunçado ("mudanças", "ajustes",
"teste2") fica impossível de entender depois.

---

## 1. O que é um commit, na prática

Cada commit é um "salvamento" de uma parte do seu trabalho, com uma mensagem
explicando o que mudou. Prefira vários commits pequenos e claros a um único commit
gigante no final com tudo misturado.

Exemplo do que **não** fazer:
```
git commit -m "mudanças"
git commit -m "ajustes finais"
git commit -m "teste"
```

Exemplo do que fazer:
```
git commit -m "feat: cria estrutura HTML da tela de login"
git commit -m "style: aplica cores do projeto no formulário de login"
git commit -m "fix: corrige alinhamento do botão de entrar"
```

---

## 2. Formato da mensagem

```
tipo: o que foi feito, em poucas palavras, no infinitivo
```

- Escreva em português.
- Comece com um dos tipos abaixo (seção 3).
- Descreva o que mudou de forma direta: "cria a tela X", "corrige Y", "ajusta Z" —
  não "várias coisas" ou "correções".
- Tente manter a mensagem em uma linha só.

---

## 3. Tipos de commit que vamos usar

| Tipo | Quando usar | Exemplo |
|---|---|---|
| `feat` | Quando você cria algo novo (uma tela, uma seção, um formulário) | `feat: cria tela de cadastro de demanda` |
| `fix` | Quando você corrige um erro/bug que já existia | `fix: corrige link quebrado no menu` |
| `style` | Quando é só uma mudança visual (cor, espaçamento, fonte), sem mudar a estrutura | `style: ajusta cores dos botões conforme design.md` |
| `docs` | Quando você mexe em algum arquivo de documentação (`.md`) | `docs: atualiza tabela de responsáveis no design.md` |
| `chore` | Tarefas de organização que não são código nem documentação (ex: mexer no `.gitignore`) | `chore: adiciona pasta de imagens ao projeto` |

Se não tiver certeza de qual tipo usar, `feat` ou `fix` resolvem a maioria dos casos.

---

## 4. Regra de ouro: um commit, um assunto

Não junte a tela de login e a tela de dashboard no mesmo commit, mesmo que você tenha
trabalhado nas duas no mesmo dia. Cada commit deve falar sobre uma coisa só. Isso ajuda
o grupo (e os professores) a entender exatamente o que cada pessoa fez, olhando o
histórico do GitHub.

Errado:
```
git add .
git commit -m "feat: telas de login e dashboard"
```

Certo:
```
git add frontend/pages/login.html frontend/css/pages/login.css
git commit -m "feat: cria tela de login"

git add frontend/pages/dashboard.html frontend/css/pages/dashboard.css
git commit -m "feat: cria tela de dashboard"
```

(Isso só faz sentido se você for a mesma pessoa trabalhando nas duas telas por algum
motivo — o normal é cada um mexer só na própria tela, então esse conflito nem deve
aparecer.)

---

## 5. Passo a passo de um commit

```bash
# veja o que foi alterado
git status

# adicione só os arquivos da sua tela
git add frontend/pages/login.html frontend/css/pages/login.css

# commit com mensagem no padrão
git commit -m "feat: cria estrutura HTML da tela de login"

# envie pro GitHub
git push origin tela-login
```

---

## 6. Exemplos reais para as nossas 5 telas

```
feat: cria estrutura HTML da tela de login
style: aplica padrão visual do grupo na tela de login
feat: cria estrutura HTML do dashboard
style: organiza os cards de indicadores no dashboard
feat: cria estrutura HTML da listagem de demandas
style: estiliza tabela e etiquetas de prioridade/status
feat: cria formulário de cadastro/edição de demanda
fix: corrige campo de prazo que não aparecia corretamente
docs: atualiza design.md com a tabela de responsáveis
```
