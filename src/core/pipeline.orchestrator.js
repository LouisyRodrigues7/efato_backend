import { classifyIntent } from "../processing/intent.classifier.js";
import { expandQuery } from "../processing/query.expander.js";
import { multiRetrieve } from "../retrieval/retriever.service.js";
import { deduplicateDocuments } from "../processing/deduplicator.service.js";
import { rerankDocuments } from "../processing/reranker.service.js";
import { applyRecencyScore } from "../processing/temporal.scorer.js";
import { compressContext } from "../processing/compressor.service.js";
import { callGemini } from "../llm/gemini.client.js";
import { buildPrompt } from "../llm/prompt.engine.js";

export const runRagPipeline = async (question, entities) => {

    // 1. INTENT
    const intent = await classifyIntent(question);

    // 2. QUERY EXPANSION
    const expanded = expandQuery(question, entities);

    // 3. RETRIEVAL
    const raw = await multiRetrieve(expanded, intent);

    let docs = [...raw.news, ...raw.web];

    // 4. NORMALIZAÇÃO (se quiser inserir depois)
    // docs = normalizeBatch(docs);

    // 5. DEDUP
    docs = deduplicateDocuments(docs);

    // 6. RERANK
    docs = await rerankDocuments(question, docs);

    // 7. TEMPORAL
    docs = applyRecencyScore(docs);

    // 8. COMPRESSION
    const context = compressContext(docs);

    // 9. PROMPT
    const prompt = buildPrompt({
        question,
        entities,
        context,
        intent
    });

    // 10. GEMINI FINAL
    const answer = await callGemini(prompt);

    return {
        intent,
        context,
        answer
    };
};