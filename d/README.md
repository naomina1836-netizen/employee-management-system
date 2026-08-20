# D.E.N.Y HRMS — Employee Management System

Full-stack Human Resource Management System with a **React (Vite)** frontend and **Express + MySQL** backend.

This is the polished “best of both” version: all advanced features from the local build (AI assistant, Docker, uploads, tests, leave balances, bulk attendance) combined with a clean public-ready structure and documentation.

---

## Features

- **Authentication** — JWT + optional refresh tokens, role-based access (Admin, HR, Manager, Employee)
- **Employees** — Full CRUD, profile photos, departments & positions
- **Leave Management** — Request / approve, leave types, balance tracking
- **Attendance** — Self check-in/out, bulk entry, late/half-day rules, hours calculation
- **Payroll** — Create, edit, view payslips
- **Performance** — Reviews and ratings
- **Dashboard & Reports** — Live stats and analytics
- **Notifications**
- **Admin / HR** — User management (`/admin/users`)
- **Settings API** — Departments & positions
- **AI Assistant (“DENY AI”)** — Context-aware help (local rules + optional Gemini/Groq)
- **Security** — Helmet, rate limiting, input validation, CORS hardening
- **Docker** — One-command local stack (MySQL + backend + frontend)

---

## Quick Start

### Option A — Docker (recommended)

```bash
# 1. Clone / extract this project
cd employee-management-system   # or whatever you named the folder

# 2. (Optional) set secrets
cp hrm-backend/.env.example hrm-backend/.env
# Edit JWT_SECRET and DB_PASSWORD if desired

# 3. Start everything
docker compose up --build
```

- Frontend: http://localhost:5173  
- Backend:  http://localhost:5001  
- MySQL:   localhost:3306 (root / rootpass by default)

### Option B — Manual

**1. Database**

```bash
# Create DB and import schema
mysql -u root -p < database/schema.sql
# Optional: mysql -u root -p hrm_db < database/fix_refresh_tokens.sql
```

**2. Backend**

```bash
cd hrm-backend
cp .env.example .env
# Edit .env → set DB credentials + a strong JWT_SECRET
npm install
npm run dev
```

**3. Frontend**

```bash
cd hrm-frontend
cp .env.example .env          # optional (defaults to http://localhost:5001/api)
npm install
npm run dev
```

- Backend: http://localhost:5001  
- Frontend: http://localhost:5173 (Vite default)

---

## Demo Login

| Role     | Email             | Password     |
|----------|-------------------|--------------|
| Admin    | admin@hrm.com     | password123  |

All seeded users share the same password (`password123`). **Change it immediately in production.**

---

## Project Structure

```
.
├── database/
│   ├── schema.sql
│   └── fix_refresh_tokens.sql
├── hrm-backend/
│   ├── config/          # DB + auto-bootstrap
│   ├── controllers/     # business logic (incl. AI)
│   ├── middleware/      # auth, roles, rate-limit, validators, upload
│   ├── models/
│   ├── routes/
│   ├── tests/           # Jest + Supertest
│   ├── utils/
│   ├── uploads/         # profile photos (gitignored)
│   ├── Dockerfile
│   └── server.js
├── hrm-frontend/
│   ├── src/
│   │   ├── components/  # Layout, Sidebar, AIAssistant, …
│   │   ├── pages/       # all screens
│   │   ├── context/     # AuthContext
│   │   ├── services/    # axios API client
│   │   └── styles/
│   ├── Dockerfile
│   └── …
├── docker-compose.yml
└── README.md
```

---

## Environment Variables

See `hrm-backend/.env.example` and `hrm-frontend/.env.example`.

Important:

- `JWT_SECRET` — **required**, use a long random string (≥ 32 characters)
- `DB_*` — MySQL connection
- `GEMINI_API_KEY` / `GROQ_API_KEY` — optional; without them the AI falls back to a solid local rule-based assistant
- `CORS_ORIGINS` — comma-separated allowed frontend origins

---

## API Overview

| Prefix              | Description                  |
|---------------------|------------------------------|
| `/api/auth`         | Login, register, refresh     |
| `/api/employees`    | Employee CRUD + photos       |
| `/api/leaves`       | Leave requests & approvals   |
| `/api/attendance`   | Check-in/out, bulk, reports  |
| `/api/payroll`      | Payslips                     |
| `/api/performance`  | Reviews                      |
| `/api/dashboard`    | Stats                        |
| `/api/notifications`| In-app notifications         |
| `/api/settings`     | Departments & positions      |
| `/api/admin`        | User management              |
| `/api/ai`           | DENY AI assistant            |
| `/api/health`       | Health check                 |

---

## Notes

- On first backend start the system automatically creates the database (if missing), loads the schema, and seeds the demo admin.
- Rate limiting is applied globally and more strictly on `/api/auth`.
- Input validation is enforced on create/update routes for employees, leave, and payroll.
- Profile photos are stored under `hrm-backend/uploads/profiles` (served at `/uploads/...`).
- Never commit real `.env` files or `node_modules`.

---

## License

MIT (or your preferred license)

---

**Built for real-world HR workflows.**  
Questions or improvements? Open an issue or PR.
