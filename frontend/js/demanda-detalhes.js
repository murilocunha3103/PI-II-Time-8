// Autor: Joao Victor Nunes Soares
//
// Comportamento e integração com a API da tela de Detalhes da Demanda (Reuniões 3 e 5)
//
// O que esta tela faz:
// - lê da URL qual demanda abrir (demanda-detalhes.html?id=3) e busca os dados dela na API
//   (GET /demandas/:id), que lê do banco de dados;
// - mostra o histórico de alterações (GET /demandas/:id/historico) e os comentários;
// - registra novos comentários (POST /demandas/:id/comentarios), com a validação da Reunião 3
//   (obrigatório, com tamanho mínimo) e o limite de tamanho do banco;
// - atualiza o status da demanda, seguindo o ciclo de vida (PATCH /demandas/:id/status);
// - cancela a demanda depois de uma confirmação (POST /demandas/:id/cancelar). O cancelamento é
//   lógico: a demanda continua no banco, apenas com o status Cancelada;
// - mostra só os botões que o perfil do usuário pode usar. A API devolve o campo "acoes" com o que é
//   permitido (podeEditar, podeCancelar e os status para os quais pode mudar). Esconder o botão é
//   apenas para a tela ficar mais clara: quem realmente impede é a API.
//
// Esta tela usa dois arquivos de apoio, carregados antes dela no HTML: sessao.js (login, mensagens
// e datas) e api.js (as chamadas para a API).

const COMENTARIO_MIN = 5;
const COMENTARIO_MAX = 1000;

// Descobre o id da demanda na URL. URLSearchParams separa os parâmetros depois do "?".
const parametrosDaUrl = new URLSearchParams(window.location.search);
const idDemanda = parametrosDaUrl.get('id');

// Dados da demanda que está aberta na tela (preenchidos ao carregar)
let demandaAtual = null;

// Elementos da demanda
const cardDemanda = document.querySelector('#card-demanda');
const tituloDemanda = document.querySelector('#titulo-demanda');
const etiquetasDemanda = document.querySelector('#etiquetas-demanda');
const infoProjeto = document.querySelector('#info-projeto');
const infoResponsavel = document.querySelector('#info-responsavel');
const infoDatas = document.querySelector('#info-datas');
const textoDescricao = document.querySelector('#texto-descricao');

// Botões e painel de status
const botaoAtualizarStatus = document.querySelector('#botao-atualizar-status');
const botaoEditarDemanda = document.querySelector('#botao-editar-demanda');
const botaoCancelarDemanda = document.querySelector('#botao-cancelar-demanda');
const painelStatus = document.querySelector('#painel-status');
const selectNovoStatus = document.querySelector('#novo-status');
const botaoConfirmarStatus = document.querySelector('#botao-confirmar-status');
const botaoFecharStatus = document.querySelector('#botao-fechar-status');

// Listas e formulário de comentário
const listaHistorico = document.querySelector('#lista-historico');
const listaComentarios = document.querySelector('#lista-comentarios');
const formularioComentario = document.querySelector('#formulario-comentario');
const campoComentario = document.querySelector('#comentario');
const erroComentario = document.querySelector('#erroComentario');

// --- Parte 1: mostrar a demanda, o histórico e os comentários ---

