import { POLITICAL_ENTITIES }
from "./intent.classifier.js";

export const extractEntities = (
    question
) => {

    const lower =
        question.toLowerCase();

    const entities = {};

    for (
        const entity
        of POLITICAL_ENTITIES
    ) {

        if (
            lower.includes(entity)
        ) {

            entities.pessoa =
                entity;

            break;
        }
    }

    return entities;
};