# 📊 Sales Insight Automator — Rabbitt AI

> Upload a CSV/XLSX sales file → AI generates an executive brief → Delivered to any inbox.

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                         │
│           React SPA (Vercel / nginx:80 locally)             │
└──────────────────────────┬──────────────────────────────────┘
                           │ POST /api/upload
                           │ multipart/form-data + x-api-key
┌──────────────────────────▼──────────────────────────────────┐
│              Node.js + Express Backend (Render / :4000)      │
│                                                             │
│  Helmet  ─── CORS ─── Rate Limiter ─── API Key Auth        │
│                            │                               │
│           ┌────────────────┼────────────────────┐          │
│           │                │                    │          │
│      fileParser       aiService           emailService     │
│   (csv/xlsx→rows)   (Gemini 1.5)       (nodemailer SMTP)   │
│           │                │                    │          │
│           └────────────────▼────────────────────┘          │
│                     Swagger /api-docs                       │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React 18, Axios, Nginx (Docker) |
| Backend | Node.js 20, Express 4 |
| AI | Google Gemini 1.5 Flash |
| Email | Nodemailer (SMTP / Gmail) |
| Docs | Swagger UI (OpenAPI 3.0) |
| Container | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Hosting | Vercel (frontend) · Render (backend) |

---

## 🚀 Quick Start (Docker Compose)

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/sales-insight-automator.git
cd sales-insight-automator
```

### 2. Configure environment variables
```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

Open `backend/.env` and fill in:
```env
APP_API_KEY=pick-any-strong-secret
GEMINI_API_KEY=from-aistudio.google.com
SMTP_HOST=smtp.gmail.com
SMTP_USER=you@gmail.com
SMTP_PASS=your-gmail-app-password   # NOT your normal password
```

Open `frontend/.env` and set:
```env
REACT_APP_API_URL=http://localhost:4000
REACT_APP_API_KEY=same-value-as-APP_API_KEY
```

### 3. Spin up
```bash
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000 |
| Swagger Docs | http://localhost:4000/api-docs |
| Health Check | http://localhost:4000/health |

### 4. Stop
```bash
docker compose down
```

---

## 🖥 Local Development (no Docker)

```bash
# Terminal 1 – Backend
cd backend
npm install
cp .env.example .env   # fill in vars
npm run dev            # nodemon, hot reload

# Terminal 2 – Frontend
cd frontend
npm install
cp .env.example .env   # fill in vars
npm start              # CRA dev server on :3000
```

---

## 🔐 Security Implementation

### 1. API Key Authentication (`x-api-key` header)
Every request to `POST /api/upload` must include an `x-api-key` header matching the server-side `APP_API_KEY` environment variable. Keys are never logged or returned in responses. In development, omitting the env var disables auth (dev mode).

### 2. Rate Limiting (express-rate-limit)
- **Global limiter**: 100 requests per IP per 15-minute window across all routes.
- **Upload limiter**: 10 uploads per IP per hour — prevents LLM and SMTP abuse.

### 3. Helmet.js
Sets 11 security-relevant HTTP headers out of the box:
`Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, etc.

### 4. CORS
Restricted to `FRONTEND_URL`. Only `GET` and `POST` methods are accepted.

### 5. File Validation (Multer)
- MIME type whitelist: only `text/csv` and `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` pass.
- Max file size: 5 MB (prevents memory exhaustion).
- Files are processed in memory only — never written to disk.

### 6. Input Validation (express-validator)
Email field is validated and normalised server-side using `express-validator` before any processing occurs.

### 7. Docker: non-root user
The backend container runs as a dedicated `appuser` (non-root) for privilege isolation.

---

## 📚 API Reference

Swagger UI: `http://localhost:4000/api-docs`  
OpenAPI JSON: `http://localhost:4000/api-docs.json`

### `POST /api/upload`

| | |
|---|---|
| Auth | `x-api-key` header |
| Content-Type | `multipart/form-data` |
| Rate limit | 10 / hour per IP |

**Fields:**
| Field | Type | Required | Description |
|---|---|---|---|
| `file` | File | ✅ | `.csv` or `.xlsx`, max 5 MB |
| `email` | string | ✅ | Recipient email for the brief |

**Success Response `200`:**
```json
{
  "success": true,
  "message": "Sales brief sent to cto@company.com",
  "requestId": "uuid-v4",
  "rowsProcessed": 6
}
```

---

## 🌍 Deployment Guide

### Backend → Render

1. Push code to GitHub.
2. New Web Service → connect repo → set root directory `backend`.
3. Build command: `npm install`  
   Start command: `node src/index.js`
4. Add all env vars from `backend/.env.example` in the Render dashboard.
5. Copy the service URL (e.g. `https://sales-api.onrender.com`) → set as `BACKEND_URL` env var.

### Frontend → Vercel

1. Import repo → set root directory `frontend`.
2. Framework preset: **Create React App**.
3. Add env vars:
   - `REACT_APP_API_URL` = your Render backend URL
   - `REACT_APP_API_KEY` = same as `APP_API_KEY`
4. Deploy.

---

## ⚙️ CI/CD Pipeline

GitHub Actions (`.github/workflows/ci.yml`) triggers on every **PR to main** and every **push to main**:

| Job | What it does |
|---|---|
| `backend-lint` | Installs deps, runs ESLint |
| `backend-docker` | Builds Docker image, smoke-tests `/health` |
| `frontend-lint-build` | Installs deps, lints, runs `npm run build`, uploads artifact |
| `compose-validate` | Validates `docker-compose.yml` syntax |

---

## 📁 Project Structure

```
sales-insight-automator/
├── backend/
│   ├── src/
│   │   ├── config/swagger.js       # OpenAPI spec
│   │   ├── middleware/
│   │   │   ├── auth.js             # x-api-key guard
│   │   │   └── rateLimiter.js      # global + upload limiters
│   │   ├── routes/upload.js        # POST /api/upload
│   │   ├── services/
│   │   │   ├── aiService.js        # Gemini integration
│   │   │   ├── emailService.js     # nodemailer / SMTP
│   │   │   └── fileParser.js       # CSV + XLSX parsing
│   │   └── index.js                # Express app entry
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── public/index.html
│   ├── src/
│   │   ├── App.jsx                 # Main SPA component
│   │   ├── index.css               # Global styles
│   │   └── index.js                # React entry
│   ├── .env.example
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── .github/workflows/ci.yml        # GitHub Actions
├── docker-compose.yml
├── sales_q1_2026.csv               # Reference test data
└── README.md
```

---

## 🔑 .env.example Reference

**`backend/.env.example`**
```env
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
APP_API_KEY=your_secret_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=your_gmail_app_password
BACKEND_URL=https://your-backend.onrender.com
```

**`frontend/.env.example`**
```env
REACT_APP_API_URL=http://localhost:4000
REACT_APP_API_KEY=your_secret_api_key_here
```

---

## 📧 Gmail SMTP Setup

1. Go to [myaccount.google.com/security](https://myaccount.google.com/security)
2. Enable **2-Step Verification**
3. Search "App passwords" → Generate one for "Mail"
4. Use that 16-character password as `SMTP_PASS` (NOT your normal Gmail password)

---

*Built by Rabbitt AI Engineering · Sales Insight Automator v1.0*
