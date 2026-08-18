# Employee Management System

Full-stack HRM app with a React (Vite) frontend and Express/MySQL backend.

## Quick Start

### 1. Clone the repo

```bash
git clone https://github.com/naomina1836-netizen/employee-management-system.git
cd employee-management-system
```

### 2. Configure the backend

```bash
cp hrm-backend/.env.example hrm-backend/.env
```

Edit `hrm-backend/.env` with your MySQL credentials and a strong `JWT_SECRET`:

```env
PORT=5001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=hrm_db
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRE=7d
```

Optional: set `CORS_ORIGINS` as a comma-separated list of allowed frontend origins.

### 3. Database

**Option A — automatic (recommended)**  
On first start, the backend creates `hrm_db` (if missing) and loads `database/schema.sql` when the `users` table is absent. It also seeds the demo admin if needed.

**Option B — manual**

1. Create a MySQL database named `hrm_db`.
2. Import `database/schema.sql`.

### 4. Install dependencies

```bash
cd hrm-backend && npm install
cd ../hrm-frontend && npm install
```

### 5. Run the app

Backend:

```bash
cd hrm-backend
npm run dev
```

Frontend (optional API URL override):

```bash
cd hrm-frontend
# optional: cp .env.example .env
npm run dev
```

- Backend: `http://localhost:5001`
- Frontend: Vite default (usually `http://localhost:5173`)

## Demo Login

- **Email:** `admin@hrm.com`
- **Password:** `password123`

All seeded users share the same password (`password123`).

## Features

- Auth (JWT), roles: Admin, HR, Manager, Employee
- Employees, leave, attendance (incl. self check-in/out), payroll, performance
- Dashboard, reports, notifications
- Admin/HR: user management (`/admin/users`)
- Settings API: departments & positions (`/api/settings/...`)

## Notes

- Frontend API base URL: `VITE_API_URL` (default `http://localhost:5001/api`).
- Do not commit real `.env` files; use `.env.example` templates.
- Rate limiting is applied to `/api` and stricter limits on `/api/auth`.
- Input validation is applied on employee, leave, and payroll create/update routes.
