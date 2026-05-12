import TavilyClient from "@tavily/core";

const client = new TavilyClient({
    apiKey: process.env.TAVILY_API_KEY
});

export const searchWeb = async (query) => {

    try {

        const res = await client.search({
            query,
            search_depth: "advanced",
            max_results: 5
        });

        return res.results.map(r => ({
            tipo: "web",
            titulo: r.title,
            texto: r.content,
            url: r.url,
            data: r.published_date
        }));

    } catch {
        return [];
    }
};