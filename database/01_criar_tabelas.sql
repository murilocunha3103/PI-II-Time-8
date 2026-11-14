-- Autor: Arthur de Senna Nardi Cortina (modelagem do banco de dados do grupo, Estudos de Banco de Dados I)
-- ============================================================================
-- Projeto Integrador II - Sistema de Acompanhamento de Demandas de Desenvolvimento
-- Time 8 | Estudos de Banco de Dados I | PUC-Campinas | Engenharia de Software
-- Script 01 - Modelo Físico (Oracle): criação das tabelas, restrições e índices
-- ============================================================================
--
-- Requisito: Oracle Database 12c ou superior (as chaves automáticas usam colunas IDENTITY).
-- Como executar no SQL Developer: abra este arquivo e use "Executar Script" (F5).
-- Ordem dos scripts:  00_remover_tabelas (opcional)  ->  01_criar_tabelas  ->  02_dados_teste
--
-- Decisões de projeto:
--  * Não há ON DELETE CASCADE de propósito: o escopo proíbe a exclusão física de demandas.
--    O banco recusa apagar uma demanda que já tenha comentários ou histórico.
--  * Tabelas de apoio (perfil, tipo_demanda, prioridade, status_demanda) guardam os valores
--    permitidos; a coluna da demanda guarda só o código (3FN).
--  * Em Oracle, a cláusula DEFAULT vem ANTES de NOT NULL.
--  * VARCHAR2(n CHAR): o tamanho conta caracteres (e não bytes), importante para acentos.
-- ============================================================================

-- Tabela PERFIL: Perfis de acesso do sistema: Administrador, Líder de Projeto e Membro da Equipe.
create table perfil (
  id_perfil number(2) not null,
  nome      varchar2(30) not null,
  constraint pk_perfil primary key (id_perfil),
  constraint uk_perfil_nome unique (nome)
);

-- Tabela TIPO_DEMANDA: Tipos de demanda permitidos: Tarefa, Defeito, Melhoria e Documentação.
create table tipo_demanda (
  id_tipo number(2) not null,
  nome    varchar2(30) not null,
  constraint pk_tipo_demanda primary key (id_tipo),
  constraint uk_tipo_demanda_nome unique (nome)
);

-- Tabela PRIORIDADE: Prioridades permitidas: Crítica, Alta, Média e Baixa. A coluna ordem permite
--   ordenar da mais urgente para a menos urgente.
create table prioridade (
  id_prioridade number(2) not null,
  nome          varchar2(30) not null,
  ordem         number(2) not null,
  constraint pk_prioridade primary key (id_prioridade),
  constraint uk_prioridade_nome unique (nome),
  constraint uk_prioridade_ordem unique (ordem)
);

-- Tabela STATUS_DEMANDA: Status do ciclo de vida da demanda: Aberta, Em andamento, Em revisão,
--   Concluída e Cancelada.
create table status_demanda (
  id_status  number(2) not null,
  nome       varchar2(30) not null,
  ordem      number(2) not null,
  finalizado char(1) default 'N' not null,
  constraint pk_status_demanda primary key (id_status),
  constraint uk_status_demanda_nome unique (nome),
  constraint uk_status_demanda_ordem unique (ordem),
  constraint ck_status_demanda_final check (finalizado IN ('S', 'N'))
);

-- Tabela TRANSICAO_STATUS: Mudanças de status permitidas no ciclo de vida da demanda (regra de
--   negócio guardada como dado).
create table transicao_status (
  id_status_origem  number(2) not null,
  id_status_destino number(2) not null,
  constraint pk_transicao_status primary key (id_status_origem, id_status_destino),
  constraint fk_transicao_origem foreign key (id_status_origem) references status_demanda (id_status),
  constraint fk_transicao_destino foreign key (id_status_destino) references status_demanda (id_status),
  constraint ck_transicao_origem_destino check (id_status_origem <> id_status_destino)
);

-- Tabela USUARIO: Usuários do sistema. São cadastrados previamente no banco (não há tela de
--   cadastro).
create table usuario (
  id_usuario number(10) generated always as identity,
  nome       varchar2(100 char) not null,
  email      varchar2(150) not null,
  senha_hash varchar2(255) not null,
  id_perfil  number(2) not null,
  constraint pk_usuario primary key (id_usuario),
  constraint uk_usuario_email unique (email),
  constraint fk_usuario_perfil foreign key (id_perfil) references perfil (id_perfil),
  constraint ck_usuario_email_minusculo check (email = LOWER(email))
);

-- Tabela PROJETO: Projetos de software acompanhados pelo sistema. São cadastrados previamente no
--   banco.
create table projeto (
  id_projeto number(10) generated always as identity,
  nome       varchar2(100 char) not null,
  descricao  varchar2(500 char),
  constraint pk_projeto primary key (id_projeto),
  constraint uk_projeto_nome unique (nome)
);

-- Tabela PROJETO_USUARIO: Vínculo entre usuários e projetos (relação N:N). Define quais projetos
--   cada usuário enxerga.
create table projeto_usuario (
  id_projeto   number(10) not null,
  id_usuario   number(10) not null,
  data_vinculo date default sysdate not null,
  constraint pk_projeto_usuario primary key (id_projeto, id_usuario),
  constraint fk_projeto_usuario_projeto foreign key (id_projeto) references projeto (id_projeto),
  constraint fk_projeto_usuario_usuario foreign key (id_usuario) references usuario (id_usuario)
);

