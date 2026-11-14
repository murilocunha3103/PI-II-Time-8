-- Autor: Arthur de Senna Nardi Cortina (modelagem do banco de dados do grupo, Estudos de Banco de Dados I)
-- ============================================================================
-- Projeto Integrador II - Sistema de Acompanhamento de Demandas de Desenvolvimento
-- Time 8 | Estudos de Banco de Dados I | PUC-Campinas | Engenharia de Software
-- Script 02 - Dados de teste (mesmos dados de teste da API da Reunião 4)
-- ============================================================================
--
-- Rode este script UMA vez, logo depois do 01. Para recriar tudo do zero: 00 -> 01 -> 02.
-- As datas são relativas a HOJE (SYSDATE), então sempre há demandas próximas do prazo e atrasadas.
-- Os ids das tabelas com IDENTITY são gerados na ordem dos INSERTs (1, 2, 3...), por isso a
-- ordem abaixo não deve ser alterada.
-- As senhas são guardadas como hash SHA-256 (STANDARD_HASH, Oracle 12c+). Senhas de teste:
--   Administrador: Admin@123 | Líder de Projeto: Lider@123 | Membro da Equipe: Membro@123
-- ============================================================================

-- Tabelas de apoio ------------------------------------------------------------
insert into perfil (id_perfil, nome) values (1, 'Administrador');
insert into perfil (id_perfil, nome) values (2, 'Líder de Projeto');
insert into perfil (id_perfil, nome) values (3, 'Membro da Equipe');
insert into tipo_demanda (id_tipo, nome) values (1, 'Tarefa');
insert into tipo_demanda (id_tipo, nome) values (2, 'Defeito');
insert into tipo_demanda (id_tipo, nome) values (3, 'Melhoria');
insert into tipo_demanda (id_tipo, nome) values (4, 'Documentação');
insert into prioridade (id_prioridade, nome, ordem) values (1, 'Crítica', 1);
insert into prioridade (id_prioridade, nome, ordem) values (2, 'Alta', 2);
insert into prioridade (id_prioridade, nome, ordem) values (3, 'Média', 3);
insert into prioridade (id_prioridade, nome, ordem) values (4, 'Baixa', 4);
insert into status_demanda (id_status, nome, ordem, finalizado) values (1, 'Aberta', 1, 'N');
insert into status_demanda (id_status, nome, ordem, finalizado) values (2, 'Em andamento', 2, 'N');
insert into status_demanda (id_status, nome, ordem, finalizado) values (3, 'Em revisão', 3, 'N');
insert into status_demanda (id_status, nome, ordem, finalizado) values (4, 'Concluída', 4, 'S');
insert into status_demanda (id_status, nome, ordem, finalizado) values (5, 'Cancelada', 5, 'S');

-- Ciclo de vida da demanda (Documento de Visão, item 2.2.4): origem -> destino
insert into transicao_status (id_status_origem, id_status_destino) values (1, 2); -- Aberta -> Em andamento
insert into transicao_status (id_status_origem, id_status_destino) values (2, 3); -- Em andamento -> Em revisão
insert into transicao_status (id_status_origem, id_status_destino) values (3, 4); -- Em revisão -> Concluída
insert into transicao_status (id_status_origem, id_status_destino) values (3, 2); -- Em revisão -> Em andamento
insert into transicao_status (id_status_origem, id_status_destino) values (1, 5); -- Aberta -> Cancelada
insert into transicao_status (id_status_origem, id_status_destino) values (2, 5); -- Em andamento -> Cancelada
insert into transicao_status (id_status_origem, id_status_destino) values (3, 5); -- Em revisão -> Cancelada

