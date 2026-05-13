/*
=========================================================
normalizer.service.js
=========================================================

Responsável pela normalização textual.

Funções:
- Remover caracteres desnecessários
- Padronizar strings
- Limpar espaços extras
- Facilitar matching textual

Importante para:
- filtros
- deduplicação
- comparação textual

=========================================================
*/
export const normalizeSource = (item) => {

    return {
        tipo: item.tipo || "unknown",
        fonte: item.fonte || item.url || "unknown",
        titulo: item.titulo || "",
        data: item.data || item.publishedAt || null,
        texto: item.texto || item.descricao || "",
        url: item.url || null,
        score: 0
    };
};

export const normalizeBatch = (items = []) => {
    return items.map(normalizeSource);
};