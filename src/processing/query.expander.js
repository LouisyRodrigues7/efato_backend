/*
=========================================================
query.expander.js
=========================================================

Responsável por expandir a pergunta original
em múltiplas queries de busca.

Objetivo:
Melhorar recuperação de documentos.

Exemplo:
"o governo aumentou imposto?"

Expansões:
- imposto importação Brasil
- aumento tributário governo
- imposto Receita Federal

=========================================================
*/

export const expandQuery = (text, entities = {}) => {

    const normalized = text
        .toLowerCase()
        .trim();

    const result = {
        keywords: [],
        relatedTerms: [],
        topics: [],
        searchQueries: []
    };

    // -------------------------
    // 1. DETECÇÃO DE PADRÕES
    // -------------------------

    const patterns = {
        taxation: [
            "imposto",
            "taxa",
            "tributação",
            "tarifa",
            "importação",
            "remessa conforme"
        ],

        government: [
            "governo",
            "presidente",
            "ministério",
            "haddad",
            "planalto"
        ],

        judiciary: [
            "stf",
            "supremo",
            "decisão",
            "liminar",
            "inconstitucional"
        ],

        economy: [
            "economia",
            "inflação",
            "juros",
            "selic",
            "mercado"
        ],

        trade: [
            "exportação",
            "importação",
            "china",
            "eua",
            "comércio exterior"
        ]
    };

    // -------------------------
    // 2. DETECÇÃO DE TÓPICOS
    // -------------------------

    const detectedTopics = [];

    for (const [topic, words] of Object.entries(patterns)) {
        if (words.some(w => normalized.includes(w))) {
            detectedTopics.push(topic);
        }
    }

    result.topics = detectedTopics;

    // -------------------------
    // 3. EXPANSÃO SEMÂNTICA
    // -------------------------

    const semanticMap = {

        taxation: [
            "imposto de importação",
            "taxação compras internacionais",
            "Shein taxa Brasil",
            "AliExpress imposto",
            "Receita Federal importação",
            "remessa conforme 50 dólares"
        ],

        government: [
            "política econômica governo federal",
            "decisões ministério da fazenda",
            "medidas econômicas Brasil",
            "declaração presidente Lula"
        ],

        judiciary: [
            "decisão STF Brasil",
            "supremo tribunal federal julgamento",
            "inconstitucionalidade lei",
            "liminar STF governo"
        ],

        economy: [
            "inflação Brasil hoje",
            "taxa selic atual",
            "mercado financeiro Brasil",
            "economia brasileira notícias"
        ],

        trade: [
            "comércio Brasil China importação",
            "balança comercial Brasil",
            "tarifas internacionais Brasil",
            "acordo comercial EUA Brasil"
        ]
    };

    // adiciona termos relacionados
    for (const topic of detectedTopics) {
        result.relatedTerms.push(...(semanticMap[topic] || []));
    }

    // -------------------------
    // 4. KEYWORDS BASE
    // -------------------------

    const baseWords = normalized
        .split(" ")
        .filter(w => w.length > 3);

    result.keywords.push(...baseWords);

    // -------------------------
    // 5. ENTIDADES (se existirem)
    // -------------------------

    if (entities?.pessoa) {
        result.relatedTerms.push(entities.pessoa);
    }

    if (entities?.tema) {
        result.relatedTerms.push(entities.tema);
    }

    // -------------------------
    // 6. GERAÇÃO DE QUERIES
    // -------------------------

    const baseQuery = text;

    const variations = [
        `${baseQuery} Brasil`,
        `${baseQuery} governo`,
        `${baseQuery} notícia`,
        `${baseQuery} atual`,
        ...result.relatedTerms.slice(0, 5).map(t => `${t} Brasil`),
        ...detectedTopics.map(t => `${t} Brasil política`)
    ];

    // remove duplicados
    result.searchQueries = [...new Set(variations)];

    return result;
};