-- Usuários, projetos e vínculos ---------------------------------------------
insert into usuario (nome, email, senha_hash, id_perfil) values ('Arthur de Senna', 'arthur@dominio.com', LOWER(RAWTOHEX(STANDARD_HASH('Admin@123', 'SHA256'))), 1);
insert into usuario (nome, email, senha_hash, id_perfil) values ('Murilo Cunha', 'murilo@dominio.com', LOWER(RAWTOHEX(STANDARD_HASH('Lider@123', 'SHA256'))), 2);
insert into usuario (nome, email, senha_hash, id_perfil) values ('Joao Victor', 'joao@dominio.com', LOWER(RAWTOHEX(STANDARD_HASH('Lider@123', 'SHA256'))), 2);
insert into usuario (nome, email, senha_hash, id_perfil) values ('Gabriel Passarela', 'gabriel@dominio.com', LOWER(RAWTOHEX(STANDARD_HASH('Membro@123', 'SHA256'))), 3);
insert into usuario (nome, email, senha_hash, id_perfil) values ('Kevin Lima', 'kevin@dominio.com', LOWER(RAWTOHEX(STANDARD_HASH('Membro@123', 'SHA256'))), 3);
insert into projeto (nome, descricao) values ('Sistema de Acompanhamento de Demandas', 'Projeto Integrador II - sistema de acompanhamento de demandas de desenvolvimento.');
insert into projeto (nome, descricao) values ('Portal do Aluno', 'Portal web para consulta de notas, matrículas e disciplinas.');
insert into projeto (nome, descricao) values ('App de Biblioteca', 'Aplicativo para consulta e reserva de livros da biblioteca.');
insert into projeto_usuario (id_projeto, id_usuario) values (1, 1);
insert into projeto_usuario (id_projeto, id_usuario) values (1, 2);
insert into projeto_usuario (id_projeto, id_usuario) values (1, 3);
insert into projeto_usuario (id_projeto, id_usuario) values (1, 4);
insert into projeto_usuario (id_projeto, id_usuario) values (1, 5);
insert into projeto_usuario (id_projeto, id_usuario) values (2, 2);
insert into projeto_usuario (id_projeto, id_usuario) values (2, 3);
insert into projeto_usuario (id_projeto, id_usuario) values (2, 5);
insert into projeto_usuario (id_projeto, id_usuario) values (3, 2);
insert into projeto_usuario (id_projeto, id_usuario) values (3, 3);
insert into projeto_usuario (id_projeto, id_usuario) values (3, 4);

