// Autor: Arthur de Senna Nardi Cortina
//
// Funções auxiliares usadas por várias rotas da API.

// Converte qualquer valor recebido (query, body) em texto sem espaços nas pontas.
// Se não for texto, devolve "" (assim nada quebra com valores inesperados).
// Atenção: no Oracle, texto vazio ("") é o mesmo que NULL.
export function textoOuVazio(valor: unknown): string {
  if (typeof valor === "string") {
    return valor.trim();
  }
  return "";
}

// Remove os acentos de um texto: "Crítica" vira "Critica". Usada para comparar sem se
// importar com acento.
export function semAcento(texto: string): string {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Procura um item de uma lista (tipos, prioridades, status) pelo nome, sem diferenciar
// maiúscula/minúscula nem acento: "critica", "CRÍTICA" e "Crítica" encontram o mesmo item.
export function encontrarPorNome<T extends { nome: string }>(lista: T[], valor: unknown): T | null {
  const procurado = semAcento(textoOuVazio(valor)).toLowerCase();

  if (procurado === "") {
    return null;
  }

  for (const item of lista) {
    if (semAcento(item.nome).toLowerCase() === procurado) {
      return item;
    }
  }

  return null;
}

// Converte um valor (número ou texto, como o "2" que vem da URL) em número inteiro positivo.
// Se não for possível, devolve null.
export function lerNumeroInteiro(valor: unknown): number | null {
  let numero = NaN;

  if (typeof valor === "number") {
    numero = valor;
  } else if (typeof valor === "string" && valor.trim() !== "") {
    numero = Number(valor.trim());
  }

  if (Number.isInteger(numero) && numero > 0) {
    return numero;
  }

  return null;
}

// Confere se o texto é uma data real no formato AAAA-MM-DD (por exemplo, 2026-11-30).
// Datas que não existem, como 2026-02-31, são recusadas.
export function dataValida(texto: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    return false;
  }

  const [ano, mes, dia] = texto.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);

  return data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia;
}

// Troca 2026-11-30 por 30/11/2026 (usada nas mensagens do histórico)
export function dataParaBR(iso: string): string {
  const partes = iso.split("-");
  if (partes.length !== 3) {
    return iso;
  }
  return partes[2] + "/" + partes[1] + "/" + partes[0];
}

// Prepara o texto digitado na busca para o comando LIKE do Oracle: tira acento, deixa
// minúsculo e "escapa" os caracteres % _ \ (que têm significado especial no LIKE).
export function prepararBusca(texto: string): string {
  return semAcento(texto).toLowerCase().replace(/[\\%_]/g, (letra) => "\\" + letra);
}
