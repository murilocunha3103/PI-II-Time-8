// Autor: Murilo Xavier Sarra da Cunha
//
// Comportamento em JavaScript da tela de Listagem de Demandas (Reunião 3).
//
// Esta tela não tem um formulário com botão de "enviar", então em vez de validar
// campos obrigatórios, o comportamento aqui é: filtrar a tabela de demandas em
// tempo real, conforme a pessoa digita no campo de busca ou escolhe um status ou
// uma prioridade nos selects, sem precisar recarregar a página.

const campoBusca = document.querySelector("#busca-demanda");
const selectStatus = document.querySelector("#filtro-status");
const selectPrioridade = document.querySelector("#filtro-prioridade");
const corpoTabela = document.querySelector("#corpo-tabela");

// Função principal: roda toda vez que a busca ou um dos filtros muda.
function aplicarFiltros() {
    const textoBusca = campoBusca.value.trim().toLowerCase();
    const statusEscolhido = selectStatus.value; // "" significa "sem filtro"
    const prioridadeEscolhida = selectPrioridade.value; // "" significa "sem filtro"

    let algumaLinhaVisivel = false;

    const linhas = corpoTabela.querySelectorAll("tr");

    linhas.forEach(function (linha) {
        // Ignora a própria linha de "nenhum resultado", se ela já existir
        if (linha.id === "linha-sem-resultado") {
            return;
        }

        // Pega o título da demanda (primeira célula da linha) como texto puro
        const titulo = linha.querySelector("td").innerText.trim().toLowerCase();

        // Pega o status e a prioridade que colocamos como atributo no HTML
        // (data-status e data-prioridade, lidos aqui com getAttribute)
        const statusDaLinha = linha.getAttribute("data-status");
        const prioridadeDaLinha = linha.getAttribute("data-prioridade");

        const bateComBusca = titulo.includes(textoBusca);
        const bateComStatus = statusEscolhido === "" || statusEscolhido === statusDaLinha;
        const bateComPrioridade = prioridadeEscolhida === "" || prioridadeEscolhida === prioridadeDaLinha;

        if (bateComBusca && bateComStatus && bateComPrioridade) {
            linha.style.display = "table-row";
            algumaLinhaVisivel = true;
        } else {
            linha.style.display = "none";
        }
    });

    mostrarMensagemSemResultado(!algumaLinhaVisivel);
}

// Mostra (ou remove) uma linha avisando que nenhuma demanda bateu com o filtro.
function mostrarMensagemSemResultado(deveMostrar) {
    const linhaExistente = document.querySelector("#linha-sem-resultado");

    if (deveMostrar && !linhaExistente) {
        const novaLinha = document.createElement("tr");
        novaLinha.id = "linha-sem-resultado";
        novaLinha.className = "linha-sem-resultado";
        novaLinha.innerHTML = "<td colspan=\"6\">Nenhuma demanda encontrada com os filtros aplicados.</td>";
        corpoTabela.appendChild(novaLinha);
    }

    if (!deveMostrar && linhaExistente) {
        linhaExistente.remove();
    }
}

// "Ouvintes" de evento: toda vez que a pessoa digita na busca (evento "input")
// ou muda um dos selects (evento "change"), a função aplicarFiltros roda de novo.
campoBusca.addEventListener("input", aplicarFiltros);
selectStatus.addEventListener("change", aplicarFiltros);
selectPrioridade.addEventListener("change", aplicarFiltros);
