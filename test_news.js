import {
  searchNews
} from "./src/integrations/news/news.service.js";

async function test() {

  const data =
    await searchNews(
      "Lula economia"
    );

  console.log(
    JSON.stringify(data, null, 2)
  );
}

test();