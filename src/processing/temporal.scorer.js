import { differenceInDays } from "date-fns";

export const applyRecencyScore = (docs) => {

    const now = new Date();

    return docs.map(doc => {

        if (!doc.data) return doc;

        const days = differenceInDays(now, new Date(doc.data));

        const boost = Math.max(0, 30 - days);

        return {
            ...doc,
            score: (doc.score || 0) + boost
        };
    });
};