// Autor: Arthur de Senna Nardi Cortina
//
// DADOS DE TESTE EM MEMÓRIA, compartilhados por toda a equipe.
//
// Nesta etapa (Reunião 4) ainda não existe banco de dados: os arrays abaixo fazem o
// papel dele (igual ao array "alunos" da aula). Quando o servidor reinicia, tudo que
// foi criado pelas rotas POST é perdido e os dados voltam a ser os que estão aqui.
//
// Os prazos e as datas de criação são calculados a partir de HOJE (com a função
// dataEmDias). Assim, em qualquer dia que o servidor for iniciado, os dados continuam
// fazendo sentido: sempre haverá demandas próximas do prazo, atrasadas, etc.
//
// Quando o banco de dados for integrado, este arquivo deixa de ser usado e as rotas
// passam a consultar o banco - o formato das respostas da API continua o mesmo.

import { Comentario, Demanda, DemandaDetalhada, Projeto, Usuario } from '../tipos';
import { dataEmDias, dataHoraEmDias } from '../utilitarios';

// Usuários dos três perfis do sistema. As senhas ficam em texto puro SÓ porque são
// dados de teste; num sistema real, a senha seria guardada de forma criptografada.
export const usuarios: Usuario[] = [
  {
    id: 1,
    nome: 'Arthur de Senna',
    email: 'arthur@dominio.com',
    senha: 'Admin@123',
    perfil: 'Administrador',
  },
  {
    id: 2,
    nome: 'Murilo Cunha',
    email: 'murilo@dominio.com',
    senha: 'Lider@123',
    perfil: 'Líder de Projeto',
  },
  {
    id: 3,
    nome: 'Joao Victor',
    email: 'joao@dominio.com',
    senha: 'Lider@123',
    perfil: 'Líder de Projeto',
  },
  {
    id: 4,
    nome: 'Gabriel Passarela',
    email: 'gabriel@dominio.com',
    senha: 'Membro@123',
    perfil: 'Membro da Equipe',
  },
  {
    id: 5,
    nome: 'Kevin Lima',
    email: 'kevin@dominio.com',
    senha: 'Membro@123',
    perfil: 'Membro da Equipe',
  },
];

export const projetos: Projeto[] = [
  {
    id: 1,
    nome: 'Sistema de Acompanhamento de Demandas',
    descricao: 'Projeto Integrador II - sistema de acompanhamento de demandas de desenvolvimento.',
  },
  {
    id: 2,
    nome: 'Portal do Aluno',
    descricao: 'Portal web para consulta de notas, matrículas e disciplinas.',
  },
  {
    id: 3,
    nome: 'App de Biblioteca',
    descricao: 'Aplicativo para consulta e reserva de livros da biblioteca.',
  },
];

