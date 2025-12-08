const resolveGeminiConfig = () => {
  const key =
    (process.env.GEMINI_API_KEY || "").trim();
  const model = process.env.GEMINI_MODEL || "gemini-flash-latest";
  const endpoint =
    process.env.GEMINI_ENDPOINT ||
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  return { key, model, endpoint };
};

const PROMPT = `Extract business card information from the image. Return ONLY valid JSON with no markdown, no code blocks, no explanations, no additional text.

Required JSON schema:
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
  "extractedText": ""
}

Rules:
- Extract ALL visible text from the card
- contactPerson = full name of the person
- designation = job title/position
- mobile = phone number with country code if visible (format: +[country][number])
- address = complete address with all details
- interestedProducts = array of product names/services mentioned
- remarks = taglines, slogans, additional notes
- extractedText = all text verbatim, line by line
- Use empty strings/arrays when information is not present
- Return ONLY the JSON object, nothing else`;

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
          { text: PROMPT }
        ]
      },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          fields: {
            type: "object",
            properties: {
              companyName: { type: "string" },
              contactPerson: { type: "string" },
              designation: { type: "string" },
              email: { type: "string" },
              mobile: { type: "string" },
              website: { type: "string" },
              address: { type: "string" },
              typeOfVisitor: { type: "string" },
              interestedProducts: { type: "array", items: { type: "string" } },
              remarks: { type: "string" }
            },
            required: ["companyName", "contactPerson", "designation", "email", "mobile", "website", "address", "typeOfVisitor", "interestedProducts", "remarks"]
          },
          extractedText: { type: "string" }
        },
        required: ["fields", "extractedText"]
      },
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

  // Clean and parse JSON response
  let cleanedText = text.trim();
  
  // Remove markdown code blocks if present
  cleanedText = cleanedText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  
  // Remove any leading/trailing non-JSON text
  const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleanedText = jsonMatch[0];
  }

  // Robust JSON parsing
  let parsed;
  try {
    parsed = JSON.parse(cleanedText);
  } catch (err) {
    // Check if JSON is incomplete (common issue)
    if (err.message.includes("Unexpected end of JSON input") || err.message.includes("end of data")) {
      // Try to fix incomplete JSON by closing unclosed structures
      let fixedJson = cleanedText;
      const openBraces = (fixedJson.match(/\{/g) || []).length;
      const closeBraces = (fixedJson.match(/\}/g) || []).length;
      const openBrackets = (fixedJson.match(/\[/g) || []).length;
      const closeBrackets = (fixedJson.match(/\]/g) || []).length;
      
      // Close unclosed brackets first
      if (openBrackets > closeBrackets) {
        fixedJson += ']'.repeat(openBrackets - closeBrackets);
      }
      
      // Close unclosed braces
      if (openBraces > closeBraces) {
        fixedJson += '}'.repeat(openBraces - closeBraces);
      }
      
      try {
        parsed = JSON.parse(fixedJson);
        console.log("Warning: Fixed incomplete JSON response");
      } catch (fixErr) {
        throw new Error(`Failed to parse Gemini response: ${err.message}. Response may be truncated. Raw text length: ${text.length} chars`);
      }
    } else {
      throw new Error(`Failed to parse Gemini response: ${err.message}. Response: ${text.substring(0, 200)}...`);
    }
  }

  // Validate parsed structure
  if (!parsed || typeof parsed !== 'object') {
    throw new Error(`Invalid JSON structure: expected object, got ${typeof parsed}`);
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
