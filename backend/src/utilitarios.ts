// Autor: Arthur de Senna Nardi Cortina
//
// Funções auxiliares usadas por várias rotas da API. Ficam aqui para ninguém
// precisar copiar e colar o mesmo código em arquivos diferentes.

// Lê um valor que veio da URL (req.query) ou do corpo (req.body) e devolve como
// texto sem espaços nas pontas. Se não for texto, devolve "" (vazio).
// Isso evita erro quando alguém envia, por exemplo, um número ou uma lista no lugar do texto.
export function textoOuVazio(valor: unknown): string {
  if (typeof valor === 'string') {
    return valor.trim();
  }
  return '';
}

// Remove os acentos de um texto: "Crítica" vira "Critica". Usado para comparar textos
// sem se importar com acento (assim "formulario" também encontra "formulário").
export function semAcento(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Confere se o valor recebido é um dos valores permitidos, sem diferenciar maiúscula,
// minúscula ou acento (ex.: "critica", "CRÍTICA" e "Crítica" valem como "Crítica").
// Devolve o valor oficial da lista (com a grafia correta) ou null se não existir.
export function encontrarValorValido<T extends string>(
  valor: unknown,
  validos: readonly T[],
): T | null {
  const procurado = semAcento(textoOuVazio(valor)).toLowerCase();

  if (procurado === '') {
    return null;
  }

  for (const valido of validos) {
    if (semAcento(valido).toLowerCase() === procurado) {
      return valido;
    }
  }

  return null;
}

// Converte um valor (número ou texto numérico) em número inteiro positivo.
// Devolve null se não for um número inteiro positivo. Usado para ids.
export function lerNumeroInteiro(valor: unknown): number | null {
  let numero = NaN;

  if (typeof valor === 'number') {
    numero = valor;
  } else if (typeof valor === 'string' && valor.trim() !== '') {
    numero = Number(valor.trim());
  }

  if (Number.isInteger(numero) && numero > 0) {
    return numero;
  }

  return null;
}

// Confere se o texto é uma data real no formato AAAA-MM-DD.
// "2026-10-25" é válida; "25/10/2026" (formato errado) e "2026-02-31" (dia que não
// existe) são inválidas.
export function dataValida(texto: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    return false;
  }

  const ano = Number(texto.slice(0, 4));
  const mes = Number(texto.slice(5, 7));
  const dia = Number(texto.slice(8, 10));

  // O JavaScript "corrige" datas impossíveis (31/02 vira março). Então criamos a data
  // e conferimos se ano, mês e dia continuam iguais aos que foram digitados.
  const data = new Date(ano, mes - 1, dia);

  return data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia;
}

// Devolve a data de hoje somada a "dias" (pode ser negativo), no formato AAAA-MM-DD.
// dataEmDias(0) = hoje, dataEmDias(7) = daqui a 7 dias, dataEmDias(-3) = 3 dias atrás.
export function dataEmDias(dias: number): string {
  const data = new Date();
  data.setDate(data.getDate() + dias);

  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');

  return ano + '-' + mes + '-' + dia;
}

// Devolve data e hora (formato ISO) de hoje somada a "dias". Usada nos dados de teste.
export function dataHoraEmDias(dias: number): string {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  return data.toISOString();
}

// Devolve a data e hora de agora (formato ISO). O servidor usa isso para registrar
// automaticamente a criação de demandas e comentários.
export function agoraISO(): string {
  return new Date().toISOString();
}
