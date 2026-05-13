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
export const classifyIntent = async (question) => {

    const text = question.toLowerCase();

    //
    // TAXAÇÃO / IMPOSTOS
    //
    if (
        text.includes("imposto") ||
        text.includes("taxa") ||
        text.includes("tribut") ||
        text.includes("shein") ||
        text.includes("aliexpress") ||
        text.includes("importação")
    ) {

        return {
            intent: "taxation_change",
            requiresRealtime: true,
            requiresOfficialSource: true,
            requiresNews: true
        };
    }

    //
    // STF / LEIS
    //
    if (
        text.includes("stf") ||
        text.includes("supremo") ||
        text.includes("lei") ||
        text.includes("projeto")
    ) {

        return {
            intent: "law_status",
            requiresRealtime: true,
            requiresOfficialSource: true,
            requiresNews: true
        };
    }

    //
    // VOTAÇÃO
    //
    if (
        text.includes("votou") ||
        text.includes("votação")
    ) {

        return {
            intent: "voting_history",
            requiresRealtime: false,
            requiresOfficialSource: true,
            requiresNews: false
        };
    }

    //
    // POLÍTICO
    //
    if (
        text.includes("deputado") ||
        text.includes("senador") ||
        text.includes("presidente") ||
        text.includes("lula") ||
        text.includes("bolsonaro")
    ) {

        return {
            intent: "politician_info",
            requiresRealtime: false,
            requiresOfficialSource: true,
            requiresNews: true
        };
    }

    //
    // DEFAULT
    //
    return {
        intent: "economic_news",
        requiresRealtime: true,
        requiresOfficialSource: false,
        requiresNews: true
    };
};