-- Demandas (18) --------------------------------------------------------------
insert into demanda (titulo, descricao, id_tipo, id_prioridade, id_status, id_projeto, id_responsavel, data_criacao, data_atualizacao, prazo)
values ('Corrigir erro de login com senha válida', 'Usuários com senha correta estão recebendo a mensagem de credenciais inválidas ao tentar entrar no sistema.', 2, 1, 1, 1, 4, SYSTIMESTAMP - INTERVAL '5' DAY, SYSTIMESTAMP - INTERVAL '3' DAY, TRUNC(SYSDATE) + 2);
insert into demanda (titulo, descricao, id_tipo, id_prioridade, id_status, id_projeto, id_responsavel, data_criacao, data_atualizacao, prazo)
values ('Criar tela de dashboard com indicadores', 'Montar a tela inicial com os cards de total de demandas, quantidade por status, prioridade e tipo.', 1, 2, 2, 1, 1, SYSTIMESTAMP - INTERVAL '12' DAY, SYSTIMESTAMP - INTERVAL '1' DAY, TRUNC(SYSDATE) + 5);
insert into demanda (titulo, descricao, id_tipo, id_prioridade, id_status, id_projeto, id_responsavel, data_criacao, data_atualizacao, prazo)
values ('Escrever README do projeto', 'Documentar como instalar as dependências e executar o projeto para os avaliadores.', 4, 4, 4, 1, 2, SYSTIMESTAMP - INTERVAL '30' DAY, SYSTIMESTAMP - INTERVAL '7' DAY, TRUNC(SYSDATE) - 6);
insert into demanda (titulo, descricao, id_tipo, id_prioridade, id_status, id_projeto, id_responsavel, data_criacao, data_atualizacao, prazo)
values ('Validar formulário de cadastro de demanda', 'Aplicar validações de título, descrição e prazo na tela de cadastro de demanda.', 3, 3, 3, 1, 5, SYSTIMESTAMP - INTERVAL '9' DAY, SYSTIMESTAMP - INTERVAL '2' DAY, TRUNC(SYSDATE) + 3);
insert into demanda (titulo, descricao, id_tipo, id_prioridade, id_status, id_projeto, id_responsavel, data_criacao, data_atualizacao, prazo)
values ('Implementar filtro na listagem de demandas', 'Permitir filtrar a tabela de demandas por status, prioridade e busca por texto.', 1, 2, 2, 1, 2, SYSTIMESTAMP - INTERVAL '8' DAY, SYSTIMESTAMP - INTERVAL '2' DAY, TRUNC(SYSDATE) + 10);
insert into demanda (titulo, descricao, id_tipo, id_prioridade, id_status, id_projeto, id_responsavel, data_criacao, data_atualizacao, prazo)
values ('Adicionar comentários na tela de detalhes', 'Permitir registrar comentários em uma demanda e exibir a lista de comentários na tela.', 1, 3, 4, 1, 3, SYSTIMESTAMP - INTERVAL '14' DAY, SYSTIMESTAMP - INTERVAL '4' DAY, TRUNC(SYSDATE) - 3);
insert into demanda (titulo, descricao, id_tipo, id_prioridade, id_status, id_projeto, id_responsavel, data_criacao, data_atualizacao, prazo)
values ('Ajustar menu em telas pequenas', 'O menu superior quebra o layout em telas com pouca largura.', 3, 4, 5, 1, 4, SYSTIMESTAMP - INTERVAL '20' DAY, SYSTIMESTAMP - INTERVAL '8' DAY, TRUNC(SYSDATE) - 1);
insert into demanda (titulo, descricao, id_tipo, id_prioridade, id_status, id_projeto, id_responsavel, data_criacao, data_atualizacao, prazo)
values ('Configurar servidor Node.js com TypeScript', 'Preparar o ambiente do backend com Node.js, TypeScript e Express.', 1, 1, 4, 1, 1, SYSTIMESTAMP - INTERVAL '25' DAY, SYSTIMESTAMP - INTERVAL '10' DAY, TRUNC(SYSDATE) - 10);
insert into demanda (titulo, descricao, id_tipo, id_prioridade, id_status, id_projeto, id_responsavel, data_criacao, data_atualizacao, prazo)
values ('Revisar regras de senha do login', 'Definir com a equipe quais critérios de senha serão exigidos no cadastro e no login.', 3, 3, 1, 1, NULL, SYSTIMESTAMP - INTERVAL '4' DAY, SYSTIMESTAMP - INTERVAL '4' DAY, TRUNC(SYSDATE) + 14);
insert into demanda (titulo, descricao, id_tipo, id_prioridade, id_status, id_projeto, id_responsavel, data_criacao, data_atualizacao, prazo)
values ('Falha ao exportar relatório de notas em PDF', 'O sistema trava ao exportar relatórios com mais de 500 linhas.', 2, 1, 2, 2, 5, SYSTIMESTAMP - INTERVAL '3' DAY, SYSTIMESTAMP - INTERVAL '1' DAY, TRUNC(SYSDATE) + 1);
insert into demanda (titulo, descricao, id_tipo, id_prioridade, id_status, id_projeto, id_responsavel, data_criacao, data_atualizacao, prazo)
values ('Documentar API de matrículas', 'Descrever todas as rotas de matrícula, com exemplos de requisição e resposta.', 4, 3, 1, 2, 3, SYSTIMESTAMP - INTERVAL '6' DAY, SYSTIMESTAMP - INTERVAL '6' DAY, TRUNC(SYSDATE) + 6);
insert into demanda (titulo, descricao, id_tipo, id_prioridade, id_status, id_projeto, id_responsavel, data_criacao, data_atualizacao, prazo)
values ('Permitir filtrar disciplinas por semestre', 'Adicionar um filtro de semestre na tela de disciplinas do portal.', 3, 2, 1, 2, 2, SYSTIMESTAMP - INTERVAL '2' DAY, SYSTIMESTAMP - INTERVAL '2' DAY, TRUNC(SYSDATE) + 20);
insert into demanda (titulo, descricao, id_tipo, id_prioridade, id_status, id_projeto, id_responsavel, data_criacao, data_atualizacao, prazo)
values ('Tela de busca de livros não carrega a capa', 'Ao buscar livros cujo título tem acento, a imagem da capa não aparece.', 2, 2, 3, 3, 4, SYSTIMESTAMP - INTERVAL '11' DAY, SYSTIMESTAMP - INTERVAL '2' DAY, TRUNC(SYSDATE) + 4);
insert into demanda (titulo, descricao, id_tipo, id_prioridade, id_status, id_projeto, id_responsavel, data_criacao, data_atualizacao, prazo)
values ('Cadastro duplicado de autores', 'Autores com nomes parecidos estão sendo cadastrados mais de uma vez no sistema.', 2, 1, 1, 3, NULL, SYSTIMESTAMP - INTERVAL '7' DAY, SYSTIMESTAMP - INTERVAL '7' DAY, TRUNC(SYSDATE) - 2);
insert into demanda (titulo, descricao, id_tipo, id_prioridade, id_status, id_projeto, id_responsavel, data_criacao, data_atualizacao, prazo)
values ('Criar manual de uso do app de biblioteca', 'Escrever um passo a passo para os bibliotecários usarem o aplicativo.', 4, 4, 2, 3, 3, SYSTIMESTAMP - INTERVAL '15' DAY, SYSTIMESTAMP - INTERVAL '5' DAY, TRUNC(SYSDATE) + 30);
insert into demanda (titulo, descricao, id_tipo, id_prioridade, id_status, id_projeto, id_responsavel, data_criacao, data_atualizacao, prazo)
values ('Padronizar mensagens de erro da API', 'Garantir que todas as rotas devolvam erros em JSON, com o mesmo formato de mensagem.', 1, 3, 3, 1, 1, SYSTIMESTAMP - INTERVAL '5' DAY, SYSTIMESTAMP - INTERVAL '1' DAY, TRUNC(SYSDATE) + 7);
insert into demanda (titulo, descricao, id_tipo, id_prioridade, id_status, id_projeto, id_responsavel, data_criacao, data_atualizacao, prazo)
values ('Atualizar paleta de cores do portal', 'Trocar as cores antigas do portal pela nova identidade visual.', 3, 4, 4, 2, 5, SYSTIMESTAMP - INTERVAL '40' DAY, SYSTIMESTAMP - INTERVAL '16' DAY, TRUNC(SYSDATE) - 15);
insert into demanda (titulo, descricao, id_tipo, id_prioridade, id_status, id_projeto, id_responsavel, data_criacao, data_atualizacao, prazo)
values ('Implementar notificações de prazo', 'Avisar os responsáveis quando uma demanda estiver perto do prazo de finalização.', 3, 2, 5, 2, NULL, SYSTIMESTAMP - INTERVAL '18' DAY, SYSTIMESTAMP - INTERVAL '9' DAY, NULL);

