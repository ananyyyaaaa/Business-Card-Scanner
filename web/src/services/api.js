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

export async function createExhibition({ name, startTime, endTime, timezone, country, createdBy = '' }) {
  const url = `${BACKEND_BASE}/api/exhibitions`;
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, startTime, endTime, timezone, country, createdBy }) });
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

export async function signup(name, email, password) {
  const url = `${BACKEND_BASE}/api/users/signup`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Signup error ${res.status}: ${txt}`);
  }
  return res.json();
}

export async function sendOtp(email) {
  const url = `${BACKEND_BASE}/api/users/send-otp`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OTP send error ${res.status}: ${txt}`);
  }
  return res.json();
}

export async function verifyOtp(email, otp) {
  const url = `${BACKEND_BASE}/api/users/verify-otp`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OTP verification error ${res.status}: ${txt}`);
  }
  return res.json();
}

export async function login(email, password, otp) {
  const url = `${BACKEND_BASE}/api/users/login`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, otp }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Login error ${res.status}: ${txt}`);
  }
  return res.json();
}

export async function checkAccess() {
  const url = `${BACKEND_BASE}/api/users/check-access`;
  const token = localStorage.getItem('token');
  const res = await fetch(url, {
    method: 'GET',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Access check error ${res.status}: ${txt}`);
  }
  return res.json();
}

export async function getCurrentUser() {
  const url = `${BACKEND_BASE}/api/users/me`;
  const token = localStorage.getItem('token');
  const res = await fetch(url, {
    method: 'GET',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Get user error ${res.status}: ${txt}`);
  }
  return res.json();
}

export async function adminLogin(email, password) {
  const url = `${BACKEND_BASE}/api/admin/login`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Admin login error ${res.status}: ${txt}`);
  }
  return res.json();
}

export async function getIpRequests() {
  const url = `${BACKEND_BASE}/api/admin/ip-requests`;
  const token = localStorage.getItem('adminToken');
  const res = await fetch(url, {
    method: 'GET',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Get IP requests error ${res.status}: ${txt}`);
  }
  return res.json();
}

export async function approveIpRequest(requestId, approved) {
  const url = `${BACKEND_BASE}/api/admin/ip-requests/${requestId}`;
  const token = localStorage.getItem('adminToken');
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    },
    body: JSON.stringify({ approved }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Approve IP request error ${res.status}: ${txt}`);
  }
  return res.json();
}

export async function updateCard(cardId, fields) {
  const url = `${BACKEND_BASE}/api/cards/${cardId}`;
  const token = localStorage.getItem('token');
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Update card error ${res.status}: ${txt}`);
  }
  return res.json();
}

