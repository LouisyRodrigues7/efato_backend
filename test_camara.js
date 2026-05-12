import {
  searchDeputado
} from "./src/integrations/camara/camara.service.js";

async function test() {

  const data =
    await searchDeputado("Lula");

  console.log(
    JSON.stringify(data, null, 2)
  );
}

test();