// Escreve os dados da demanda na tela e mostra apenas os botões permitidos para o usuário
function mostrarDemanda(demanda) {
  demandaAtual = demanda;

  tituloDemanda.textContent = demanda.titulo;
  etiquetasDemanda.innerHTML =
    '<span class="' + classeEtiqueta(demanda.prioridade) + '">' + escaparHtml(demanda.prioridade) + '</span>' +
    '<span class="' + classeEtiqueta(demanda.status) + '">' + escaparHtml(demanda.status) + '</span>';

  infoProjeto.textContent = 'Projeto: ' + demanda.projeto.nome + '  |  Tipo: ' + demanda.tipo;
  infoResponsavel.textContent = 'Responsável: ' + (demanda.responsavel ? demanda.responsavel.nome : 'Não atribuído');
  infoDatas.textContent =
    'Criada em: ' + formatarDataHora(demanda.dataCriacao) +
    '  |  Última atualização: ' + formatarDataHora(demanda.dataAtualizacao) +
    '  |  Prazo: ' + formatarData(demanda.prazo);
  textoDescricao.textContent = demanda.descricao;

  // Botões: cada um só aparece se a API disse que o usuário pode fazer aquela ação
  const podeMudarStatus = demanda.acoes.statusPermitidos.length > 0;
  botaoAtualizarStatus.style.display = podeMudarStatus ? '' : 'none';
  botaoEditarDemanda.style.display = demanda.acoes.podeEditar ? '' : 'none';
  botaoCancelarDemanda.style.display = demanda.acoes.podeCancelar ? '' : 'none';

  // As opções do painel de status são só os status permitidos para este usuário, neste momento
  selectNovoStatus.innerHTML = '';
  demanda.acoes.statusPermitidos.forEach(function (status) {
    selectNovoStatus.innerHTML += '<option value="' + escaparHtml(status.nome) + '">' + escaparHtml(status.nome) + '</option>';
  });

  if (!podeMudarStatus) {
    painelStatus.hidden = true;
  }
}

// Busca os dados da demanda na API e mostra na tela
async function carregarDemanda() {
  try {
    const demanda = await buscarDemandaApi(idDemanda);
    mostrarDemanda(demanda);
  } catch (erro) {
    // Por exemplo, 404: a demanda não existe (ou o usuário não tem acesso ao projeto dela)
    cardDemanda.style.display = 'none';
    mostrarErroDaApi(erro);
  }
}

// Mostra o histórico de alterações, do mais recente para o mais antigo. A API já devolve a frase
// pronta em "mensagem" (por exemplo: "Maria alterou o status da demanda de Aberta para Em andamento.").
async function carregarHistorico() {
  try {
    const registros = await listarHistoricoApi(idDemanda);
    listaHistorico.innerHTML = '';

    if (registros.length === 0) {
      listaHistorico.innerHTML = '<li>Nenhuma alteração registrada ainda.</li>';
      return;
    }

    registros.forEach(function (registro) {
      listaHistorico.innerHTML +=
        '<li>' + escaparHtml(registro.mensagem) +
        '<span class="data-historico">' + formatarDataHora(registro.dataHora) + '</span></li>';
    });
  } catch (erro) {
    listaHistorico.innerHTML = '<li>Não foi possível carregar o histórico.</li>';
  }
}

// Mostra os comentários, do mais antigo para o mais recente
async function carregarComentarios() {
  try {
    const comentarios = await listarComentariosApi(idDemanda);
    listaComentarios.innerHTML = '';

    if (comentarios.length === 0) {
      listaComentarios.innerHTML = '<li>Nenhum comentário ainda. Seja o primeiro a comentar!</li>';
      return;
    }

    comentarios.forEach(function (comentario) {
      listaComentarios.innerHTML +=
        '<li><span class="autor-comentario">' + escaparHtml(comentario.usuario.nome) + ' (' + escaparHtml(comentario.usuario.perfil) + ')</span>' +
        '<span class="data-historico">' + formatarDataHora(comentario.dataHora) + '</span>' +
        '<span class="texto-comentario">' + escaparHtml(comentario.texto) + '</span></li>';
    });
  } catch (erro) {
    listaComentarios.innerHTML = '<li>Não foi possível carregar os comentários.</li>';
  }
}

// --- Parte 2: validação e envio do comentário ---

function mostrarErro(campo, elementoErro, mensagem) {
  campo.classList.add('campo-invalido');
  elementoErro.textContent = mensagem;
}

function limparErro() {
  campoComentario.classList.remove('campo-invalido');
  erroComentario.textContent = '';
}

