export function parseOCRText(text) {
  if (!text || typeof text !== "string") return {};

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
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
  const phoneRegex = /(\+?\d[\d\s\-().]{7,}\d)/g;
  const phoneMatches = cleaned.match(phoneRegex) || [];
  const phones = [];
  phoneMatches.forEach(num => {
    let digits = num.replace(/\D/g, "");
    while (digits.length > 0) {
      const chunk = digits.slice(0, 10);
      phones.push(chunk.replace(/(\d{5})(\d{5})/, "$1 $2"));
      digits = digits.slice(10);
    }
  });
  const phone = phones.join(", ");

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
  const companyKeywords = [
    "private limited","pvt ltd","limited","ltd","inc","corporation","corp",
    "llc","company","co.","technologies","solutions","studio","agency"
  ];
  let company = "";
  for (let line of lines) {
    const lower = line.toLowerCase();
    if (!line.match(emailRegex) && !line.match(websiteRegex) && !line.match(phoneRegex)) {
      if (companyKeywords.some(k => lower.includes(k))) {
        company = line.replace(/(\b[A-Za-z]+)s\b/i, "$1's"); // Haldiram's fix
        break;
      }
    }
  }
  // fallback: take line after first name line if company not found
  if (!company && lines.length > 1) {
    company = lines[1];
  }

  // -----------------------------
  // NAME
  // -----------------------------
  const names = lines.filter(line => {
    const cleanedLine = line.replace(/[^a-zA-Z\s'-]/g, "").trim();
    return cleanedLine &&
      !line.match(emailRegex) &&
      !line.match(phoneRegex) &&
      !line.toLowerCase().includes("www") &&
      !line.toLowerCase().includes("http") &&
      !companyKeywords.some(k => line.toLowerCase().includes(k)) &&
      cleanedLine.split(" ").length <= 4;
  });
  const name = names.join(", ");

  // -----------------------------
  // ADDRESS
  // -----------------------------
  const addressKeywords = ["street","st.","road","rd","avenue","ave","city","india","usa","vip","mode","lane"];
  const addressLines = lines.filter(line => {
    const cleanedLine = line.replace(emailRegex, "").replace(websiteRegex, "").trim();
    return addressKeywords.some(k => cleanedLine.toLowerCase().includes(k));
  });
  const address = addressLines.join(", ");

  return {
    name,
    email,
    phone,
    website,
    company,
    address,
    extras: { raw: cleaned }
  };
}
