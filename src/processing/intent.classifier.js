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

const FACT_CHECK_TERMS = [

    "é verdade",
    "verdade que",
    "é falso",
    "falso que",
    "boato",
    "fake",
    "fake news",
    "mentira",
    "isso aconteceu",
    "procede",
    "confere",
    "é real"
];

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
// ENTIDADES POLÍTICAS IMPORTANTES
// melhora perguntas como:
// "lula falou sobre economia"
// "bolsonaro foi preso"
// "haddad anunciou imposto"
//

export const POLITICAL_ENTITIES = [

    //
    // presidentes
    //
    "lula",
    "bolsonaro",
    "dilma",
    "temer",
    "fhc",

    //
    // ministros / políticos 
    //
    "haddad",
    "alckmin",
    "moraes",
    "barroso",
    "zema",
    "tarcisio",
    "tarcisio",
    "nikolas",
    "boulos",
    "ciro",
    "marina",
    "tebet",
    "flavio bolsonaro",

    //
    // partidos
    //
    "pt",
    "pl",
    "psdb",
    "mdb",
    "pdt",
    "psol"
];

//
// DETECTA NOMES PRÓPRIOS
// Ex:
// "O que Lula falou"
// "Quem é Haddad"
// "Bolsonaro foi ao STF"
//

const containsPoliticalEntity = (
    text
) => {

    if (!text) {
        return false;
    }

    //
    // normaliza
    //
    const lower =
        text.toLowerCase();

    //
    // MATCH DIRETO
    // agora aceita:
    // lula
    // Lula
    // LULA
    //
    const hasKnownEntity =
        POLITICAL_ENTITIES.some(entity =>
            lower.includes(entity)
        );

    if (hasKnownEntity) {
        return true;
    }

    //
    // fallback:
    // detecta palavras iniciando com maiúscula
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
        "Quem",
        "O",
        "A",
        "Os",
        "As"
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

    //
    // proteção
    //
    if (
        !question ||
        typeof question !== "string"
    ) {

        return {

            intent: "out_of_scope",

            isPolitical: false,

            requiresRealtime: false,

            requiresOfficialSource: false,

            requiresNews: false
        };
    }

    const lower =
        question.toLowerCase();

    const isFactCheck =
    FACT_CHECK_TERMS.some(term =>
        lower.includes(term)
    );

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

    // FACT-CHECK
     if (isFactCheck) {

        return {

            intent: "fact_check",
            topic: "fact_check",
            isPolitical: true,
            requiresRealtime: true,
            requiresOfficialSource: true,
            requiresNews: true
        };
    }

    // CARGO PÚBLICO
    if (
        lower.includes("cargo") ||
        lower.includes("mandato") ||
        lower.includes("presidente") ||
        lower.includes("senador") ||
        lower.includes("deputado")
    ) {

        return {

            intent: "public_office",
            topic: "public_office",
            isPolitical: true,
            requiresRealtime: false,
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

    // STATUS
    if (
        lower.includes("preso") ||
        lower.includes("prisão") ||
        lower.includes("solto") ||
        lower.includes("soltura") ||
        lower.includes("condenado") ||
        lower.includes("condenação") ||
        lower.includes("investigado") ||
        lower.includes("acusado") ||
        lower.includes("processo")
        ) {
        return {
            intent: "person_status",
            topic: "legal_status",
            requiresRealtime: true,
            isPolitical: true,
            requiresOfficialSource: true,
            requiresNews: true,
            requiresCurrentStatus: true,
            
        }
    }       


    // DISCURSO
    if (
        lower.includes("falou") ||
        lower.includes("disse") ||
        lower.includes("afirmou") ||
        lower.includes("declarou") ||
        lower.includes("anunciou")
    ) {
    return  {
        intent: "political_statement",
        topic: "statement",
        requiresRealtime: true,
        requiresNews: true
        }
    }

    // AÇÃO GOVERNAMENTAL
    if (
        lower.includes("anunciou") ||
        lower.includes("criou") ||
        lower.includes("lançou") ||
        lower.includes("programa") ||
        lower.includes("decreto")
    ) {
        return {
        intent: "government_action",
        topic: "government_action",
        requiresRealtime: true,
        requiresNews: true
    }
}

    //
    // DEFAULT POLÍTICO
    //
    return {

        intent: "politician_info",

        isPolitical: true,

        requiresRealtime: true,

        requiresOfficialSource: true,

        requiresNews: true,

        requiresNews: true,
    
    };
};