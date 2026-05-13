/*
=========================================================
reranker.service.js
=========================================================

Responsável por reordenar documentos
por relevância.

Utiliza:
- matching textual
- score semântico
- peso em títulos
- frequência de termos

Objetivo:
Priorizar melhores evidências.

=========================================================
*/
const STOP_WORDS = new Set([
    "a", "o", "e", "de", "da", "do", "das", "dos",
    "para", "por", "com", "sem", "um", "uma",
    "na", "no", "nas", "nos", "em", "sobre",
    "que", "como", "qual", "quais", "foi",
    "são", "ser", "ter", "tem", "mais",
    "menos", "ao", "aos", "às", "as"
]);

const normalize = (text = "") => {

    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
};

const tokenize = (text = "") => {

    return normalize(text)
        .split(" ")
        .filter(word =>
            word.length > 2 &&
            !STOP_WORDS.has(word)
        );
};

const countOccurrences = (
    text,
    term
) => {

    if (!text || !term) {
        return 0;
    }

    const regex =
        new RegExp(`\\b${term}\\b`, "gi");

    return (
        text.match(regex)?.length || 0
    );
};

export const rerankDocuments = async (
    query,
    docs
) => {

    try {

        if (!docs?.length) {
            return [];
        }

        const queryTerms =
            tokenize(query);

        const reranked = docs.map(doc => {

            const title =
                normalize(doc.titulo || "");

            const text =
                normalize(doc.texto || "");

            const source =
                normalize(doc.source || "");

            let score = 0;

            //
            // 1. MATCH EXATO DA QUERY
            //
            if (
                title.includes(
                    normalize(query)
                )
            ) {
                score += 15;
            }

            if (
                text.includes(
                    normalize(query)
                )
            ) {
                score += 10;
            }

            //
            // 2. MATCH POR TERMOS
            //
            let matchedTerms = 0;

            for (const term of queryTerms) {

                const titleCount =
                    countOccurrences(
                        title,
                        term
                    );

                const textCount =
                    countOccurrences(
                        text,
                        term
                    );

                if (
                    titleCount > 0 ||
                    textCount > 0
                ) {
                    matchedTerms++;
                }

                //
                // título vale mais
                //
                score += titleCount * 4;

                //
                // texto vale menos
                //
                score += textCount * 1.5;
            }

            //
            // 3. COBERTURA DA QUERY
            //
            const coverage =
                matchedTerms /
                Math.max(
                    queryTerms.length,
                    1
                );

            score += coverage * 20;

            //
            // 4. BÔNUS POR FONTE CONFIÁVEL
            //
            if (
                source.includes("gov") ||
                source.includes("camara") ||
                source.includes("senado")
            ) {
                score += 12;
            }

            if (
                source.includes("g1") ||
                source.includes("bbc") ||
                source.includes("reuters") ||
                source.includes("cnn") ||
                source.includes("estadao")
            ) {
                score += 8;
            }

            //
            // 5. PENALIDADE PARA TEXTO MUITO CURTO
            //
            if (text.length < 150) {
                score -= 8;
            }

            //
            // 6. BÔNUS PARA DOCUMENTOS RICOS
            //
            if (text.length > 1000) {
                score += 5;
            }

            //
            // 7. BÔNUS SE TIVER DATA
            //
            if (
                doc.publishedDate ||
                doc.data
            ) {
                score += 3;
            }

            return {

                ...doc,

                score: Number(
                    score.toFixed(2)
                ),

                matchedTerms,

                coverage: Number(
                    coverage.toFixed(2)
                )
            };
        });

        //
        // ORDENAÇÃO FINAL
        //
        reranked.sort(
            (a, b) =>
                (b.score || 0) -
                (a.score || 0)
        );

        //
        // DEBUG
        //
        console.log("\n[RERANK TOP 5]");

        reranked
            .slice(0, 5)
            .forEach((doc, index) => {

                console.log(
                    `#${index + 1}`,
                    {
                        score: doc.score,
                        coverage:
                            doc.coverage,
                        title:
                            doc.titulo
                    }
                );
            });

        //
        // LIMITA CONTEXTO FINAL
        //
        return reranked.slice(0, 10);

    } catch (error) {

        console.error(
            "\n[RERANK ERROR]"
        );

        console.error(error);

        return docs.slice(0, 10);
    }
};