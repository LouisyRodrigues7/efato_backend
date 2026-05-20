/*
=========================================================
pipeline.orchestrator.js
=========================================================

Núcleo principal do sistema RAG.

Responsável por coordenar toda a pipeline:

1. Validação da pergunta
2. Classificação de intenção
3. Expansão de query
4. Retrieval multi-fonte
5. Deduplicação
6. Filtro de relevância
7. Reranking
8. Score temporal
9. Compressão de contexto
10. Construção do prompt
11. Chamada da LLM
12. Resposta final

Objetivo:
Centralizar toda lógica principal do backend.

=========================================================
*/
import { classifyIntent } from "../processing/intent.classifier.js";
import { expandQuery } from "../processing/query.expander.js";

import { multiRetrieve }
from "../retrieval/retriever.service.js";

import { deduplicateDocuments }
from "../processing/deduplicator.service.js";

import { filterRelevantDocuments }
from "../processing/relevance.filter.js";

import { rerankDocuments }
from "../processing/reranker.service.js";

import { applyRecencyScore }
from "../processing/temporal.scorer.js";

import { compressContext }
from "../processing/compressor.service.js";

import { callGemini }
from "../llm/gemini.client.js";

import { buildPrompt }
from "../llm/prompt.engine.js";

//
// PIPELINE LIMITS
//
const LIMITS = {

    MAX_DOCS_AFTER_RETRIEVAL: 40,

    MAX_DOCS_AFTER_FILTER: 20,

    MAX_DOCS_AFTER_RERANK: 8,

    MAX_CONTEXT_DOCS: 5
};

