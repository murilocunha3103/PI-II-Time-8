// Autor: Arthur de Senna Nardi Cortina
//
// Tipos (contratos) usados por toda a API. Eles definem o "formato" de cada
// informação do sistema: o que é um usuário, um projeto, uma demanda e um comentário.
// É o mesmo conceito que vimos na aula com a interface "Aluno": o TypeScript avisa
// na hora de compilar se alguém usar um campo que não existe ou um valor inválido.

// Valores permitidos, exatamente como estão no Documento de Visão do projeto
export type TipoDemanda = 'Tarefa' | 'Defeito' | 'Melhoria' | 'Documentação';
export type PrioridadeDemanda = 'Crítica' | 'Alta' | 'Média' | 'Baixa';
export type StatusDemanda = 'Aberta' | 'Em andamento' | 'Em revisão' | 'Concluída' | 'Cancelada';
export type PerfilUsuario = 'Administrador' | 'Líder de Projeto' | 'Membro da Equipe';

// As mesmas listas de valores, só que como arrays. Servem para VALIDAR dados
// recebidos (ex.: conferir se o tipo enviado no POST é um dos quatro permitidos).
export const TIPOS_VALIDOS: TipoDemanda[] = ['Tarefa', 'Defeito', 'Melhoria', 'Documentação'];
export const PRIORIDADES_VALIDAS: PrioridadeDemanda[] = ['Crítica', 'Alta', 'Média', 'Baixa'];
export const STATUS_VALIDOS: StatusDemanda[] = [
  'Aberta',
  'Em andamento',
  'Em revisão',
  'Concluída',
  'Cancelada',
];

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  senha: string; // só existe nos dados de teste - NUNCA deve ser devolvida pela API
  perfil: PerfilUsuario;
}

export interface Projeto {
  id: number;
  nome: string;
  descricao: string;
}

// Demanda como fica guardada nos dados (referencia projeto e responsável pelo id)
export interface Demanda {
  id: number;
  titulo: string;
  descricao: string;
  tipo: TipoDemanda;
  prioridade: PrioridadeDemanda;
  status: StatusDemanda;
  projetoId: number;
  responsavelId: number | null; // null = ainda sem responsável
  dataCriacao: string; // data e hora em formato ISO, ex.: 2026-10-20T14:30:00.000Z
  dataAtualizacao: string;
  prazo: string | null; // data no formato AAAA-MM-DD, ou null se não definido
}

// Demanda como a API devolve nas respostas: com o nome do projeto e do
// responsável já resolvidos, para a tela não precisar procurar por id.
export interface DemandaDetalhada {
  id: number;
  titulo: string;
  descricao: string;
  tipo: TipoDemanda;
  prioridade: PrioridadeDemanda;
  status: StatusDemanda;
  projeto: { id: number; nome: string };
  responsavel: { id: number; nome: string } | null;
  dataCriacao: string;
  dataAtualizacao: string;
  prazo: string | null;
}

export interface Comentario {
  id: number;
  demandaId: number;
  usuarioId: number;
  texto: string;
  dataHora: string; // registrada automaticamente pelo servidor
}
