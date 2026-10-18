// Autor: Arthur de Senna Nardi Cortina
//
// Rota do Dashboard (Reunião 4):
//   GET /dashboard
//
// Devolve os indicadores da tela inicial: total de demandas, quantidade por status,
// por prioridade e por tipo, as demandas críticas em aberto e as demandas próximas do
// prazo de finalização.
//
// CRITÉRIOS ADOTADOS PELA EQUIPE (a Reunião 4 pede que sejam definidos e explicados):
//   - "Em aberto": demanda com status "Aberta", ou seja, registrada e ainda não iniciada.
//     Logo, "críticas em aberto" = prioridade "Crítica" + status "Aberta". É o alerta de
//     "algo crítico que ninguém começou a resolver". Demandas críticas que já estão
//     "Em andamento" ou "Em revisão" estão sendo tratadas e entram nas contagens normais.
//   - "Próximas do prazo": demanda ainda não finalizada (status diferente de "Concluída"
//     e "Cancelada") cujo prazo está entre hoje e os próximos 7 dias, inclusive.
//
// Filtros opcionais pela URL (preparam a integração com a barra de filtros do dashboard):
//   /dashboard?prioridade=Alta
//   /dashboard?responsavel=2        (id do usuário responsável)
//   /dashboard?busca=login          (procura no título, na descrição e no nome do responsável)

import { Express, Request, Response } from 'express';
import { demandas, montarDemandaDetalhada } from '../dados/dados';
import { PRIORIDADES_VALIDAS, STATUS_VALIDOS, TIPOS_VALIDOS } from '../tipos';
import {
  dataEmDias,
  encontrarValorValido,
  lerNumeroInteiro,
  semAcento,
  textoOuVazio,
} from '../utilitarios';

const DIAS_PROXIMO_PRAZO = 7;

export function registrarRotasDashboard(app: Express) {
  app.get('/dashboard', (req: Request, res: Response) => {
    // 1. Lê os filtros opcionais que vieram na URL (req.query)
    const prioridadeTexto = textoOuVazio(req.query.prioridade);
    const responsavelTexto = textoOuVazio(req.query.responsavel);
    const busca = semAcento(textoOuVazio(req.query.busca)).toLowerCase();

    // 2. Valida os filtros: se vieram preenchidos, precisam ser valores válidos
    let prioridadeFiltro: string | null = null;
    if (prioridadeTexto !== '') {
      prioridadeFiltro = encontrarValorValido(prioridadeTexto, PRIORIDADES_VALIDAS);

      if (prioridadeFiltro === null) {
        return res.status(400).json({
          mensagem: 'Prioridade inválida. Valores aceitos: ' + PRIORIDADES_VALIDAS.join(', ') + '.',
        });
      }
    }

    let responsavelFiltro: number | null = null;
    if (responsavelTexto !== '') {
      responsavelFiltro = lerNumeroInteiro(responsavelTexto);

      if (responsavelFiltro === null) {
        return res
          .status(400)
          .json({ mensagem: 'O responsável deve ser informado pelo id (número inteiro).' });
      }
    }

    // 3. Aplica os filtros sobre as demandas
    const filtradas = demandas.map(montarDemandaDetalhada).filter((demanda) => {
      const nomeResponsavel = demanda.responsavel ? demanda.responsavel.nome : '';
      const textoParaBusca = semAcento(
        demanda.titulo + ' ' + demanda.descricao + ' ' + nomeResponsavel,
      ).toLowerCase();

      const bateComBusca = busca === '' || textoParaBusca.includes(busca);
      const bateComPrioridade =
        prioridadeFiltro === null || demanda.prioridade === prioridadeFiltro;
      const bateComResponsavel =
        responsavelFiltro === null ||
        (demanda.responsavel !== null && demanda.responsavel.id === responsavelFiltro);

      return bateComBusca && bateComPrioridade && bateComResponsavel;
    });

    // 4. Prepara os contadores, todos começando em zero (assim, mesmo um status sem
    //    nenhuma demanda aparece na resposta com valor 0)
    const porStatus: Record<string, number> = {};
    const porPrioridade: Record<string, number> = {};
    const porTipo: Record<string, number> = {};

    STATUS_VALIDOS.forEach((status) => {
      porStatus[status] = 0;
    });
    PRIORIDADES_VALIDAS.forEach((prioridade) => {
      porPrioridade[prioridade] = 0;
    });
    TIPOS_VALIDOS.forEach((tipo) => {
      porTipo[tipo] = 0;
    });

    // 5. Percorre as demandas filtradas contando e separando as listas especiais
    const hoje = dataEmDias(0);
    const limite = dataEmDias(DIAS_PROXIMO_PRAZO);

    const criticasEmAberto: typeof filtradas = [];
    const proximasDoPrazo: typeof filtradas = [];

    filtradas.forEach((demanda) => {
      porStatus[demanda.status]++;
      porPrioridade[demanda.prioridade]++;
      porTipo[demanda.tipo]++;

      if (demanda.prioridade === 'Crítica' && demanda.status === 'Aberta') {
        criticasEmAberto.push(demanda);
      }

      const naoFinalizada = demanda.status !== 'Concluída' && demanda.status !== 'Cancelada';

      // As datas estão no formato AAAA-MM-DD, então dá para compará-las como texto
      if (
        naoFinalizada &&
        demanda.prazo !== null &&
        demanda.prazo >= hoje &&
        demanda.prazo <= limite
      ) {
        proximasDoPrazo.push(demanda);
      }
    });

    // As que vencem primeiro aparecem primeiro
    proximasDoPrazo.sort((a, b) => (a.prazo || '').localeCompare(b.prazo || ''));

    // 6. Responde com os indicadores (200) e a explicação dos critérios adotados
    return res.status(200).json({
      totalDemandas: filtradas.length,
      porStatus,
      porPrioridade,
      porTipo,
      criticasEmAberto: {
        quantidade: criticasEmAberto.length,
        demandas: criticasEmAberto,
      },
      proximasDoPrazo: {
        quantidade: proximasDoPrazo.length,
        demandas: proximasDoPrazo,
      },
      criterios: {
        emAberto:
          'Demanda com status Aberta (ainda não iniciada). Críticas em aberto = prioridade Crítica + status Aberta.',
        proximasDoPrazo:
          'Demanda não finalizada (status diferente de Concluída e Cancelada) com prazo entre hoje e os próximos ' +
          DIAS_PROXIMO_PRAZO +
          ' dias, inclusive.',
      },
    });
  });
}
