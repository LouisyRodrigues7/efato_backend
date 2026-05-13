/*
=========================================================
gemini.client.js
=========================================================

Cliente responsável pela comunicação com a API Gemini.

Funções:
- Construir requests HTTP
- Configurar geração da IA
- Controlar retries
- Tratar erros
- Sanitizar respostas
- Limpar markdown do JSON retornado

Também realiza:
- logging
- timeout
- validação de resposta

Fluxo:
Prompt -> Gemini API -> Resposta JSON

=========================================================
*/
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const GEMINI_MODEL =
    process.env.GEMINI_MODEL ||
    "gemini-2.5-flash";

const API_KEY =
    process.env.GEMINI_API_KEY;

const URL =
    `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`;

let geminiRequestCount = 0;

const sleep = (ms) =>
    new Promise(resolve =>
        setTimeout(resolve, ms)
    );

const sanitizePrompt = (
    prompt = ""
) => {

    return prompt
        .replace(/\s+/g, " ")
        .trim();
};

const extractTextResponse = (
    data
) => {

    try {

        return data
            ?.candidates?.[0]
            ?.content?.parts
            ?.map(part => part.text || "")
            .join(" ")
            .trim();

    } catch {

        return "";
    }
};

const buildRequestBody = (
    prompt
) => {

    return {

        contents: [
            {
                role: "user",

                parts: [
                    {
                        text: prompt
                    }
                ]
            }
        ],

        generationConfig: {

            //
            // mais factual
            //
            temperature: 0.15,

            //
            // reduz aleatoriedade
            //
            topP: 0.7,

            topK: 20,

            //
            // evita respostas gigantes
            //
            maxOutputTokens: 1200
        },

        safetySettings: [

            {
                category:
                    "HARM_CATEGORY_HARASSMENT",

                threshold:
                    "BLOCK_ONLY_HIGH"
            },

            {
                category:
                    "HARM_CATEGORY_HATE_SPEECH",

                threshold:
                    "BLOCK_ONLY_HIGH"
            },

            {
                category:
                    "HARM_CATEGORY_SEXUALLY_EXPLICIT",

                threshold:
                    "BLOCK_ONLY_HIGH"
            },

            {
                category:
                    "HARM_CATEGORY_DANGEROUS_CONTENT",

                threshold:
                    "BLOCK_ONLY_HIGH"
            }
        ]
    };
};

export const callGemini = async (
    prompt,
    retries = 2
) => {

    try {

        if (!API_KEY) {

            throw new Error(
                "GEMINI_API_KEY not configured"
            );
        }

        geminiRequestCount++;

        const cleanPrompt =
            sanitizePrompt(prompt);

        console.log("\n==============================");
        console.log("[GEMINI REQUEST]");
        console.log(
            "Model:",
            GEMINI_MODEL
        );

        console.log(
            "Request:",
            geminiRequestCount
        );

        console.log(
            "Prompt Size:",
            cleanPrompt.length,
            "chars"
        );

        console.log(
            "Timestamp:",
            new Date().toISOString()
        );

        console.log("==============================\n");

        const response =
            await axios.post(
                URL,

                buildRequestBody(
                    cleanPrompt
                ),

                {
                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    timeout: 45000
                }
            );

        const text =
            extractTextResponse(
                response.data
            );

        if (!text) {

            console.error(
                "\n[GEMINI EMPTY RESPONSE]"
            );

            console.error(
                JSON.stringify(
                    response.data,
                    null,
                    2
                )
            );

            throw new Error(
                "Empty Gemini response"
            );
        }

        console.log(
            "[GEMINI SUCCESS]"
        );

        console.log(
            "Output Size:",
            text.length,
            "chars\n"
        );

        //
        // remove markdown do Gemini
        //
        const cleaned =
            text
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim();

        //
        // tenta validar json
        //
        try {

            JSON.parse(cleaned);

            console.log(
                "[VALID JSON RESPONSE]\n"
            );

        } catch {

            console.warn(
                "[INVALID JSON FORMAT]\n"
            );
        }

        return cleaned;

    } catch (error) {

        const status =
            error.response?.status;

        const responseData =
            error.response?.data;

        console.error("\n==============================");
        console.error("[GEMINI ERROR]");
        console.error("==============================");

        if (status) {

            console.error(
                "Status:",
                status
            );
        }

        if (responseData) {

            console.error(
                JSON.stringify(
                    responseData,
                    null,
                    2
                )
            );

        } else {

            console.error(
                error.message
            );
        }

        console.error("==============================\n");

        //
        // retry inteligente
        //
        const retryableErrors =
            [429, 500, 503];

        if (
            retries > 0 &&
            retryableErrors.includes(
                status
            )
        ) {

            console.log(
                `[GEMINI RETRY] Remaining: ${retries}`
            );

            await sleep(2000);

            return callGemini(
                prompt,
                retries - 1
            );
        }

        //
        // mensagens melhores
        //
        if (status === 429) {

            throw new Error(
                "Gemini quota exceeded"
            );
        }

        if (status === 400) {

            throw new Error(
                "Invalid Gemini request"
            );
        }

        if (status === 503) {

            throw new Error(
                "Gemini temporarily unavailable"
            );
        }

        throw new Error(

            responseData
                ?.error
                ?.message ||

            error.message ||

            "Gemini request failed"
        );
    }
};