export const runRagPipeline = async (
    question
) => {

    try {

        console.log("\n=================================");
        console.log("STARTING RAG PIPELINE");
        console.log("=================================");

        //
        // 1. VALIDATION
        //
        if (
            !question ||
            typeof question !== "string"
        ) {

            return {

                success: false,

                error: "Invalid question"
            };
        }

        //
        // 2. INTENT CLASSIFICATION
        //
        const intent =
            await classifyIntent(question);

        console.log("\n[INTENT]");
        console.log(intent);

        //
        // NOVO:
        // BLOQUEIA PERGUNTAS FORA DO ESCOPO POLÍTICO
        //
        if (
            intent?.intent === "out_of_scope" ||
            intent?.isPolitical === false
        ) {

            console.log("\n[OUT OF SCOPE QUESTION BLOCKED]");

            return {

                success: false,

                outOfScope: true,

                question,

                intent,

                answer: {

                    resumo:
                        "Este sistema é especializado apenas em temas políticos e institucionais brasileiros.",

                    analise:
                        "A pergunta enviada não foi identificada como relacionada a política, governo, eleições, leis, parlamentares, instituições públicas ou temas políticos associados.",

                    fontes_utilizadas: [],

                    evidencias: [],

                    confiabilidade: {

                        nivel: "alta",

                        motivo:
                            "A classificação detectou que a pergunta está fora do escopo político do sistema."
                    }
                }
            };
        }

        //
        // 3. QUERY EXPANSION
        //
        const expanded =
            expandQuery(question);

        console.log("\n[QUERY EXPANSION]");
        console.log({

            keywords:
                expanded?.keywords?.length || 0,

            relatedTerms:
                expanded?.relatedTerms?.length || 0,

            searchQueries:
                expanded?.searchQueries?.length || 0
        });

        //
        // 4. MULTI SOURCE RETRIEVAL
        //
        const raw =
            await multiRetrieve(
                expanded,
                intent
            );

        let docs = [

            ...(raw.news || []),

            ...(raw.web || []),

            ...(raw.camara || []),

            ...(raw.senado || [])
        ];

        //
        // LIMIT INITIAL RETRIEVAL
        //
        docs = docs.slice(
            0,
            LIMITS.MAX_DOCS_AFTER_RETRIEVAL
        );

        console.log("\n[RAW RETRIEVED DOCS]");
        console.log(docs.length);

        //
        // 5. REMOVE INVALID DOCS
        //
        docs = docs.filter(doc =>
            doc &&
            (
                doc.texto ||
                doc.titulo
            )
        );

        console.log("\n[VALID DOCS]");
        console.log(docs.length);

        //
        // 6. DEDUPLICAÇÃO
        //
        docs =
            deduplicateDocuments(docs);

        console.log("\n[AFTER DEDUP]");
        console.log(docs.length);

        //
        // 7. RELEVANCE FILTER
        //
        docs =
            filterRelevantDocuments(
                question,
                docs
            );

        //
        // LIMIT AFTER FILTER
        //
        docs = docs.slice(
            0,
            LIMITS.MAX_DOCS_AFTER_FILTER
        );

        console.log("\n[AFTER RELEVANCE FILTER]");
        console.log(docs.length);

        //
        // 8. RERANK
        //
        docs =
            await rerankDocuments(
                question,
                docs
            );

        //
        // LIMIT AFTER RERANK
        //
        docs = docs.slice(
            0,
            LIMITS.MAX_DOCS_AFTER_RERANK
        );

        console.log("\n[AFTER RERANK]");
        console.log(docs.length);

        //
        // 9. TEMPORAL SCORING
        //
        docs =
            applyRecencyScore(docs);

        //
        // 10. FINAL SORT
        //
        docs.sort((a, b) =>
            (b.score || 0) -
            (a.score || 0)
        );

        console.log("\n[TOP DOCUMENT]");
        console.log(
            docs?.[0]?.titulo || "none"
        );

        //
        // 11. CONTEXT COMPRESSION
        //
        const context =
            compressContext(
                docs.slice(
                    0,
                    LIMITS.MAX_CONTEXT_DOCS
                )
            );

        console.log("\n[FINAL CONTEXT]");
        console.log(context.length);

        //
        // 12. BUILD PROMPT
        //
        const prompt =
            buildPrompt({

                question,

                context,

                intent
            });

        console.log("\n[PROMPT SIZE]");
        console.log(
            `${prompt.length} chars`
        );

        //
        // 13. GEMINI SYNTHESIS
        //
        let answer = null;

        try {

            const rawAnswer =
                await callGemini(prompt);

            //
            // tenta converter para JSON real
            //
            try {

                answer =
                    JSON.parse(rawAnswer);

                console.log(
                    "\n[ANSWER JSON PARSED]"
                );

            } catch (parseError) {

                console.error(
                    "\n[JSON PARSE ERROR]"
                );

                console.error(
                    parseError.message
                );

                answer = {

                    resumo:
                        "Falha ao interpretar resposta da IA.",

                    analise:
                        rawAnswer,

                    confiabilidade: {

                        nivel: "baixa",

                        motivo:
                            "Resposta retornada em formato inválido."
                    }
                };
            }

        } catch (error) {

            console.error(
                "\n[GEMINI ERROR]"
            );

            console.error(
                error.message
            );

            answer = {

                resumo:
                    "O sistema de IA não conseguiu gerar uma resposta.",

                analise:
                    error.message,

                confiabilidade: {

                    nivel: "baixa",

                    motivo:
                        "Falha na comunicação com o modelo Gemini."
                }
            };
        }

        //
        // 14. FINAL RESPONSE
        //
        return {

            success: true,

            pipeline: {

                intentDetected:
                    intent.intent,

                retrievalUsed: {

                    news:
                        !!raw.news?.length,

                    web:
                        !!raw.web?.length,

                    camara:
                        !!raw.camara?.length,

                    senado:
                        !!raw.senado?.length
                }
            },

            question,

            intent,

            expandedQuery: {

                keywords:
                    expanded
                        ?.keywords
                        ?.slice(0, 5),

                searchQueries:
                    expanded
                        ?.searchQueries
                        ?.slice(0, 5)
            },

            stats: {

                rawDocuments:
                    [
                        ...(raw.news || []),
                        ...(raw.web || []),
                        ...(raw.camara || []),
                        ...(raw.senado || [])
                    ].length,

                retrievedDocuments:
                    docs.length,

                contextDocuments:
                    context.length,

                promptSize:
                    prompt.length
            },

            topDocument:
                docs?.[0]
                    ? {

                        titulo:
                            docs[0].titulo,

                        fonte:
                            docs[0].fonte,

                        score:
                            docs[0].score
                    }
                    : null,

            contextPreview:
                context.map(doc => ({

                    titulo:
                        doc.titulo,

                    fonte:
                        doc.fonte,

                    resumo:
                        doc.resumo
                            ?.slice(0, 200)
                })),

            answer
        };

    } catch (error) {

        console.error(
            "\n[PIPELINE ERROR]"
        );

        console.error(error);

        return {

            success: false,

            error:
                "Pipeline execution failed",

            detail:
                error.message
        };
    }
};