-- Tabela DEMANDA: Demanda de desenvolvimento (tarefa, defeito, melhoria ou documentação). É a
--   principal entidade do sistema e nunca é excluída fisicamente.
create table demanda (
  id_demanda       number(10) generated always as identity,
  titulo           varchar2(100 char) not null,
  descricao        varchar2(2000 char) not null,
  id_tipo          number(2) not null,
  id_prioridade    number(2) not null,
  id_status        number(2) default 1 not null,
  id_projeto       number(10) not null,
  id_responsavel   number(10),
  data_criacao     timestamp default systimestamp not null,
  data_atualizacao timestamp default systimestamp not null,
  prazo            date,
  constraint pk_demanda primary key (id_demanda),
  constraint fk_demanda_tipo foreign key (id_tipo) references tipo_demanda (id_tipo),
  constraint fk_demanda_prioridade foreign key (id_prioridade) references prioridade (id_prioridade),
  constraint fk_demanda_status foreign key (id_status) references status_demanda (id_status),
  constraint fk_demanda_projeto foreign key (id_projeto) references projeto (id_projeto),
  constraint fk_demanda_responsavel foreign key (id_responsavel) references usuario (id_usuario),
  constraint ck_demanda_titulo check (TRIM(titulo) IS NOT NULL),
  constraint ck_demanda_descricao check (TRIM(descricao) IS NOT NULL),
  constraint ck_demanda_datas check (data_atualizacao >= data_criacao),
  constraint ck_demanda_prazo check (prazo IS NULL OR prazo >= TRUNC(data_criacao))
);

-- Tabela COMENTARIO: Comentários registrados em uma demanda, sempre vinculados a um usuário, com
--   data e hora.
create table comentario (
  id_comentario number(10) generated always as identity,
  id_demanda    number(10) not null,
  id_usuario    number(10) not null,
  texto         varchar2(1000 char) not null,
  data_hora     timestamp default systimestamp not null,
  constraint pk_comentario primary key (id_comentario),
  constraint fk_comentario_demanda foreign key (id_demanda) references demanda (id_demanda),
  constraint fk_comentario_usuario foreign key (id_usuario) references usuario (id_usuario),
  constraint ck_comentario_texto check (TRIM(texto) IS NOT NULL)
);

-- Tabela HISTORICO_DEMANDA: Histórico das alterações relevantes de cada demanda (status,
--   responsável, prioridade, prazo e cancelamento). Nunca é apagado.
create table historico_demanda (
  id_historico   number(10) generated always as identity,
  id_demanda     number(10) not null,
  id_usuario     number(10) not null,
  campo_alterado varchar2(20) not null,
  valor_anterior varchar2(100 char),
  valor_novo     varchar2(100 char),
  data_hora      timestamp default systimestamp not null,
  constraint pk_historico_demanda primary key (id_historico),
  constraint fk_historico_demanda foreign key (id_demanda) references demanda (id_demanda),
  constraint fk_historico_usuario foreign key (id_usuario) references usuario (id_usuario),
  constraint ck_historico_campo check (campo_alterado IN ('STATUS', 'RESPONSAVEL', 'PRIORIDADE', 'PRAZO', 'CANCELAMENTO'))
);

-- ----------------------------------------------------------------------------
-- Índices nas chaves estrangeiras (o Oracle cria índice automático só para PK e UNIQUE)
-- e no prazo (usado pelo dashboard em "demandas próximas do prazo").
create index idx_usuario_perfil on usuario (id_perfil);
create index idx_projeto_usuario_usuario on projeto_usuario (id_usuario);
create index idx_transicao_destino on transicao_status (id_status_destino);
create index idx_demanda_tipo on demanda (id_tipo);
create index idx_demanda_prioridade on demanda (id_prioridade);
create index idx_demanda_status on demanda (id_status);
create index idx_demanda_projeto on demanda (id_projeto);
create index idx_demanda_responsavel on demanda (id_responsavel);
create index idx_demanda_prazo on demanda (prazo);
create index idx_comentario_demanda on comentario (id_demanda);
create index idx_comentario_usuario on comentario (id_usuario);
create index idx_historico_demanda on historico_demanda (id_demanda);
create index idx_historico_usuario on historico_demanda (id_usuario);

-- ----------------------------------------------------------------------------
-- Comentários nas tabelas (aparecem no SQL Developer, na aba "Detalhes" da tabela)
comment on table perfil is 'Perfis de acesso do sistema: Administrador, Líder de Projeto e Membro da Equipe.';
comment on table tipo_demanda is 'Tipos de demanda permitidos: Tarefa, Defeito, Melhoria e Documentação.';
comment on table prioridade is 'Prioridades permitidas: Crítica, Alta, Média e Baixa. A coluna ordem permite ordenar da mais urgente para a menos urgente.';
comment on table status_demanda is 'Status do ciclo de vida da demanda: Aberta, Em andamento, Em revisão, Concluída e Cancelada.';
comment on table transicao_status is 'Mudanças de status permitidas no ciclo de vida da demanda (regra de negócio guardada como dado).';
comment on table usuario is 'Usuários do sistema. São cadastrados previamente no banco (não há tela de cadastro).';
comment on table projeto is 'Projetos de software acompanhados pelo sistema. São cadastrados previamente no banco.';
comment on table projeto_usuario is 'Vínculo entre usuários e projetos (relação N:N). Define quais projetos cada usuário enxerga.';
comment on table demanda is 'Demanda de desenvolvimento (tarefa, defeito, melhoria ou documentação). É a principal entidade do sistema e nunca é excluída fisicamente.';
comment on table comentario is 'Comentários registrados em uma demanda, sempre vinculados a um usuário, com data e hora.';
comment on table historico_demanda is 'Histórico das alterações relevantes de cada demanda (status, responsável, prioridade, prazo e cancelamento). Nunca é apagado.';
