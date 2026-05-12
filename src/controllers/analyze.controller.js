import { runPipeline } from "../core/pipeline.orchestrator.js";
import { extractEntities } from "../services/old-entity.service.js";

export const analyzeText = async (req, res) => {

    try {

        const { text } = req.body;

        if (!text) {
            return res.status(400).json({
                error: "text is required"
            });
        }

        const entities = await extractEntities(text);

        const result = await runPipeline(text, entities);

        return res.json(result);

    } catch (error) {

        return res.status(500).json({
            error: "Pipeline failure",
            detail: error.message
        });
    }
};