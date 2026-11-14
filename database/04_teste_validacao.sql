-- Autor: Arthur de Senna Nardi Cortina (modelagem do banco de dados do grupo, Estudos de Banco de Dados I)
-- ============================================================================
-- Projeto Integrador II - Sistema de Acompanhamento de Demandas de Desenvolvimento
-- Time 8 | Estudos de Banco de Dados I | PUC-Campinas | Engenharia de Software
-- Script 04 - Testes de validação do banco (Oracle 12c ou superior)
-- ============================================================================
--
-- COMO USAR: execute o 01 e o 02 numa conta/esquema novo e, NO MESMO DIA, abra este arquivo no
-- SQL Developer e use "Executar Script" (F5). O resultado aparece na aba "Saída do Script".
-- Cada teste imprime uma linha PASS ou FALHOU. No fim aparece o total.
-- O script NÃO deixa alterações no banco: tudo o que ele insere ou altera é desfeito (ROLLBACK).
-- Observação: os ids automáticos (IDENTITY) avançam mesmo com ROLLBACK; isso é normal no Oracle.
-- ============================================================================
set serveroutput on size unlimited
set define off
set feedback off
declare
  v_total pls_integer := 0;
  v_ok    pls_integer := 0;
  v_falha pls_integer := 0;
  procedure registra(p_id varchar2, p_desc varchar2, p_passou boolean, p_detalhe varchar2 default null) is
  begin
    v_total := v_total + 1;
    if p_passou then
      v_ok := v_ok + 1;
      dbms_output.put_line('PASS   ' || rpad(p_id, 5) || p_desc);
    else
      v_falha := v_falha + 1;
      dbms_output.put_line('FALHOU ' || rpad(p_id, 5) || p_desc || '  ' || p_detalhe);
    end if;
  end registra;
  procedure conta(p_id varchar2, p_desc varchar2, p_sql varchar2, p_esperado number) is
    v number;
  begin
    execute immediate p_sql into v;
    registra(p_id, p_desc, v = p_esperado, '(esperado ' || p_esperado || ', obtido ' || v || ')');
  exception
    when others then
      registra(p_id, p_desc, false, 'ERRO ao executar: ' || sqlerrm);
  end conta;
  procedure texto(p_id varchar2, p_desc varchar2, p_sql varchar2, p_esperado varchar2) is
    v varchar2(4000);
  begin
    execute immediate p_sql into v;
    registra(p_id, p_desc, nvl(v, '(nulo)') = p_esperado, '(esperado "' || p_esperado || '", obtido "' || v || '")');
  exception
    when others then
      registra(p_id, p_desc, false, 'ERRO ao executar: ' || sqlerrm);
  end texto;
  procedure recusa(p_id varchar2, p_desc varchar2, p_sql varchar2, p_codigo number) is
    v_cod number;
    v_msg varchar2(4000);
  begin
    execute immediate p_sql;
    rollback;
    registra(p_id, p_desc, false, '(o banco ACEITOU; deveria recusar com ORA' || p_codigo || ')');
  exception
    when others then
      v_cod := sqlcode;
      v_msg := sqlerrm;
      rollback;
      registra(p_id, p_desc, v_cod = p_codigo, '(esperado erro ' || p_codigo || ', obtido: ' || v_msg || ')');
  end recusa;
  procedure aceita(p_id varchar2, p_desc varchar2, p_sql varchar2) is
    v_msg varchar2(4000);
  begin
    execute immediate p_sql;
    rollback;
    registra(p_id, p_desc, true);
  exception
    when others then
      v_msg := sqlerrm;
      rollback;
      registra(p_id, p_desc, false, '(o banco RECUSOU: ' || v_msg || ')');
  end aceita;
  procedure comportamento is
    v_id    number;
    v_idc   number;
    v_idh   number;
    v_stat  number;
    v_resp  number;
    v_prazo date;
    v_cri   timestamp;
    v_atu   timestamp;
    v_dt    date;
    v_ts    timestamp;
    v_fin   char(1);
    v_agora timestamp := cast(systimestamp as timestamp);
  begin
    begin
      insert into demanda (titulo, descricao, id_tipo, id_prioridade, id_projeto)
      values ('Teste de comportamento', 'Descricao do teste', 1, 1, 1)
      returning id_demanda into v_id;
      select id_status, id_responsavel, prazo, data_criacao, data_atualizacao
        into v_stat, v_resp, v_prazo, v_cri, v_atu
        from demanda where id_demanda = v_id;
      registra('P01', 'Demanda criada sem informar o status nasce com status 1 (Aberta)', v_stat = 1, '(obtido ' || v_stat || ')');
      registra('P02', 'Demanda criada sem responsável e sem prazo fica com os dois nulos', v_resp is null and v_prazo is null);
      registra('P03', 'O id da demanda é gerado automaticamente (IDENTITY) e é maior que 18', v_id > 18, '(obtido ' || v_id || ')');
      registra('P04', 'A data de criação da demanda é preenchida com a data e hora atuais', v_cri between v_agora - interval '5' minute and v_agora + interval '5' minute, '(obtido ' || to_char(v_cri) || ')');
      registra('P05', 'A data de atualização da demanda nasce igual (ou posterior) à data de criação', v_atu >= v_cri);
      rollback;
    exception
      when others then
        rollback;
        registra('P01', 'Teste de comportamento da demanda', false, 'ERRO: ' || sqlerrm);
    end;
    begin
      insert into projeto_usuario (id_projeto, id_usuario) values (3, 5);
      select data_vinculo into v_dt from projeto_usuario where id_projeto = 3 and id_usuario = 5;
      registra('P06', 'Vínculo usuário–projeto criado sem data recebe a data de hoje', trunc(v_dt) = trunc(sysdate), '(obtido ' || to_char(v_dt, 'DD/MM/YYYY') || ')');
      rollback;
    exception
      when others then
        rollback;
        registra('P06', 'Vínculo usuário–projeto criado sem data recebe a data de hoje', false, 'ERRO: ' || sqlerrm);
    end;
    begin
      insert into comentario (id_demanda, id_usuario, texto) values (1, 1, 'Teste de comportamento')
      returning id_comentario, data_hora into v_idc, v_ts;
      registra('P07', 'Comentário criado sem data recebe a data e hora atuais', v_ts between v_agora - interval '5' minute and v_agora + interval '5' minute, '(obtido ' || to_char(v_ts) || ')');
      rollback;
    exception
      when others then
        rollback;
        registra('P07', 'Comentário criado sem data recebe a data e hora atuais', false, 'ERRO: ' || sqlerrm);
    end;
    begin
      insert into historico_demanda (id_demanda, id_usuario, campo_alterado) values (1, 1, 'PRAZO')
      returning id_historico, data_hora into v_idh, v_ts;
      registra('P08', 'Histórico criado sem data recebe a data e hora atuais', v_ts between v_agora - interval '5' minute and v_agora + interval '5' minute, '(obtido ' || to_char(v_ts) || ')');
      rollback;
    exception
      when others then
        rollback;
        registra('P08', 'Histórico criado sem data recebe a data e hora atuais', false, 'ERRO: ' || sqlerrm);
    end;
    begin
      insert into status_demanda (id_status, nome, ordem) values (99, 'Teste', 99);
      select finalizado into v_fin from status_demanda where id_status = 99;
      registra('P09', 'Status criado sem informar “finalizado” fica com N', v_fin = 'N', '(obtido ' || v_fin || ')');
      rollback;
    exception
      when others then
        rollback;
        registra('P09', 'Status criado sem informar “finalizado” fica com N', false, 'ERRO: ' || sqlerrm);
    end;
    registra('P10', 'O id do comentário e do histórico também são gerados automaticamente', v_idc is not null and v_idh is not null, '(ids obtidos: ' || v_idc || ' e ' || v_idh || ')');
  end comportamento;
