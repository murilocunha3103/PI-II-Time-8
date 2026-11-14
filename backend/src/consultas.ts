// Autor: Arthur de Senna Nardi Cortina
//
// Consultas ao banco usadas por mais de uma rota: o SELECT padrão de demanda, a regra de
// "quais projetos o usuário enxerga" e a leitura das tabelas de apoio (tipo, prioridade, status).
//
// Todas as consultas usam "binds" (:nome) para os valores. Nunca juntamos texto digitado pelo
// usuário dentro do SQL, o que evita o ataque de SQL Injection.

import { Connection } from "oracledb";
import { ehAdministrador } from "./permissoes";
import { Binds, DemandaResposta, ItemDominio, Linha, UsuarioLogado } from "./tipos";

// Colunas da demanda. Cada coluna ganha um nome entre aspas (alias), assim o Oracle devolve
// exatamente "titulo", "projetoNome"... (sem aspas ele devolveria TITULO, PROJETONOME).
export const COLUNAS_DEMANDA = `
  d.id_demanda AS "id", d.titulo AS "titulo", d.descricao AS "descricao",
  d.id_tipo AS "tipoId", t.nome AS "tipo",
  d.id_prioridade AS "prioridadeId", pr.nome AS "prioridade",
  d.id_status AS "statusId", s.nome AS "status",
  d.id_projeto AS "projetoId", p.nome AS "projetoNome",
  d.id_responsavel AS "responsavelId", u.nome AS "responsavelNome",
  TO_CHAR(d.data_criacao, 'YYYY-MM-DD"T"HH24:MI:SS') AS "dataCriacao",
  TO_CHAR(d.data_atualizacao, 'YYYY-MM-DD"T"HH24:MI:SS') AS "dataAtualizacao",
  TO_CHAR(d.prazo, 'YYYY-MM-DD') AS "prazo"`;

// Tabelas ligadas à demanda. O responsável é LEFT JOIN porque pode ficar em branco.
export const JOINS_DEMANDA = `
  FROM demanda d
  JOIN tipo_demanda t ON t.id_tipo = d.id_tipo
  JOIN prioridade pr ON pr.id_prioridade = d.id_prioridade
  JOIN status_demanda s ON s.id_status = d.id_status
  JOIN projeto p ON p.id_projeto = d.id_projeto
  LEFT JOIN usuario u ON u.id_usuario = d.id_responsavel`;

// Transforma a linha do banco no formato da demanda devolvido pela API
export function montarDemanda(linha: Linha): DemandaResposta {
  return {
    id: linha.id,
    titulo: linha.titulo,
    descricao: linha.descricao,
    tipo: linha.tipo,
    prioridade: linha.prioridade,
    status: linha.status,
    projeto: { id: linha.projetoId, nome: linha.projetoNome },
    responsavel: linha.responsavelId === null ? null : { id: linha.responsavelId, nome: linha.responsavelNome },
    dataCriacao: linha.dataCriacao,
    dataAtualizacao: linha.dataAtualizacao,
    prazo: linha.prazo,
  };
}

// Busca UMA demanda pelo id. Devolve a linha do banco (com os ids internos) ou null.
export async function buscarDemanda(conn: Connection, id: number): Promise<Linha | null> {
  const resultado = await conn.execute(`SELECT ${COLUNAS_DEMANDA} ${JOINS_DEMANDA} WHERE d.id_demanda = :id`, { id });
  const linhas = (resultado.rows ?? []) as Linha[];
  return linhas[0] ?? null;
}

// Confere se o usuário enxerga o projeto: o Administrador enxerga todos; Líder e Membro só
// os projetos em que estão vinculados (tabela projeto_usuario).
export async function usuarioEnxergaProjeto(conn: Connection, usuario: UsuarioLogado, projetoId: number): Promise<boolean> {
  if (ehAdministrador(usuario)) {
    const existe = await conn.execute(`SELECT COUNT(*) AS "total" FROM projeto WHERE id_projeto = :projetoId`, { projetoId });
    return ((existe.rows ?? []) as Linha[])[0].total > 0;
  }
  return usuarioVinculadoAoProjeto(conn, usuario.id, projetoId);
}

