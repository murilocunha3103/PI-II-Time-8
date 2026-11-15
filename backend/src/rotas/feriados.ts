// Autor: Gabriel Passarela Silva
//
// Rota de verificação de feriado nacional (Reunião 5):
//   GET /feriados/verificar?data=AAAA-MM-DD
//
// Responde se a data informada é feriado nacional, consultando a API externa (BrasilAPI) por
// meio do arquivo servicoFeriados.ts. A tela de cadastro/edição de demanda usa esta rota para
// avisar o usuário assim que ele escolhe um prazo que cai em feriado. Além disso, as rotas que
// gravam o prazo (POST /demandas e PUT /demandas/:id) conferem a mesma regra no servidor.
//
// Exemplo de resposta: { "data": "2026-12-25", "feriado": true, "nome": "Natal", "fonte": "api" }
//
// Códigos: 200 (consulta feita) e 400 (data ausente ou inválida).

import { Express, Request, Response } from "express";
import { exigirLogin } from "../autenticacao";
import { verificarFeriadoNacional } from "../servicoFeriados";
import { dataValida, textoOuVazio } from "../utilitarios";

export function registrarRotasFeriados(app: Express) {
  app.get("/feriados/verificar", exigirLogin, async (req: Request, res: Response) => {
    const data = textoOuVazio(req.query.data);

    if (data === "") {
      return res.status(400).json({ mensagem: "Informe a data no formato AAAA-MM-DD." });
    }

    if (!dataValida(data)) {
      return res.status(400).json({ mensagem: "A data deve ser válida e estar no formato AAAA-MM-DD (ex.: 2026-12-25)." });
    }

    try {
      const resultado = await verificarFeriadoNacional(data);
      return res.status(200).json({ data, feriado: resultado.feriado, nome: resultado.nome, fonte: resultado.fonte });
    } catch (erro) {
      console.error(erro);
      return res.status(500).json({ mensagem: "Erro ao verificar o feriado!" });
    }
  });
}