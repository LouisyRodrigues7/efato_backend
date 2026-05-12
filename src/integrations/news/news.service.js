import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_KEY =
  process.env.NEWS_API_KEY;

const BASE_URL =
  "https://newsapi.org/v2/everything";

export const searchNews = async (
  query
) => {

  try {

    const response =
      await axios.get(BASE_URL, {
        params: {
          q: query,
          language: "pt",
          sortBy: "publishedAt",
          pageSize: 5,
          apiKey: API_KEY
        },
        timeout: 10000
      });

    const articles =
      response.data?.articles || [];

    // remove artigos inválidos
    const filtered =
      articles.filter(article =>
        article.title &&
        article.description
      );

    // remove duplicados
    const unique =
      filtered.filter(
        (article, index, self) =>
          index === self.findIndex(
            a => a.url === article.url
          )
      );

    return unique.map(article => ({

      titulo:
        article.title,

      descricao:
        article.description,

      fonte:
        article.source?.name,

      url:
        article.url,

      data:
        article.publishedAt,

      relevancia:
        calculateRelevance(
          query,
          article
        )
    }))
    .sort(
      (a, b) =>
        b.relevancia - a.relevancia
    );

  } catch (error) {

    console.error(
      "ERRO NEWS API:",
      error.response?.data || error.message
    );

    return [];
  }
};

const calculateRelevance = (
  query,
  article
) => {

  const text = `
    ${article.title || ""}
    ${article.description || ""}
  `
    .toLowerCase();

  const terms =
    query
      .toLowerCase()
      .split(" ");

  let score = 0;

  terms.forEach(term => {

    if (text.includes(term)) {
      score += 10;
    }
  });

  return score;
};