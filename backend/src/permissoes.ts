// Autor: Arthur de Senna Nardi Cortina
//
// Regras de permissão por perfil (item 2.1 do Documento de Visão). São funções simples, sem
// acesso ao banco: recebem o usuário e os dados da demanda e respondem se a ação é permitida.
//
//  - Administrador: acessa tudo e faz tudo com as demandas.
//  - Líder de Projeto: cria, edita, cancela e altera o status (todas as transições) das demandas
//    dos projetos aos quais está vinculado.
//  - Membro da Equipe: só vê e comenta. Pode mudar o status das demandas ATRIBUÍDAS A ELE de
//    Aberta para Em andamento e de Em andamento para Em revisão. Não conclui nem cancela,
//    não cria nem edita demandas, não altera responsável nem prioridade.
//
// "Quais projetos o usuário enxerga" depende do banco (tabela projeto_usuario); isso fica em
// consultas.ts.

import { PERFIL, STATUS, UsuarioLogado } from "./tipos";

export function ehAdministrador(usuario: UsuarioLogado): boolean {
  return usuario.perfilId === PERFIL.ADMINISTRADOR;
}

export function ehLider(usuario: UsuarioLogado): boolean {
  return usuario.perfilId === PERFIL.LIDER;
}

export function ehMembro(usuario: UsuarioLogado): boolean {
  return usuario.perfilId === PERFIL.MEMBRO;
}

// Criar e editar demandas (inclui atribuir responsável, alterar prioridade e prazo)
export function podeCriarOuEditar(usuario: UsuarioLogado): boolean {
  return ehAdministrador(usuario) || ehLider(usuario);
}

// Cancelar demandas
export function podeCancelar(usuario: UsuarioLogado): boolean {
  return ehAdministrador(usuario) || ehLider(usuario);
}

// Resposta de uma verificação de permissão: se foi permitido e, se não, o motivo (mostrado na tela)
export interface ResultadoPermissao {
  permitido: boolean;
  motivo: string;
}

// Confere se o usuário pode mudar o status da demanda de "statusAtual" para "statusNovo".
// Esta função só olha o PERFIL. Se a mudança existe no ciclo de vida (tabela transicao_status)
// é conferido à parte, pela rota.
export function verificarMudancaStatus(
  usuario: UsuarioLogado,
  responsavelId: number | null,
  statusAtual: number,
  statusNovo: number
): ResultadoPermissao {
  // Administrador e Líder podem fazer qualquer mudança prevista no ciclo de vida
  if (ehAdministrador(usuario) || ehLider(usuario)) {
    return { permitido: true, motivo: "" };
  }

  // Membro: só nas demandas atribuídas a ele...
  if (responsavelId !== usuario.id) {
    return { permitido: false, motivo: "O Membro da Equipe só pode alterar o status das demandas atribuídas a ele." };
  }

  // ...e só Aberta -> Em andamento e Em andamento -> Em revisão
  const abrir = statusAtual === STATUS.ABERTA && statusNovo === STATUS.EM_ANDAMENTO;
  const enviarParaRevisao = statusAtual === STATUS.EM_ANDAMENTO && statusNovo === STATUS.EM_REVISAO;

  if (abrir || enviarParaRevisao) {
    return { permitido: true, motivo: "" };
  }

  return {
    permitido: false,
    motivo: "O Membro da Equipe só pode passar a demanda de Aberta para Em andamento e de Em andamento para Em revisão.",
  };
}
