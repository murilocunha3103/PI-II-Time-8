// Autor: Gabriel Passarela Silva
//
// Validações em JavaScript da tela de Login (Reunião 3).
//
// Regras implementadas, seguindo o item 2.1 da pauta:
// - e-mail obrigatório e em formato válido;
// - senha obrigatória, com regras de segurança definidas pela equipe: no mínimo
//   8 caracteres, com pelo menos 1 letra maiúscula, 1 minúscula, 1 número e 1
//   caractere especial;
// - mensagens de erro claras, exibidas embaixo de cada campo;
// - feedback em tempo real na senha (a lista de regras vai ficando verde conforme
//   a pessoa digita);
// - impedir o envio do formulário enquanto houver algum campo inválido.

const formulario = document.querySelector("#formulario-login");
const campoEmail = document.querySelector("#email");
const campoSenha = document.querySelector("#senha");

const erroEmail = document.querySelector("#erroEmail");
const erroSenha = document.querySelector("#erroSenha");

const regraTamanho = document.querySelector("#regra-tamanho");
const regraMaiuscula = document.querySelector("#regra-maiuscula");
const regraMinuscula = document.querySelector("#regra-minuscula");
const regraNumero = document.querySelector("#regra-numero");
const regraEspecial = document.querySelector("#regra-especial");

// Expressões regulares usadas nas validações. Cada uma testa uma regra separada.
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_MAIUSCULA = /[A-Z]/;
const REGEX_MINUSCULA = /[a-z]/;
const REGEX_NUMERO = /[0-9]/;
const REGEX_ESPECIAL = /[^A-Za-z0-9]/;

function mostrarErro(campo, elementoErro, mensagem) {
    campo.classList.add("campo-invalido");
    elementoErro.innerText = mensagem;
}

function limparErros() {
    campoEmail.classList.remove("campo-invalido");
    campoSenha.classList.remove("campo-invalido");
    erroEmail.innerText = "";
    erroSenha.innerText = "";
}

// Atualiza a lista de regras da senha em tempo real, conforme a pessoa digita
campoSenha.addEventListener("input", function () {
    const valor = campoSenha.value;

    if (valor.length >= 8) {
        regraTamanho.classList.add("regra-atendida");
    } else {
        regraTamanho.classList.remove("regra-atendida");
    }

    if (REGEX_MAIUSCULA.test(valor)) {
        regraMaiuscula.classList.add("regra-atendida");
    } else {
        regraMaiuscula.classList.remove("regra-atendida");
    }

    if (REGEX_MINUSCULA.test(valor)) {
        regraMinuscula.classList.add("regra-atendida");
    } else {
        regraMinuscula.classList.remove("regra-atendida");
    }

    if (REGEX_NUMERO.test(valor)) {
        regraNumero.classList.add("regra-atendida");
    } else {
        regraNumero.classList.remove("regra-atendida");
    }

    if (REGEX_ESPECIAL.test(valor)) {
        regraEspecial.classList.add("regra-atendida");
    } else {
        regraEspecial.classList.remove("regra-atendida");
    }
});

formulario.addEventListener("submit", function (event) {
    event.preventDefault(); // impede o comportamento padrão de recarregar a página

    limparErros();

    const email = campoEmail.value.trim();
    const senha = campoSenha.value;

    let formularioValido = true;

    if (email === "") {
        mostrarErro(campoEmail, erroEmail, "O e-mail é obrigatório.");
        formularioValido = false;
    } else if (!REGEX_EMAIL.test(email)) {
        mostrarErro(campoEmail, erroEmail, "Digite um e-mail em um formato válido (ex: nome@dominio.com).");
        formularioValido = false;
    }

    if (senha === "") {
        mostrarErro(campoSenha, erroSenha, "A senha é obrigatória.");
        formularioValido = false;
    } else if (
        senha.length < 8
        || !REGEX_MAIUSCULA.test(senha)
        || !REGEX_MINUSCULA.test(senha)
        || !REGEX_NUMERO.test(senha)
        || !REGEX_ESPECIAL.test(senha)
    ) {
        mostrarErro(campoSenha, erroSenha, "A senha não atende a todos os requisitos listados abaixo.");
        formularioValido = false;
    }

    if (!formularioValido) {
        return;
    }

    // Ainda não existe backend de autenticação nesta etapa do projeto - isso será
    // implementado quando o login for conectado à API, nas próximas reuniões.
    alert("Login validado com sucesso! (a autenticação real será implementada quando o backend estiver pronto)");
});