formularioComentario.addEventListener('submit', async function (event) {
  event.preventDefault(); // impede o comportamento padrão de recarregar a página

  limparErro();
  limparMensagem();

  const comentario = campoComentario.value.trim();

  // Mesma ideia da Reunião 3: uma "flag" que vira false se a regra falhar
  let formularioValido = true;

  if (comentario === '') {
    mostrarErro(campoComentario, erroComentario, 'O comentário não pode ficar vazio.');
    formularioValido = false;
  } else if (comentario.length < COMENTARIO_MIN) {
    mostrarErro(
      campoComentario,
      erroComentario,
      'O comentário precisa ter pelo menos ' + COMENTARIO_MIN + ' caracteres.',
    );
    formularioValido = false;
  } else if (comentario.length > COMENTARIO_MAX) {
    mostrarErro(
      campoComentario,
      erroComentario,
      'O comentário pode ter no máximo ' + COMENTARIO_MAX + ' caracteres.',
    );
    formularioValido = false;
  }

  if (!formularioValido) {
    return;
  }

  try {
    // Envia o comentário para a API, que grava no banco. Quem comentou é o usuário logado.
    await comentarApi(idDemanda, comentario);

    // Limpa o campo depois de enviar, pra ficar pronto pro próximo comentário, e atualiza a lista
    campoComentario.value = '';
    await carregarComentarios();
  } catch (erro) {
    mostrarErroDaApi(erro);
  }
});

// --- Parte 3: atualizar o status da demanda (ciclo de vida) ---

// "Atualizar status" abre (ou fecha) o painel com os status permitidos
botaoAtualizarStatus.addEventListener('click', function () {
  painelStatus.hidden = !painelStatus.hidden;
});

botaoFecharStatus.addEventListener('click', function () {
  painelStatus.hidden = true;
});

botaoConfirmarStatus.addEventListener('click', async function () {
  const novoStatus = selectNovoStatus.value;

  limparMensagem();

  try {
    await atualizarStatusApi(idDemanda, novoStatus);

    painelStatus.hidden = true;
    mostrarMensagem('sucesso', 'Status atualizado para "' + novoStatus + '".');

    // Recarrega a demanda (novo status e novos botões permitidos) e o histórico (nova linha)
    await carregarDemanda();
    await carregarHistorico();
  } catch (erro) {
    mostrarErroDaApi(erro);
  }
});

// --- Parte 4: confirmação antes de cancelar a demanda ---

botaoCancelarDemanda.addEventListener('click', async function () {
  // confirm() abre uma caixa de diálogo nativa do navegador com "OK" e "Cancelar".
  // Só seguimos em frente se a pessoa confirmar clicando em "OK".
  const confirmou = confirm(
    'Tem certeza que deseja cancelar esta demanda? Essa ação não pode ser desfeita.',
  );

  if (!confirmou) {
    return;
  }

  limparMensagem();

  try {
    // A API muda o status para Cancelada (a demanda NÃO é apagada) e registra no histórico
    await cancelarDemandaApi(idDemanda);

    mostrarMensagem('sucesso', 'Demanda cancelada com sucesso.');
    await carregarDemanda();
    await carregarHistorico();
  } catch (erro) {
    mostrarErroDaApi(erro);
  }
});

// "Editar" abre o formulário em modo de edição, com os dados desta demanda
botaoEditarDemanda.addEventListener('click', function () {
  irPara('demanda-form.html?id=' + idDemanda);
});

// --- Início: roda assim que a página carrega, só se houver um usuário logado ---

if (exigirLogin()) {
  if (idDemanda === null) {
    cardDemanda.style.display = 'none';
    mostrarMensagem('erro', 'Nenhuma demanda foi informada. Volte para a listagem e escolha uma demanda.');
  } else {
    carregarDemanda();
    carregarHistorico();
    carregarComentarios();
  }
}
