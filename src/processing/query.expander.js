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

export const expandQuery = (text, entities, intent = {}) => {

    const normalized = text
        .toLowerCase()
        .trim();

const result = {
    keywords: [],
    relatedTerms: [],
    topics: [],
    searchQueries: [],

    historicalQueries: [],
    currentQueries: []
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
        ],

       
    legal_status: [
        "preso",
        "prisão",
        "domiciliar",
        "condenado",
        "condenação",
        "solto",
        "soltura",
        "investigado",
        "acusado",
        "processo",
        "julgamento",
        "sentença",
        "recurso",
        "habeas corpus"
    ],

    person_info: [
        "quem é",
        "cargo",
        "mandato",
        "trajetória",
        "biografia"
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
        ],

        legal_status: [
        "{entity} preso STF",
        "{entity} prisão domiciliar",
        "{entity} condenação STF",
        "{entity} status jurídico",
        "{entity} recurso defesa",
        "{entity} habeas corpus",
        "{entity} solto quando",
        "{entity} prazo prisão"
    ],

    person_info: [
        "{entity} quem é",
        "{entity} cargo atual",
        "{entity} trajetória política",
        "{entity} biografia"
    ]

    };

    const intentExpansions = {

    legal_status: {

        historical: [
            "{entity} prisão",
            "{entity} condenação",
            "{entity} soltura"
        ],

        current: [
            "{entity} atualmente",
            "{entity} cargo atual",
            "{entity} presidente",
            "{entity} governo",
            "{entity} situação atual"
        ]
    },

    public_office: {
        historical: [
            "{entity} senador",
            "{entity} deputado",
            "{entity} ministro",
            "{entity} cargos públicos",
            "{entity} trajetória política"
        ],

        current: [
            "{entity} cargo atual",
            "{entity} mandato atual",
            "{entity} atualmente"
        ]
},

    election: {
        historical: [
            "{entity} eleição",
            "{entity} resultado eleitoral"
        ],

        current: [
            "{entity} votação"
        ]
    },


    statement: {

        current: [
            "{entity} declarou",
            "{entity} afirmou",
            "{entity} entrevista",
            "{entity} discurso",
            "{entity} pronunciamento",
            "{entity} falou sobre"
        ]
    },


    government_action: {

    current: [
        "medida do governo",
        "anúncio governo federal",
        "programa governo",
        "decreto governo",
        "ação governo",
        "anúncio"
    ]
},

    fact_check: {

    current: [

        "{entity} acusação",

        "{entity} investigação",

        "{entity} denúncia",

        "{entity} checagem",

        "{entity} nota oficial",

        "{entity} esclarecimento",

        "{entity} fato ou boato",

        "{entity} é verdade",

        "{entity} nota oficial",

        "{entity} defesa",

        "{entity} resposta",

        "{entity} esclarecimento"
        ]
    }
};


    const entity =
    entities?.pessoa || "";

    // adiciona termos relacionados
  for (const topic of detectedTopics) {
    const terms = semanticMap[topic] || [];

    const resolved = terms.map(term =>
        entity
            ? term.replace("{entity}", entity)
            : term.replace("{entity} ", "")   // remove placeholder se não há entidade
    );

    result.relatedTerms.push(...resolved);
}

if (
    entity &&
    intent?.topic &&
    intentExpansions[intent.topic]
) {

    const expansion =
        intentExpansions[intent.topic];

    if (expansion.historical) {

        result.historicalQueries.push(

            ...expansion.historical.map(
                term =>
                    term.replace(
                        "{entity}",
                        entity
                    )
            )
        );
    }

    if (expansion.current) {

        result.currentQueries.push(

            ...expansion.current.map(
                term =>
                    term.replace(
                        "{entity}",
                        entity
                    )
            )
        );
    }
}

    // -------------------------
    // 4. KEYWORDS BASE
    // -------------------------

    const baseWords = normalized
        .replace(/[^\w\sÀ-ÿ]/g, "")
        .split(/\s+/)
        .filter(word => word.length > 2);

    result.keywords.push(...baseWords);

    // -------------------------
    // 5. ENTIDADES (se existirem)
    // -------------------------

    if (entities?.pessoa) {
        result.relatedTerms.push(
            entities.pessoa
        );
    }

    if (entities?.tema) {
        result.relatedTerms.push(entities.tema);
    }

    // -------------------------
    // 6. GERAÇÃO DE QUERIES
    // -------------------------

    const baseQuery = text;

    const variations = [
        baseQuery,
        ...result.currentQueries,      
        ...result.historicalQueries,    
        ...result.relatedTerms,
        ...detectedTopics.map(topic => `${topic} política brasileira`)
    ];
    result.searchQueries = [

        ...new Set(
            variations
                .map(q => q.trim())
                .filter(Boolean)
        )

    ].slice(0, 20);

    result.historicalQueries = [

        ...new Set(
            result.historicalQueries
                .map(q => q.trim())
                .filter(Boolean)
        )

    ].slice(0, 10);

    result.currentQueries = [

        ...new Set(
            result.currentQueries
                .map(q => q.trim())
                .filter(Boolean)
        )

    ].slice(0, 10);

    return result;

    console.log(
    JSON.stringify(
        result,
        null,
        2
    )
);
};