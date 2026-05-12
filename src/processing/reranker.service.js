export const rerankDocuments = async (query, docs) => {

    const q = query.toLowerCase();

    return docs
        .map(doc => {

            let score = 0;

            const text = (doc.texto || "").toLowerCase();
            const title = (doc.titulo || "").toLowerCase();

            // match simples (substitui embedding temporariamente)
            if (text.includes(q)) score += 2;
            if (title.includes(q)) score += 3;

            // bônus por presença parcial
            if (text.split(" ").some(w => q.includes(w))) score += 1;

            return {
                ...doc,
                score
            };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 15);
};