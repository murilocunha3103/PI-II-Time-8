// Autor: Gabriel Passarela Silva
//
// Validações compartilhadas pelo cadastro (POST /demandas) e pela edição (PUT /demandas/:id).
// Cada função devolve uma mensagem de erro (texto) ou null quando o campo está correto. As rotas
// juntam as mensagens numa lista e devolvem tudo de uma vez ao usuário (código 400).
//
// Mesmo que a tela já valide os campos, o servidor valida de novo: qualquer pessoa pode chamar a
// API sem passar pela tela (por exemplo, pelo Thunder Client).

import { Connection } from "oracledb";
import { dataDeHoje, usuarioVinculadoAoProjeto } from "./consultas";
import { Linha } from "./tipos";
import { verificarFeriadoNacional } from "./servicoFeriados";
import { dataValida, lerNumeroInteiro, textoOuVazio } from "./utilitarios";

// Limites iguais aos das colunas do banco (varchar2(100 char) e varchar2(2000 char))
export const TITULO_MAXIMO = 100;
export const DESCRICAO_MAXIMA = 2000;

export function validarTitulo(titulo: string): string | null {
  if (titulo === "") {
    return "O título é obrigatório.";
  }
  if (titulo.length > TITULO_MAXIMO) {
    return "O título pode ter no máximo " + TITULO_MAXIMO + " caracteres.";
  }
  return null;
}

export function validarDescricao(descricao: string): string | null {
  if (descricao === "") {
    return "A descrição é obrigatória.";
  }
  if (descricao.length > DESCRICAO_MAXIMA) {
    return "A descrição pode ter no máximo " + DESCRICAO_MAXIMA + " caracteres.";
  }
  return null;
}

// O responsável é opcional. Se for informado, o usuário precisa existir e estar vinculado ao
// projeto da demanda (regra RN10). Se for o mesmo responsável que a demanda já tem, não confere
// de novo (para continuar possível editar demandas antigas).
export async function validarResponsavel(
  conn: Connection,
  valor: unknown,
  projetoId: number,
  responsavelAtual: number | null
): Promise<{ id: number | null; erro: string | null }> {
  if (valor === null || valor === undefined || valor === "") {
    return { id: null, erro: null };
  }

  const id = lerNumeroInteiro(valor);
  if (id === null) {
    return { id: null, erro: "O responsável (responsavelId) deve ser o id de um usuário." };
  }

  if (id === responsavelAtual) {
    return { id, erro: null };
  }

  const existe = await conn.execute(`SELECT COUNT(*) AS "total" FROM usuario WHERE id_usuario = :id`, { id });
  if (((existe.rows ?? []) as Linha[])[0].total === 0) {
    return { id, erro: "O responsável informado não existe." };
  }

  if (!(await usuarioVinculadoAoProjeto(conn, id, projetoId))) {
    return { id, erro: "O responsável precisa estar vinculado ao projeto da demanda." };
  }

  return { id, erro: null };
}

// O prazo é opcional. Se for informado precisa ser uma data real (AAAA-MM-DD), não pode ser no
// passado e não pode ser feriado nacional (consulta a API externa). Se for o mesmo prazo que a
// demanda já tem, não confere de novo (assim dá para editar uma demanda atrasada sem mexer no prazo).
export async function validarPrazo(
  conn: Connection,
  valor: unknown,
  prazoAtual: string | null
): Promise<{ prazo: string | null; erro: string | null }> {
  const prazo = textoOuVazio(valor);

  if (prazo === "") {
    return { prazo: null, erro: null };
  }

  if (!dataValida(prazo)) {
    return { prazo, erro: "O prazo deve ser uma data válida no formato AAAA-MM-DD (ex.: 2026-11-30)." };
  }

  if (prazo === prazoAtual) {
    return { prazo, erro: null };
  }

  if (prazo < (await dataDeHoje(conn))) {
    return { prazo, erro: "O prazo não pode ser uma data no passado." };
  }

  const feriado = await verificarFeriadoNacional(prazo);
  if (feriado.feriado) {
    return { prazo, erro: `O prazo não pode ser um feriado nacional (${feriado.nome}).` };
  }

  return { prazo, erro: null };
}
