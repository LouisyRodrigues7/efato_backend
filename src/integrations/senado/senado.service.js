import axios from "axios";

const BASE_URL =
  "https://legis.senado.leg.br/dadosabertos";

//
// Buscar senadores
//
export const searchSenador = async (nome) => {

  try {

    const response = await axios.get(
      `${BASE_URL}/senador/lista/atual`
    );

    const parlamentares =
      response.data
      .ListaParlamentarEmExercicio
      .Parlamentares
      .Parlamentar;

    const filtered = parlamentares.filter((p) => {

      const nomeParlamentar =
        p.IdentificacaoParlamentar
        ?.NomeParlamentar;

      return nomeParlamentar
        ?.toLowerCase()
        .includes(nome.toLowerCase());
    });

    return filtered.map((p) => ({

      codigo:
        p.IdentificacaoParlamentar
        ?.CodigoParlamentar,

      nome:
        p.IdentificacaoParlamentar
        ?.NomeParlamentar,

      partido:
        p.IdentificacaoParlamentar
        ?.SiglaPartidoParlamentar,

      uf:
        p.IdentificacaoParlamentar
        ?.UfParlamentar,

      email:
        p.IdentificacaoParlamentar
        ?.EmailParlamentar
    }));

  } catch (error) {

    console.error(
      "ERRO API SENADO:",
      error.response?.data || error.message
    );

    return [];
  }
};