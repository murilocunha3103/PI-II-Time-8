// Autor: Kevin Eziquiel Lima
//
// Validações em JavaScript da tela de Cadastro/Edição de Demanda (Reunião 3).
//
// Regras implementadas, seguindo o item 2.1 da pauta:
// - título obrigatório, com tamanho mínimo e máximo de caracteres;
// - descrição obrigatória, com tamanho mínimo de caracteres;
// - prazo de finalização obrigatório, e não pode ser uma data no passado;
// - mensagens de erro claras, exibidas embaixo de cada campo;
// - impedir o envio do formulário enquanto houver algum campo inválido.
//
// Os campos "tipo" e "prioridade" não precisam de validação de obrigatoriedade,
// porque são <select> com um valor sempre selecionado por padrão - nunca ficam
// vazios. O campo "responsável" pode ficar em branco de propósito, conforme o
// item 2.2.5 do Documento de Visão (a atribuição pode ser feita depois).

const formulario = document.querySelector("#formulario-demanda");

const campoTitulo = document.querySelector("#titulo");
const campoDescricao = document.querySelector("#descricao");
const campoPrazo = document.querySelector("#prazo");

const erroTitulo = document.querySelector("#erroTitulo");
const erroDescricao = document.querySelector("#erroDescricao");
const erroPrazo = document.querySelector("#erroPrazo");

const mensagemSucesso = document.querySelector("#mensagem-sucesso");

// Regras de tamanho, num só lugar, pra facilitar caso o grupo queira ajustar depois
const TITULO_MIN = 5;
const TITULO_MAX = 100;
const DESCRICAO_MIN = 10;

// Mesmo padrão usado no Exemplo03 da aula: uma função pra marcar erro, recebendo
// o campo e o elemento de erro diretamente.
function mostrarErro(campo, elementoErro, mensagem) {
    campo.classList.add("campo-invalido");
    elementoErro.innerText = mensagem;
}

function limparErros() {
    campoTitulo.classList.remove("campo-invalido");
    campoDescricao.classList.remove("campo-invalido");
    campoPrazo.classList.remove("campo-invalido");

    erroTitulo.innerText = "";
    erroDescricao.innerText = "";
    erroPrazo.innerText = "";
}

formulario.addEventListener("submit", function (event) {
    event.preventDefault(); // impede o comportamento padrão de recarregar a página

    limparErros();
    mensagemSucesso.style.display = "none";

    const titulo = campoTitulo.value.trim();
    const descricao = campoDescricao.value.trim();
    const prazo = campoPrazo.value;

    // Mesmo padrão do slide 25 da aula: uma "flag" que começa true e vira false
    // se qualquer regra falhar. No final, só seguimos em frente se ela continuar true.
    let formularioValido = true;

    if (titulo === "") {
        mostrarErro(campoTitulo, erroTitulo, "O título é obrigatório.");
        formularioValido = false;
    } else if (titulo.length < TITULO_MIN) {
        mostrarErro(campoTitulo, erroTitulo, "O título precisa ter pelo menos " + TITULO_MIN + " caracteres.");
        formularioValido = false;
    } else if (titulo.length > TITULO_MAX) {
        mostrarErro(campoTitulo, erroTitulo, "O título pode ter no máximo " + TITULO_MAX + " caracteres.");
        formularioValido = false;
    }

    if (descricao === "") {
        mostrarErro(campoDescricao, erroDescricao, "A descrição é obrigatória.");
        formularioValido = false;
    } else if (descricao.length < DESCRICAO_MIN) {
        mostrarErro(campoDescricao, erroDescricao, "A descrição precisa ter pelo menos " + DESCRICAO_MIN + " caracteres.");
        formularioValido = false;
    }

    if (prazo === "") {
        mostrarErro(campoPrazo, erroPrazo, "O prazo de finalização é obrigatório.");
        formularioValido = false;
    } else {
        const dataEscolhida = new Date(prazo + "T00:00:00");
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0); // zera a hora, pra comparar só o dia

        if (dataEscolhida < hoje) {
            mostrarErro(campoPrazo, erroPrazo, "O prazo não pode ser uma data no passado.");
            formularioValido = false;
        }
    }

    if (!formularioValido) {
        return;
    }

    mensagemSucesso.style.display = "block";
});
