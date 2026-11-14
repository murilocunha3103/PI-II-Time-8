// Autor: Arthur de Senna Nardi Cortina
//
// Tipos e constantes compartilhados por todas as rotas da API (Reunião 5).
//
// Os códigos (ids) dos perfis e dos status abaixo são os mesmos cadastrados nas tabelas de apoio
// pelo script database/02_dados_teste.sql. Usamos os códigos (e não os nomes) nas regras de negócio
// para que um acento ou uma letra maiúscula diferente no banco não quebre o sistema.

// Perfis de acesso (tabela perfil)
export const PERFIL = {
  ADMINISTRADOR: 1,
  LIDER: 2,
  MEMBRO: 3,
};

// Status da demanda (tabela status_demanda)
export const STATUS = {
  ABERTA: 1,
  EM_ANDAMENTO: 2,
  EM_REVISAO: 3,
  CONCLUIDA: 4,
  CANCELADA: 5,
};

// Prioridade "Crítica" (tabela prioridade)
export const PRIORIDADE_CRITICA = 1;

// Usuário que está fazendo a requisição (descoberto a partir do token)
export interface UsuarioLogado {
  id: number;
  nome: string;
  email: string;
  perfilId: number;
  perfil: string; // nome do perfil, só para exibir na tela
}

// Uma linha qualquer devolvida pelo Oracle (as colunas chegam como propriedades do objeto)
export type Linha = Record<string, any>;

// Valores ("binds") enviados ao Oracle junto com um comando SQL: { nome: valor, ... }
export type Binds = Record<string, any>;

// Item de uma tabela de apoio (tipo, prioridade, status): código, nome e ordem
export interface ItemDominio {
  id: number;
  nome: string;
  ordem: number;
}

export interface Referencia {
  id: number;
  nome: string;
}

// Formato da demanda devolvido pela API (o mesmo da Reunião 4)
export interface DemandaResposta {
  id: number;
  titulo: string;
  descricao: string;
  tipo: string;
  prioridade: string;
  status: string;
  projeto: Referencia;
  responsavel: Referencia | null;
  dataCriacao: string;
  dataAtualizacao: string;
  prazo: string | null;
}

// Faz o Express "enxergar" a propriedade req.usuario, preenchida pelo middleware exigirLogin
declare global {
  namespace Express {
    interface Request {
      usuario?: UsuarioLogado;
    }
  }
}
