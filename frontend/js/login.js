// Autor: Gabriel Passarela Silva
//
// Validações em JavaScript e integração com a API da tela de Login (Reuniões 3 e 5).
//
// Reunião 5: depois que os campos passam nas validações abaixo, a tela envia o e-mail e a senha para
// a API (POST /login, função loginApi do arquivo api.js). Se estiverem certos, o token e os dados
// do usuário são guardados na sessão (salvarSessao, do sessao.js) e a pessoa vai para o
// Dashboard. Se a API recusar (e-mail ou senha inválidos, servidor fora do ar...), a mensagem
// recebida é mostrada na tela, acima do formulário.
//
// Regras da Reunião 3, que continuam valendo. As validações da tela NÃO
// substituem as validações da API:
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

const botaoEntrar = document.querySelector(".botao-entrar");

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

    // Campos válidos: agora a API confere o e-mail e a senha no banco de dados
    entrarNoSistema(email, senha);
});

// Envia o login para a API. O botão fica desabilitado enquanto espera a resposta, para a pessoa
// não clicar duas vezes.
async function entrarNoSistema(email, senha) {
    limparMensagem();
    botaoEntrar.disabled = true;

    try {
        const dados = await loginApi(email, senha);

        // Login certo: guarda o token e os dados do usuário e vai para o Dashboard
        salvarSessao(dados.token, dados.usuario);
        irPara("dashboard.html");
    } catch (erro) {
        // Mostra a mensagem enviada pela API (401: e-mail ou senha inválidos, etc.)
        mostrarErroDaApi(erro);
    } finally {
        botaoEntrar.disabled = false;
    }
}

// Se a pessoa já está logada, não precisa ver a tela de login: vai direto para o Dashboard
if (estaLogado()) {
    irPara("dashboard.html");
}

// Se a pessoa foi mandada de volta para cá porque a sessão venceu, avisa o motivo
if (window.location.search.indexOf("aviso=expirada") !== -1) {
    mostrarMensagem("aviso", "Sua sessão expirou. Entre novamente.");
}