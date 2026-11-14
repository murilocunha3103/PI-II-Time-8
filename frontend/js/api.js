// Autor: Arthur de Senna Nardi Cortina
//
// Todas as chamadas da página para a API (backend) ficam neste arquivo, como na Aula 08: as telas
// não conhecem endereços nem detalhes do fetch, só chamam as funções abaixo (listarDemandasApi,
// buscarDemandaApi...). Assim, se um endereço mudar, só este arquivo muda.
//
// Cada função devolve os dados da resposta (já convertidos de JSON). Se a API responder com erro
// (400, 401, 403, 404...), a função lança um Error com a MESMA mensagem enviada pela API, e a tela
// mostra essa mensagem ao usuário (mostrarErroDaApi). O erro tem também:
//   erro.status -> o código HTTP (0 se nem chegou a falar com o servidor)
//   erro.erros  -> a lista de problemas, quando a API envia uma (validação de formulários)
//
// Depende do sessao.js (carregue o sessao.js antes deste arquivo).

const API_BASE_URL = 'http://localhost:3000';

// Cria o erro que as funções lançam
function criarErroApi(mensagem, status, erros) {
  const erro = new Error(mensagem);
  erro.status = status;
  erro.erros = erros || [];
  return erro;
}

// Transforma { status: 'Aberta', busca: 'login' } em "?status=Aberta&busca=login".
// Campos vazios são ignorados. encodeURIComponent protege acentos e espaços na URL.
function montarQuery(filtros) {
  const partes = [];

  for (const chave in filtros) {
    const valor = filtros[chave];

    if (valor !== '' && valor !== null && valor !== undefined) {
      partes.push(chave + '=' + encodeURIComponent(valor));
    }
  }

  return partes.length > 0 ? '?' + partes.join('&') : '';
}

// Função central: todas as outras passam por ela. Faz o fetch, envia o token do usuário logado,
// converte a resposta e lança o erro quando o status não é de sucesso.
async function requisicaoApi(metodo, caminho, corpo) {
  const opcoes = { method: metodo, headers: {} };
  const token = obterToken();

  if (token !== null) {
    opcoes.headers['Authorization'] = 'Bearer ' + token;
  }

  if (corpo !== undefined) {
    opcoes.headers['Content-Type'] = 'application/json';
    opcoes.body = JSON.stringify(corpo);
  }

  let resposta;

  try {
    resposta = await fetch(API_BASE_URL + caminho, opcoes);
  } catch (erro) {
    // O fetch só falha de verdade quando não consegue falar com o servidor
    throw criarErroApi('Não foi possível conectar ao servidor. Confira se a API está rodando.', 0, []);
  }

  let dados = null;

  try {
    dados = await resposta.json();
  } catch (erro) {
    // resposta sem corpo JSON
  }

  if (!resposta.ok) {
    // 401 fora do login = sessão vencida ou token inválido: volta para a tela de login
    if (resposta.status === 401 && caminho !== '/login') {
      sairDoSistema('expirada');
    }

    const mensagem = dados && dados.mensagem ? dados.mensagem : 'Erro na requisição.';
    throw criarErroApi(mensagem, resposta.status, dados && dados.erros ? dados.erros : []);
  }

  return dados;
}

// --- Login e usuários ---

async function loginApi(email, senha) {
  return requisicaoApi('POST', '/login', { email: email, senha: senha });
}

// projetoId (opcional): lista só os usuários vinculados àquele projeto
async function listarUsuariosApi(projetoId) {
  return requisicaoApi('GET', '/usuarios' + montarQuery({ projeto: projetoId }));
}

async function listarProjetosApi() {
  return requisicaoApi('GET', '/projetos');
}

// --- Dashboard e listagem ---

// filtros: { prioridade, responsavel, projeto, busca }
async function buscarDashboardApi(filtros) {
  return requisicaoApi('GET', '/dashboard' + montarQuery(filtros || {}));
}

// filtros: { status, prioridade, tipo, responsavel, projeto, busca, ordenarPor, ordem }
async function listarDemandasApi(filtros) {
  return requisicaoApi('GET', '/demandas' + montarQuery(filtros || {}));
}

// --- Uma demanda ---

async function buscarDemandaApi(id) {
  return requisicaoApi('GET', '/demandas/' + id);
}

// demanda: { titulo, descricao, tipo, prioridade, projetoId, responsavelId, prazo }
async function cadastrarDemandaApi(demanda) {
  return requisicaoApi('POST', '/demandas', demanda);
}

// demanda: { titulo, descricao, tipo, prioridade, responsavelId, prazo }
async function atualizarDemandaApi(id, demanda) {
  return requisicaoApi('PUT', '/demandas/' + id, demanda);
}

// status: nome do novo status, por exemplo 'Em andamento'
async function atualizarStatusApi(id, status) {
  return requisicaoApi('PATCH', '/demandas/' + id + '/status', { status: status });
}

// Cancelamento lógico: a demanda continua no banco, com o status Cancelada
async function cancelarDemandaApi(id) {
  return requisicaoApi('POST', '/demandas/' + id + '/cancelar');
}

// --- Comentários, histórico e feriados ---

async function listarComentariosApi(id) {
  return requisicaoApi('GET', '/demandas/' + id + '/comentarios');
}

async function comentarApi(id, texto) {
  return requisicaoApi('POST', '/demandas/' + id + '/comentarios', { texto: texto });
}

async function listarHistoricoApi(id) {
  return requisicaoApi('GET', '/demandas/' + id + '/historico');
}

// data: 'AAAA-MM-DD'. Devolve { data, feriado, nome, fonte }
async function verificarFeriadoApi(data) {
  return requisicaoApi('GET', '/feriados/verificar' + montarQuery({ data: data }));
}
