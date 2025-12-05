const resolveGeminiConfig = () => {
  const key =
    (process.env.GEMINI_API_KEY || "").trim();
  const model = process.env.GEMINI_MODEL || "gemini-2.5-pro";
  const endpoint =
    process.env.GEMINI_ENDPOINT ||
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  return { key, model, endpoint };
};

const PROMPT = `You are an expert AI specialized in extracting business card information. 
Carefully analyze the business card image and extract EVERY SINGLE DETAIL visible on the card.

Extract ALL information including:
- Company name (full name, any abbreviations, subsidiaries, divisions)
- Contact person's FULL name (first, middle, last name - extract everything)
- Job title/designation (exact title as written)
- ALL email addresses (if multiple, include all)
- ALL phone numbers (mobile, landline, fax - include country codes if visible)
- Website URLs (full URLs, including www if present)
- Complete address (street number, street name, city, state/province, postal code, country - extract every detail)
- Any product names, services, or business categories mentioned
- Any additional notes, taglines, slogans, or remarks
- Social media handles if present
- Any other text visible on the card

Return ONLY valid JSON matching this exact schema:
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
  "extractedText": "All text content extracted verbatim from the card, line by line, preserving original formatting"
}

CRITICAL RULES:
- Extract EVERY piece of text visible on the card - do not skip ANY information
- "contactPerson" = the human's full name (not company name)
- "designation" = the exact job title/position associated with contactPerson
- For phone numbers: include country code if visible, format as: +[country code][number]
- For addresses: include complete address with ALL details (street, city, state, postal code, country)
- For interestedProducts: extract ALL product names, services, or business categories mentioned (as array)
- For remarks: include taglines, slogans, additional notes, or any other text not fitting other fields
- "extractedText" should contain ALL text from the card verbatim, line by line
- Use empty strings/arrays ONLY when information is truly not present
- Be extremely thorough - extract every single detail you can see
- Respond with ONLY valid JSON, no markdown, no code blocks, no explanations`;

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
          { inline_data: { mime_type: mimeType, data: base64Image } },
          { text: PROMPT }  // text comes second
        ]
      },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
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
  if (!candidates.length) {
    throw new Error("Gemini returned no candidates");
  }

  const text = candidates
    .flatMap((c) => c.content?.parts || [])
    .map((p) => p.text || "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  console.log("\n=== RAW GEMINI RESPONSE ===");
  console.log(text);
  console.log("===========================\n");

  // Robust JSON parsing
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    // Try to extract JSON from response if wrapped in markdown or other text
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch (parseErr) {
        throw new Error(`Failed to parse Gemini JSON: ${parseErr.message}`);
      }
    } else {
      throw new Error(`Failed to parse Gemini response: ${err.message}`);
    }
  }

  const fields = parsed.fields || parsed;
  const result = {
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
    rawText: parsed.extractedText || text || "",
  };

  console.log("\n=== EXTRACTED TEXT (VERBATIM) ===");
  console.log(result.rawText);
  console.log("===================================\n");

  console.log("\n=== EXTRACTED FIELDS ===");
  console.log(JSON.stringify(result.fields, null, 2));
  console.log("========================\n");

  return result;
}
