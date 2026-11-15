// Autor: Gabriel Passarela Silva
//
// Verificação de feriado nacional (Reunião 5, item 2.2.5 do Documento de Visão).
//
// O Documento de Visão exige o uso de uma API externa para saber se a data do prazo de finalização
// é feriado nacional; se for, o cadastro ou a atualização do prazo é impedido. Usamos a BrasilAPI:
//   https://brasilapi.com.br/api/feriados/v1/2026
// Ela devolve a lista de feriados do ano, no formato:
//   [ { "date": "2026-12-25", "name": "Natal", "type": "national" }, ... ]
//
// Para não consultar a internet a cada validação, guardamos em memória (cache) a lista de cada ano
// depois da primeira consulta.
//
// PLANO DE CONTINGÊNCIA: se a API externa não responder (sem internet, fora do ar, demora demais),
// o sistema NÃO trava. Ele usa uma lista local dos feriados nacionais previstos em lei (datas fixas
// e a Sexta-feira Santa, calculada a partir da Páscoa). O resultado informa de onde veio a resposta
// no campo "fonte": "api" (BrasilAPI) ou "local" (lista de contingência).

export interface ResultadoFeriado {
  feriado: boolean;
  nome: string | null;
  fonte: "api" | "local";
}

const URL_API = "https://brasilapi.com.br/api/feriados/v1/";
const TEMPO_LIMITE_MS = 4000; // se a API não responder em 4 segundos, usamos a lista local
const ESPERA_APOS_FALHA_MS = 60 * 1000; // depois de uma falha, só tenta a API de novo após 1 minuto

// Cache: ano -> (data AAAA-MM-DD -> nome do feriado)
const cache = new Map<number, Map<string, string>>();
let apiIndisponivelAte = 0;

// Consulta a BrasilAPI e devolve os feriados do ano
async function buscarNaApi(ano: number): Promise<Map<string, string>> {
  const controlador = new AbortController();
  const cronometro = setTimeout(() => controlador.abort(), TEMPO_LIMITE_MS);

  try {
    const resposta = await fetch(URL_API + ano, { signal: controlador.signal });

    if (!resposta.ok) {
      throw new Error("A API de feriados respondeu com o status " + resposta.status);
    }

    const lista = (await resposta.json()) as Array<{ date: string; name: string; type?: string }>;
    const feriados = new Map<string, string>();

    lista.forEach((item) => {
      if (item.type === undefined || item.type === "national") {
        feriados.set(item.date, item.name);
      }
    });

    return feriados;
  } finally {
    clearTimeout(cronometro);
  }
}

// Calcula a data da Páscoa de um ano (algoritmo de Meeus/Jones/Butcher, para o calendário gregoriano)
function calcularPascoa(ano: number): Date {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(ano, mes - 1, dia));
}

// Lista local de contingência: feriados nacionais previstos em lei
function calcularFeriadosLocais(ano: number): Map<string, string> {
  const feriados = new Map<string, string>();

  // Datas fixas (mês-dia)
  feriados.set(ano + "-01-01", "Confraternização Universal");
  feriados.set(ano + "-04-21", "Tiradentes");
  feriados.set(ano + "-05-01", "Dia do Trabalho");
  feriados.set(ano + "-09-07", "Independência do Brasil");
  feriados.set(ano + "-10-12", "Nossa Senhora Aparecida");
  feriados.set(ano + "-11-02", "Finados");
  feriados.set(ano + "-11-15", "Proclamação da República");
  feriados.set(ano + "-12-25", "Natal");

  // O Dia da Consciência Negra é feriado nacional desde 2024
  if (ano >= 2024) {
    feriados.set(ano + "-11-20", "Dia da Consciência Negra");
  }

  // Sexta-feira Santa: dois dias antes da Páscoa
  const sextaSanta = calcularPascoa(ano);
  sextaSanta.setUTCDate(sextaSanta.getUTCDate() - 2);
  feriados.set(sextaSanta.toISOString().slice(0, 10), "Sexta-feira Santa");

  return feriados;
}

// Informa se uma data (AAAA-MM-DD) é feriado nacional
export async function verificarFeriadoNacional(dataISO: string): Promise<ResultadoFeriado> {
  const ano = Number(dataISO.slice(0, 4));
  let feriados = cache.get(ano);
  let fonte: "api" | "local" = "api";

  if (!feriados) {
    if (Date.now() < apiIndisponivelAte) {
      // A API falhou há pouco tempo: nem tenta de novo agora, usa a lista local
      feriados = calcularFeriadosLocais(ano);
      fonte = "local";
    } else {
      try {
        feriados = await buscarNaApi(ano);
        cache.set(ano, feriados); // guarda para as próximas verificações do mesmo ano
      } catch (erro) {
        console.warn("API de feriados indisponível, usando a lista local:", (erro as Error).message);
        apiIndisponivelAte = Date.now() + ESPERA_APOS_FALHA_MS;
        feriados = calcularFeriadosLocais(ano);
        fonte = "local";
      }
    }
  }

  const nome = feriados.get(dataISO) ?? null;
  return { feriado: nome !== null, nome, fonte };
}