// 18 demandas com tipos, prioridades, status e prazos variados, para dar para demonstrar
// filtros, busca, ordenação e os indicadores do dashboard.
export const demandas: Demanda[] = [
  {
    id: 1,
    titulo: 'Corrigir erro de login com senha válida',
    descricao:
      'Usuários com senha correta estão recebendo a mensagem de credenciais inválidas ao tentar entrar no sistema.',
    tipo: 'Defeito',
    prioridade: 'Crítica',
    status: 'Aberta',
    projetoId: 1,
    responsavelId: 4,
    dataCriacao: dataHoraEmDias(-5),
    dataAtualizacao: dataHoraEmDias(-3),
    prazo: dataEmDias(2),
  },
  {
    id: 2,
    titulo: 'Criar tela de dashboard com indicadores',
    descricao:
      'Montar a tela inicial com os cards de total de demandas, quantidade por status, prioridade e tipo.',
    tipo: 'Tarefa',
    prioridade: 'Alta',
    status: 'Em andamento',
    projetoId: 1,
    responsavelId: 1,
    dataCriacao: dataHoraEmDias(-12),
    dataAtualizacao: dataHoraEmDias(-1),
    prazo: dataEmDias(5),
  },
  {
    id: 3,
    titulo: 'Escrever README do projeto',
    descricao: 'Documentar como instalar as dependências e executar o projeto para os avaliadores.',
    tipo: 'Documentação',
    prioridade: 'Baixa',
    status: 'Concluída',
    projetoId: 1,
    responsavelId: 2,
    dataCriacao: dataHoraEmDias(-30),
    dataAtualizacao: dataHoraEmDias(-7),
    prazo: dataEmDias(-6),
  },
  {
    id: 4,
    titulo: 'Validar formulário de cadastro de demanda',
    descricao: 'Aplicar validações de título, descrição e prazo na tela de cadastro de demanda.',
    tipo: 'Melhoria',
    prioridade: 'Média',
    status: 'Em revisão',
    projetoId: 1,
    responsavelId: 5,
    dataCriacao: dataHoraEmDias(-9),
    dataAtualizacao: dataHoraEmDias(-2),
    prazo: dataEmDias(3),
  },
  {
    id: 5,
    titulo: 'Implementar filtro na listagem de demandas',
    descricao: 'Permitir filtrar a tabela de demandas por status, prioridade e busca por texto.',
    tipo: 'Tarefa',
    prioridade: 'Alta',
    status: 'Em andamento',
    projetoId: 1,
    responsavelId: 2,
    dataCriacao: dataHoraEmDias(-8),
    dataAtualizacao: dataHoraEmDias(-2),
    prazo: dataEmDias(10),
  },
  {
    id: 6,
    titulo: 'Adicionar comentários na tela de detalhes',
    descricao:
      'Permitir registrar comentários em uma demanda e exibir a lista de comentários na tela.',
    tipo: 'Tarefa',
    prioridade: 'Média',
    status: 'Concluída',
    projetoId: 1,
    responsavelId: 3,
    dataCriacao: dataHoraEmDias(-14),
    dataAtualizacao: dataHoraEmDias(-4),
    prazo: dataEmDias(-3),
  },
  {
    id: 7,
    titulo: 'Ajustar menu em telas pequenas',
    descricao: 'O menu superior quebra o layout em telas com pouca largura.',
    tipo: 'Melhoria',
    prioridade: 'Baixa',
    status: 'Cancelada',
    projetoId: 1,
    responsavelId: 4,
    dataCriacao: dataHoraEmDias(-20),
    dataAtualizacao: dataHoraEmDias(-8),
    prazo: dataEmDias(-1),
  },
  {
    id: 8,
    titulo: 'Configurar servidor Node.js com TypeScript',
    descricao: 'Preparar o ambiente do backend com Node.js, TypeScript e Express.',
    tipo: 'Tarefa',
    prioridade: 'Crítica',
    status: 'Concluída',
    projetoId: 1,
    responsavelId: 1,
    dataCriacao: dataHoraEmDias(-25),
    dataAtualizacao: dataHoraEmDias(-10),
    prazo: dataEmDias(-10),
  },
  {
    id: 9,
    titulo: 'Revisar regras de senha do login',
    descricao:
      'Definir com a equipe quais critérios de senha serão exigidos no cadastro e no login.',
    tipo: 'Melhoria',
    prioridade: 'Média',
    status: 'Aberta',
    projetoId: 1,
    responsavelId: null,
    dataCriacao: dataHoraEmDias(-4),
    dataAtualizacao: dataHoraEmDias(-4),
    prazo: dataEmDias(14),
  },
  {
    id: 10,
    titulo: 'Falha ao exportar relatório de notas em PDF',
    descricao: 'O sistema trava ao exportar relatórios com mais de 500 linhas.',
    tipo: 'Defeito',
    prioridade: 'Crítica',
    status: 'Em andamento',
    projetoId: 2,
    responsavelId: 5,
    dataCriacao: dataHoraEmDias(-3),
    dataAtualizacao: dataHoraEmDias(-1),
    prazo: dataEmDias(1),
  },
  {
    id: 11,
    titulo: 'Documentar API de matrículas',
    descricao: 'Descrever todas as rotas de matrícula, com exemplos de requisição e resposta.',
    tipo: 'Documentação',
    prioridade: 'Média',
    status: 'Aberta',
    projetoId: 2,
    responsavelId: 3,
    dataCriacao: dataHoraEmDias(-6),
    dataAtualizacao: dataHoraEmDias(-6),
    prazo: dataEmDias(6),
  },
  {
    id: 12,
    titulo: 'Permitir filtrar disciplinas por semestre',
    descricao: 'Adicionar um filtro de semestre na tela de disciplinas do portal.',
    tipo: 'Melhoria',
    prioridade: 'Alta',
    status: 'Aberta',
    projetoId: 2,
    responsavelId: 2,
    dataCriacao: dataHoraEmDias(-2),
    dataAtualizacao: dataHoraEmDias(-2),
    prazo: dataEmDias(20),
  },
  {
    id: 13,
    titulo: 'Tela de busca de livros não carrega a capa',
    descricao: 'Ao buscar livros cujo título tem acento, a imagem da capa não aparece.',
    tipo: 'Defeito',
    prioridade: 'Alta',
    status: 'Em revisão',
    projetoId: 3,
    responsavelId: 4,
    dataCriacao: dataHoraEmDias(-11),
    dataAtualizacao: dataHoraEmDias(-2),
    prazo: dataEmDias(4),
  },
  {
    id: 14,
    titulo: 'Cadastro duplicado de autores',
    descricao: 'Autores com nomes parecidos estão sendo cadastrados mais de uma vez no sistema.',
    tipo: 'Defeito',
    prioridade: 'Crítica',
    status: 'Aberta',
    projetoId: 3,
    responsavelId: null,
    dataCriacao: dataHoraEmDias(-7),
    dataAtualizacao: dataHoraEmDias(-7),
    prazo: dataEmDias(-2),
  },
  {
    id: 15,
    titulo: 'Criar manual de uso do app de biblioteca',
    descricao: 'Escrever um passo a passo para os bibliotecários usarem o aplicativo.',
    tipo: 'Documentação',
    prioridade: 'Baixa',
    status: 'Em andamento',
    projetoId: 3,
    responsavelId: 3,
    dataCriacao: dataHoraEmDias(-15),
    dataAtualizacao: dataHoraEmDias(-5),
    prazo: dataEmDias(30),
  },
  {
    id: 16,
    titulo: 'Padronizar mensagens de erro da API',
    descricao:
      'Garantir que todas as rotas devolvam erros em JSON, com o mesmo formato de mensagem.',
    tipo: 'Tarefa',
    prioridade: 'Média',
    status: 'Em revisão',
    projetoId: 1,
    responsavelId: 1,
    dataCriacao: dataHoraEmDias(-5),
    dataAtualizacao: dataHoraEmDias(-1),
    prazo: dataEmDias(7),
  },
  {
    id: 17,
    titulo: 'Atualizar paleta de cores do portal',
    descricao: 'Trocar as cores antigas do portal pela nova identidade visual.',
    tipo: 'Melhoria',
    prioridade: 'Baixa',
    status: 'Concluída',
    projetoId: 2,
    responsavelId: 5,
    dataCriacao: dataHoraEmDias(-40),
    dataAtualizacao: dataHoraEmDias(-16),
    prazo: dataEmDias(-15),
  },
  {
    id: 18,
    titulo: 'Implementar notificações de prazo',
    descricao: 'Avisar os responsáveis quando uma demanda estiver perto do prazo de finalização.',
    tipo: 'Melhoria',
    prioridade: 'Alta',
    status: 'Cancelada',
    projetoId: 2,
    responsavelId: null,
    dataCriacao: dataHoraEmDias(-18),
    dataAtualizacao: dataHoraEmDias(-9),
    prazo: null,
  },
];

