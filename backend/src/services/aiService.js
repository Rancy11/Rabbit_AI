const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI;

function getClient() {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured.');
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

/**
 * Generate a professional sales brief from tabular data text.
 * @param {string} dataText - Plain-text representation of the sales data
 * @returns {Promise<string>} - HTML-formatted executive summary
 */
async function generateSalesBrief(dataText) {
  const client = getClient();
  const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
You are a senior business analyst at a B2B sales company. 
You have been given the following raw sales data:

--- BEGIN DATA ---
${dataText}
--- END DATA ---

Write a concise, professional executive sales brief for leadership. 
Structure your response in clear sections using HTML tags (use <h2>, <p>, <ul>, <li>, <strong>, <table>, <tr>, <th>, <td>).
Include:
1. **Executive Summary** – 2-3 sentence overview of overall performance
2. **Key Highlights** – Top 3–5 bullet points on wins, trends, or anomalies
3. **Revenue Breakdown** – A small HTML table summarizing revenue by category or region if applicable
4. **Risks & Concerns** – Any cancelled orders, underperforming regions, or anomalies
5. **Recommended Actions** – 2-3 actionable recommendations for leadership

Keep the tone professional, data-driven, and concise. Output only the HTML content, no markdown or code fences.
`.trim();

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

module.exports = { generateSalesBrief };
