// Autor: Joao Victor Nunes Soares
//
// Comportamento e validações em JavaScript da tela de Detalhes da Demanda
//
// O que foi implementado:
// - validação do campo de comentário (obrigatório, com tamanho mínimo);
// - ao enviar um comentário válido, ele é adicionado na lista da tela na hora,
//   sem precisar recarregar a página;
// - confirmação antes de cancelar uma demanda, pra evitar cancelamento sem
//   querer num clique errado.

const COMENTARIO_MIN = 5;

// --- Parte 1: validação e envio do comentário ---

const formularioComentario = document.querySelector('#formulario-comentario');
const campoComentario = document.querySelector('#comentario');
const erroComentario = document.querySelector('#erroComentario');
const listaComentarios = document.querySelector('#lista-comentarios');

function mostrarErro(campo, elementoErro, mensagem) {
  campo.classList.add('campo-invalido');
  elementoErro.innerText = mensagem;
}

function limparErro() {
  campoComentario.classList.remove('campo-invalido');
  erroComentario.innerText = '';
}

formularioComentario.addEventListener('submit', function (event) {
  event.preventDefault(); // impede o comportamento padrão de recarregar a página

  limparErro();

  const comentario = campoComentario.value.trim();

  // se a regra falhar.
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
  }

  if (!formularioValido) {
    return;
  }

  // Cria um novo <li> com o texto digitado e coloca no final da lista
  const novoComentario = document.createElement('li');
  novoComentario.innerText = comentario;
  listaComentarios.appendChild(novoComentario);

  // Limpa o campo depois de "enviar", pra ficar pronto pro próximo comentário
  campoComentario.value = '';
});

// --- Parte 2: confirmação antes de cancelar a demanda ---

const botaoCancelarDemanda = document.querySelector('#botao-cancelar-demanda');

botaoCancelarDemanda.addEventListener('click', function () {
  // confirm() abre uma caixa de diálogo nativa do navegador com "OK" e "Cancelar".
  // Só seguimos em frente se a pessoa confirmar clicando em "OK".
  const confirmou = confirm(
    'Tem certeza que deseja cancelar esta demanda? Essa ação não pode ser desfeita.',
  );

  if (confirmou) {
    // A regra de negócio completa (registrar no histórico, impedir cancelar uma
    // demanda já concluída, etc.) será implementada quando o backend existir.
    alert(
      'Demanda cancelada! (a atualização real no banco de dados será feita quando o backend estiver pronto)',
    );
  }
});
