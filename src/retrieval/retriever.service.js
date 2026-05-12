import { searchNews } from "../integrations/news/news.service.js";
import { searchWeb } from "./web.search.service.js";
import { searchDeputado } from "../integrations/camara/camara.service.js";
import { searchSenador } from "../integrations/senado/senado.service.js";

export const multiRetrieve = async (expanded, intent) => {

    const queries = expanded.searchQueries;

    const newsPromises = queries.map(q => searchNews(q));
    const webPromises = queries.map(q => searchWeb(q));

    const [news, web] = await Promise.all([
        Promise.all(newsPromises),
        Promise.all(webPromises)
    ]);

    return [
        ...news.flat(),
        ...web.flat()
    ];
};