const Groq = require('groq-sdk');

let client;

function getClient() {
  if (!client) {
    if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is not configured.');
    client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return client;
}

async function generateSalesBrief(dataText) {
  const groq = getClient();

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: 'You are a senior business analyst. Always respond with clean HTML only — no markdown, no code fences.',
      },
      {
        role: 'user',
        content: `
You have been given the following raw sales data:

--- BEGIN DATA ---
${dataText}
--- END DATA ---

Write a concise professional executive sales brief for leadership.
Structure your response using HTML tags (h2, p, ul, li, strong, table, tr, th, td).
Include:
1. Executive Summary – 2-3 sentence overview
2. Key Highlights – Top 3-5 bullet points
3. Revenue Breakdown – HTML table by category/region
4. Risks & Concerns – cancelled orders, anomalies
5. Recommended Actions – 2-3 actionable recommendations

Output only HTML, nothing else.
        `.trim(),
      },
    ],
    temperature: 0.7,
    max_tokens: 1500,
  });

  return completion.choices[0].message.content;
}

module.exports = { generateSalesBrief };