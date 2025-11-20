const BACKEND_BASE = (
  import.meta.env.VITE_BACKEND_URL ||
  (typeof window !== 'undefined' ? window.BACKEND_URL : '') ||
  'https://bizcard-auq6.onrender.com'
).replace(/\/$/, '');

export async function saveCardEntry(imageFile, audioBlob, fields, exhibitionId = null, createdBy = '') {
  const form = new FormData();
  if (imageFile) form.append('image', imageFile, imageFile.name || 'card.jpg');
  if (audioBlob) form.append('audio', audioBlob, 'audio.webm');
  form.append('fields', JSON.stringify(fields || {}));
  if (exhibitionId) form.append('exhibitionId', exhibitionId);
  if (createdBy) form.append('createdBy', createdBy);

  const url = `${BACKEND_BASE}/api/cards/save-entry`;
  const res = await fetch(url, { method: 'POST', body: form });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Server error ${res.status}: ${txt}`);
  }
  return res.json();
}

export async function extractOcr(imageFile) {
  const form = new FormData();
  form.append('image', imageFile, imageFile.name || 'card.jpg');
  const url = `${BACKEND_BASE}/api/cards/extract-ocr`;
  const res = await fetch(url, { method: 'POST', body: form });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OCR error ${res.status}: ${txt}`);
  }
  return res.json();
}

export async function getCards() {
  const url = `${BACKEND_BASE}/api/cards/`;
  const res = await fetch(url);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Fetch error ${res.status}: ${txt}`);
  }
  return res.json();
}

export async function getCardsForExhibition(exhibitionId) {
  const url = `${BACKEND_BASE}/api/cards/?exhibitionId=${encodeURIComponent(exhibitionId)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Fetch error ${res.status}: ${txt}`);
  }
  return res.json();
}

export async function createExhibition({ name, date, time, createdBy = '' }) {
  const url = `${BACKEND_BASE}/api/exhibitions`;
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, date, time, createdBy }) });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Create exhibition error ${res.status}: ${txt}`);
  }
  return res.json();
}

export async function duplicateExhibition(id, createdBy = '') {
  const url = `${BACKEND_BASE}/api/exhibitions/${id}/duplicate`;
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ createdBy }) });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Duplicate exhibition error ${res.status}: ${txt}`);
  }
  return res.json();
}

export async function deleteExhibition(id) {
  const url = `${BACKEND_BASE}/api/exhibitions/${id}`;
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Delete exhibition error ${res.status}: ${txt}`);
  }
  return res.json();
}

export async function listExhibitions() {
  const url = `${BACKEND_BASE}/api/exhibitions`;
  const res = await fetch(url);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Fetch exhibitions error ${res.status}: ${txt}`);
  }
  return res.json();
}

export async function getLiveExhibitions() {
  const url = `${BACKEND_BASE}/api/exhibitions/live/today`;
  const res = await fetch(url);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Fetch live exhibitions error ${res.status}: ${txt}`);
  }
  return res.json();
}


