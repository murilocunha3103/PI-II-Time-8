// Autor: Kevin Ezequiel e Gabriel Passarela Silva       
//
// Validações em JavaScript e integração com a API da tela de Cadastro/Edição de Demanda
// (Reuniões 3 e 5).
//
// Esta tela serve para DUAS coisas, conforme a URL:
// - demanda-form.html          -> CADASTRAR uma nova demanda (POST /demandas)
// - demanda-form.html?id=3     -> EDITAR a demanda 3 (PUT /demandas/3). Nesse caso o formulário já
//                                 abre preenchido com os dados que estão no banco, e o projeto não
//                                 pode ser trocado.
//
// O que a tela faz:
// - preenche a lista de projetos (GET /projetos) e, ao escolher o projeto, a lista de responsáveis,
//   que são só os usuários vinculados àquele projeto (GET /usuarios?projeto=...);
// - mantém as validações da Reunião 3 (elas NÃO substituem as validações da API):
//   título obrigatório com tamanho mínimo e máximo; descrição obrigatória com tamanho mínimo;
//   prazo obrigatório e que não pode ser uma data no passado;
// - confere se o prazo é feriado nacional, pela API (GET /feriados/verificar), e avisa o usuário
//   já na hora de escolher a data. A API confere de novo ao salvar;
// - envia os dados para a API e mostra na tela os erros que ela devolver (400, 403, 404...);
// - só o Administrador e o Líder de Projeto criam e editam demandas: para o Membro da Equipe, o
//   formulário é escondido e uma mensagem explica o motivo.
//
// Esta tela usa dois arquivos de apoio, carregados antes dela no HTML: sessao.js (login, mensagens)
// e api.js (as chamadas para a API).

const formulario = document.querySelector("#formulario-demanda");

const campoTitulo = document.querySelector("#titulo");
const campoDescricao = document.querySelector("#descricao");
const campoProjeto = document.querySelector("#projeto");
const campoTipo = document.querySelector("#tipo");
const campoPrioridade = document.querySelector("#prioridade");
const campoResponsavel = document.querySelector("#responsavel");
const campoPrazo = document.querySelector("#prazo");

const erroTitulo = document.querySelector("#erroTitulo");
const erroDescricao = document.querySelector("#erroDescricao");
const erroProjeto = document.querySelector("#erroProjeto");
const erroPrazo = document.querySelector("#erroPrazo");

const mensagemSucesso = document.querySelector("#mensagem-sucesso");
const tituloPagina = document.querySelector("#titulo-pagina");
const botaoSalvar = document.querySelector("#botao-salvar");
const linkCancelar = document.querySelector("#link-cancelar");

// Regras de tamanho, num só lugar, pra facilitar caso o grupo queira ajustar depois
const TITULO_MIN = 5;
const TITULO_MAX = 100;
const DESCRICAO_MIN = 10;
const DESCRICAO_MAX = 2000;

// Descobre se é cadastro ou edição: se a URL tem ?id=..., é edição
const parametrosDaUrl = new URLSearchParams(window.location.search);
const idEdicao = parametrosDaUrl.get("id");
const modoEdicao = idEdicao !== null;

// Dados da demanda como estavam no banco (só existem na edição). Servem para saber o que mudou.
let demandaOriginal = null;

// Mesmo padrão usado no Exemplo03 da aula: uma função pra marcar erro, recebendo
// o campo e o elemento de erro diretamente.
function mostrarErro(campo, elementoErro, mensagem) {
    campo.classList.add("campo-invalido");
    elementoErro.innerText = mensagem;
}

function limparErros() {
    campoTitulo.classList.remove("campo-invalido");
    campoDescricao.classList.remove("campo-invalido");
    campoProjeto.classList.remove("campo-invalido");
    campoPrazo.classList.remove("campo-invalido");

    erroTitulo.innerText = "";
    erroDescricao.innerText = "";
    erroProjeto.innerText = "";
    erroPrazo.innerText = "";
}

// --- Parte 1: preencher as listas e, na edição, os campos ---

