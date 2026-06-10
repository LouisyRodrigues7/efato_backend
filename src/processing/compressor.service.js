/*
=========================================================
compressor.service.js
=========================================================

Responsável por comprimir documentos longos
em resumos relevantes.

Funções:
- Extrair frases importantes
- Reduzir tamanho do contexto
- Priorizar informações úteis

Benefícios:
- Menor consumo de tokens
- Melhor desempenho
- Respostas mais rápidas

=========================================================
*/
const MAX_DOCS = 5;

const MAX_SUMMARY_LENGTH = 250;

const normalizeText = (text = "") => {

    return text
        .replace(/\s+/g, " ")
        .replace(/\n+/g, " ")
        .trim();
};

const splitSentences = (text = "") => {

    return normalizeText(text)
        .split(/(?<=[.!?])\s+/);
};

const buildSmartSummary = (
    text = "",
    queryTerms = []
) => {

    if (!text) {
        return "";
    }

    const sentences =
        splitSentences(text);

    //
    // score por relevância
    //
    const ranked = sentences.map(sentence => {

        const lower =
            sentence.toLowerCase();

        let score = 0;

        for (const term of queryTerms) {

            if (lower.includes(term)) {
                score += 3;
            }
        }

        //
        // bônus para frases informativas
        //
        if (
            lower.includes("imposto") ||
            lower.includes("governo") ||
            lower.includes("lei") ||
            lower.includes("ministério") ||
            lower.includes("receita") ||
            lower.includes("federal")
        ) {
            score += 2;
        }

        //
        // bônus para números/datas
        //
        if (/\d/.test(sentence)) {
            score += 1;
        }

        return {
            sentence,
            score
        };
    });

    //
    // ordena pelas melhores frases
    //
    ranked.sort(
        (a, b) => b.score - a.score
    );

    let summary = "";

    for (const item of ranked) {

        if (
            summary.length +
            item.sentence.length >
            MAX_SUMMARY_LENGTH
        ) {
            continue;
        }

        summary += item.sentence + " ";

        //
        // já suficiente
        //
        if (
            summary.length >
            MAX_SUMMARY_LENGTH * 0.8
        ) {
            break;
        }
    }

    //
    // fallback
    //
    if (!summary.trim()) {

        summary =
            normalizeText(text)
                .slice(0, MAX_SUMMARY_LENGTH);
    }

    return summary.trim();
};

export const compressContext = (
    docs,
    question = ""
) => {

    try {

        if (!docs?.length) {
            return [];
        }

        const queryTerms =
            question
                .toLowerCase()
                .split(" ")
                .filter(
                    term => term.length > 3
                );

        const compressed = docs
            .slice(0, MAX_DOCS)
            .map(doc => {

                const text =
                normalizeText(
                    doc.texto ||
                    doc.titulo ||
                    ""
                );

                const smartSummary =
                    buildSmartSummary(
                        text,
                        queryTerms
                    );

                return {

                    titulo:
                        doc.titulo ||
                        "Sem título",

                    resumo:
                        smartSummary,

                    fonte:
                        doc.fonte ||
                        doc.source ||
                        "Fonte desconhecida",

                    data:
                        doc.data ||
                        doc.publishedDate ||
                        null,

                    url:
                        doc.url || null,

                    score:
                        doc.score || 0
                };
            })
            .filter(doc =>
                doc.resumo 
            );

        //
        // debug
        //
        console.log(
            "\n[COMPRESSED CONTEXT]"
        );

        console.log(
            compressed.map(doc => ({
                titulo: doc.titulo,
                resumoSize:
                    doc.resumo.length,
                score: doc.score
            }))
        );

        return compressed;

    } catch (error) {

        console.error(
            "\n[COMPRESSOR ERROR]"
        );

        console.error(error);

        return docs.slice(0, 3).map(doc => ({

            titulo:
                doc.titulo || "",

            resumo:
                normalizeText(
                    doc.texto || ""
                ).slice(0, 250),

            fonte:
                doc.fonte ||
                "Fonte desconhecida",

            data:
                doc.data || null,

            url:
                doc.url || null
        }));
    }
};