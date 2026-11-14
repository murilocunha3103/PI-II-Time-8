-- Autor: Arthur de Senna Nardi Cortina (modelagem do banco de dados do grupo, Estudos de Banco de Dados I)
-- ============================================================================
-- Projeto Integrador II - Sistema de Acompanhamento de Demandas de Desenvolvimento
-- Time 8 | Estudos de Banco de Dados I | PUC-Campinas | Engenharia de Software
-- Script 03 - Consultas de exemplo (o que cada rota da API vai precisar do banco)
-- ============================================================================
--
-- Cada consulta mostra como o modelo atende uma rota da API da Reunião 4. São só consultas
-- (SELECT), podem ser executadas à vontade. Em Oracle, rode uma por vez (Ctrl+Enter).
-- ============================================================================

-- 1) POST /login: confere e-mail e senha e devolve o perfil
select u.id_usuario, u.nome, u.email, p.nome as perfil
from usuario u
join perfil p on p.id_perfil = u.id_perfil
where u.email = 'gabriel@dominio.com'
  and u.senha_hash = LOWER(RAWTOHEX(STANDARD_HASH('Membro@123', 'SHA256')));

-- 2) GET /demandas: listagem com filtros (status e prioridade), ordenada por prioridade e prazo
select d.id_demanda, d.titulo, t.nome as tipo, pr.nome as prioridade, s.nome as status,
       p.nome as projeto, u.nome as responsavel, d.data_criacao, d.prazo
from demanda d
join tipo_demanda t   on t.id_tipo = d.id_tipo
join prioridade pr    on pr.id_prioridade = d.id_prioridade
join status_demanda s on s.id_status = d.id_status
join projeto p        on p.id_projeto = d.id_projeto
left join usuario u   on u.id_usuario = d.id_responsavel
where s.nome = 'Aberta' and pr.nome = 'Crítica'
order by pr.ordem, d.prazo nulls last;

-- 3) GET /demandas?busca=login: busca no título ou na descrição
select d.id_demanda, d.titulo
from demanda d
where LOWER(d.titulo) like '%login%' or LOWER(d.descricao) like '%login%';

-- 4) GET /demandas/:id: todos os dados de uma demanda
select d.*, t.nome as tipo, pr.nome as prioridade, s.nome as status, p.nome as projeto, u.nome as responsavel
from demanda d
join tipo_demanda t   on t.id_tipo = d.id_tipo
join prioridade pr    on pr.id_prioridade = d.id_prioridade
join status_demanda s on s.id_status = d.id_status
join projeto p        on p.id_projeto = d.id_projeto
left join usuario u   on u.id_usuario = d.id_responsavel
where d.id_demanda = 1;

-- 5) GET /demandas/:id/comentarios: comentários da demanda, do mais antigo para o mais novo
select c.id_comentario, u.nome as autor, c.texto, c.data_hora
from comentario c
join usuario u on u.id_usuario = c.id_usuario
where c.id_demanda = 1
order by c.data_hora;

-- 6) GET /dashboard: total por status (o LEFT JOIN faz aparecer também os status com zero demandas)
select s.nome as status, count(d.id_demanda) as quantidade
from status_demanda s
left join demanda d on d.id_status = s.id_status
group by s.nome, s.ordem
order by s.ordem;

-- 6b) GET /dashboard: total por prioridade
select pr.nome as prioridade, count(d.id_demanda) as quantidade
from prioridade pr
left join demanda d on d.id_prioridade = pr.id_prioridade
group by pr.nome, pr.ordem
order by pr.ordem;

-- 6c) GET /dashboard: total por tipo
select t.nome as tipo, count(d.id_demanda) as quantidade
from tipo_demanda t
left join demanda d on d.id_tipo = t.id_tipo
group by t.nome, t.id_tipo
order by t.id_tipo;

-- 7) GET /dashboard: críticas em aberto (critério da equipe: prioridade Crítica + status Aberta)
select d.id_demanda, d.titulo, d.prazo
from demanda d
join prioridade pr    on pr.id_prioridade = d.id_prioridade
join status_demanda s on s.id_status = d.id_status
where pr.nome = 'Crítica' and s.nome = 'Aberta';

-- 8) GET /dashboard: próximas do prazo (critério da equipe: não finalizadas, com prazo nos próximos 7 dias)
select d.id_demanda, d.titulo, d.prazo
from demanda d
join status_demanda s on s.id_status = d.id_status
where s.finalizado = 'N'
  and d.prazo between TRUNC(SYSDATE) and TRUNC(SYSDATE) + 7
order by d.prazo;

-- 9) Projetos que um usuário enxerga (Líder e Membro só veem os projetos em que estão vinculados)
select p.id_projeto, p.nome
from projeto p
join projeto_usuario pu on pu.id_projeto = p.id_projeto
where pu.id_usuario = 4;

-- 10) Histórico de uma demanda, já no formato de frase do Documento de Visão
select h.data_hora,
       u.nome || ' alterou ' || LOWER(h.campo_alterado) || ' de "' || NVL(h.valor_anterior, '(vazio)') || '" para "' || h.valor_novo || '".' as mensagem
from historico_demanda h
join usuario u on u.id_usuario = h.id_usuario
where h.id_demanda = 3
order by h.data_hora, h.id_historico;

-- 11) Ciclo de vida: a mudança Aberta (1) -> Em revisão (3) é permitida? (0 linhas = NÃO é permitida)
select count(*) as permitida
from transicao_status
where id_status_origem = 1 and id_status_destino = 3;

-- 12) Cancelamento é sempre LÓGICO (nunca DELETE). Exemplo - remova os "--" para testar:
-- update demanda set id_status = 5, data_atualizacao = SYSTIMESTAMP where id_demanda = 9;
-- rollback;