// Coloca no <select> a opção que corresponde ao texto vindo da API, ignorando acento e maiúscula
// (o <option> "documentacao" corresponde ao "Documentação" que a API devolve)
function selecionarOpcao(select, textoDaApi) {
    for (const opcao of select.options) {
        if (semAcentoMinusculo(opcao.value) === semAcentoMinusculo(textoDaApi)) {
            select.value = opcao.value;
        }
    }
}

// Preenche a lista de projetos com os projetos que o usuário enxerga
async function carregarProjetos() {
    const projetos = await listarProjetosApi();

    projetos.forEach(function (projeto) {
        campoProjeto.innerHTML += "<option value=\"" + projeto.id + "\">" + escaparHtml(projeto.nome) + "</option>";
    });
}

// Preenche a lista de responsáveis com os usuários vinculados ao projeto escolhido.
// A primeira opção ("Sem responsável definido") sempre existe, pois o responsável é opcional.
async function carregarResponsaveis(projetoId, responsavelSelecionado) {
    campoResponsavel.innerHTML = "<option value=\"\">Sem responsável definido</option>";

    if (projetoId === "") {
        return;
    }

    const usuarios = await listarUsuariosApi(projetoId);

    usuarios.forEach(function (usuario) {
        campoResponsavel.innerHTML += "<option value=\"" + usuario.id + "\">" + escaparHtml(usuario.nome) + "</option>";
    });

    if (responsavelSelecionado) {
        campoResponsavel.value = String(responsavelSelecionado);
    }
}

// Ao trocar o projeto, a lista de responsáveis muda (cada projeto tem seus próprios usuários)
campoProjeto.addEventListener("change", async function () {
    try {
        await carregarResponsaveis(campoProjeto.value, null);
    } catch (erro) {
        mostrarErroDaApi(erro);
    }
});

// Na edição: busca a demanda no banco e preenche o formulário com os dados dela
async function carregarDemandaParaEdicao() {
    const demanda = await buscarDemandaApi(idEdicao);

    // A API informa se este usuário pode editar esta demanda (perfil e status permitem?)
    if (!demanda.acoes.podeEditar) {
        formulario.style.display = "none";
        mostrarMensagem("erro", "Esta demanda não pode ser editada: ela já foi concluída ou cancelada, ou o seu perfil não permite editar.");
        return;
    }

    demandaOriginal = demanda;

    tituloPagina.textContent = "Editar demanda #" + demanda.id;
    botaoSalvar.textContent = "Salvar alterações";
    linkCancelar.href = "demanda-detalhes.html?id=" + demanda.id;

    campoTitulo.value = demanda.titulo;
    campoDescricao.value = demanda.descricao;
    selecionarOpcao(campoTipo, demanda.tipo);
    selecionarOpcao(campoPrioridade, demanda.prioridade);
    campoPrazo.value = demanda.prazo === null ? "" : demanda.prazo;

    // O projeto de uma demanda já cadastrada não pode ser trocado
    campoProjeto.value = String(demanda.projeto.id);
    campoProjeto.disabled = true;

    await carregarResponsaveis(String(demanda.projeto.id), demanda.responsavel ? demanda.responsavel.id : null);
}

// --- Parte 2: validação do prazo (data no passado e feriado nacional) ---

// Confere, sem falar com a API, se o prazo foi preenchido e se não está no passado.
// Na EDIÇÃO, se o prazo não foi mexido, não vale a regra do passado: assim ainda é possível editar o
// título de uma demanda atrasada sem precisar mudar o prazo dela.
// Devolve true se o prazo está correto.
function validarPrazoNaTela() {
    const prazo = campoPrazo.value;

    if (prazo === "") {
        mostrarErro(campoPrazo, erroPrazo, "O prazo de finalização é obrigatório.");
        return false;
    }

    const prazoNaoMudou = modoEdicao && demandaOriginal !== null && prazo === demandaOriginal.prazo;

    if (!prazoNaoMudou) {
        const dataEscolhida = new Date(prazo + "T00:00:00");
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0); // zera a hora, pra comparar só o dia

        if (dataEscolhida < hoje) {
            mostrarErro(campoPrazo, erroPrazo, "O prazo não pode ser uma data no passado.");
            return false;
        }
    }

    return true;
}

