// Autor: Kevin Eziquiel Lima
//
// Rotas da tela de Cadastro de Demanda (Reunião 4):
//   POST /demandas  -> cadastra uma nova demanda, validando os dados no servidor
//   GET  /projetos  -> lista os projetos pré-cadastrados (para escolher o projeto no cadastro)
//
// Corpo (JSON) esperado no POST /demandas:
//   {
//     "titulo": "Corrigir erro no login",          (obrigatório)
//     "descricao": "Descrição da demanda",          (obrigatório)
//     "tipo": "Defeito",                            (obrigatório: Tarefa | Defeito | Melhoria | Documentação)
//     "prioridade": "Alta",                         (obrigatório: Crítica | Alta | Média | Baixa)
//     "projetoId": 1,                               (obrigatório: o projeto precisa existir)
//     "responsavelId": 4,                           (opcional: se informado, o usuário precisa existir)
//     "prazo": "2026-11-30"                         (opcional: formato AAAA-MM-DD)
//   }
//
// O status ("Aberta"), a data de criação e a data da última atualização são definidos
// AUTOMATICAMENTE pelo servidor, mesmo que venham no corpo da requisição - eles são ignorados.
//
// Códigos HTTP usados:
//   201 -> demanda criada (devolve a demanda criada)
//   400 -> dados inválidos (devolve a lista de problemas encontrados)

import { Express, Request, Response } from "express";
import { demandas, gerarIdDemanda, montarDemandaDetalhada, projetos, usuarios } from "../dados/dados";
import { Demanda, PRIORIDADES_VALIDAS, TIPOS_VALIDOS } from "../tipos";
import { agoraISO, dataValida, encontrarValorValido, lerNumeroInteiro, textoOuVazio } from "../utilitarios";

const TITULO_MAXIMO = 100;

export function registrarRotasCadastro(app: Express) {
  // GET /projetos - lista os projetos
  app.get("/projetos", (req: Request, res: Response) => {
    return res.status(200).json(projetos);
  });

  // POST /demandas - cadastra uma demanda
  app.post("/demandas", (req: Request, res: Response) => {
    // 1. Lê o corpo da requisição. O "|| {}" evita erro se vier sem corpo nenhum.
    const { titulo, descricao, tipo, prioridade, projetoId, responsavelId, prazo } = req.body || {};

    const tituloLido = textoOuVazio(titulo);
    const descricaoLida = textoOuVazio(descricao);
    const tipoLido = encontrarValorValido(tipo, TIPOS_VALIDOS);
    const prioridadeLida = encontrarValorValido(prioridade, PRIORIDADES_VALIDAS);
    const idDoProjeto = lerNumeroInteiro(projetoId);
    const prazoLido = textoOuVazio(prazo);

    // 2. Valida tudo e vai juntando os problemas encontrados numa lista, para a pessoa
    //    ver todos os erros de uma vez (mesma ideia da flag "formularioValido" da tela)
    const erros: string[] = [];

    if (tituloLido === "") {
      erros.push("O título é obrigatório.");
    } else if (tituloLido.length > TITULO_MAXIMO) {
      erros.push("O título pode ter no máximo " + TITULO_MAXIMO + " caracteres.");
    }

    if (descricaoLida === "") {
      erros.push("A descrição é obrigatória.");
    }

    if (tipoLido === null) {
      erros.push("Tipo inválido ou ausente. Valores aceitos: " + TIPOS_VALIDOS.join(", ") + ".");
    }

    if (prioridadeLida === null) {
      erros.push("Prioridade inválida ou ausente. Valores aceitos: " + PRIORIDADES_VALIDAS.join(", ") + ".");
    }

    if (idDoProjeto === null) {
      erros.push("O projeto (projetoId) é obrigatório.");
    } else if (!projetos.some((item) => item.id === idDoProjeto)) {
      erros.push("O projeto informado não existe.");
    }

    // O responsável pode ficar em branco. Só é validado se tiver sido informado.
    let idDoResponsavel: number | null = null;
    const responsavelInformado = responsavelId !== undefined && responsavelId !== null && responsavelId !== "";

    if (responsavelInformado) {
      idDoResponsavel = lerNumeroInteiro(responsavelId);

      if (idDoResponsavel === null) {
        erros.push("O responsável (responsavelId) deve ser o id de um usuário.");
      } else if (!usuarios.some((item) => item.id === idDoResponsavel)) {
        erros.push("O responsável informado não existe.");
      }
    }

    // O prazo também é opcional. Se informado, precisa ser uma data real em AAAA-MM-DD.
    if (prazoLido !== "" && !dataValida(prazoLido)) {
      erros.push("O prazo deve ser uma data válida no formato AAAA-MM-DD (ex.: 2026-11-30).");
    }

    // 3. Se houve qualquer problema, responde 400 e NÃO cria a demanda
    if (erros.length > 0 || tipoLido === null || prioridadeLida === null || idDoProjeto === null) {
      return res.status(400).json({
        mensagem: "Dados inválidos. Corrija os problemas abaixo e tente novamente.",
        erros
      });
    }

    // 4. Cria a demanda. Status, datas e id são definidos aqui, pelo servidor.
    const agora = agoraISO();

    const novaDemanda: Demanda = {
      id: gerarIdDemanda(),
      titulo: tituloLido,
      descricao: descricaoLida,
      tipo: tipoLido,
      prioridade: prioridadeLida,
      status: "Aberta",
      projetoId: idDoProjeto,
      responsavelId: idDoResponsavel,
      dataCriacao: agora,
      dataAtualizacao: agora,
      prazo: prazoLido !== "" ? prazoLido : null
    };

    demandas.push(novaDemanda);

    // 5. Responde 201 (criado) com a demanda criada
    return res.status(201).json(montarDemandaDetalhada(novaDemanda));
  });
}
