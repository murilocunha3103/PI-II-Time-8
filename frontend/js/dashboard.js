// Autor: Arthur de Senna Nardi Cortina

// Comportamento em JavaScript da tela de Dashboard (Reunião 5).
//
// Na Reunião 3 esta tela calculava os indicadores a partir de uma lista temporária de demandas
// escrita dentro do próprio arquivo. Agora os indicadores vêm da API (GET /dashboard), que os
// calcula com os dados do banco de dados. Cada usuário vê apenas os números dos projetos que
// enxerga (o Administrador vê todos).
//
// Esta tela usa três arquivos de apoio, carregados antes dela no HTML:
//   - sessao.js: sessão do usuário (login), mensagens e formatação de datas;
//   - api.js: as chamadas para a API (buscarDashboardApi, listarUsuariosApi, listarProjetosApi).

// Campos da barra de filtros
const campoBusca = document.querySelector('#busca-dashboard');
const campoProjeto = document.querySelector('#filtro-projeto');
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

// Listas de demandas críticas em aberto e de demandas próximas do prazo
const listaCriticas = document.querySelector('#lista-criticas');
const listaPrazo = document.querySelector('#lista-prazo');

// Guarda qual foi a última consulta feita. Se uma resposta antiga chegar depois de uma mais nova
// (por exemplo, a pessoa digitou rápido), ela é descartada.
let numeroDaConsulta = 0;
let temporizadorBusca = null;

// Escreve no card o valor de um indicador que vem como objeto { nome: quantidade }.
// Ex.: preencherCard('#valor-prioridade-alta', dados.porPrioridade['Alta'])
function escreverNumero(seletor, valor) {
  document.querySelector(seletor).textContent = valor === undefined ? 0 : valor;
}

// Monta uma lista (críticas ou próximas do prazo) com um link para os detalhes de cada demanda
function preencherLista(elementoLista, demandas, formatarDetalhe) {
  elementoLista.innerHTML = '';

  if (demandas.length === 0) {
    elementoLista.innerHTML = '<li class="detalhe-item">Nenhuma demanda nesta situação.</li>';
    return;
  }

  demandas.forEach(function (demanda) {
    elementoLista.innerHTML +=
      '<li>' +
      '<a href="demanda-detalhes.html?id=' + demanda.id + '">' + escaparHtml(demanda.titulo) + '</a>' +
      '<span class="detalhe-item">' + escaparHtml(formatarDetalhe(demanda)) + '</span>' +
      '</li>';
  });
}

// Escreve todos os números recebidos da API nos cards e nas listas
function mostrarIndicadores(dados) {
  valorTotal.textContent = dados.totalDemandas;
  valorAbertas.textContent = dados.porStatus['Aberta'];
  valorAndamento.textContent = dados.porStatus['Em andamento'];
  valorRevisao.textContent = dados.porStatus['Em revisão'];
  valorConcluidas.textContent = dados.porStatus['Concluída'];
  valorCanceladas.textContent = dados.porStatus['Cancelada'];
  valorCriticas.textContent = dados.criticasEmAberto.quantidade;
  valorPrazo.textContent = dados.proximasDoPrazo.quantidade;

  escreverNumero('#valor-prioridade-critica', dados.porPrioridade['Crítica']);
  escreverNumero('#valor-prioridade-alta', dados.porPrioridade['Alta']);
  escreverNumero('#valor-prioridade-media', dados.porPrioridade['Média']);
  escreverNumero('#valor-prioridade-baixa', dados.porPrioridade['Baixa']);

  escreverNumero('#valor-tipo-tarefa', dados.porTipo['Tarefa']);
  escreverNumero('#valor-tipo-defeito', dados.porTipo['Defeito']);
  escreverNumero('#valor-tipo-melhoria', dados.porTipo['Melhoria']);
  escreverNumero('#valor-tipo-documentacao', dados.porTipo['Documentação']);

  preencherLista(listaCriticas, dados.criticasEmAberto.demandas, function (demanda) {
    return demanda.projeto.nome + ' | Responsável: ' + (demanda.responsavel ? demanda.responsavel.nome : 'Não atribuído');
  });

  preencherLista(listaPrazo, dados.proximasDoPrazo.demandas, function (demanda) {
    return demanda.projeto.nome + ' | Prazo: ' + formatarData(demanda.prazo) + ' | ' + demanda.status;
  });

  textoContagem.textContent = 'Indicadores calculados sobre ' + dados.totalDemandas + ' demanda(s).';
}

// Função principal: roda toda vez que a busca ou um dos filtros muda, e quando a página carrega.
// Lê os filtros da tela, pede os indicadores à API e escreve o resultado nos cards.
async function carregarDashboard() {
  numeroDaConsulta = numeroDaConsulta + 1;
  const consultaAtual = numeroDaConsulta;

  try {
    const dados = await buscarDashboardApi({
      busca: campoBusca.value.trim(),
      projeto: campoProjeto.value,
      responsavel: campoResponsavel.value,
      prioridade: campoPrioridade.value,
    });

    if (consultaAtual !== numeroDaConsulta) {
      return; // chegou uma resposta velha: ignora
    }

    limparMensagem();
    mostrarIndicadores(dados);
  } catch (erro) {
    mostrarErroDaApi(erro);
  }
}

// Preenche as opções dos filtros de projeto e de responsável com os dados do banco
async function carregarOpcoesDosFiltros() {
  try {
    const projetos = await listarProjetosApi();
    projetos.forEach(function (projeto) {
      campoProjeto.innerHTML += '<option value="' + projeto.id + '">' + escaparHtml(projeto.nome) + '</option>';
    });

    const usuarios = await listarUsuariosApi();
    usuarios.forEach(function (usuario) {
      campoResponsavel.innerHTML += '<option value="' + usuario.id + '">' + escaparHtml(usuario.nome) + '</option>';
    });
  } catch (erro) {
    mostrarErroDaApi(erro);
  }
}

// "Ouvintes" de evento: toda vez que a pessoa digita na busca ou muda um dos selects, os
// indicadores são pedidos de novo à API.

// Um cuidado especial na busca: a busca também procura pelo nome do responsável. Se a pessoa já
// tiver um responsável selecionado no filtro e começar a digitar um nome diferente, os dois
// filtros iam "brigar" entre si e tudo ficaria zerado. Por isso, toda vez que a busca é usada, o
// filtro de responsável é limpo antes. A espera de 0,3 s evita pedir à API a cada letra digitada.
function buscarPorNome() {
  campoResponsavel.value = '';
  clearTimeout(temporizadorBusca);
  temporizadorBusca = setTimeout(carregarDashboard, 300);
}

campoBusca.addEventListener('input', buscarPorNome);
campoProjeto.addEventListener('change', carregarDashboard);
campoResponsavel.addEventListener('change', carregarDashboard);
campoPrioridade.addEventListener('change', carregarDashboard);

// Roda uma vez assim que a página carrega: só continua se houver um usuário logado
if (exigirLogin()) {
  carregarOpcoesDosFiltros();
  carregarDashboard();
}
