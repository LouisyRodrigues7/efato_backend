/*
=========================================================
deduplicator.service.js
=========================================================

Responsável por remover documentos repetidos
ou extremamente parecidos.

Objetivos:
- Reduzir redundância
- Melhorar diversidade de fontes
- Evitar contexto duplicado

=========================================================
*/
export const deduplicateDocuments = (docs) => {

    const map = new Map();

    for (const doc of docs) {

        const key =
            (doc.url && doc.url.trim()) ||
            (doc.titulo ? doc.titulo.slice(0, 100) : Math.random());

        if (!map.has(key)) {
            map.set(key, doc);
        }
    }

    return Array.from(map.values());
};