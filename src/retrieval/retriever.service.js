/*
=========================================================
retriever.service.js
=========================================================

Serviço principal de retrieval multi-fonte.

Responsável por:
- Buscar notícias
- Buscar web
- Integrar fontes oficiais
- Consolidar documentos

Utiliza paralelismo com Promise.all.

=========================================================
*/
import { searchNews }
from "../integrations/news/news.service.js";

import { searchWeb }
from "./web.search.service.js";

//
// LIMITES GLOBAIS
//
const LIMITS = {

    MAX_SEARCH_QUERIES: 5,

    MAX_RESULTS_PER_SOURCE: 20,

    MIN_QUERY_LENGTH: 4
};

//
// REMOVE QUERIES RUINS/DUPLICADAS
//
const sanitizeQueries = (
    queries = []
) => {

    return [

        ...new Set(

            queries
                .filter(Boolean)

                .map(q =>
                    q.trim()
                )

                .filter(q =>
                    q.length >=
                    LIMITS.MIN_QUERY_LENGTH
                )
        )

    ].slice(
        0,
        LIMITS.MAX_SEARCH_QUERIES
    );
};

//
// NORMALIZA DOCUMENTOS
//
const normalizeDocs = (
    docs = [],
    tipo = "web"
) => {

    return docs
        .filter(Boolean)

        .map(doc => ({

            tipo,

            titulo:
                doc.titulo ||
                doc.title ||
                "Sem título",

            texto:
                doc.texto ||
                doc.content ||
                doc.description ||
                "",

            fonte:
                doc.fonte ||
                doc.url ||
                "",

            url:
                doc.url ||
                doc.fonte ||
                "",

            data:
                doc.data ||
                doc.publishedDate ||
                null,

            score:
                doc.score || 0,

            metadata:
                doc.metadata || {}
        }))

        //
        // REMOVE DOCS SEM CONTEÚDO
        //
        .filter(doc =>
            doc.texto ||
            doc.titulo
        );
};

export const multiRetrieve = async (
    expanded,
    intent
) => {

    try {

        //
        // QUERIES FINAIS
        //
        const queries =
            sanitizeQueries(
                expanded.searchQueries || []
            );

        console.log("\n[MULTI RETRIEVE]");
        console.log(queries);

        //
        // CONTROLE DE BUSCA POR INTENT
        //
        const shouldSearchNews =
            intent?.requiresNews !== false;

        const shouldSearchWeb =
            true;

        //
        // TASKS
        //
        const newsTasks =
            shouldSearchNews
                ? queries.map(query =>
                    searchNews(query)
                )
                : [];

        const webTasks =
            shouldSearchWeb
                ? queries.map(query =>
                    searchWeb(query)
                )
                : [];

        //
        // EXECUÇÃO PARALELA
        //
        const [
            newsResults,
            webResults
        ] = await Promise.all([

            Promise.all(newsTasks),

            Promise.all(webTasks)
        ]);

        //
        // FLATTEN
        //
        const rawNews =
            newsResults.flat();

        const rawWeb =
            webResults.flat();

        //
        // NORMALIZAÇÃO
        //
        let news =
            normalizeDocs(
                rawNews,
                "news"
            );

        let web =
            normalizeDocs(
                rawWeb,
                "web"
            );

        //
        // LIMITES POR FONTE
        //
        news = news.slice(
            0,
            LIMITS.MAX_RESULTS_PER_SOURCE
        );

        web = web.slice(
            0,
            LIMITS.MAX_RESULTS_PER_SOURCE
        );

        console.log("\n[NEWS RESULTS]");
        console.log(news.length);

        console.log("\n[WEB RESULTS]");
        console.log(web.length);

        //
        // DEBUG CONTROLADO
        //
        console.log("\n[SAMPLE NEWS]");
        console.log(
            news?.[0]?.titulo || "none"
        );

        console.log("\n[SAMPLE WEB]");
        console.log(
            web?.[0]?.titulo || "none"
        );

        return {

            news,

            web
        };

    } catch (error) {

        console.error(
            "\n[MULTI RETRIEVE ERROR]"
        );

        console.error(error);

        return {

            news: [],

            web: []
        };
    }
};