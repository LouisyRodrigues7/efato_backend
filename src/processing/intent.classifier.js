/*
=========================================================
intent.classifier.js
=========================================================

Responsável por detectar a intenção da pergunta.

Exemplos:
- taxation_change
- fake_news
- political_event
- economic_policy

A intenção influencia:
- fontes utilizadas
- estratégia de retrieval
- comportamento da pipeline

=========================================================
*/

const POLITICAL_TERMS = [

    //
    // política geral
    //
    "política",
    "governo",
    "presidente",
    "senador",
    "deputado",
    "prefeito",
    "governador",
    "ministro",
    "vereador",

    //
    // instituições
    //
    "câmara",
    "senado",
    "stf",
    "supremo",
    "tse",
    "planalto",

    //
    // eleições
    //
    "eleição",
    "eleitoral",
    "urna",
    "campanha",
    "votação",

    //
    // legislação
    //
    "lei",
    "pec",
    "projeto",
    "medida provisória",

    //
    // economia pública
    //
    "imposto",
    "tributo",
    "taxa",
    "gasto público"
];

//
// DETECTA NOMES PRÓPRIOS
// Ex:
// "o que lula falou"
// "quem é haddad"
// "bolsonaro foi ao stf"
//

const containsPoliticalEntity = (
    text
) => {

    //
    // palavras iniciando com maiúscula
    //
    const matches =
        text.match(
            /\b[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç]+\b/g
        ) || [];

    //
    // evita palavras comuns
    //
    const blacklist = [
        "Qual",
        "Quando",
        "Onde",
        "Como",
        "Porque",
        "Quem"
    ];

    const filtered =
        matches.filter(word =>
            !blacklist.includes(word)
        );

    return filtered.length > 0;
};

export const classifyIntent = async (
    question
) => {

    const lower =
        question.toLowerCase();

    //
    // DETECÇÃO POR TERMOS
    //
    const hasPoliticalTerm =
        POLITICAL_TERMS.some(term =>
            lower.includes(term)
        );

    //
    // DETECÇÃO POR ENTIDADE
    //
    const hasPoliticalEntity =
        containsPoliticalEntity(question);

    //
    // FORA DO ESCOPO
    //
    if (
        !hasPoliticalTerm &&
        !hasPoliticalEntity
    ) {

        return {

            intent: "out_of_scope",

            isPolitical: false,

            requiresRealtime: false,

            requiresOfficialSource: false,

            requiresNews: false
        };
    }

    //
    // TAXAÇÃO
    //
    if (
        lower.includes("imposto") ||
        lower.includes("tribut") ||
        lower.includes("taxa")
    ) {

        return {

            intent: "taxation_change",

            isPolitical: true,

            requiresRealtime: true,

            requiresOfficialSource: true,

            requiresNews: true
        };
    }

    //
    // STF / LEIS
    //
    if (
        lower.includes("stf") ||
        lower.includes("supremo") ||
        lower.includes("lei") ||
        lower.includes("projeto")
    ) {

        return {

            intent: "law_status",

            isPolitical: true,

            requiresRealtime: true,

            requiresOfficialSource: true,

            requiresNews: true
        };
    }

    //
    // VOTAÇÃO
    //
    if (
        lower.includes("votou") ||
        lower.includes("votação")
    ) {

        return {

            intent: "voting_history",

            isPolitical: true,

            requiresRealtime: false,

            requiresOfficialSource: true,

            requiresNews: false
        };
    }

    //
    // DEFAULT POLÍTICO
    //
    return {

        intent: "politician_info",

        isPolitical: true,

        requiresRealtime: true,

        requiresOfficialSource: true,

        requiresNews: true
    };
};