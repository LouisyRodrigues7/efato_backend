export const compressContext = (docs) => {

    return docs.slice(0, 10).map(doc => ({

        titulo: doc.titulo,
        resumo: (doc.texto || "").slice(0, 300),
        fonte: doc.fonte,
        data: doc.data,
        url: doc.url
    }));
};