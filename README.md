# Employee Management System

Full-stack HRM app with a React frontend and Express/MySQL backend.

## Quick Start

### 1. Clone the repo

```bash
git clone https://github.com/naomina1836-netizen/employee-management-system.git
cd employee-management-system
```

### 2. Set up the database

1. Create a MySQL database named `hrm_db`.
2. Import `database/schema.sql` into that database.

The backend now also bootstraps the demo admin account automatically if the schema already exists but the admin row is missing.

### 3. Configure the backend

Create `hrm-backend/.env` with values like these:

```env
PORT=5001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=hrm_db
JWT_SECRET=your_secret_key
```

### 4. Install dependencies

```bash
cd hrm-backend
npm install

cd ../hrm-frontend
npm install
```

### 5. Run the app

Backend:

```bash
cd hrm-backend
npm run dev
```

Frontend:

```bash
cd hrm-frontend
npm run dev
```

## Demo Login

If you imported the sample schema or let the backend bootstrap the demo account, use:

- Email: `admin@hrm.com`
- Password: `password123`

## Notes

- Frontend runs on Vite.
- Backend runs on Express and connects to MySQL.
- If login fails on a fresh machine, the first thing to check is whether the database was imported and the backend `.env` values match your local MySQL setup.
