// Autor: Arthur de Senna Nardi Cortina

// Comportamento em JavaScript da tela de Dashboard (Reunião 3).

// A lista "demandas" logo abaixo é TEMPORÁRIA - foi criada só pra demonstrar os
// filtros e os indicadores funcionando nesta etapa do projeto, já que o backend
// ainda não está pronto pra fornecer os dados de verdade. Quando o backend e o
// banco de dados estiverem prontos, essa lista será substituída pelos dados reais.

const demandas = [
  {
    titulo: 'Corrigir erro no login',
    prioridade: 'critica',
    status: 'aberta',
    responsavel: 'Gabriel Passarela',
    prazo: '2026-09-22',
  },
  {
    titulo: 'Criar tela de dashboard',
    prioridade: 'media',
    status: 'andamento',
    responsavel: 'Arthur de Senna',
    prazo: '2026-09-25',
  },
  {
    titulo: 'Escrever README do projeto',
    prioridade: 'baixa',
    status: 'concluida',
    responsavel: 'Murilo Cunha',
    prazo: '2026-09-15',
  },
  {
    titulo: 'Validar formulario de cadastro',
    prioridade: 'alta',
    status: 'revisao',
    responsavel: 'Kevin Lima',
    prazo: '2026-09-21',
  },
  {
    titulo: 'Implementar filtro na listagem',
    prioridade: 'media',
    status: 'andamento',
    responsavel: 'Murilo Cunha',
    prazo: '2026-09-28',
  },
  {
    titulo: 'Adicionar comentarios na demanda',
    prioridade: 'baixa',
    status: 'concluida',
    responsavel: 'Joao Victor',
    prazo: '2026-09-18',
  },
  {
    titulo: 'Ajustar responsividade do menu',
    prioridade: 'baixa',
    status: 'cancelada',
    responsavel: 'Gabriel Passarela',
    prazo: '2026-09-20',
  },
  {
    titulo: 'Configurar servidor Node.js',
    prioridade: 'alta',
    status: 'concluida',
    responsavel: 'Arthur de Senna',
    prazo: '2026-09-19',
  },
  {
    titulo: 'Revisar regras de senha',
    prioridade: 'media',
    status: 'aberta',
    responsavel: 'Gabriel Passarela',
    prazo: '2026-09-23',
  },
  {
    titulo: 'Testar cancelamento de demanda',
    prioridade: 'critica',
    status: 'andamento',
    responsavel: 'Joao Victor',
    prazo: '2026-09-24',
  },
  {
    titulo: 'Padronizar mensagens de erro',
    prioridade: 'alta',
    status: 'aberta',
    responsavel: 'Kevin Lima',
    prazo: '2026-10-05',
  },
  {
    titulo: 'Revisar paleta de cores',
    prioridade: 'baixa',
    status: 'revisao',
    responsavel: 'Murilo Cunha',
    prazo: '2026-10-10',
  },
];

// Campos da barra de filtros
const campoBusca = document.querySelector('#busca-dashboard');
const campoResponsavel = document.querySelector('#filtro-responsavel');
const campoPrioridade = document.querySelector('#filtro-prioridade-dashboard');

// Elementos dos cards, onde os números vão ser escritos
const valorTotal = document.querySelector('#valor-total');
const valorAbertas = document.querySelector('#valor-abertas');
const valorAndamento = document.querySelector('#valor-andamento');
const valorRevisao = document.querySelector('#valor-revisao');
const valorConcluidas = document.querySelector('#valor-concluidas');
const valorCanceladas = document.querySelector('#valor-canceladas');
const valorCriticas = document.querySelector('#valor-criticas');
const valorPrazo = document.querySelector('#valor-prazo');
const textoContagem = document.querySelector('#contagem-filtro');

