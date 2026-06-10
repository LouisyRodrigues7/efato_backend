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

const LEGAL_TERMS = [
    "preso",
    "prisao",
    "condenado",
    "condenacao",
    "solto",
    "soltura",
    "investigado",
    "processo"
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


const expandTerms = (terms) => {

    const expanded = new Set(terms);

    if (
        terms.some(term =>
            LEGAL_TERMS.includes(term)
        )
    ) {

        [
            "prisao",
            "condenacao",
            "condenado",
            "solto",
            "soltura",
            "liberdade",
            "processo",
            "tribunal",
            "stf"
        ].forEach(term =>
            expanded.add(term)
        );
    }

    return [...expanded];
};

//
// CALCULA SCORE
//
const calculateScore = (
    terms,
    title,
    content
) => {

    let score = 0;

    for (const term of terms) {

        if (
            title.includes(term)
        ) {
            score += 5;
        }

        if (
            content.includes(term)
        ) {
            score += 2;
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
        expandTerms(
            extractTerms(question)
        );

    console.log("\n[RELEVANCE TERMS]");
    console.log(terms);

    //
    // SCORE DOCUMENTOS
    //
    const scoredDocs =
        docs.map(doc => {

            const title =
            normalizeText(
                doc.titulo || ""
            );

        const content =
            normalizeText(
                doc.texto || ""
            );

        const score =
            calculateScore(
                terms,
                title,
                content
            );

        console.log(
        docs.map(doc => ({
            titulo: doc.titulo,
            textoSize: doc.texto?.length
        }))
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

        .filter(doc =>
            doc.relevanceScore > 0
        )

        .sort(
            (a,b) =>
                b.relevanceScore -
                a.relevanceScore
        )

        .slice(0, 20);

    console.log("\n[RELEVANT DOCS]");
    console.log(filtered.length);

    return filtered;
};