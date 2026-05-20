/*
=========================================================
analyze.controller.js
=========================================================

Controller responsável por receber as requisições HTTP
vindas do frontend.

Funções principais:
- Receber pergunta do usuário
- Validar entrada básica
- Chamar pipeline principal
- Retornar resposta JSON ao frontend

Fluxo:
Frontend -> Controller -> Pipeline

=========================================================
*/

import { runRagPipeline }
from "../core/pipeline.orchestrator.js";

export const analyzeText = async (
    req,
    res
) => {

    try {

        //
        // DEBUG
        //
        console.log("\n[BODY RECEBIDO]");
        console.log(req.body);

        //
        // proteção contra body undefined
        //
        const body =
            req.body || {};

        //
        // compatibilidade frontend
        //
        const text =
            body.text ||
            body.question;

        //
        // validação
        //
        if (
            !text ||
            typeof text !== "string"
        ) {

            return res.status(400).json({

                success: false,

                error:
                    "text or question is required"
            });
        }

        //
        // executa pipeline
        //
        const result =
            await runRagPipeline(text);

        return res.json(result);

    } catch (error) {

        console.error(
            "\n[CONTROLLER ERROR]"
        );

        console.error(error);

        return res.status(500).json({

            success: false,

            error:
                "Pipeline failure",

            detail:
                error.message
        });
    }
};