// Função principal: roda toda vez que a busca ou um dos filtros muda, e sempre
// que a página carrega pela primeira vez (chamada lá no final do arquivo).
function aplicarFiltros() {
  const textoBusca = campoBusca.value.trim().toLowerCase();
  const responsavelEscolhido = campoResponsavel.value;
  const prioridadeEscolhida = campoPrioridade.value;

  // Contadores de cada indicador do dashboard, começando todos zerados
  let total = 0;
  let abertas = 0;
  let andamento = 0;
  let revisao = 0;
  let concluidas = 0;
  let canceladas = 0;
  let criticasEmAberto = 0;
  let proximasDoPrazo = 0;

  // Data de hoje, sem hora, e a data de 7 dias a partir de hoje - usadas pra
  // saber se uma demanda está "próxima do prazo"
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const seteDiasDepois = new Date(hoje);
  seteDiasDepois.setDate(seteDiasDepois.getDate() + 7);

  demandas.forEach(function (demanda) {
    const bateComBusca =
      demanda.titulo.toLowerCase().includes(textoBusca) ||
      demanda.responsavel.toLowerCase().includes(textoBusca);

    const bateComResponsavel =
      responsavelEscolhido === '' || responsavelEscolhido === demanda.responsavel;
    const bateComPrioridade =
      prioridadeEscolhida === '' || prioridadeEscolhida === demanda.prioridade;

    // A demanda só entra na contagem se passar nos três critérios ao mesmo tempo
    if (bateComBusca && bateComResponsavel && bateComPrioridade) {
      total = total + 1;

      if (demanda.status === 'aberta') {
        abertas = abertas + 1;
      }

      if (demanda.status === 'andamento') {
        andamento = andamento + 1;
      }

      if (demanda.status === 'revisao') {
        revisao = revisao + 1;
      }

      if (demanda.status === 'concluida') {
        concluidas = concluidas + 1;
      }

      if (demanda.status === 'cancelada') {
        canceladas = canceladas + 1;
      }

      if (demanda.prioridade === 'critica' && demanda.status === 'aberta') {
        criticasEmAberto = criticasEmAberto + 1;
      }

      const dataDoPrazo = new Date(demanda.prazo + 'T00:00:00');
      const aindaNaoFinalizada = demanda.status !== 'concluida' && demanda.status !== 'cancelada';

      if (aindaNaoFinalizada && dataDoPrazo >= hoje && dataDoPrazo <= seteDiasDepois) {
        proximasDoPrazo = proximasDoPrazo + 1;
      }
    }
  });

  // Escreve os números calculados em cada card
  valorTotal.innerText = total;
  valorAbertas.innerText = abertas;
  valorAndamento.innerText = andamento;
  valorRevisao.innerText = revisao;
  valorConcluidas.innerText = concluidas;
  valorCanceladas.innerText = canceladas;
  valorCriticas.innerText = criticasEmAberto;
  valorPrazo.innerText = proximasDoPrazo;

  textoContagem.innerText =
    'Mostrando ' + total + ' de ' + demandas.length + ' demandas cadastradas.';
}

// "Ouvintes" de evento: toda vez que a pessoa digita na busca ou muda um dos
// selects, os cards são recalculados.

// Um cuidado especial na busca: se a pessoa já tiver um responsável selecionado
// no filtro e começar a digitar um nome diferente na busca, os dois filtros iam
// "brigar" entre si (a busca só acha o que também bate com o responsável
// escolhido) e a tabela ficaria sempre zerada, sem a pessoa entender o porquê.
// Por isso, toda vez que a busca é usada, o filtro de responsável é limpo antes.

function buscarPorNome() {
  campoResponsavel.value = '';
  aplicarFiltros();
}

campoBusca.addEventListener('input', buscarPorNome);
campoResponsavel.addEventListener('change', aplicarFiltros);
campoPrioridade.addEventListener('change', aplicarFiltros);

// Roda uma vez assim que a página carrega, pra já mostrar os totais completos
aplicarFiltros();
