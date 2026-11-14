// Autor: Murilo Xavier Sarra da Cunha
//
// Comportamento em JavaScript da tela de Listagem de Demandas (Reuniões 3 e 5).
//
// Na Reunião 3 esta tela só escondia linhas de uma tabela fixa no HTML. Agora a lista vem da API
// (GET /demandas, função listarDemandasApi do arquivo api.js), que lê as demandas do banco de dados.
// Cada vez que a pessoa digita na busca, escolhe um filtro ou muda a ordenação, a tela pede à API a
// lista já filtrada e ordenada e redesenha a tabela, sem recarregar a página.
//
// O que a tela faz:
// - filtros por status, prioridade, tipo, projeto e responsável (podem ser combinados);
// - busca por texto (título, descrição ou nome do responsável);
// - ordenação por prioridade, data de criação, prazo ou status, crescente ou decrescente;
// - opção "Somente as minhas" (as demandas em que o usuário logado é o responsável);
// - cada título é um link para a tela de detalhes (demanda-detalhes.html?id=...);
// - o botão "Nova demanda" só aparece para o Administrador e o Líder de Projeto;
// - erros devolvidos pela API (401, 404...) são mostrados na tela.
//
// Esta tela usa dois arquivos de apoio, carregados antes dela no HTML: sessao.js (login e mensagens)
// e api.js (as chamadas para a API).

const campoBusca = document.querySelector("#busca-demanda");
const selectStatus = document.querySelector("#filtro-status");
const selectPrioridade = document.querySelector("#filtro-prioridade");
const selectTipo = document.querySelector("#filtro-tipo");
const selectProjeto = document.querySelector("#filtro-projeto");
const selectResponsavel = document.querySelector("#filtro-responsavel");
const campoMinhas = document.querySelector("#filtro-minhas");
const selectOrdenarPor = document.querySelector("#ordenar-por");
const selectOrdem = document.querySelector("#ordem-crescente");
const corpoTabela = document.querySelector("#corpo-tabela");
const textoContagem = document.querySelector("#contagem-resultados");
const botaoNovaDemanda = document.querySelector("#botao-nova-demanda");

// Guarda qual foi a última consulta feita. Se uma resposta antiga chegar depois de uma mais nova
// (a pessoa digitou rápido), ela é descartada.
let numeroDaConsulta = 0;
let temporizadorBusca = null;

// Junta tudo o que está escolhido nos filtros num objeto, no formato que a API espera.
// Campos vazios são ignorados pela função montarQuery (api.js).
function lerFiltros() {
    let responsavel = selectResponsavel.value;

    // "Somente as minhas" usa o id do usuário logado como responsável
    if (campoMinhas.checked) {
        responsavel = obterUsuario().id;
    }

    return {
        busca: campoBusca.value.trim(),
        status: selectStatus.value,
        prioridade: selectPrioridade.value,
        tipo: selectTipo.value,
        projeto: selectProjeto.value,
        responsavel: responsavel,
        ordenarPor: selectOrdenarPor.value,
        ordem: selectOrdem.value,
    };
}

// Desenha a tabela com as demandas recebidas da API
function renderizarTabela(demandas) {
    corpoTabela.innerHTML = "";

    if (demandas.length === 0) {
        corpoTabela.innerHTML = "<tr class=\"linha-sem-resultado\"><td colspan=\"8\">Nenhuma demanda encontrada com os filtros aplicados.</td></tr>";
        return;
    }

    demandas.forEach(function (demanda) {
        const responsavel = demanda.responsavel === null ? "Não atribuído" : demanda.responsavel.nome;

        // escaparHtml protege a página caso algum texto (título, nome...) tenha caracteres de HTML
        corpoTabela.innerHTML +=
            "<tr>" +
            "<td><a href=\"demanda-detalhes.html?id=" + demanda.id + "\">" + escaparHtml(demanda.titulo) + "</a></td>" +
            "<td>" + escaparHtml(demanda.tipo) + "</td>" +
            "<td><span class=\"" + classeEtiqueta(demanda.prioridade) + "\">" + escaparHtml(demanda.prioridade) + "</span></td>" +
            "<td><span class=\"" + classeEtiqueta(demanda.status) + "\">" + escaparHtml(demanda.status) + "</span></td>" +
            "<td>" + escaparHtml(demanda.projeto.nome) + "</td>" +
            "<td>" + escaparHtml(responsavel) + "</td>" +
            "<td>" + formatarData(demanda.dataCriacao) + "</td>" +
            "<td>" + formatarData(demanda.prazo) + "</td>" +
            "</tr>";
    });
}

// Função principal: roda toda vez que a busca ou um filtro muda, e quando a página carrega.
async function carregarDemandas() {
    numeroDaConsulta = numeroDaConsulta + 1;
    const consultaAtual = numeroDaConsulta;

    try {
        const demandas = await listarDemandasApi(lerFiltros());

        if (consultaAtual !== numeroDaConsulta) {
            return; // chegou uma resposta velha: ignora
        }

        limparMensagem();
        renderizarTabela(demandas);
        textoContagem.textContent = demandas.length + " demanda(s) encontrada(s)";
    } catch (erro) {
        corpoTabela.innerHTML = "<tr class=\"linha-sem-resultado\"><td colspan=\"8\">Não foi possível carregar as demandas.</td></tr>";
        textoContagem.textContent = "";
        mostrarErroDaApi(erro);
    }
}

// Preenche as opções dos filtros de projeto e de responsável com os dados do banco
async function carregarOpcoesDosFiltros() {
    try {
        const projetos = await listarProjetosApi();
        projetos.forEach(function (projeto) {
            selectProjeto.innerHTML += "<option value=\"" + projeto.id + "\">" + escaparHtml(projeto.nome) + "</option>";
        });

        const usuarios = await listarUsuariosApi();
        usuarios.forEach(function (usuario) {
            selectResponsavel.innerHTML += "<option value=\"" + usuario.id + "\">" + escaparHtml(usuario.nome) + "</option>";
        });
    } catch (erro) {
        mostrarErroDaApi(erro);
    }
}

// "Ouvintes" de evento: toda vez que a pessoa digita na busca (evento "input") ou muda um dos
// filtros (evento "change"), a lista é pedida de novo à API. A busca espera 0,3 s depois da última
// letra digitada, para não pedir à API a cada tecla.
campoBusca.addEventListener("input", function () {
    clearTimeout(temporizadorBusca);
    temporizadorBusca = setTimeout(carregarDemandas, 300);
});

[selectStatus, selectPrioridade, selectTipo, selectProjeto, selectResponsavel, selectOrdenarPor, selectOrdem].forEach(function (campo) {
    campo.addEventListener("change", carregarDemandas);
});

// Marcar "Somente as minhas" trava o filtro de responsável (ele passa a valer o usuário logado)
campoMinhas.addEventListener("change", function () {
    selectResponsavel.disabled = campoMinhas.checked;
    carregarDemandas();
});

// Roda uma vez assim que a página carrega: só continua se houver um usuário logado
if (exigirLogin()) {
    // O botão "Nova demanda" só aparece para quem pode criar demandas
    if (!podeCriarDemanda()) {
        botaoNovaDemanda.style.display = "none";
    }

    carregarOpcoesDosFiltros();
    carregarDemandas();
}
