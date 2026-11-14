// Autor: Arthur de Senna Nardi Cortina
//
// Funções de apoio usadas por TODAS as telas (Reunião 5): sessão do usuário (login), mensagens para
// o usuário, formatação de datas e etiquetas.
//
// Este arquivo deve ser carregado ANTES do api.js e do JavaScript da própria tela:
//   <script src="../js/sessao.js"></script>
//   <script src="../js/api.js"></script>
//   <script src="../js/NOME-DA-TELA.js"></script>
//
// A sessão (token + dados do usuário) fica guardada no sessionStorage do navegador. Ela dura
// enquanto a aba estiver aberta e é apagada ao clicar em "Sair". O token é enviado à API em
// todas as requisições (veja api.js).

const CHAVE_TOKEN = 'pi2_token';
const CHAVE_USUARIO = 'pi2_usuario';

// --- Sessão do usuário ---

// Guarda o token e os dados do usuário depois de um login bem-sucedido
function salvarSessao(token, usuario) {
  sessionStorage.setItem(CHAVE_TOKEN, token);
  sessionStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
}

// Devolve o token guardado, ou null se não houver login
function obterToken() {
  return sessionStorage.getItem(CHAVE_TOKEN);
}

// Devolve o usuário logado (objeto com id, nome, email e perfil), ou null se não houver login
function obterUsuario() {
  const texto = sessionStorage.getItem(CHAVE_USUARIO);

  if (texto === null) {
    return null;
  }

  return JSON.parse(texto);
}

function estaLogado() {
  return obterToken() !== null && obterUsuario() !== null;
}

// Troca de página. Fica numa função para ser usada por todas as telas do mesmo jeito.
function irPara(pagina) {
  window.location.href = pagina;
}

// Encerra a sessão e volta para a tela de login. O "motivo" (opcional) vira um aviso na tela de login.
function sairDoSistema(motivo) {
  sessionStorage.removeItem(CHAVE_TOKEN);
  sessionStorage.removeItem(CHAVE_USUARIO);

  if (motivo) {
    irPara('login.html?aviso=' + motivo);
  } else {
    irPara('login.html');
  }
}

// Chamada no início de toda tela, exceto o login: se não houver login, manda para a tela de login.
// Se houver, escreve o nome do usuário no menu. Devolve true se pode continuar carregando a tela.
function exigirLogin() {
  if (!estaLogado()) {
    irPara('login.html');
    return false;
  }

  preencherBarraUsuario();
  return true;
}

// Escreve "Nome (Perfil) | Sair" no lugar do texto "Nome do Usuário" do menu superior
function preencherBarraUsuario() {
  const local = document.querySelector('.usuario-logado');
  const usuario = obterUsuario();

  if (local === null || usuario === null) {
    return;
  }

  local.textContent = usuario.nome + ' (' + usuario.perfil + ') | ';

  const linkSair = document.createElement('a');
  linkSair.href = '#';
  linkSair.className = 'link-sair';
  linkSair.textContent = 'Sair';
  linkSair.addEventListener('click', function (event) {
    event.preventDefault();
    sairDoSistema();
  });

  local.appendChild(linkSair);
}

// --- Perfis (usados só para mostrar ou esconder botões; quem realmente impede é a API) ---

function perfilDoUsuario() {
  const usuario = obterUsuario();
  return usuario === null ? '' : semAcentoMinusculo(usuario.perfil);
}

function ehAdministrador() {
  return perfilDoUsuario() === 'administrador';
}

function ehLider() {
  return perfilDoUsuario().indexOf('lider') === 0;
}

function ehMembro() {
  return perfilDoUsuario().indexOf('membro') === 0;
}

// Só o Administrador e o Líder de Projeto criam e editam demandas
function podeCriarDemanda() {
  return ehAdministrador() || ehLider();
}

// --- Mensagens para o usuário ---

// Mostra uma mensagem colorida no elemento <div id="areaMensagem"> da página.
// tipo: 'erro', 'sucesso' ou 'aviso'. "erros" (opcional) é uma lista de problemas, mostrada abaixo.
function mostrarMensagem(tipo, texto, erros) {
  const area = document.querySelector('#areaMensagem');

  if (area === null) {
    alert(texto);
    return;
  }

  area.innerHTML = '';

  const caixa = document.createElement('div');
  caixa.className = 'alerta alerta-' + tipo;
  caixa.setAttribute('role', 'alert');

  const paragrafo = document.createElement('p');
  paragrafo.textContent = texto;
  caixa.appendChild(paragrafo);

  if (erros && erros.length > 0) {
    const lista = document.createElement('ul');

    erros.forEach(function (erro) {
      const item = document.createElement('li');
      item.textContent = erro;
      lista.appendChild(item);
    });

    caixa.appendChild(lista);
  }

  area.appendChild(caixa);

  if (caixa.scrollIntoView) {
    caixa.scrollIntoView({ block: 'nearest' });
  }
}

function limparMensagem() {
  const area = document.querySelector('#areaMensagem');

  if (area !== null) {
    area.innerHTML = '';
  }
}

// Mostra na tela o erro vindo da API (o erro já traz a mensagem e, às vezes, uma lista de problemas)
function mostrarErroDaApi(erro) {
  mostrarMensagem('erro', erro.message, erro.erros);
}

// --- Textos, datas e etiquetas ---

// "Crítica" -> "critica" (sem acento e em minúsculas), para comparar textos
function semAcentoMinusculo(texto) {
  return String(texto).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// Protege o HTML: troca < > & " ' por códigos. Use SEMPRE que for colocar um texto vindo da API
// (título, nome, comentário...) dentro de um innerHTML, para ninguém conseguir injetar código na página.
function escaparHtml(texto) {
  return String(texto === null || texto === undefined ? '' : texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// "2026-11-30" (ou "2026-11-30T14:05:00") -> "30/11/2026". Sem data, devolve "--/--/----".
function formatarData(texto) {
  if (texto === null || texto === undefined || texto === '') {
    return '--/--/----';
  }

  const partes = texto.slice(0, 10).split('-');
  return partes[2] + '/' + partes[1] + '/' + partes[0];
}

// "2026-11-30T14:05:00" -> "30/11/2026 14:05"
function formatarDataHora(texto) {
  if (texto === null || texto === undefined || texto === '') {
    return '--/--/---- --:--';
  }

  return formatarData(texto) + ' ' + texto.slice(11, 16);
}

// Devolve a classe CSS da etiqueta colorida de uma prioridade ou de um status
function classeEtiqueta(nome) {
  const chave = semAcentoMinusculo(nome);

  const classes = {
    critica: 'etiqueta-critica',
    alta: 'etiqueta-alta',
    media: 'etiqueta-media',
    baixa: 'etiqueta-baixa',
    aberta: 'etiqueta-aberta',
    'em andamento': 'etiqueta-andamento',
    'em revisao': 'etiqueta-revisao',
    concluida: 'etiqueta-concluida',
    cancelada: 'etiqueta-cancelada',
  };

  return 'etiqueta ' + (classes[chave] || '');
}
