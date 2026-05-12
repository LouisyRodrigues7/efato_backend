import { callGemini } from "../llm/gemini.client.js";

export const classifyIntent = async (question) => {

    const prompt = `
Classifique a intenção da pergunta política/econômica.

Retorne APENAS JSON válido:

{
  "intent": "",
  "requiresRealtime": true,
  "requiresOfficialSource": true,
  "requiresNews": true
}

Intents:
- politician_info
- voting_history
- economic_news
- taxation_change
- law_status
- corruption_case
- executive_action
- international_trade
- fake_news_check

Pergunta:
${question}
`;

    const res = await callGemini(prompt);

    try {
        return JSON.parse(res.replace(/```json|```/g, "").trim());
    } catch {

        return {
            intent: "unknown",
            requiresRealtime: true,
            requiresOfficialSource: true,
            requiresNews: true
        };
    }
};