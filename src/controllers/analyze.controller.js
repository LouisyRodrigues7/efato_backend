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
import { runRagPipeline } from "../core/pipeline.orchestrator.js";

export const analyzeText = async (req, res) => {

    try {

        // FIX: aceita tanto "text" quanto "question"
        const text = req.body.text || req.body.question;

        if (!text) {

            return res.status(400).json({
                error: "text is required"
            });
        }

        const result = await runRagPipeline(text);

        return res.json(result);

    } catch (error) {

        console.error("Pipeline error:", error);

        return res.status(500).json({
            error: "Pipeline failure",
            detail: error.message
        });
    }
};