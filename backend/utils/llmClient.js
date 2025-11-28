import axios from "axios";

const getConfig = () => ({
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.OPENAI_MODEL || "gpt-4o-mini",
  baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1/chat/completions",
});

const SYSTEM_PROMPT = `You extract structured data from business card text.
Return STRICT JSON with this shape:
{
  "companyName": "",
  "contactPerson": "",
  "designation": "",
  "email": "",
  "mobile": "",
  "website": "",
  "address": "",
  "interestedProducts": [],
  "remarks": ""
}
Use empty strings for missing values and array for interestedProducts. Keep phone numbers in international format.`;

export async function parseBusinessCardWithLLM(text) {
  const { apiKey, model, baseUrl } = getConfig();

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await axios.post(
    baseUrl,
    {
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 20000,
    }
  );

  const content = response.data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("LLM returned empty response");
  }

  try {
    return JSON.parse(content);
  } catch (err) {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error(`Unable to parse LLM JSON: ${err.message}`);
  }
}

