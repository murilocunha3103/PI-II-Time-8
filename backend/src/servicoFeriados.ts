// Autor: Arthur de Senna Nardi Cortina (arquivo-base da estrutura da equipe)
//
// ARQUIVO-BASE (esqueleto): a verificação de feriado nacional será implementada por Gabriel
// Passarela Silva, que vai SUBSTITUIR todo o conteúdo deste arquivo na branch dela.
//
// Este esqueleto existe só para o sistema já compilar e funcionar. Enquanto ele estiver aqui,
// nenhuma data é considerada feriado.

export interface ResultadoFeriado {
  feriado: boolean;
  nome: string | null;
  fonte: "api" | "local";
}

// Informa se uma data (AAAA-MM-DD) é feriado nacional
export async function verificarFeriadoNacional(dataISO: string): Promise<ResultadoFeriado> {
  return { feriado: false, nome: null, fonte: "local" };
}