export const comentarios: Comentario[] = [
  {
    id: 1,
    demandaId: 1,
    usuarioId: 4,
    texto: 'Consegui reproduzir o erro apenas com e-mails escritos em letras maiúsculas.',
    dataHora: dataHoraEmDias(-4),
  },
  {
    id: 2,
    demandaId: 1,
    usuarioId: 2,
    texto: 'Prioridade máxima: o erro impede o acesso de todos os usuários.',
    dataHora: dataHoraEmDias(-3),
  },
  {
    id: 3,
    demandaId: 2,
    usuarioId: 1,
    texto: 'Cards de indicadores prontos, falta ligar nos dados vindos da API.',
    dataHora: dataHoraEmDias(-5),
  },
  {
    id: 4,
    demandaId: 4,
    usuarioId: 5,
    texto: 'Validações de título, descrição e prazo concluídas, aguardando revisão.',
    dataHora: dataHoraEmDias(-2),
  },
  {
    id: 5,
    demandaId: 4,
    usuarioId: 3,
    texto: 'Revisei os campos obrigatórios e está de acordo com o escopo.',
    dataHora: dataHoraEmDias(-1),
  },
  {
    id: 6,
    demandaId: 10,
    usuarioId: 5,
    texto: 'O erro só acontece quando o relatório tem mais de 500 linhas.',
    dataHora: dataHoraEmDias(-2),
  },
  {
    id: 7,
    demandaId: 13,
    usuarioId: 4,
    texto: 'A capa não carrega quando o título do livro possui acento.',
    dataHora: dataHoraEmDias(-8),
  },
  {
    id: 8,
    demandaId: 14,
    usuarioId: 2,
    texto: 'Autores com nomes parecidos estão sendo cadastrados duas vezes.',
    dataHora: dataHoraEmDias(-6),
  },
];

// Contadores de id: o próximo id livre de cada lista. Como outros arquivos não conseguem
// alterar uma variável importada, eles chamam as funções abaixo para pegar um id novo.
let proximoIdDemanda = demandas.length + 1;
let proximoIdComentario = comentarios.length + 1;

export function gerarIdDemanda(): number {
  const id = proximoIdDemanda;
  proximoIdDemanda++;
  return id;
}

export function gerarIdComentario(): number {
  const id = proximoIdComentario;
  proximoIdComentario++;
  return id;
}

// Transforma uma demanda "crua" (que só guarda os ids do projeto e do responsável) na
// versão que a API devolve, com o nome do projeto e do responsável. É usada pelas rotas
// de listagem, detalhes, cadastro e dashboard, para todas devolverem o mesmo formato.
export function montarDemandaDetalhada(demanda: Demanda): DemandaDetalhada {
  const projeto = projetos.find((item) => item.id === demanda.projetoId);
  const responsavel = usuarios.find((item) => item.id === demanda.responsavelId);

  return {
    id: demanda.id,
    titulo: demanda.titulo,
    descricao: demanda.descricao,
    tipo: demanda.tipo,
    prioridade: demanda.prioridade,
    status: demanda.status,
    projeto: {
      id: demanda.projetoId,
      nome: projeto ? projeto.nome : 'Projeto não encontrado',
    },
    responsavel: responsavel ? { id: responsavel.id, nome: responsavel.nome } : null,
    dataCriacao: demanda.dataCriacao,
    dataAtualizacao: demanda.dataAtualizacao,
    prazo: demanda.prazo,
  };
}
