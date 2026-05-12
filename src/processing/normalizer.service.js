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