-- Comentários (8) ------------------------------------------------------------
insert into comentario (id_demanda, id_usuario, texto, data_hora) values (1, 4, 'Consegui reproduzir o erro apenas com e-mails escritos em letras maiúsculas.', SYSTIMESTAMP - INTERVAL '4' DAY);
insert into comentario (id_demanda, id_usuario, texto, data_hora) values (1, 2, 'Prioridade máxima: o erro impede o acesso de todos os usuários.', SYSTIMESTAMP - INTERVAL '3' DAY);
insert into comentario (id_demanda, id_usuario, texto, data_hora) values (2, 1, 'Cards de indicadores prontos, falta ligar nos dados vindos da API.', SYSTIMESTAMP - INTERVAL '5' DAY);
insert into comentario (id_demanda, id_usuario, texto, data_hora) values (4, 5, 'Validações de título, descrição e prazo concluídas, aguardando revisão.', SYSTIMESTAMP - INTERVAL '2' DAY);
insert into comentario (id_demanda, id_usuario, texto, data_hora) values (4, 3, 'Revisei os campos obrigatórios e está de acordo com o escopo.', SYSTIMESTAMP - INTERVAL '1' DAY);
insert into comentario (id_demanda, id_usuario, texto, data_hora) values (10, 5, 'O erro só acontece quando o relatório tem mais de 500 linhas.', SYSTIMESTAMP - INTERVAL '2' DAY);
insert into comentario (id_demanda, id_usuario, texto, data_hora) values (13, 4, 'A capa não carrega quando o título do livro possui acento.', SYSTIMESTAMP - INTERVAL '8' DAY);
insert into comentario (id_demanda, id_usuario, texto, data_hora) values (14, 2, 'Autores com nomes parecidos estão sendo cadastrados duas vezes.', SYSTIMESTAMP - INTERVAL '6' DAY);