// Pergunta à API se o prazo é feriado nacional. Devolve true se NÃO for feriado (ou se não foi
// possível verificar agora: nesse caso a API confere de novo na hora de salvar).
async function prazoNaoEhFeriado() {
    const prazoNaoMudou = modoEdicao && demandaOriginal !== null && campoPrazo.value === demandaOriginal.prazo;

    if (prazoNaoMudou) {
        return true;
    }

    try {
        const resultado = await verificarFeriadoApi(campoPrazo.value);

        if (resultado.feriado) {
            mostrarErro(campoPrazo, erroPrazo, "O prazo não pode ser um feriado nacional (" + resultado.nome + ").");
            return false;
        }
    } catch (erro) {
        // Sem resposta da API de feriados: segue em frente; o servidor confere de novo ao salvar
    }

    return true;
}

// Assim que a pessoa escolhe uma data, já avisa se ela está no passado ou se é feriado
campoPrazo.addEventListener("change", async function () {
    campoPrazo.classList.remove("campo-invalido");
    erroPrazo.innerText = "";

    if (campoPrazo.value !== "" && validarPrazoNaTela()) {
        await prazoNaoEhFeriado();
    }
});

// --- Parte 3: validação do formulário e envio para a API ---

formulario.addEventListener("submit", async function (event) {
    event.preventDefault(); // impede o comportamento padrão de recarregar a página

    limparErros();
    limparMensagem();
    mensagemSucesso.style.display = "none";

    const titulo = campoTitulo.value.trim();
    const descricao = campoDescricao.value.trim();

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
    } else if (descricao.length > DESCRICAO_MAX) {
        mostrarErro(campoDescricao, erroDescricao, "A descrição pode ter no máximo " + DESCRICAO_MAX + " caracteres.");
        formularioValido = false;
    }

    if (campoProjeto.value === "") {
        mostrarErro(campoProjeto, erroProjeto, "Escolha o projeto da demanda.");
        formularioValido = false;
    }

    if (!validarPrazoNaTela()) {
        formularioValido = false;
    }

    if (!formularioValido) {
        return;
    }

    // Confere o feriado antes de enviar (a API também confere)
    if (!(await prazoNaoEhFeriado())) {
        return;
    }

    // Monta o objeto que a API espera. O responsável é opcional (em branco = null).
    const dados = {
        titulo: titulo,
        descricao: descricao,
        tipo: campoTipo.value,
        prioridade: campoPrioridade.value,
        responsavelId: campoResponsavel.value === "" ? null : Number(campoResponsavel.value),
        prazo: campoPrazo.value,
    };

    botaoSalvar.disabled = true; // evita clicar duas vezes enquanto espera a API

    try {
        let demandaSalva;

        if (modoEdicao) {
            demandaSalva = await atualizarDemandaApi(idEdicao, dados);
        } else {
            dados.projetoId = Number(campoProjeto.value);
            demandaSalva = await cadastrarDemandaApi(dados);
        }

        // Deu certo: avisa e abre a tela de detalhes da demanda salva
        mensagemSucesso.style.display = "block";
        setTimeout(function () {
            irPara("demanda-detalhes.html?id=" + demandaSalva.id);
        }, 1000);
    } catch (erro) {
        // Mostra os problemas devolvidos pela API (400: dados inválidos, 403: sem permissão...)
        mostrarErroDaApi(erro);
        botaoSalvar.disabled = false;
    }
});

// --- Início: roda assim que a página carrega, só se houver um usuário logado ---

async function iniciarFormulario() {
    // O Membro da Equipe não cria nem edita demandas: esconde o formulário e explica o motivo
    if (!podeCriarDemanda()) {
        formulario.style.display = "none";
        mostrarMensagem("erro", "O seu perfil (" + obterUsuario().perfil + ") não permite criar nem editar demandas.");
        return;
    }

    try {
        await carregarProjetos();

        if (modoEdicao) {
            await carregarDemandaParaEdicao();
        }
    } catch (erro) {
        formulario.style.display = "none";
        mostrarErroDaApi(erro);
    }
}

if (exigirLogin()) {
    iniciarFormulario();
}