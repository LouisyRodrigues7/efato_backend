export const buildPrompt = ({
  question,
  entities,
  context,
  intent
}) => {

  return `
Você é um sistema RAG político baseado em evidências reais.

REGRAS:
- Use apenas o contexto fornecido
- Considere múltiplas fontes
- Avalie confiabilidade
- Indique divergências
- Não invente fatos

INTENT:
${intent?.intent}

PERGUNTA:
${question}

ENTIDADES:
${JSON.stringify(entities, null, 2)}

CONTEXTO:
${JSON.stringify(context, null, 2)}

Responda em JSON:
{
  "resumo": "",
  "analise": "",
  "evidencias": [],
  "confiabilidade": "",
  "divergencias": []
}
`;
};