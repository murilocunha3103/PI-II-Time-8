# Banco de dados — Oracle

Scripts do banco de dados do Sistema de Acompanhamento de Demandas. O modelo (conceitual, lógico e físico) está
documentado no trabalho de Estudos de Banco de Dados I. **Exige Oracle 12c ou superior** (colunas `IDENTITY`).

## Scripts (execute com "Executar Script", F5, no SQL Developer)

| Ordem | Arquivo | O que faz |
|---|---|---|
| — | `00_remover_tabelas.sql` | Apaga todas as tabelas. Só use para recriar o banco do zero |
| 1 | `01_criar_tabelas.sql` | Cria as 11 tabelas, as restrições e os 13 índices |
| 2 | `02_dados_teste.sql` | Carrega os dados de teste. **Rode uma única vez** |
| — | `03_consultas_exemplo.sql` | Consultas (SELECT) que mostram o que cada rota da API usa do banco |
| — | `04_testes_validacao.sql` | Testes automáticos: imprime PASS ou FALHOU (rode no mesmo dia do script 02) |

Para recomeçar: `00` → `01` → `02`. Conferência: `select count(*) from demanda;` deve devolver **18**.

## As 11 tabelas

| Tabela | Para que serve |
|---|---|
| `perfil` | Administrador, Líder de Projeto e Membro da Equipe |
| `tipo_demanda` | Tarefa, Defeito, Melhoria e Documentação |
| `prioridade` | Crítica, Alta, Média e Baixa (coluna `ordem` para ordenar) |
| `status_demanda` | Aberta, Em andamento, Em revisão, Concluída e Cancelada |
| `transicao_status` | Mudanças de status permitidas (o ciclo de vida) |
| `usuario` | Usuários, com a senha guardada só como hash |
| `projeto` | Projetos |
| `projeto_usuario` | Quais usuários participam de quais projetos (define o que cada um enxerga) |
| `demanda` | As demandas (nunca são apagadas: o cancelamento é uma mudança de status) |
| `comentario` | Comentários de cada demanda |
| `historico_demanda` | Histórico de alterações (status, responsável, prioridade, prazo e cancelamento) |

## Dados de teste

3 projetos, 5 usuários (1 Administrador, 2 Líderes e 2 Membros), 18 demandas, 8 comentários e 28 registros de histórico.
As datas são relativas ao dia em que o script 02 for executado, então sempre há demandas próximas do prazo e atrasadas.
As senhas de teste estão no README do projeto.

## Observações

* Cada integrante executa os scripts no **seu próprio esquema** do Oracle.
* As chaves estrangeiras não usam `ON DELETE CASCADE`: o banco recusa apagar uma demanda que já tenha comentários ou histórico.
* Os scripts precisam ser abertos em **UTF-8** para os acentos aparecerem certos.
