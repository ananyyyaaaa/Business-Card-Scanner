import { parseBusinessCardWithLLM } from "./llmClient.js";

const COMPANY_KEYWORDS = [
  "private limited","pvt ltd","limited","ltd","inc","inc.","corporation","corp",
  "llc","company","co.","technologies","solutions","studio","agency","realty","partners",
  "consulting","consultants","services","enterprises","industries","group","sweets","snacks","bakery","distributor","wholesale"
];

const ADDRESS_KEYWORDS = [
  "street","st.","road","rd","avenue","ave","city","india","usa","uk","suite","sec","sector",
  "sco","lane","estate","pittsburgh","hyderabad","london","chandigarh","office","offices","campus","paris","new york","dubai","singapore"
];

const STOP_WORDS = ["investments","investment","management","property","development","technical","consultant","consultancy","manager","director"];
const NAME_PREFIXES = ["mr","mrs","ms","dr","shri","smt"];

const PHONE_PATTERN = "((?:\\+|00)?\\d[\\d\\s\\-().]{6,}\\d)";

const DESIGNATION_KEYWORDS = [
  "consultant","manager","director","engineer","designer","developer","executive",
  "specialist","lead","president","owner","agent","partner","founder","ceo","cto","cfo",
  "principal","analyst","advisor","head","architect","lim","lims","sales","pm","technical","consultant"
];

const SERVICE_KEYWORDS = [
  "investments","property management","property development","sales","consulting",
  "management","development","support","services","solutions","lims","sales",
  "sweet","snacks","catering","restaurant","bakery","distributor"
];