-- Histórico de alterações (28) -----------------------------------------------
insert into historico_demanda (id_demanda, id_usuario, campo_alterado, valor_anterior, valor_novo, data_hora)
values (1, 2, 'RESPONSAVEL', NULL, 'Gabriel Passarela', SYSTIMESTAMP - INTERVAL '4' DAY);
insert into historico_demanda (id_demanda, id_usuario, campo_alterado, valor_anterior, valor_novo, data_hora)
values (1, 2, 'PRIORIDADE', 'Alta', 'Crítica', SYSTIMESTAMP - INTERVAL '3' DAY);
insert into historico_demanda (id_demanda, id_usuario, campo_alterado, valor_anterior, valor_novo, data_hora)
values (2, 1, 'PRAZO', TO_CHAR(TRUNC(SYSDATE) + 3, 'YYYY-MM-DD'), TO_CHAR(TRUNC(SYSDATE) + 5, 'YYYY-MM-DD'), SYSTIMESTAMP - INTERVAL '6' DAY);
insert into historico_demanda (id_demanda, id_usuario, campo_alterado, valor_anterior, valor_novo, data_hora)
values (2, 1, 'STATUS', 'Aberta', 'Em andamento', SYSTIMESTAMP - INTERVAL '1' DAY);
insert into historico_demanda (id_demanda, id_usuario, campo_alterado, valor_anterior, valor_novo, data_hora)
values (3, 2, 'STATUS', 'Aberta', 'Em andamento', SYSTIMESTAMP - INTERVAL '22' DAY);
insert into historico_demanda (id_demanda, id_usuario, campo_alterado, valor_anterior, valor_novo, data_hora)
values (3, 2, 'STATUS', 'Em andamento', 'Em revisão', SYSTIMESTAMP - INTERVAL '15' DAY);
insert into historico_demanda (id_demanda, id_usuario, campo_alterado, valor_anterior, valor_novo, data_hora)
values (3, 1, 'STATUS', 'Em revisão', 'Concluída', SYSTIMESTAMP - INTERVAL '7' DAY);
insert into historico_demanda (id_demanda, id_usuario, campo_alterado, valor_anterior, valor_novo, data_hora)
values (4, 5, 'STATUS', 'Aberta', 'Em andamento', SYSTIMESTAMP - INTERVAL '5' DAY);
insert into historico_demanda (id_demanda, id_usuario, campo_alterado, valor_anterior, valor_novo, data_hora)
values (4, 5, 'STATUS', 'Em andamento', 'Em revisão', SYSTIMESTAMP - INTERVAL '2' DAY);
insert into historico_demanda (id_demanda, id_usuario, campo_alterado, valor_anterior, valor_novo, data_hora)
values (5, 2, 'PRIORIDADE', 'Média', 'Alta', SYSTIMESTAMP - INTERVAL '5' DAY);
insert into historico_demanda (id_demanda, id_usuario, campo_alterado, valor_anterior, valor_novo, data_hora)
values (5, 2, 'STATUS', 'Aberta', 'Em andamento', SYSTIMESTAMP - INTERVAL '2' DAY);
insert into historico_demanda (id_demanda, id_usuario, campo_alterado, valor_anterior, valor_novo, data_hora)
values (6, 3, 'STATUS', 'Aberta', 'Em andamento', SYSTIMESTAMP - INTERVAL '11' DAY);
insert into historico_demanda (id_demanda, id_usuario, campo_alterado, valor_anterior, valor_novo, data_hora)
values (6, 3, 'STATUS', 'Em andamento', 'Em revisão', SYSTIMESTAMP - INTERVAL '7' DAY);
insert into historico_demanda (id_demanda, id_usuario, campo_alterado, valor_anterior, valor_novo, data_hora)
values (6, 2, 'STATUS', 'Em revisão', 'Concluída', SYSTIMESTAMP - INTERVAL '4' DAY);
insert into historico_demanda (id_demanda, id_usuario, campo_alterado, valor_anterior, valor_novo, data_hora)
values (7, 2, 'CANCELAMENTO', 'Aberta', 'Cancelada', SYSTIMESTAMP - INTERVAL '8' DAY);
insert into historico_demanda (id_demanda, id_usuario, campo_alterado, valor_anterior, valor_novo, data_hora)
values (8, 1, 'STATUS', 'Aberta', 'Em andamento', SYSTIMESTAMP - INTERVAL '20' DAY);
insert into historico_demanda (id_demanda, id_usuario, campo_alterado, valor_anterior, valor_novo, data_hora)
values (8, 1, 'STATUS', 'Em andamento', 'Em revisão', SYSTIMESTAMP - INTERVAL '15' DAY);
insert into historico_demanda (id_demanda, id_usuario, campo_alterado, valor_anterior, valor_novo, data_hora)
values (8, 1, 'STATUS', 'Em revisão', 'Concluída', SYSTIMESTAMP - INTERVAL '10' DAY);
insert into historico_demanda (id_demanda, id_usuario, campo_alterado, valor_anterior, valor_novo, data_hora)
values (10, 5, 'STATUS', 'Aberta', 'Em andamento', SYSTIMESTAMP - INTERVAL '1' DAY);
insert into historico_demanda (id_demanda, id_usuario, campo_alterado, valor_anterior, valor_novo, data_hora)
values (13, 4, 'STATUS', 'Aberta', 'Em andamento', SYSTIMESTAMP - INTERVAL '6' DAY);
insert into historico_demanda (id_demanda, id_usuario, campo_alterado, valor_anterior, valor_novo, data_hora)
values (13, 4, 'STATUS', 'Em andamento', 'Em revisão', SYSTIMESTAMP - INTERVAL '2' DAY);
insert into historico_demanda (id_demanda, id_usuario, campo_alterado, valor_anterior, valor_novo, data_hora)
values (15, 3, 'STATUS', 'Aberta', 'Em andamento', SYSTIMESTAMP - INTERVAL '5' DAY);
insert into historico_demanda (id_demanda, id_usuario, campo_alterado, valor_anterior, valor_novo, data_hora)
values (16, 1, 'STATUS', 'Aberta', 'Em andamento', SYSTIMESTAMP - INTERVAL '3' DAY);
insert into historico_demanda (id_demanda, id_usuario, campo_alterado, valor_anterior, valor_novo, data_hora)
values (16, 1, 'STATUS', 'Em andamento', 'Em revisão', SYSTIMESTAMP - INTERVAL '1' DAY);
insert into historico_demanda (id_demanda, id_usuario, campo_alterado, valor_anterior, valor_novo, data_hora)
values (17, 5, 'STATUS', 'Aberta', 'Em andamento', SYSTIMESTAMP - INTERVAL '32' DAY);
insert into historico_demanda (id_demanda, id_usuario, campo_alterado, valor_anterior, valor_novo, data_hora)
values (17, 5, 'STATUS', 'Em andamento', 'Em revisão', SYSTIMESTAMP - INTERVAL '24' DAY);
insert into historico_demanda (id_demanda, id_usuario, campo_alterado, valor_anterior, valor_novo, data_hora)
values (17, 3, 'STATUS', 'Em revisão', 'Concluída', SYSTIMESTAMP - INTERVAL '16' DAY);
insert into historico_demanda (id_demanda, id_usuario, campo_alterado, valor_anterior, valor_novo, data_hora)
values (18, 1, 'CANCELAMENTO', 'Aberta', 'Cancelada', SYSTIMESTAMP - INTERVAL '9' DAY);

commit;
