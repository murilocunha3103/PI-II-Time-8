-- Autor: Arthur de Senna Nardi Cortina (modelagem do banco de dados do grupo, Estudos de Banco de Dados I)
-- ============================================================================
-- Projeto Integrador II - Sistema de Acompanhamento de Demandas de Desenvolvimento
-- Time 8 | Estudos de Banco de Dados I | PUC-Campinas | Engenharia de Software
-- Script 00 - Remove as tabelas (opcional: use antes de recriar o banco)
-- ============================================================================
--
-- CUIDADO: apaga todas as tabelas e todos os dados. Se alguma tabela ainda não existir,
-- o Oracle mostra o erro ORA-00942 naquela linha; isso é normal e pode ser ignorado.
-- ============================================================================

drop table historico_demanda cascade constraints purge;
drop table comentario cascade constraints purge;
drop table demanda cascade constraints purge;
drop table projeto_usuario cascade constraints purge;
drop table projeto cascade constraints purge;
drop table usuario cascade constraints purge;
drop table transicao_status cascade constraints purge;
drop table status_demanda cascade constraints purge;
drop table prioridade cascade constraints purge;
drop table tipo_demanda cascade constraints purge;
drop table perfil cascade constraints purge;
