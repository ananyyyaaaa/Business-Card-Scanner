# BizCard Web

React web frontend for BizCard. Uses Vite.

## Setup

1. Install dependencies:

```
cd web
npm install
```

2. Configure backend URL (optional). Create a `.env` file in `web/`:

```
VITE_BACKEND_URL=http://localhost:5000
```

If omitted, it defaults to `https://bizcard-auq6.onrender.com`.

3. Run dev server:

```
npm run dev
```

4. Build for production:

```
npm run build
npm run preview
```

## Deploy

- The `dist/` folder is static and can be hosted on any static host (Netlify, Vercel static, S3+CF, etc.).
- Ensure the backend is reachable from the deployed origin and that CORS allows it (backend currently allows all origins).
