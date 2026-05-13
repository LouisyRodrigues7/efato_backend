/*
=========================================================
camara.service.js
=========================================================

Serviço de integração com APIs da Câmara dos Deputados.

Responsável por:
- Buscar projetos de lei
- Buscar deputados
- Consultar documentos oficiais
- Recuperar votações e discursos

Fonte oficial governamental.

=========================================================
*/
import axios from "axios";

const BASE_URL =
  "https://dadosabertos.camara.leg.br/api/v2";

export const searchDeputado = async (nome) => {

  try {

    const response = await axios.get(
      `${BASE_URL}/deputados`,
      {
        params: {
          nome
        },
        timeout: 10000
      }
    );

    const deputados =
      response.data?.dados || [];

    const search =
      nome
        .toLowerCase()
        .trim();

    const ranked = deputados
      .map(dep => {

        const depNome =
          dep.nome
            .toLowerCase();

        let relevancia = 0;

        // match exato
        if (depNome === search) {
          relevancia = 100;
        }

        // começa com
        else if (
          depNome.startsWith(search)
        ) {
          relevancia = 80;
        }

        // contém
        else if (
          depNome.includes(search)
        ) {
          relevancia = 50;
        }

        return {
          ...dep,
          relevancia
        };
      })
      .filter(dep =>
        dep.relevancia > 0
      )
      .sort(
        (a, b) =>
          b.relevancia - a.relevancia
      );

    return ranked;

  } catch (error) {

    console.error(
      "ERRO API CÂMARA:",
      error.response?.data || error.message
    );

    return [];
  }
};