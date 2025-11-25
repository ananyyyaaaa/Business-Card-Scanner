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

### Render (Recommended)

1. **Configure as Web Service** (not Static Site):
   - **Root Directory**: `web`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: `Node`

2. **Environment Variables**:
   - `VITE_BACKEND_URL`: Your backend URL (e.g., `https://business-card-scanner-pyrt.onrender.com`)

3. The server will automatically handle SPA routing and serve `index.html` for all routes.

### Other Static Hosts

- The `dist/` folder is static and can be hosted on any static host (Netlify, Vercel static, S3+CF, etc.).
- For static hosts, ensure they support SPA routing (serving `index.html` for all routes).
- Ensure the backend is reachable from the deployed origin and that CORS allows it.
