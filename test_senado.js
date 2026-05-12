import {
  searchSenador
} from "./src/integrations/senado/senado.service.js";

async function test() {

  const data =
    await searchSenador("Humberto");

  console.log(
    JSON.stringify(data, null, 2)
  );
}

test();