const likelyName = (line) => {
  if (!line) return false;
  const stripped = line.replace(/^[^A-Za-z0-9]+/, "");
  if (!/[A-Za-z]/.test(stripped)) return false;
  const words = stripped.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 4) return false;
  if (words.some(w => STOP_WORDS.includes(w.toLowerCase()))) return false;
  if (NAME_PREFIXES.includes(words[0].toLowerCase())) return true;
  const hasAlphaWord = words.every(w => /[A-Za-z]/.test(w));
  const hasLoneInitial = words.some(w => w.length === 1 && /[A-Za-z]/.test(w));
  if (!hasAlphaWord && !hasLoneInitial) return false;
  const titleCaseScore = words.filter(w => /^[A-Z][a-z'.-]+$/.test(w) || w === w.toUpperCase()).length;
  return titleCaseScore >= Math.max(2, Math.ceil(words.length * 0.75));
};

const compactUpper = (line) => line.replace(/[^A-Za-z]/g, "").toUpperCase();

const likelyCompany = (line) => {
  if (!line) return false;
  if (line.length < 3) return false;
  const cleanedUpper = line.replace(/[^A-Za-z]/g, "").toUpperCase();
  const hasKeyword = COMPANY_KEYWORDS.some(k => line.toLowerCase().includes(k));
  const allCaps = cleanedUpper.length >= 5 && line === line.toUpperCase();
  const fancyCaps = cleanedUpper.length >= 5 && compactUpper(line) === cleanedUpper;
  return (hasKeyword || allCaps || fancyCaps) && !likelyName(line);
};

export async function parseOCRText(text) {
  if (!text || typeof text !== "string") return {};

  const rawLines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const normalizedQuotes = rawLines.map(line =>
    line.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').trim()
  );
  const weightedLines = normalizedQuotes.map((line, idx) => ({
    text: line,
    score: idx === 0 ? 2 : 1, // first lines usually contain name/company
  }));
  const lines = Array.from(new Set(normalizedQuotes)); // for matching
  const cleaned = text.replace(/\s+/g, " ").trim();

  // -----------------------------
  // EMAIL
  // -----------------------------
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
  const emails = [...cleaned.matchAll(emailRegex)].map(m => m[0]);
  const email = emails.join(", ");

  // -----------------------------
  // PHONE
  // -----------------------------
  const phoneRegex = new RegExp(PHONE_PATTERN, "g");
  const phoneTestRegex = new RegExp(PHONE_PATTERN);
  const phoneMatches = cleaned.match(phoneRegex) || [];
  const phoneSet = new Set();
  phoneMatches.forEach(num => {
    const normalized = num
      .replace(/[\u202c\u202d]/g, "")
      .replace(/\(0\)/g, "")
      .replace(/\s+/g, " ")
      .replace(/\s*-\s*/g, "-")
      .replace(/[.]/g, " ")
      .trim();
    if (normalized.length >= 7) phoneSet.add(normalized);
  });
  const phone = [...phoneSet].join(", ");

  // -----------------------------
  // WEBSITE
  // -----------------------------
  const websiteRegex = /(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.(com|in|co|org|net|info|ai|io|biz|uk)/gi;
  const websiteMatches = [...cleaned.matchAll(websiteRegex)]
    .map(m => m[0])
    .filter(w => !email.includes(w));
  const website = websiteMatches.map(w => (w.startsWith("http") ? w : "https://" + w)).join(", ");

  // -----------------------------
  // COMPANY
  // -----------------------------
  let company = "";
  lines.forEach((line, idx) => {
    if (company) return;
    if (!line.match(emailRegex) && !line.match(websiteRegex) && !line.match(phoneRegex)) {
      if (likelyCompany(line)) {
        const next = lines[idx + 1];
        if (next && likelyCompany(next) && next !== line) {
          company = `${line} ${next}`.trim();
        } else {
          company = line;
        }
      }
    }
  });
  if (!company && lines.length > 0) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      if (likelyName(line)) continue;
      const letters = line.replace(/[^A-Za-z]/g, "");
      if (letters.length >= 4 && letters === letters.toUpperCase()) {
        let combined = line;
        const next = lines[i + 1];
        if (next && next === next.toUpperCase() && !likelyName(next)) {
          combined = `${line} ${next}`.trim();
        }
        company = combined;
        break;
      }
    }
  }
  if (!company && lines.length > 0) {
    company = lines[0];
  }

  // -----------------------------
  // NAME
  // -----------------------------
  const nameCandidates = weightedLines
    .map(item => item.text)
    .filter(line => {
      if (line === company) return false;
      if (line.match(emailRegex) || line.match(phoneRegex)) return false;
      if (COMPANY_KEYWORDS.some(k => line.toLowerCase().includes(k))) return false;
      return likelyName(line);
    });
  const name = nameCandidates[0] || (lines.find(line => likelyName(line)) || "");

  // -----------------------------
  // DESIGNATION
  // -----------------------------
  const designationLine = lines.find(line =>
    DESIGNATION_KEYWORDS.some(k => line.toLowerCase().includes(k))
  );
  const designation = designationLine || "";

  // -----------------------------
  // ADDRESS
  // -----------------------------
  const addressLines = lines.filter(line => {
    const cleanedLine = line.replace(emailRegex, "").replace(websiteRegex, "").trim().toLowerCase();
    if (!cleanedLine) return false;
    if (cleanedLine.includes(name.toLowerCase())) return false;
    if (cleanedLine.includes(company.toLowerCase())) return false;
    if (phoneTestRegex.test(line) && !/[a-zA-Z]{2,}/.test(cleanedLine)) return false;
    const hasDigits = /\d/.test(cleanedLine);
    return ADDRESS_KEYWORDS.some(k => cleanedLine.includes(k)) || hasDigits;
  });
  const address = addressLines.join(", ");

  // -----------------------------
  // SERVICES / NOTES
  // -----------------------------
  const services = lines
    .filter(line => {
      const lc = line.toLowerCase();
      const hasDigits = /\d/.test(line);
      if (hasDigits || line.match(emailRegex) || line.match(phoneRegex)) return false;
      return SERVICE_KEYWORDS.some(k => lc.includes(k));
    })
    .map(line => line.replace(/^[•\-–]+/, "").trim())
    .filter((value, index, self) => value && self.indexOf(value) === index);

  const result = {
    contactPerson: name,
    name,
    email,
    phone,
    mobile: phone,
    website,
    company,
    companyName: company,
    designation,
    address,
    interestedProducts: services,
    remarks: services.length ? services.join(", ") : "",
    extras: { raw: cleaned, services }
  };

  const needsLLMAssist =
    (!result.companyName || !result.contactPerson || !result.email || !result.mobile || !result.address) &&
    !!process.env.OPENAI_API_KEY;

  if (needsLLMAssist) {
    try {
      const llm = await parseBusinessCardWithLLM(cleaned);
      if (llm.companyName && !result.companyName) {
        result.companyName = llm.companyName;
        result.company = llm.companyName;
      }
      if (llm.contactPerson && !result.contactPerson) result.contactPerson = llm.contactPerson;
      if (llm.designation && !result.designation) result.designation = llm.designation;
      if (llm.email && !result.email) result.email = llm.email;
      if (llm.mobile && !result.mobile) {
        result.mobile = llm.mobile;
        result.phone = llm.mobile;
      }
      if (llm.website && !result.website) result.website = llm.website;
      if (llm.address && !result.address) result.address = llm.address;
      if ((!result.interestedProducts || result.interestedProducts.length === 0) && Array.isArray(llm.interestedProducts)) {
        result.interestedProducts = llm.interestedProducts;
      }
      if (llm.remarks && !result.remarks) result.remarks = llm.remarks;
      result.extras.llm = llm;
    } catch (err) {
      console.warn("LLM parse failed:", err.message);
    }
  }

  return result;
}
