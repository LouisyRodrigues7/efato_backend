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
    tipo = "web",
    temporalType = "default"
) => {

    return docs
        .filter(Boolean)
        .map(doc => ({

            tipo,

            temporalType,

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

        const defaultQueries =
        sanitizeQueries(
            expanded.searchQueries || []
        );

        const useDualRetrieval =
        intent?.requiresCurrentStatus === true;

        const queries = useDualRetrieval
        ? []
        : defaultQueries;

    
        const historicalQueries =
            sanitizeQueries(
                expanded.historicalQueries || []
            );

        const currentQueries =
            sanitizeQueries(
                expanded.currentQueries || []
        );

    
        console.log({
        useDualRetrieval,
        historicalQueries,
        currentQueries,
        defaultQueries
    });
     
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

            const historicalNewsTasks =
            useDualRetrieval && shouldSearchNews
                ? historicalQueries.map(query =>
                    searchNews(query)
                )
                : [];

        const historicalWebTasks =
        useDualRetrieval
            ? historicalQueries.map(query =>
                searchWeb(query)
            )
            : [];

        const currentNewsTasks =
        useDualRetrieval && shouldSearchNews
            ? currentQueries.map(query =>
                searchNews(query)
            )
            : [];

        const currentWebTasks =
            useDualRetrieval
                ? currentQueries.map(query =>
                    searchWeb(query)
                )
                : [];
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
            webResults,

            historicalNewsResults,
            historicalWebResults,

            currentNewsResults,
            currentWebResults

        ] = await Promise.all([

            Promise.all(newsTasks),
            Promise.all(webTasks),

            Promise.all(historicalNewsTasks),
            Promise.all(historicalWebTasks),

            Promise.all(currentNewsTasks),
            Promise.all(currentWebTasks)
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

        const rawHistoricalNews =
        historicalNewsResults.flat();

        const rawHistoricalWeb =
            historicalWebResults.flat();

        const rawCurrentNews =
            currentNewsResults.flat();

        const rawCurrentWeb =
            currentWebResults.flat();

        //
        // LIMITES POR FONTE
        //
        let news = [
        ...normalizeDocs(
            rawNews,
            "news"
        ),

        ...normalizeDocs(
            rawHistoricalNews,
            "news",
            "historical"
        ),

        ...normalizeDocs(
            rawCurrentNews,
            "news",
            "current"
        )
    ];

    let web = [
        ...normalizeDocs(
            rawWeb,
            "web"
        ),

        ...normalizeDocs(
            rawHistoricalWeb,
            "web",
            "historical"
        ),

        ...normalizeDocs(
            rawCurrentWeb,
            "web",
            "current"
        )
    ];


        news = news.slice(
            0,
            LIMITS.MAX_RESULTS_PER_SOURCE
        );

        web = web.slice(
            0,
            LIMITS.MAX_RESULTS_PER_SOURCE
        );

        console.log("\n[NEWS DOCS]");
        console.log(news.length);

        console.log("\n[WEB DOCS]");
        console.log(web.length);

        
       
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