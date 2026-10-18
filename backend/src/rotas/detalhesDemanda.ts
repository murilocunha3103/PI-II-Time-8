// Autor: Joao Victor Nunes Soares
//
// Rotas da tela de Detalhes da Demanda (Reunião 4):
//   GET  /demandas/:id               -> devolve todos os campos de uma demanda
//   GET  /demandas/:id/comentarios   -> lista os comentários da demanda
//   POST /demandas/:id/comentarios   -> registra um novo comentário na demanda
//
// O ":id" na rota é um parâmetro de rota: em /demandas/3, req.params.id vale "3".
//
// Códigos HTTP usados:
//   200 -> consulta feita com sucesso
//   201 -> comentário criado
//   400 -> dados do comentário inválidos (texto vazio, usuário ausente ou inexistente)
//   404 -> a demanda não existe

import { Express, Request, Response } from "express";
import { comentarios, demandas, gerarIdComentario, montarDemandaDetalhada, usuarios } from "../dados/dados";
import { Comentario } from "../tipos";
import { agoraISO, lerNumeroInteiro, textoOuVazio } from "../utilitarios";

const TAMANHO_MAXIMO_COMENTARIO = 1000;

// Monta o comentário no formato que a API devolve, trocando o usuarioId pelos dados
// do autor (id, nome e perfil). A senha do usuário nunca é devolvida.
function montarComentarioDetalhado(comentario: Comentario) {
  const autor = usuarios.find((item) => item.id === comentario.usuarioId);

  return {
    id: comentario.id,
    demandaId: comentario.demandaId,
    texto: comentario.texto,
    dataHora: comentario.dataHora,
    usuario: autor ? { id: autor.id, nome: autor.nome, perfil: autor.perfil } : null
  };
}

export function registrarRotasDetalhes(app: Express) {
  // GET /demandas/:id - devolve uma demanda específica
  app.get("/demandas/:id", (req: Request, res: Response) => {
    // req.params.id chega como texto; Number(...) converte para número
    const id = Number(req.params.id);
    const demanda = demandas.find((item) => item.id === id);

    if (!demanda) {
      return res.status(404).json({ mensagem: "Demanda não encontrada." });
    }

    return res.status(200).json(montarDemandaDetalhada(demanda));
  });

  // GET /demandas/:id/comentarios - lista os comentários da demanda, do mais antigo para o mais novo
  app.get("/demandas/:id/comentarios", (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const demanda = demandas.find((item) => item.id === id);

    if (!demanda) {
      return res.status(404).json({ mensagem: "Demanda não encontrada." });
    }

    const lista = comentarios
      .filter((item) => item.demandaId === id)
      .sort((a, b) => a.dataHora.localeCompare(b.dataHora))
      .map(montarComentarioDetalhado);

    return res.status(200).json(lista);
  });

  // POST /demandas/:id/comentarios - registra um comentário.
  // Corpo (JSON) esperado: { "texto": "...", "usuarioId": 2 }
  app.post("/demandas/:id/comentarios", (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const demanda = demandas.find((item) => item.id === id);

    // 1. A demanda precisa existir (senão, 404)
    if (!demanda) {
      return res.status(404).json({ mensagem: "Demanda não encontrada." });
    }

    // 2. Lê o corpo da requisição. O "|| {}" evita erro se vier sem corpo nenhum.
    const { texto, usuarioId } = req.body || {};
    const textoComentario = textoOuVazio(texto);
    const idDoUsuario = lerNumeroInteiro(usuarioId);

    // 3. Valida os dados (a API não confia no que recebe, mesmo que a tela já valide)
    if (textoComentario === "") {
      return res.status(400).json({ mensagem: "O texto do comentário é obrigatório e não pode ficar vazio." });
    }

    if (textoComentario.length > TAMANHO_MAXIMO_COMENTARIO) {
      return res
        .status(400)
        .json({ mensagem: "O comentário pode ter no máximo " + TAMANHO_MAXIMO_COMENTARIO + " caracteres." });
    }

    if (idDoUsuario === null) {
      return res.status(400).json({ mensagem: "O usuário que está comentando (usuarioId) é obrigatório." });
    }

    const usuarioExiste = usuarios.some((item) => item.id === idDoUsuario);

    if (!usuarioExiste) {
      return res.status(400).json({ mensagem: "O usuário informado não existe." });
    }

    // 4. Cria o comentário. A data e a hora são registradas pelo servidor, e não
    //    pelo que o cliente enviar.
    const novoComentario: Comentario = {
      id: gerarIdComentario(),
      demandaId: id,
      usuarioId: idDoUsuario,
      texto: textoComentario,
      dataHora: agoraISO()
    };

    comentarios.push(novoComentario);

    // 5. Responde 201 (criado) com o comentário já no formato completo
    return res.status(201).json(montarComentarioDetalhado(novoComentario));
  });
}
