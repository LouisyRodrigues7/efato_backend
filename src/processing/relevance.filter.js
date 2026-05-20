/*
=========================================================
relevance.filter.js
=========================================================

Responsável por filtrar documentos
com baixa relevância.

Funções:
- Medir similaridade textual
- Detectar termos importantes
- Remover ruído

Evita envio de contexto inútil para a IA.

=========================================================
*/
const STOPWORDS = [

    "sobre",
    "porque",
    "qual",
    "quais",
    "como",
    "para",
    "entre",
    "depois",
    "antes",
    "quando",
    "onde",
    "muito",
    "muita",
    "todos",
    "todas",
    "esses",
    "essas",
    "aquela",
    "aquele",
    "governo",
    "política",
    "politica",
    "brasil",
    "atual",
    "notícia",
    "noticias"
];

//
// NORMALIZA TEXTO
//
const normalizeText = (
    text = ""
) => {

    return text
        .toLowerCase()

        //
        // REMOVE ACENTOS
        //
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")

        //
        // REMOVE PONTUAÇÃO
        //
        .replace(/[^\w\s]/g, " ")

        //
        // REMOVE ESPAÇOS DUPLOS
        //
        .replace(/\s+/g, " ")

        .trim();
};

//
// EXTRAI TERMOS RELEVANTES
//
const extractTerms = (
    question
) => {

    return normalizeText(question)

        .split(" ")

        .map(term => term.trim())

        .filter(term =>
            term.length >= 4
        )

        .filter(term =>
            !STOPWORDS.includes(term)
        );
};

//
// CALCULA SCORE
//
const calculateScore = (
    terms,
    content
) => {

    let score = 0;

    for (const term of terms) {

        //
        // MATCH EXATO
        //
        if (content.includes(term)) {

            score += 2;
        }

        //
        // MATCH NO TÍTULO TEM PESO MAIOR
        //
        if (
            content
                .slice(0, 300)
                .includes(term)
        ) {

            score += 1;
        }
    }

    return score;
};

export const filterRelevantDocuments = (
    question,
    docs
) => {

    if (!docs?.length) {
        return [];
    }

    //
    // TERMOS RELEVANTES
    //
    const terms =
        extractTerms(question);

    console.log("\n[RELEVANCE TERMS]");
    console.log(terms);

    //
    // SCORE DOCUMENTOS
    //
    const scoredDocs =
        docs.map(doc => {

            const content =
                normalizeText(`

                    ${doc.titulo || ""}

                    ${doc.texto || ""}
                `);

            const score =
                calculateScore(
                    terms,
                    content
                );

            return {

                ...doc,

                relevanceScore:
                    score
            };
        });

    //
    // FILTRA
    //
    const filtered =
        scoredDocs

            //
            // SCORE MÍNIMO
            //
            .filter(doc =>
                doc.relevanceScore >= 3
            )

            //
            // ORDENA
            //
            .sort((a, b) =>
                b.relevanceScore -
                a.relevanceScore
            );

    console.log("\n[RELEVANT DOCS]");
    console.log(filtered.length);

    return filtered;
};