// Confere se um usuário está vinculado a um projeto (qualquer perfil, inclusive Administrador)
export async function usuarioVinculadoAoProjeto(conn: Connection, usuarioId: number, projetoId: number): Promise<boolean> {
  const resultado = await conn.execute(
    `SELECT COUNT(*) AS "total" FROM projeto_usuario WHERE id_projeto = :projetoId AND id_usuario = :usuarioId`,
    { projetoId, usuarioId }
  );
  return ((resultado.rows ?? []) as Linha[])[0].total > 0;
}

// Pedaço de SQL que limita as demandas aos projetos que o usuário enxerga. O Administrador não
// tem limite (devolve ""). Para os demais, devolve " AND d.id_projeto IN (...)" e coloca o bind
// :visivelPara dentro de "binds". Use depois de um WHERE que já exista (por exemplo, WHERE 1 = 1).
export function clausulaVisibilidade(usuario: UsuarioLogado, binds: Binds): string {
  if (ehAdministrador(usuario)) {
    return "";
  }
  binds.visivelPara = usuario.id;
  return " AND d.id_projeto IN (SELECT pu.id_projeto FROM projeto_usuario pu WHERE pu.id_usuario = :visivelPara)";
}

// Lê uma tabela de apoio inteira (são poucas linhas): tipo_demanda, prioridade ou status_demanda.
// Os nomes de tabela e de coluna vêm do nosso código (nunca do usuário), por isso podem entrar no SQL.
export async function carregarDominio(
  conn: Connection,
  tabela: "tipo_demanda" | "prioridade" | "status_demanda",
  colunaId: "id_tipo" | "id_prioridade" | "id_status"
): Promise<ItemDominio[]> {
  // tipo_demanda não tem coluna "ordem": para ela, ordenamos pelo próprio código
  const colunaOrdem = tabela === "tipo_demanda" ? colunaId : "ordem";
  const resultado = await conn.execute(
    `SELECT ${colunaId} AS "id", nome AS "nome", ${colunaOrdem} AS "ordem"
       FROM ${tabela} ORDER BY ${colunaOrdem}`
  );
  return (resultado.rows ?? []) as ItemDominio[];
}

// Atalhos para cada tabela de apoio
export const carregarTipos = (conn: Connection) => carregarDominio(conn, "tipo_demanda", "id_tipo");
export const carregarPrioridades = (conn: Connection) => carregarDominio(conn, "prioridade", "id_prioridade");
export const carregarStatus = (conn: Connection) => carregarDominio(conn, "status_demanda", "id_status");

// Data de hoje segundo o BANCO (AAAA-MM-DD). Usamos a data do banco para comparar prazos, pois
// é a mesma data usada nas regras do próprio banco (por exemplo, o CHECK do prazo).
export async function dataDeHoje(conn: Connection): Promise<string> {
  const resultado = await conn.execute(`SELECT TO_CHAR(TRUNC(SYSDATE), 'YYYY-MM-DD') AS "hoje" FROM dual`);
  return ((resultado.rows ?? []) as Linha[])[0].hoje;
}

// Letras com acento e suas versões sem acento, na mesma ordem (usadas no TRANSLATE do Oracle)
const LETRAS_COM_ACENTO = "áàâãäéèêëíìîïóòôõöúùûüç";
const LETRAS_SEM_ACENTO = "aaaaaeeeeiiiiooooouuuuc";

// Pedaço de SQL da busca por texto. Procura o texto no título, na descrição e no nome do
// responsável, sem diferenciar maiúscula/minúscula nem acento: LOWER deixa tudo minúsculo e
// TRANSLATE troca "á" por "a", "ç" por "c" etc. O texto buscado deve vir de prepararBusca().
// Devolve "" se a busca estiver vazia; senão, " AND ..." e coloca o bind :busca em "binds".
export function filtroBusca(busca: string, binds: Binds): string {
  if (busca === "") {
    return "";
  }
  binds.busca = "%" + busca + "%";
  return (
    ` AND TRANSLATE(LOWER(d.titulo || ' ' || d.descricao || ' ' || NVL(u.nome, '')),` +
    ` '${LETRAS_COM_ACENTO}', '${LETRAS_SEM_ACENTO}') LIKE :busca ESCAPE '\\'`
  );
}
