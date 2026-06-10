/*
=========================================================
web.search.service.js
=========================================================

Serviço de busca web complementar.

Responsável por:
- Buscar páginas públicas
- Recuperar contexto adicional
- Complementar notícias e fontes oficiais

Pode utilizar:
- Tavily
- Search APIs
- motores de busca

=========================================================
*/
import { tavily } from "@tavily/core";

const client = tavily({
    apiKey: process.env.TAVILY_API_KEY
});

export const searchWeb = async (query) => {

    try {

        console.log("\n[TAVILY SEARCH]");
        console.log(query);

        const response = await client.search(query, {
            search_depth: "advanced",
            max_results: 5
        });

        console.log("\n[TAVILY RAW]");
       /* console.log(
        response.results.map(r => ({
            title: r.title,
            contentSize:
                r.content?.length || 0
        }))
        );*/

        if (!response.results) {
            return [];
        }

        return response.results.map(item => ({

            tipo: "web",

            fonte: item.url || "web",

            titulo: item.title || "",

            texto:
                item.content ||
                item.snippet ||
                "",

            url: item.url || "",

            data:
                item.published_date ||
                null,

            score:
                item.score || 0,

            metadata: item
        }));

    } catch (error) {

        console.error(
            "\n[TAVILY ERROR]"
        );

        console.error(error);

        return [];
    }
};