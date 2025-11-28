
const resolveGeminiConfig = () => {
  const key =
    (process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_GENAI_KEY ||
      "").trim();
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const endpoint =
    process.env.GEMINI_ENDPOINT ||
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  return { key, model, endpoint };
};

const PROMPT = `You are an AI that reads business card images and returns structured contact data.
Respond ONLY with valid JSON matching this schema:
{
  "fields": {
    "companyName": "",
    "contactPerson": "",
    "designation": "",
    "email": "",
    "mobile": "",
    "website": "",
    "address": "",
    "typeOfVisitor": "",
    "interestedProducts": [],
    "remarks": ""
  },
  "extractedText": "verbatim text you read from the card"
}
Use empty strings when data is missing. For multiple phone numbers, keep the main mobile.`;

export async function parseBusinessCardImage(base64Image, mimeType = "image/jpeg") {
  const { key: apiKey, endpoint } = resolveGeminiConfig();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY (or GOOGLE_API_KEY) is not configured on the backend");
  }

  const body = {
    contents: [
      {
        role: "user",
        parts: [
          { text: PROMPT },
          {
            inline_data: {
                mime_type: mimeType,
                data: base64Image,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
    },
  };

  const fetchFn = typeof fetch === "function"
    ? fetch
    : (await import("node-fetch")).default;

  const response = await fetchFn(`${endpoint}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json();
  if (!response.ok) {
    const message = payload?.error?.message || "Gemini API request failed";
    throw new Error(message);
  }

  const candidates = payload?.candidates || [];
  const text = candidates
    .flatMap((c) => c.content?.parts || [])
    .map((p) => p.text || "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error("Failed to parse Gemini response");
  }

  const fields = parsed.fields || parsed;
  return {
    fields: {
      companyName: fields.companyName || fields.company || "",
      contactPerson: fields.contactPerson || fields.name || "",
      designation: fields.designation || fields.title || "",
      email: fields.email || "",
      mobile: fields.mobile || fields.phone || "",
      website: fields.website || "",
      address: fields.address || "",
      typeOfVisitor: fields.typeOfVisitor || "",
      interestedProducts: Array.isArray(fields.interestedProducts) ? fields.interestedProducts : [],
      remarks: fields.remarks || ""
    },
    rawText: parsed.extractedText || "",
  };
}