begin
  dbms_output.put_line('Testes de validação do banco - executado em ' || to_char(sysdate, 'DD/MM/YYYY HH24:MI') || ' no esquema ' || user);
  dbms_output.put_line('----------------------------------------------------------------------');
  dbms_output.put_line('--- ESTRUTURA ---');
  conta('A01', q'[Existem as 11 tabelas do sistema]', q'[select count(*) from user_tables where table_name in ('PERFIL', 'TIPO_DEMANDA', 'PRIORIDADE', 'STATUS_DEMANDA', 'TRANSICAO_STATUS', 'USUARIO', 'PROJETO', 'PROJETO_USUARIO', 'DEMANDA', 'COMENTARIO', 'HISTORICO_DEMANDA')]', 11);
  conta('A02', q'[Existem as 11 chaves primárias, com os nomes previstos]', q'[select count(*) from user_constraints where constraint_type = 'P' and constraint_name in ('PK_PERFIL', 'PK_TIPO_DEMANDA', 'PK_PRIORIDADE', 'PK_STATUS_DEMANDA', 'PK_TRANSICAO_STATUS', 'PK_USUARIO', 'PK_PROJETO', 'PK_PROJETO_USUARIO', 'PK_DEMANDA', 'PK_COMENTARIO', 'PK_HISTORICO_DEMANDA')]', 11);
  conta('A03', q'[Existem as 14 chaves estrangeiras, com os nomes previstos]', q'[select count(*) from user_constraints where constraint_type = 'R' and constraint_name in ('FK_TRANSICAO_ORIGEM', 'FK_TRANSICAO_DESTINO', 'FK_USUARIO_PERFIL', 'FK_PROJETO_USUARIO_PROJETO', 'FK_PROJETO_USUARIO_USUARIO', 'FK_DEMANDA_TIPO', 'FK_DEMANDA_PRIORIDADE', 'FK_DEMANDA_STATUS', 'FK_DEMANDA_PROJETO', 'FK_DEMANDA_RESPONSAVEL', 'FK_COMENTARIO_DEMANDA', 'FK_COMENTARIO_USUARIO', 'FK_HISTORICO_DEMANDA', 'FK_HISTORICO_USUARIO')]', 14);
  conta('A04', q'[Existem as 8 restrições UNIQUE, com os nomes previstos]', q'[select count(*) from user_constraints where constraint_type = 'U' and constraint_name in ('UK_PERFIL_NOME', 'UK_TIPO_DEMANDA_NOME', 'UK_PRIORIDADE_NOME', 'UK_PRIORIDADE_ORDEM', 'UK_STATUS_DEMANDA_NOME', 'UK_STATUS_DEMANDA_ORDEM', 'UK_USUARIO_EMAIL', 'UK_PROJETO_NOME')]', 8);
  conta('A05', q'[Existem as 9 restrições CHECK, com os nomes previstos]', q'[select count(*) from user_constraints where constraint_type = 'C' and constraint_name in ('CK_STATUS_DEMANDA_FINAL', 'CK_TRANSICAO_ORIGEM_DESTINO', 'CK_USUARIO_EMAIL_MINUSCULO', 'CK_DEMANDA_TITULO', 'CK_DEMANDA_DESCRICAO', 'CK_DEMANDA_DATAS', 'CK_DEMANDA_PRAZO', 'CK_COMENTARIO_TEXTO', 'CK_HISTORICO_CAMPO')]', 9);
  conta('A06', q'[Cada chave estrangeira liga a tabela certa à tabela certa (14 de 14)]', q'[select count(*) from user_constraints c join user_constraints r on r.constraint_name = c.r_constraint_name where c.constraint_type = 'R' and (c.constraint_name, c.table_name, r.table_name) in (('FK_TRANSICAO_ORIGEM', 'TRANSICAO_STATUS', 'STATUS_DEMANDA'), ('FK_TRANSICAO_DESTINO', 'TRANSICAO_STATUS', 'STATUS_DEMANDA'), ('FK_USUARIO_PERFIL', 'USUARIO', 'PERFIL'), ('FK_PROJETO_USUARIO_PROJETO', 'PROJETO_USUARIO', 'PROJETO'), ('FK_PROJETO_USUARIO_USUARIO', 'PROJETO_USUARIO', 'USUARIO'), ('FK_DEMANDA_TIPO', 'DEMANDA', 'TIPO_DEMANDA'), ('FK_DEMANDA_PRIORIDADE', 'DEMANDA', 'PRIORIDADE'), ('FK_DEMANDA_STATUS', 'DEMANDA', 'STATUS_DEMANDA'), ('FK_DEMANDA_PROJETO', 'DEMANDA', 'PROJETO'), ('FK_DEMANDA_RESPONSAVEL', 'DEMANDA', 'USUARIO'), ('FK_COMENTARIO_DEMANDA', 'COMENTARIO', 'DEMANDA'), ('FK_COMENTARIO_USUARIO', 'COMENTARIO', 'USUARIO'), ('FK_HISTORICO_DEMANDA', 'HISTORICO_DEMANDA', 'DEMANDA'), ('FK_HISTORICO_USUARIO', 'HISTORICO_DEMANDA', 'USUARIO'))]', 14);
  conta('A07', q'[Nenhuma chave estrangeira usa ON DELETE CASCADE ou SET NULL]', q'[select count(*) from user_constraints where constraint_type = 'R' and delete_rule <> 'NO ACTION' and table_name in ('PERFIL', 'TIPO_DEMANDA', 'PRIORIDADE', 'STATUS_DEMANDA', 'TRANSICAO_STATUS', 'USUARIO', 'PROJETO', 'PROJETO_USUARIO', 'DEMANDA', 'COMENTARIO', 'HISTORICO_DEMANDA')]', 0);
  conta('A08', q'[Existem os 13 índices criados no script 01]', q'[select count(*) from user_indexes where index_name in ('IDX_USUARIO_PERFIL', 'IDX_PROJETO_USUARIO_USUARIO', 'IDX_TRANSICAO_DESTINO', 'IDX_DEMANDA_TIPO', 'IDX_DEMANDA_PRIORIDADE', 'IDX_DEMANDA_STATUS', 'IDX_DEMANDA_PROJETO', 'IDX_DEMANDA_RESPONSAVEL', 'IDX_DEMANDA_PRAZO', 'IDX_COMENTARIO_DEMANDA', 'IDX_COMENTARIO_USUARIO', 'IDX_HISTORICO_DEMANDA', 'IDX_HISTORICO_USUARIO')]', 13);
  conta('A09', q'[Existem 5 colunas IDENTITY (usuario, projeto, demanda, comentario, historico_demanda)]', q'[select count(*) from user_tab_identity_cols where table_name in ('PERFIL', 'TIPO_DEMANDA', 'PRIORIDADE', 'STATUS_DEMANDA', 'TRANSICAO_STATUS', 'USUARIO', 'PROJETO', 'PROJETO_USUARIO', 'DEMANDA', 'COMENTARIO', 'HISTORICO_DEMANDA')]', 5);
  conta('A10', q'[As 11 tabelas somam 47 colunas]', q'[select count(*) from user_tab_columns where table_name in ('PERFIL', 'TIPO_DEMANDA', 'PRIORIDADE', 'STATUS_DEMANDA', 'TRANSICAO_STATUS', 'USUARIO', 'PROJETO', 'PROJETO_USUARIO', 'DEMANDA', 'COMENTARIO', 'HISTORICO_DEMANDA')]', 47);
  conta('A11', q'[Colunas que faltam (esperadas, mas ausentes ou com tipo/obrigatoriedade diferente)]', q'[select count(*) from ((select 'perfil' t, 'id_perfil' c, 'NUMBER(2)' ty, 'N' n from dual union all select 'perfil' t, 'nome' c, 'VARCHAR2(30)' ty, 'N' n from dual union all select 'tipo_demanda' t, 'id_tipo' c, 'NUMBER(2)' ty, 'N' n from dual union all select 'tipo_demanda' t, 'nome' c, 'VARCHAR2(30)' ty, 'N' n from dual union all select 'prioridade' t, 'id_prioridade' c, 'NUMBER(2)' ty, 'N' n from dual union all select 'prioridade' t, 'nome' c, 'VARCHAR2(30)' ty, 'N' n from dual union all select 'prioridade' t, 'ordem' c, 'NUMBER(2)' ty, 'N' n from dual union all select 'status_demanda' t, 'id_status' c, 'NUMBER(2)' ty, 'N' n from dual union all select 'status_demanda' t, 'nome' c, 'VARCHAR2(30)' ty, 'N' n from dual union all select 'status_demanda' t, 'ordem' c, 'NUMBER(2)' ty, 'N' n from dual union all select 'status_demanda' t, 'finalizado' c, 'CHAR(1)' ty, 'N' n from dual union all select 'transicao_status' t, 'id_status_origem' c, 'NUMBER(2)' ty, 'N' n from dual union all select 'transicao_status' t, 'id_status_destino' c, 'NUMBER(2)' ty, 'N' n from dual union all select 'usuario' t, 'id_usuario' c, 'NUMBER(10)' ty, 'N' n from dual union all select 'usuario' t, 'nome' c, 'VARCHAR2(100)' ty, 'N' n from dual union all select 'usuario' t, 'email' c, 'VARCHAR2(150)' ty, 'N' n from dual union all select 'usuario' t, 'senha_hash' c, 'VARCHAR2(255)' ty, 'N' n from dual union all select 'usuario' t, 'id_perfil' c, 'NUMBER(2)' ty, 'N' n from dual union all select 'projeto' t, 'id_projeto' c, 'NUMBER(10)' ty, 'N' n from dual union all select 'projeto' t, 'nome' c, 'VARCHAR2(100)' ty, 'N' n from dual union all select 'projeto' t, 'descricao' c, 'VARCHAR2(500)' ty, 'Y' n from dual union all select 'projeto_usuario' t, 'id_projeto' c, 'NUMBER(10)' ty, 'N' n from dual union all select 'projeto_usuario' t, 'id_usuario' c, 'NUMBER(10)' ty, 'N' n from dual union all select 'projeto_usuario' t, 'data_vinculo' c, 'DATE' ty, 'N' n from dual union all select 'demanda' t, 'id_demanda' c, 'NUMBER(10)' ty, 'N' n from dual union all select 'demanda' t, 'titulo' c, 'VARCHAR2(100)' ty, 'N' n from dual union all select 'demanda' t, 'descricao' c, 'VARCHAR2(2000)' ty, 'N' n from dual union all select 'demanda' t, 'id_tipo' c, 'NUMBER(2)' ty, 'N' n from dual union all select 'demanda' t, 'id_prioridade' c, 'NUMBER(2)' ty, 'N' n from dual union all select 'demanda' t, 'id_status' c, 'NUMBER(2)' ty, 'N' n from dual union all select 'demanda' t, 'id_projeto' c, 'NUMBER(10)' ty, 'N' n from dual union all select 'demanda' t, 'id_responsavel' c, 'NUMBER(10)' ty, 'Y' n from dual union all select 'demanda' t, 'data_criacao' c, 'TIMESTAMP' ty, 'N' n from dual union all select 'demanda' t, 'data_atualizacao' c, 'TIMESTAMP' ty, 'N' n from dual union all select 'demanda' t, 'prazo' c, 'DATE' ty, 'Y' n from dual union all select 'comentario' t, 'id_comentario' c, 'NUMBER(10)' ty, 'N' n from dual union all select 'comentario' t, 'id_demanda' c, 'NUMBER(10)' ty, 'N' n from dual union all select 'comentario' t, 'id_usuario' c, 'NUMBER(10)' ty, 'N' n from dual union all select 'comentario' t, 'texto' c, 'VARCHAR2(1000)' ty, 'N' n from dual union all select 'comentario' t, 'data_hora' c, 'TIMESTAMP' ty, 'N' n from dual union all select 'historico_demanda' t, 'id_historico' c, 'NUMBER(10)' ty, 'N' n from dual union all select 'historico_demanda' t, 'id_demanda' c, 'NUMBER(10)' ty, 'N' n from dual union all select 'historico_demanda' t, 'id_usuario' c, 'NUMBER(10)' ty, 'N' n from dual union all select 'historico_demanda' t, 'campo_alterado' c, 'VARCHAR2(20)' ty, 'N' n from dual union all select 'historico_demanda' t, 'valor_anterior' c, 'VARCHAR2(100)' ty, 'Y' n from dual union all select 'historico_demanda' t, 'valor_novo' c, 'VARCHAR2(100)' ty, 'Y' n from dual union all select 'historico_demanda' t, 'data_hora' c, 'TIMESTAMP' ty, 'N' n from dual) minus (select lower(table_name) t, lower(column_name) c, case when data_type like 'TIMESTAMP%' then 'TIMESTAMP' when data_type = 'NUMBER' then 'NUMBER(' || data_precision || ')' when data_type in ('VARCHAR2', 'CHAR') then data_type || '(' || char_length || ')' else data_type end ty, nullable n from user_tab_columns where table_name in ('PERFIL', 'TIPO_DEMANDA', 'PRIORIDADE', 'STATUS_DEMANDA', 'TRANSICAO_STATUS', 'USUARIO', 'PROJETO', 'PROJETO_USUARIO', 'DEMANDA', 'COMENTARIO', 'HISTORICO_DEMANDA')))]', 0);
  conta('A12', q'[Colunas sobrando (existem, mas não eram esperadas)]', q'[select count(*) from ((select lower(table_name) t, lower(column_name) c, case when data_type like 'TIMESTAMP%' then 'TIMESTAMP' when data_type = 'NUMBER' then 'NUMBER(' || data_precision || ')' when data_type in ('VARCHAR2', 'CHAR') then data_type || '(' || char_length || ')' else data_type end ty, nullable n from user_tab_columns where table_name in ('PERFIL', 'TIPO_DEMANDA', 'PRIORIDADE', 'STATUS_DEMANDA', 'TRANSICAO_STATUS', 'USUARIO', 'PROJETO', 'PROJETO_USUARIO', 'DEMANDA', 'COMENTARIO', 'HISTORICO_DEMANDA')) minus (select 'perfil' t, 'id_perfil' c, 'NUMBER(2)' ty, 'N' n from dual union all select 'perfil' t, 'nome' c, 'VARCHAR2(30)' ty, 'N' n from dual union all select 'tipo_demanda' t, 'id_tipo' c, 'NUMBER(2)' ty, 'N' n from dual union all select 'tipo_demanda' t, 'nome' c, 'VARCHAR2(30)' ty, 'N' n from dual union all select 'prioridade' t, 'id_prioridade' c, 'NUMBER(2)' ty, 'N' n from dual union all select 'prioridade' t, 'nome' c, 'VARCHAR2(30)' ty, 'N' n from dual union all select 'prioridade' t, 'ordem' c, 'NUMBER(2)' ty, 'N' n from dual union all select 'status_demanda' t, 'id_status' c, 'NUMBER(2)' ty, 'N' n from dual union all select 'status_demanda' t, 'nome' c, 'VARCHAR2(30)' ty, 'N' n from dual union all select 'status_demanda' t, 'ordem' c, 'NUMBER(2)' ty, 'N' n from dual union all select 'status_demanda' t, 'finalizado' c, 'CHAR(1)' ty, 'N' n from dual union all select 'transicao_status' t, 'id_status_origem' c, 'NUMBER(2)' ty, 'N' n from dual union all select 'transicao_status' t, 'id_status_destino' c, 'NUMBER(2)' ty, 'N' n from dual union all select 'usuario' t, 'id_usuario' c, 'NUMBER(10)' ty, 'N' n from dual union all select 'usuario' t, 'nome' c, 'VARCHAR2(100)' ty, 'N' n from dual union all select 'usuario' t, 'email' c, 'VARCHAR2(150)' ty, 'N' n from dual union all select 'usuario' t, 'senha_hash' c, 'VARCHAR2(255)' ty, 'N' n from dual union all select 'usuario' t, 'id_perfil' c, 'NUMBER(2)' ty, 'N' n from dual union all select 'projeto' t, 'id_projeto' c, 'NUMBER(10)' ty, 'N' n from dual union all select 'projeto' t, 'nome' c, 'VARCHAR2(100)' ty, 'N' n from dual union all select 'projeto' t, 'descricao' c, 'VARCHAR2(500)' ty, 'Y' n from dual union all select 'projeto_usuario' t, 'id_projeto' c, 'NUMBER(10)' ty, 'N' n from dual union all select 'projeto_usuario' t, 'id_usuario' c, 'NUMBER(10)' ty, 'N' n from dual union all select 'projeto_usuario' t, 'data_vinculo' c, 'DATE' ty, 'N' n from dual union all select 'demanda' t, 'id_demanda' c, 'NUMBER(10)' ty, 'N' n from dual union all select 'demanda' t, 'titulo' c, 'VARCHAR2(100)' ty, 'N' n from dual union all select 'demanda' t, 'descricao' c, 'VARCHAR2(2000)' ty, 'N' n from dual union all select 'demanda' t, 'id_tipo' c, 'NUMBER(2)' ty, 'N' n from dual union all select 'demanda' t, 'id_prioridade' c, 'NUMBER(2)' ty, 'N' n from dual union all select 'demanda' t, 'id_status' c, 'NUMBER(2)' ty, 'N' n from dual union all select 'demanda' t, 'id_projeto' c, 'NUMBER(10)' ty, 'N' n from dual union all select 'demanda' t, 'id_responsavel' c, 'NUMBER(10)' ty, 'Y' n from dual union all select 'demanda' t, 'data_criacao' c, 'TIMESTAMP' ty, 'N' n from dual union all select 'demanda' t, 'data_atualizacao' c, 'TIMESTAMP' ty, 'N' n from dual union all select 'demanda' t, 'prazo' c, 'DATE' ty, 'Y' n from dual union all select 'comentario' t, 'id_comentario' c, 'NUMBER(10)' ty, 'N' n from dual union all select 'comentario' t, 'id_demanda' c, 'NUMBER(10)' ty, 'N' n from dual union all select 'comentario' t, 'id_usuario' c, 'NUMBER(10)' ty, 'N' n from dual union all select 'comentario' t, 'texto' c, 'VARCHAR2(1000)' ty, 'N' n from dual union all select 'comentario' t, 'data_hora' c, 'TIMESTAMP' ty, 'N' n from dual union all select 'historico_demanda' t, 'id_historico' c, 'NUMBER(10)' ty, 'N' n from dual union all select 'historico_demanda' t, 'id_demanda' c, 'NUMBER(10)' ty, 'N' n from dual union all select 'historico_demanda' t, 'id_usuario' c, 'NUMBER(10)' ty, 'N' n from dual union all select 'historico_demanda' t, 'campo_alterado' c, 'VARCHAR2(20)' ty, 'N' n from dual union all select 'historico_demanda' t, 'valor_anterior' c, 'VARCHAR2(100)' ty, 'Y' n from dual union all select 'historico_demanda' t, 'valor_novo' c, 'VARCHAR2(100)' ty, 'Y' n from dual union all select 'historico_demanda' t, 'data_hora' c, 'TIMESTAMP' ty, 'N' n from dual))]', 0);
  conta('A13', q'[Só 5 colunas aceitam nulo (id_responsavel, prazo, descricao do projeto, valor_anterior, valor_novo)]', q'[select count(*) from user_tab_columns where nullable = 'Y' and table_name in ('PERFIL', 'TIPO_DEMANDA', 'PRIORIDADE', 'STATUS_DEMANDA', 'TRANSICAO_STATUS', 'USUARIO', 'PROJETO', 'PROJETO_USUARIO', 'DEMANDA', 'COMENTARIO', 'HISTORICO_DEMANDA')]', 5);
  dbms_output.put_line('--- DADOS ---');
  conta('B01', q'[A tabela perfil tem 3 registros]', q'[select count(*) from perfil]', 3);
  conta('B02', q'[A tabela tipo_demanda tem 4 registros]', q'[select count(*) from tipo_demanda]', 4);
  conta('B03', q'[A tabela prioridade tem 4 registros]', q'[select count(*) from prioridade]', 4);
  conta('B04', q'[A tabela status_demanda tem 5 registros]', q'[select count(*) from status_demanda]', 5);
  conta('B05', q'[A tabela transicao_status tem 7 registros]', q'[select count(*) from transicao_status]', 7);
  conta('B06', q'[A tabela usuario tem 5 registros]', q'[select count(*) from usuario]', 5);
  conta('B07', q'[A tabela projeto tem 3 registros]', q'[select count(*) from projeto]', 3);
  conta('B08', q'[A tabela projeto_usuario tem 11 registros]', q'[select count(*) from projeto_usuario]', 11);
  conta('B09', q'[A tabela demanda tem 18 registros]', q'[select count(*) from demanda]', 18);
  conta('B10', q'[A tabela comentario tem 8 registros]', q'[select count(*) from comentario]', 8);
  conta('B11', q'[A tabela historico_demanda tem 28 registros]', q'[select count(*) from historico_demanda]', 28);
  conta('B12', q'[Perfis corretos (Administrador, Líder de Projeto, Membro da Equipe)]', q'[select count(*) from perfil where (id_perfil, nome) in ((1, 'Administrador'), (2, 'Líder de Projeto'), (3, 'Membro da Equipe'))]', 3);
  conta('B13', q'[Tipos corretos (Tarefa, Defeito, Melhoria, Documentação)]', q'[select count(*) from tipo_demanda where (id_tipo, nome) in ((1, 'Tarefa'), (2, 'Defeito'), (3, 'Melhoria'), (4, 'Documentação'))]', 4);
  conta('B14', q'[Prioridades corretas e na ordem (Crítica 1, Alta 2, Média 3, Baixa 4)]', q'[select count(*) from prioridade where (id_prioridade, nome, ordem) in ((1, 'Crítica', 1), (2, 'Alta', 2), (3, 'Média', 3), (4, 'Baixa', 4))]', 4);
  conta('B15', q'[Status corretos; só Concluída e Cancelada são finalizados]', q'[select count(*) from status_demanda where (id_status, nome, ordem, finalizado) in ((1, 'Aberta', 1, 'N'), (2, 'Em andamento', 2, 'N'), (3, 'Em revisão', 3, 'N'), (4, 'Concluída', 4, 'S'), (5, 'Cancelada', 5, 'S'))]', 5);
  conta('B16', q'[As 7 transições do ciclo de vida estão cadastradas]', q'[select count(*) from transicao_status where (id_status_origem, id_status_destino) in ((1, 2), (2, 3), (3, 4), (3, 2), (1, 5), (2, 5), (3, 5))]', 7);
  conta('B17', q'[Os 5 usuários têm e-mail e perfil corretos]', q'[select count(*) from usuario u join perfil p on p.id_perfil = u.id_perfil where (u.email, p.nome) in (('arthur@dominio.com', 'Administrador'), ('murilo@dominio.com', 'Líder de Projeto'), ('joao@dominio.com', 'Líder de Projeto'), ('gabriel@dominio.com', 'Membro da Equipe'), ('kevin@dominio.com', 'Membro da Equipe'))]', 5);
  conta('B18', q'[Os 3 projetos têm os nomes corretos]', q'[select count(*) from projeto where nome in ('Sistema de Acompanhamento de Demandas', 'Portal do Aluno', 'App de Biblioteca')]', 3);
  texto('B19', q'[Vínculos por projeto: 5 no projeto 1, 3 no projeto 2 e 3 no projeto 3]', q'[select listagg(qtd, '/') within group (order by id_projeto) from (select id_projeto, count(*) qtd from projeto_usuario group by id_projeto)]', q'[5/3/3]');
  texto('B20', q'[Demandas por projeto: 10 no projeto 1, 5 no projeto 2 e 3 no projeto 3]', q'[select listagg(qtd, '/') within group (order by id_projeto) from (select id_projeto, count(*) qtd from demanda group by id_projeto)]', q'[10/5/3]');
  conta('B21', q'[Demandas sem responsável: 3]', q'[select count(*) from demanda where id_responsavel is null]', 3);
  conta('B22', q'[Demandas sem prazo: 1]', q'[select count(*) from demanda where prazo is null]', 1);
  conta('B23', q'[A senha de teste do Administrador está guardada como hash SHA-256]', q'[select count(*) from usuario where email = 'arthur@dominio.com' and senha_hash = lower(rawtohex(standard_hash('Admin@123', 'SHA256')))]', 1);
  conta('B24', q'[O histórico está coerente: o último status registrado de cada demanda é o status atual]', q'[select count(*) from demanda d join status_demanda s on s.id_status = d.id_status where exists (select 1 from historico_demanda h where h.id_demanda = d.id_demanda and h.campo_alterado in ('STATUS', 'CANCELAMENTO')) and s.nome <> (select h.valor_novo from historico_demanda h where h.id_historico = (select max(h2.id_historico) from historico_demanda h2 where h2.id_demanda = d.id_demanda and h2.campo_alterado in ('STATUS', 'CANCELAMENTO')))]', 0);
  dbms_output.put_line('--- CONSULTAS ---');
  texto('Q01', q'[Dashboard: demandas por status (Aberta/Em andamento/Em revisão/Concluída/Cancelada) = 5/4/3/4/2]', q'[select listagg(qtd, '/') within group (order by ordem) from (select s.ordem, count(d.id_demanda) qtd from status_demanda s left join demanda d on d.id_status = s.id_status group by s.ordem)]', q'[5/4/3/4/2]');
  texto('Q02', q'[Dashboard: demandas por prioridade (Crítica/Alta/Média/Baixa) = 4/5/5/4]', q'[select listagg(qtd, '/') within group (order by ordem) from (select p.ordem, count(d.id_demanda) qtd from prioridade p left join demanda d on d.id_prioridade = p.id_prioridade group by p.ordem)]', q'[4/5/5/4]');
  texto('Q03', q'[Dashboard: demandas por tipo (Tarefa/Defeito/Melhoria/Documentação) = 5/4/6/3]', q'[select listagg(qtd, '/') within group (order by id_tipo) from (select t.id_tipo, count(d.id_demanda) qtd from tipo_demanda t left join demanda d on d.id_tipo = t.id_tipo group by t.id_tipo)]', q'[5/4/6/3]');
  texto('Q04', q'[Dashboard: críticas em aberto = demandas 1,14]', q'[select listagg(d.id_demanda, ',') within group (order by d.id_demanda) from demanda d join prioridade p on p.id_prioridade = d.id_prioridade join status_demanda s on s.id_status = d.id_status where p.ordem = 1 and s.ordem = 1]', q'[1,14]');
  texto('Q05', q'[Dashboard: próximas do prazo (não finalizadas, prazo em até 7 dias) = demandas 1,2,4,10,11,13,16]', q'[select listagg(d.id_demanda, ',') within group (order by d.id_demanda) from demanda d join status_demanda s on s.id_status = d.id_status where s.finalizado = 'N' and d.prazo between trunc(sysdate) and trunc(sysdate) + 7]', q'[1,2,4,10,11,13,16]');
  conta('Q06', q'[Login válido: gabriel@dominio.com com a senha correta devolve 1 usuário, perfil Membro da Equipe]', q'[select count(*) from usuario u where u.email = 'gabriel@dominio.com' and u.id_perfil = 3 and u.senha_hash = lower(rawtohex(standard_hash('Membro@123', 'SHA256')))]', 1);
  conta('Q07', q'[Login com senha errada não devolve nenhum usuário]', q'[select count(*) from usuario where email = 'gabriel@dominio.com' and senha_hash = lower(rawtohex(standard_hash('SenhaErrada1', 'SHA256')))]', 0);
  texto('Q08', q'[Projetos visíveis ao usuário 4 (Gabriel) = projetos 1,3]', q'[select listagg(p.id_projeto, ',') within group (order by p.id_projeto) from projeto p join projeto_usuario pu on pu.id_projeto = p.id_projeto where pu.id_usuario = 4]', q'[1,3]');
  conta('Q09', q'[Ciclo de vida: Aberta → Em revisão NÃO é permitida (0 linhas)]', q'[select count(*) from transicao_status where id_status_origem = 1 and id_status_destino = 3]', 0);
  conta('Q10', q'[Ciclo de vida: Em revisão → Em andamento é permitida (1 linha)]', q'[select count(*) from transicao_status where id_status_origem = 3 and id_status_destino = 2]', 1);
  texto('Q11', q'[Busca por “login” no título ou na descrição = demandas 1,9]', q'[select listagg(id_demanda, ',') within group (order by id_demanda) from demanda where lower(titulo) like '%login%' or lower(descricao) like '%login%']', q'[1,9]');
  texto('Q12', q'[Listagem: demandas do projeto 3 ordenadas por prazo = 14,13,15]', q'[select listagg(id_demanda, ',') within group (order by prazo) from demanda where id_projeto = 3]', q'[14,13,15]');
  conta('Q13', q'[Histórico da demanda 3 tem 3 registros (Aberta → Em andamento → Em revisão → Concluída)]', q'[select count(*) from historico_demanda where id_demanda = 3]', 3);
  texto('Q14', q'[A demanda 1 tem 2 comentários e a demanda 3 não tem nenhum]', q'[select listagg(qtd, '/') within group (order by id_demanda) from (select d.id_demanda, count(c.id_comentario) qtd from demanda d left join comentario c on c.id_demanda = d.id_demanda where d.id_demanda in (1, 3) group by d.id_demanda)]', q'[2/0]');
  dbms_output.put_line('--- DADOS INVÁLIDOS ---');
  recusa('N01', q'[E-mail de usuário repetido]', q'[insert into usuario (nome, email, senha_hash, id_perfil) values ('Teste', 'arthur@dominio.com', 'x', 1)]', -1);
  recusa('N02', q'[E-mail com letra maiúscula]', q'[insert into usuario (nome, email, senha_hash, id_perfil) values ('Teste', 'Novo@Dominio.com', 'x', 1)]', -2290);
  recusa('N03', q'[Usuário com perfil inexistente]', q'[insert into usuario (nome, email, senha_hash, id_perfil) values ('Teste', 'n03@dominio.com', 'x', 99)]', -2291);
  recusa('N04', q'[Usuário sem nome]', q'[insert into usuario (nome, email, senha_hash, id_perfil) values (null, 'n04@dominio.com', 'x', 1)]', -1400);
  recusa('N05', q'[Demanda com tipo inexistente]', q'[insert into demanda (titulo, descricao, id_tipo, id_prioridade, id_projeto) values ('Titulo valido', 'Descricao valida', 99, 1, 1)]', -2291);
  recusa('N06', q'[Demanda com prioridade inexistente]', q'[insert into demanda (titulo, descricao, id_tipo, id_prioridade, id_projeto) values ('Titulo valido', 'Descricao valida', 1, 99, 1)]', -2291);
  recusa('N07', q'[Demanda com status inexistente]', q'[insert into demanda (titulo, descricao, id_tipo, id_prioridade, id_status, id_projeto) values ('Titulo valido', 'Descricao valida', 1, 1, 99, 1)]', -2291);
  recusa('N08', q'[Demanda com projeto inexistente]', q'[insert into demanda (titulo, descricao, id_tipo, id_prioridade, id_projeto) values ('Titulo valido', 'Descricao valida', 1, 1, 99)]', -2291);
  recusa('N09', q'[Demanda com responsável inexistente]', q'[insert into demanda (titulo, descricao, id_tipo, id_prioridade, id_projeto, id_responsavel) values ('Titulo valido', 'Descricao valida', 1, 1, 1, 99)]', -2291);
  recusa('N10', q'[Demanda com título só de espaços]', q'[insert into demanda (titulo, descricao, id_tipo, id_prioridade, id_projeto) values ('   ', 'Descricao valida', 1, 1, 1)]', -2290);
  recusa('N11', q'[Demanda com descrição vazia (no Oracle, texto vazio é nulo)]', q'[insert into demanda (titulo, descricao, id_tipo, id_prioridade, id_projeto) values ('Titulo valido', '', 1, 1, 1)]', -1400);
  recusa('N12', q'[Demanda com prazo anterior ao dia da criação]', q'[insert into demanda (titulo, descricao, id_tipo, id_prioridade, id_projeto, prazo) values ('Titulo valido', 'Descricao valida', 1, 1, 1, trunc(sysdate) - 1)]', -2290);
  recusa('N13', q'[Demanda com data de atualização anterior à criação]', q'[insert into demanda (titulo, descricao, id_tipo, id_prioridade, id_projeto, data_atualizacao) values ('Titulo valido', 'Descricao valida', 1, 1, 1, systimestamp - interval '1' day)]', -2290);
  recusa('N14', q'[Demanda sem projeto]', q'[insert into demanda (titulo, descricao, id_tipo, id_prioridade, id_projeto) values ('Titulo valido', 'Descricao valida', 1, 1, null)]', -1400);
  recusa('N15', q'[Título de demanda com 101 caracteres (o limite é 100)]', q'[insert into demanda (titulo, descricao, id_tipo, id_prioridade, id_projeto) values (rpad('a', 101, 'a'), 'Descricao valida', 1, 1, 1)]', -12899);
  recusa('N16', q'[Comentário só com espaços]', q'[insert into comentario (id_demanda, id_usuario, texto) values (1, 1, '   ')]', -2290);
  recusa('N17', q'[Comentário sem texto]', q'[insert into comentario (id_demanda, id_usuario, texto) values (1, 1, null)]', -1400);
  recusa('N18', q'[Comentário em demanda inexistente]', q'[insert into comentario (id_demanda, id_usuario, texto) values (999, 1, 'Teste')]', -2291);
  recusa('N19', q'[Comentário de usuário inexistente]', q'[insert into comentario (id_demanda, id_usuario, texto) values (1, 99, 'Teste')]', -2291);
  recusa('N20', q'[Histórico com campo fora da lista (TITULO)]', q'[insert into historico_demanda (id_demanda, id_usuario, campo_alterado) values (1, 1, 'TITULO')]', -2290);
  recusa('N21', q'[Histórico em demanda inexistente]', q'[insert into historico_demanda (id_demanda, id_usuario, campo_alterado) values (999, 1, 'STATUS')]', -2291);
  recusa('N22', q'[Status com “finalizado” diferente de S ou N]', q'[insert into status_demanda (id_status, nome, ordem, finalizado) values (9, 'Teste', 9, 'X')]', -2290);
  recusa('N23', q'[Status com nome repetido]', q'[insert into status_demanda (id_status, nome, ordem) values (9, 'Aberta', 9)]', -1);
  recusa('N24', q'[Status com ordem repetida]', q'[insert into status_demanda (id_status, nome, ordem) values (9, 'Novo', 1)]', -1);
  recusa('N25', q'[Prioridade com nome repetido]', q'[insert into prioridade (id_prioridade, nome, ordem) values (9, 'Alta', 9)]', -1);
  recusa('N26', q'[Prioridade com ordem repetida]', q'[insert into prioridade (id_prioridade, nome, ordem) values (9, 'Nova', 1)]', -1);
  recusa('N27', q'[Tipo de demanda com nome repetido]', q'[insert into tipo_demanda (id_tipo, nome) values (9, 'Tarefa')]', -1);
  recusa('N28', q'[Perfil com nome repetido]', q'[insert into perfil (id_perfil, nome) values (9, 'Administrador')]', -1);
  recusa('N29', q'[Projeto com nome repetido]', q'[insert into projeto (nome) values ('Portal do Aluno')]', -1);
  recusa('N30', q'[Transição de um status para ele mesmo]', q'[insert into transicao_status (id_status_origem, id_status_destino) values (1, 1)]', -2290);
  recusa('N31', q'[Transição repetida (chave primária composta)]', q'[insert into transicao_status (id_status_origem, id_status_destino) values (1, 2)]', -1);
  recusa('N32', q'[Vínculo usuário–projeto repetido (chave primária composta)]', q'[insert into projeto_usuario (id_projeto, id_usuario) values (1, 1)]', -1);
  recusa('N33', q'[Vínculo com projeto inexistente]', q'[insert into projeto_usuario (id_projeto, id_usuario) values (99, 1)]', -2291);
  recusa('N34', q'[Vínculo com usuário inexistente]', q'[insert into projeto_usuario (id_projeto, id_usuario) values (1, 99)]', -2291);
  recusa('N35', q'[Informar o id à mão em coluna IDENTITY (GENERATED ALWAYS)]', q'[insert into usuario (id_usuario, nome, email, senha_hash, id_perfil) values (900, 'Teste', 'n35@dominio.com', 'x', 1)]', -32795);
  recusa('N36', q'[Excluir a demanda 1 (tem comentários e histórico)]', q'[delete from demanda where id_demanda = 1]', -2292);
  recusa('N37', q'[Excluir o projeto 1 (tem demandas)]', q'[delete from projeto where id_projeto = 1]', -2292);
  recusa('N38', q'[Excluir o status 1 (está em uso)]', q'[delete from status_demanda where id_status = 1]', -2292);
  recusa('N39', q'[Excluir o perfil 1 (está em uso)]', q'[delete from perfil where id_perfil = 1]', -2292);
  recusa('N40', q'[Excluir o usuário 1 (é responsável, comentarista e autor de histórico)]', q'[delete from usuario where id_usuario = 1]', -2292);
  dbms_output.put_line('--- DADOS VÁLIDOS ---');
  aceita('V01', q'[Usuário novo com e-mail em minúsculas]', q'[insert into usuario (nome, email, senha_hash, id_perfil) values ('Teste', 'v01@dominio.com', 'x', 3)]');
  aceita('V02', q'[Demanda só com os campos obrigatórios]', q'[insert into demanda (titulo, descricao, id_tipo, id_prioridade, id_projeto) values ('Titulo valido', 'Descricao valida', 1, 1, 1)]');
  aceita('V03', q'[Demanda completa (responsável, prazo daqui a 10 dias)]', q'[insert into demanda (titulo, descricao, id_tipo, id_prioridade, id_projeto, id_responsavel, prazo) values ('Titulo valido', 'Descricao valida', 2, 2, 2, 2, trunc(sysdate) + 10)]');
  aceita('V04', q'[Demanda com prazo igual ao dia de hoje (limite permitido)]', q'[insert into demanda (titulo, descricao, id_tipo, id_prioridade, id_projeto, prazo) values ('Titulo valido', 'Descricao valida', 1, 1, 1, trunc(sysdate))]');
  aceita('V05', q'[Demanda com título de exatamente 100 caracteres]', q'[insert into demanda (titulo, descricao, id_tipo, id_prioridade, id_projeto) values (rpad('a', 100, 'a'), 'Descricao valida', 1, 1, 1)]');
  aceita('V06', q'[Comentário de 1000 caracteres acentuados]', q'[insert into comentario (id_demanda, id_usuario, texto) values (1, 1, rpad('á', 1000, 'á'))]');
  aceita('V07', q'[Cancelamento lógico: mudar o status da demanda 9 para Cancelada]', q'[update demanda set id_status = 5 where id_demanda = 9]');
  aceita('V08', q'[Atualizar a data de atualização da demanda 1 para agora]', q'[update demanda set data_atualizacao = systimestamp where id_demanda = 1]');
  dbms_output.put_line('--- COMPORTAMENTO ---');
  comportamento;
  dbms_output.put_line('----------------------------------------------------------------------');
  dbms_output.put_line('RESULTADO FINAL: ' || v_total || ' testes | ' || v_ok || ' PASS | ' || v_falha || ' FALHOU');
  if v_falha = 0 then
    dbms_output.put_line('TUDO CERTO: nenhuma falha.');
  else
    dbms_output.put_line('ATENCAO: ha ' || v_falha || ' falha(s). Veja as linhas FALHOU acima.');
  end if;
end;
/
