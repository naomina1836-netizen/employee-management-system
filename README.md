# Employee Management System

A modern, full-stack **Employee Management System (HRM)** designed to help organizations manage employees, attendance, leave, payroll, performance, users, notifications, reports, and administrative settings from a centralized platform.

The project uses a **React + Vite** frontend, an **Express.js + Node.js** backend, and **MySQL** for persistent data storage. Authentication and authorization are handled using **JWT**, with role-based access control for Admin, HR, Manager, and Employee users.

---

## 📋 Table of Contents

* [Overview](#-overview)
* [Key Features](#-key-features)
* [Technology Stack](#-technology-stack)
* [System Architecture](#-system-architecture)
* [Project Structure](#-project-structure)
* [Prerequisites](#-prerequisites)
* [Installation](#-installation)
* [Environment Configuration](#-environment-configuration)
* [Database Setup](#-database-setup)
* [Running the Application](#-running-the-application)
* [Demo Account](#-demo-account)
* [User Roles & Permissions](#-user-roles--permissions)
* [Core Modules](#-core-modules)
* [API Overview](#-api-overview)
* [Frontend Configuration](#-frontend-configuration)
* [Security](#-security)
* [Validation & Error Handling](#-validation--error-handling)
* [Rate Limiting](#-rate-limiting)
* [Development Workflow](#-development-workflow)
* [Troubleshooting](#-troubleshooting)
* [Docker](#-docker)
* [Production Deployment](#-production-deployment)
* [Environment Variables](#-environment-variables)
* [CI/CD](#-cicd)
* [Future Improvements](#-future-improvements)
* [Contributing](#-contributing)
* [License](#-license)

---

# 📌 Overview

The **Employee Management System** is a full-stack Human Resource Management application built to simplify and centralize common HR operations.

The system provides different levels of access depending on the user's role. Administrators and HR personnel can manage employees and organizational data, while managers and employees receive functionality appropriate to their responsibilities.

The platform is designed with a modular architecture so additional HR features can be added without significantly changing the existing application structure.

### Main objectives

* Centralize employee information.
* Simplify employee and user management.
* Track employee attendance and working hours.
* Manage leave requests and approvals.
* Manage payroll information.
* Track employee performance.
* Provide dashboards and reports.
* Support role-based authorization.
* Protect sensitive HR data.
* Provide a scalable foundation for future HR functionality.

---

# ✨ Key Features

## 🔐 Authentication & Authorization

* JWT-based authentication.
* Secure password handling.
* Login and authentication management.
* Role-based access control.
* Protected API routes.
* Protected frontend pages.
* Multiple user roles:

  * Admin
  * HR
  * Manager
  * Employee

---

## 👥 Employee Management

Administrators and authorized HR users can manage employee information.

Features include:

* Create employees.
* Update employee information.
* View employee profiles.
* Delete employees where permitted.
* Assign departments.
* Assign positions.
* Manage employment information.
* Search and manage employee records.

---

## ⏱️ Attendance Management

The attendance module provides tools for monitoring employee attendance.

Supported functionality includes:

* Employee check-in.
* Employee check-out.
* Attendance records.
* Working-time tracking.
* Attendance history.
* Attendance management for authorized users.
* Employee self-service attendance actions.

---

## 🏖️ Leave Management

Employees can submit leave requests while authorized users can review and manage them.

Features include:

* Submit leave requests.
* View leave history.
* Review pending requests.
* Approve leave.
* Reject leave.
* Track leave status.
* Manage employee leave records.

---

## 💰 Payroll Management

The payroll module provides functionality for managing employee compensation records.

Features include:

* Create payroll records.
* Update payroll information.
* View payroll records.
* Manage employee compensation data.
* Validate payroll input.
* Restrict payroll operations based on authorization.

---

## 📈 Performance Management

The performance module provides a foundation for tracking employee performance.

Potential use cases include:

* Performance records.
* Employee evaluations.
* Performance history.
* Manager-based performance management.
* Performance-related reporting.

---

## 📊 Dashboard

The dashboard provides a centralized overview of important HR information.

Depending on the user's role, the dashboard can display information such as:

* Total employees.
* Attendance information.
* Leave requests.
* Payroll information.
* Performance information.
* Notifications.
* HR statistics.
* System activity.

---

## 🔔 Notifications

The notification system allows the application to communicate important events to users.

Examples include:

* Leave status changes.
* Administrative notifications.
* Attendance-related notifications.
* System updates.
* HR-related events.

---

## 📑 Reports

The reporting functionality provides a centralized way to review organizational information.

Reports can be used to analyze:

* Employee data.
* Attendance.
* Leave.
* Payroll.
* Performance.
* Other HR metrics.

---

## ⚙️ Administrative Settings

Authorized administrators can manage organizational configuration.

The settings API supports management of:

* Departments.
* Positions.
* Other organizational configuration.

Settings endpoints are available under:

```text
/api/settings/...
```

---

# 🛠️ Technology Stack

## Frontend

| Technology              | Purpose                         |
| ----------------------- | ------------------------------- |
| React                   | User interface                  |
| Vite                    | Frontend development/build tool |
| JavaScript / TypeScript | Application development         |
| CSS                     | Styling                         |
| REST API                | Backend communication           |

## Backend

| Technology | Purpose                   |
| ---------- | ------------------------- |
| Node.js    | Runtime environment       |
| Express.js | Backend framework         |
| JWT        | Authentication            |
| MySQL      | Relational database       |
| REST API   | Application communication |

## Security

| Technology / Mechanism   | Purpose                     |
| ------------------------ | --------------------------- |
| JWT                      | Authentication              |
| Password hashing         | Secure credential storage   |
| Role-based authorization | Access control              |
| Rate limiting            | Abuse protection            |
| Input validation         | Data integrity              |
| CORS                     | Cross-origin access control |

---

# 🏗️ System Architecture

The application follows a client-server architecture.

```text
┌─────────────────────────────┐
│        React Frontend       │
│          + Vite             │
└──────────────┬──────────────┘
               │
               │ HTTP / REST API
               ▼
┌─────────────────────────────┐
│       Express Backend       │
│          + Node.js          │
├─────────────────────────────┤
│ Authentication              │
│ Authorization               │
│ Validation                  │
│ Rate Limiting               │
│ Business Logic              │
│ API Routes                  │
└──────────────┬──────────────┘
               │
               │ SQL
               ▼
┌─────────────────────────────┐
│           MySQL             │
│        HRM Database         │
└─────────────────────────────┘
```

### Request flow

```text
User
  ↓
React Frontend
  ↓
REST API Request
  ↓
Express Router
  ↓
Authentication
  ↓
Authorization
  ↓
Input Validation
  ↓
Controller / Business Logic
  ↓
MySQL Database
  ↓
API Response
  ↓
React UI
```

---

# 📁 Project Structure

The repository is divided into separate frontend, backend, and database components.

```text
employee-management-system/
│
├── hrm-backend/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── config/          # db pool + bootstrap (auto schema/seed)
│   ├── models/
│   ├── utils/           # access + pagination helpers
│   ├── scripts/
│   ├── database/
│   ├── server.js
│   ├── setup.js         # jest env setup
│   ├── *.test.js        # jest tests
│   ├── .env.example
│   └── package.json
│
├── hrm-frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   ├── styles/
│   │   └── assets/
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── database/
│   └── schema.sql
│
├── README.md
└── ...
```

> The backend uses a flat layout (no `src/` wrapper). The exact folder structure may evolve as new modules are added.

---

# 💻 Prerequisites

Before installing the application, make sure the following software is installed.

### Required

* Node.js
* npm
* MySQL
* Git

### Recommended

* VS Code
* MySQL Workbench
* Postman or another API testing tool
* Modern web browser

Check your installed versions:

```bash
node -v
npm -v
mysql --version
git --version
```

---

# 🚀 Installation

## 1. Clone the repository

```bash
git clone https://github.com/naomina1836-netizen/employee-management-system.git

cd employee-management-system
```

---

# ⚙️ Backend Configuration

Navigate to the backend:

```bash
cd hrm-backend
```

Create the environment file:

```bash
cp .env.example .env
```

On Windows PowerShell, if `cp` is unavailable, use:

```powershell
Copy-Item .env.example .env
```

Open the `.env` file and configure your database and authentication settings.

Example:

```env
PORT=5001

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=hrm_db

JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRE=7d

CORS_ORIGINS=http://localhost:5173
```

### Important

Do not use the example JWT secret in a real production deployment.

Generate a strong, unique secret before deploying the application.

---

# 🗄️ Database Setup

The application supports two database setup methods.

## Option A — Automatic Setup

The recommended method is to allow the backend to initialize the database.

On the first startup, the backend can:

1. Create the `hrm_db` database if it does not already exist.
2. Detect whether the required database tables exist.
3. Load the database schema when required.
4. Create the initial demo/admin account when necessary.

This makes local development and testing easier.

---

## Option B — Manual Setup

If you prefer to configure MySQL manually:

### Step 1 — Open MySQL

```bash
mysql -u root -p
```

### Step 2 — Create the database

```sql
CREATE DATABASE hrm_db;
```

### Step 3 — Select the database

```sql
USE hrm_db;
```

### Step 4 — Import the schema

From the project root, import:

```text
database/schema.sql
```

For example:

```bash
mysql -u root -p hrm_db < database/schema.sql
```

---

# 📦 Install Dependencies

From the project root, install backend dependencies:

```bash
cd hrm-backend
npm install
```

Then install frontend dependencies:

```bash
cd ../hrm-frontend
npm install
```

---

# ▶️ Running the Application

The backend and frontend should normally run in separate terminal windows.

---

## Start the Backend

Open a terminal:

```bash
cd hrm-backend
npm run dev
```

The backend should be available at:

```text
http://localhost:5001
```

API endpoints are available under:

```text
http://localhost:5001/api
```

---

## Start the Frontend

Open another terminal:

```bash
cd hrm-frontend
npm run dev
```

Vite will normally provide the application at:

```text
http://localhost:5173
```

Open the displayed URL in your browser.

---

# 🔑 Demo Account

For local development/testing, the seeded demo administrator account is:

```text
Email:    admin@hrm.com
Password: password123
```

Other seeded users may use the same demo password:

```text
password123
```

### ⚠️ Security Warning

These credentials are intended for development and demonstration purposes only.

**Do not use these credentials in a production environment.**

Immediately change or remove demo credentials before deploying the application publicly.

---

# 👤 User Roles & Permissions

The application supports four primary roles.

## Admin

The Admin has the highest level of system access.

Typical capabilities include:

* Manage users.
* Manage employees.
* Manage departments.
* Manage positions.
* Access administrative settings.
* Manage HR data.
* View reports.
* Manage system configuration.

---

## HR

HR users are responsible for employee and human-resource operations.

Typical capabilities include:

* Manage employees.
* Manage attendance.
* Manage leave.
* Manage payroll.
* View employee information.
* Manage performance information.
* Access HR reports.

---

## Manager

Managers have access to functionality related to employees under their management.

Typical capabilities include:

* View assigned employees.
* Monitor attendance.
* Review leave requests.
* Manage performance-related information.
* Access relevant reports.

---

## Employee

Employees have access to self-service functionality.

Typical capabilities include:

* View personal information.
* Check in.
* Check out.
* View attendance.
* Submit leave requests.
* View leave history.
* View available personal HR information.
* Receive notifications.

> Actual permissions are enforced by backend authorization rules and may vary as the application evolves.

---

# 🧩 Core Modules

The application is organized around several major HR modules.

```text
Authentication
      │
      ├── Login
      ├── JWT
      └── Role Authorization
      │
      ▼
Employee Management
      │
      ├── Employee Profiles
      ├── Departments
      └── Positions
      │
      ▼
Attendance
      │
      ├── Check-In
      ├── Check-Out
      └── Attendance History
      │
      ▼
Leave Management
      │
      ├── Requests
      ├── Approval
      └── Leave History
      │
      ▼
Payroll
      │
      ├── Payroll Records
      └── Compensation
      │
      ▼
Performance
      │
      ├── Evaluations
      └── Performance Records
      │
      ▼
Reports & Notifications
```

---

# 🔌 API Overview

The backend exposes RESTful API endpoints under:

```text
/api
```

Major API areas include:

```text
/api/auth
/api/employees
/api/attendance
/api/leave
/api/payroll
/api/performance
/api/admin
/api/settings
/api/notifications
/api/reports
```

The exact endpoints may change as development continues.

---

## Authentication

Authentication-related functionality is available under:

```text
/api/auth
```

Typical operations include:

```text
POST /api/auth/login
```

Authentication returns a JWT that is used to access protected resources.

---

## Admin / User Management

Administrative user management is available under:

```text
/api/admin/users
```

This functionality is restricted to authorized administrators and HR users where applicable.

---

## Settings

Organizational settings are available under:

```text
/api/settings/...
```

These endpoints can be used to manage:

* Departments.
* Positions.
* Organizational configuration.

---

# 🌐 Frontend Configuration

The frontend uses the following environment variable for the backend API URL:

```env
VITE_API_URL=http://localhost:5001/api
```

If no custom API URL is configured, the application uses:

```text
http://localhost:5001/api
```

For example, create:

```text
hrm-frontend/.env
```

and add:

```env
VITE_API_URL=http://localhost:5001/api
```

After changing environment variables, restart the Vite development server.

---

# 🔒 Security

Security is an important part of the application architecture because the system handles employee and organizational information.

The application includes multiple security mechanisms.

## JWT Authentication

JSON Web Tokens are used to authenticate users and protect private API resources.

```text
Login
  ↓
Credentials Verified
  ↓
JWT Generated
  ↓
JWT Sent to Client
  ↓
Client Requests Protected API
  ↓
JWT Verified
  ↓
Request Authorized
```

---

## Password Security

Passwords should never be stored as plain text.

The application uses password hashing before storing user credentials.

---

## Role-Based Authorization

Authentication determines **who the user is**.

Authorization determines **what the user is allowed to do**.

For example:

```text
Admin     → Administrative operations
HR        → HR operations
Manager   → Team management
Employee  → Self-service operations
```

Backend authorization should always be treated as the final security boundary.

---

## CORS

Cross-Origin Resource Sharing is configured to control which frontend applications can communicate with the backend.

The allowed origins can be configured using:

```env
CORS_ORIGINS=http://localhost:5173
```

Multiple origins can be provided as a comma-separated list:

```env
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

# 🛡️ Validation & Error Handling

Input validation is applied to important create and update operations.

Current validation coverage includes areas such as:

* Employees.
* Leave requests.
* Payroll records.

Validation helps prevent:

* Invalid data.
* Missing required fields.
* Incorrect formats.
* Unexpected input.
* Corrupted records.

API errors should return appropriate HTTP status codes and meaningful error responses.

---

# 🚦 Rate Limiting

Rate limiting is enabled for the API to reduce abuse and excessive requests.

General API rate limiting is applied to:

```text
/api
```

Authentication endpoints use stricter limits:

```text
/api/auth
```

This is particularly important for protecting login endpoints from excessive automated requests.

---

# 🧪 Development Workflow

A recommended development workflow is:

```text
1. Create a feature branch
        ↓
2. Update the backend/database if necessary
        ↓
3. Update the frontend
        ↓
4. Test API endpoints
        ↓
5. Test the UI
        ↓
6. Verify authentication/authorization
        ↓
7. Run lint/build checks
        ↓
8. Commit changes
        ↓
9. Push the branch
        ↓
10. Open a Pull Request
```

Example:

```bash
git checkout -b feature/employee-management

git add .

git commit -m "feat: improve employee management"

git push origin feature/employee-management
```

---

# 🧪 Testing

Before submitting changes, verify the following:

### Backend

```bash
cd hrm-backend
npm install
npm run dev
```

Confirm:

* Server starts successfully.
* Database connection works.
* Authentication works.
* Protected routes reject unauthorized requests.
* Role permissions work correctly.
* Validation rejects invalid input.

### Frontend

```bash
cd hrm-frontend
npm install
npm run dev
```

Confirm:

* Login works.
* Dashboard loads.
* API requests succeed.
* Protected pages behave correctly.
* Employee management works.
* Attendance works.
* Leave functionality works.
* Payroll functionality works.
* Notifications display correctly.

---

# 🐛 Troubleshooting

## Backend cannot connect to MySQL

Check:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=hrm_db
```

Make sure MySQL is running.

You can test the connection using:

```bash
mysql -u root -p
```

---

## Database does not exist

Create it manually:

```sql
CREATE DATABASE hrm_db;
```

Then import:

```text
database/schema.sql
```

---

## Frontend cannot connect to backend

Verify the backend is running:

```text
http://localhost:5001
```

Then check:

```env
VITE_API_URL=http://localhost:5001/api
```

Restart the frontend after changing `.env`.

---

## CORS errors

Check the backend configuration:

```env
CORS_ORIGINS=http://localhost:5173
```

If the frontend is running on another port, update the value accordingly.

Example:

```env
CORS_ORIGINS=http://localhost:5174
```

Restart the backend after changing the environment configuration.

---

## Port already in use

If port `5001` is already being used, either stop the process using it or change:

```env
PORT=5001
```

to another available port.

If the backend port changes, also update:

```env
VITE_API_URL
```

in the frontend.

---
---

# 🐳 Docker

Run the full stack (MySQL + backend + frontend) with Docker Compose.

## Prerequisites

* [Docker](https://docs.docker.com/get-docker/)
* [Docker Compose](https://docs.docker.com/compose/) v2 (`docker compose`)

## Quick start

From the **repository root**:

```bash
# 1. Environment file (optional — defaults work for local demos)
cp .env.docker.example .env

# 2. Edit .env — set a strong JWT_SECRET (and MYSQL_ROOT_PASSWORD) before any real use
# 3. Build and start
docker compose up --build

# 🚀 Production Deployment

Before deploying the application to production, review the following.

## Backend

Use production environment variables:

```env
NODE_ENV=production
PORT=5001

DB_HOST=your-production-db-host
DB_USER=your-production-db-user
DB_PASSWORD=your-production-db-password
DB_NAME=hrm_db

JWT_SECRET=your-production-secret
JWT_EXPIRE=7d

CORS_ORIGINS=https://your-frontend-domain.com
```

### Production checklist

* [ ] Use a strong database password.
* [ ] Use a cryptographically strong JWT secret.
* [ ] Disable demo credentials.
* [ ] Configure production CORS origins.
* [ ] Use HTTPS.
* [ ] Secure database access.
* [ ] Configure backups.
* [ ] Review API rate limits.
* [ ] Review authentication and authorization.
* [ ] Do not expose database credentials.
* [ ] Do not commit `.env` files.
* [ ] Configure production logging.
* [ ] Monitor application errors.

---

# 🔐 Environment Variables

## Backend

| Variable       | Description              | Example                 |
| -------------- | ------------------------ | ----------------------- |
| `PORT`         | Backend server port      | `5001`                  |
| `DB_HOST`      | MySQL hostname           | `localhost`             |
| `DB_USER`      | MySQL username           | `root`                  |
| `DB_PASSWORD`  | MySQL password           | `your_password`         |
| `DB_NAME`      | Database name            | `hrm_db`                |
| `JWT_SECRET`   | JWT signing secret       | `your_secret`           |
| `JWT_EXPIRE`   | JWT expiration time      | `7d`                    |
| `CORS_ORIGINS` | Allowed frontend origins | `http://localhost:5173` |

## Frontend

| Variable       | Description          | Example                     |
| -------------- | -------------------- | --------------------------- |
| `VITE_API_URL` | Backend API base URL | `http://localhost:5001/api` |

---

# 📌 Important Development Notes

### Environment files

Never commit real environment files containing secrets.

Use:

```text
.env.example
```

as a template.

Keep actual credentials inside:

```text
.env
```

and make sure `.env` is included in `.gitignore`.

---

### Database changes

When modifying database structure:

1. Update the schema.
2. Test the migration/change locally.
3. Verify existing functionality.
4. Update documentation where necessary.
5. Test with a clean database when possible.

---

### API changes

When changing API endpoints:

1. Update backend routes.
2. Update controllers/business logic.
3. Update validation.
4. Update frontend API calls.
5. Test authorization.
6. Test error handling.
7. Update this README if the public API changes.

---
---

# 🔄 CI/CD

This repository includes GitHub Actions workflows for continuous integration and a deploy-ready continuous delivery pipeline.

## Workflows

| Workflow | File | Triggers | What it does |
| --- | --- | --- | --- |
| **CI** | `.github/workflows/ci.yml` | Push & pull requests to `main` / `master` / `develop` | Installs deps, runs backend Jest tests, builds the Vite frontend, uploads `dist` artifact |
| **CD** | `.github/workflows/cd.yml` | Push to `main` / `master`, or manual **workflow_dispatch** | Re-verifies tests + build, uploads a SHA-tagged frontend artifact, then runs a staging deploy job (placeholder until you wire a host) |

## What runs in CI

1. **Backend** (`hrm-backend`): `npm ci` → `npm test`  
   - Unit tests only (no MySQL required).  
   - `JWT_SECRET` and `SKIP_BOOTSTRAP` are set by the workflow.
2. **Frontend** (`hrm-frontend`): `npm ci` → `npm run build`  
   - Optional repo variable `VITE_API_URL` controls the build-time API base URL.

Both jobs must pass for the aggregate **CI success** check (useful for branch protection).

## Enabling branch protection (recommended)

In GitHub → **Settings → Branches → Branch protection rules** for `main`:

- Require a pull request before merging
- Require status checks to pass: **CI success**
- (Optional) Require branches to be up to date

## Wiring real deploys (CD)

The CD workflow currently stops at a **Deploy (staging)** placeholder so the pipeline is safe by default. Choose a host and add the matching step:

| Target | Typical approach | Secrets / vars to add |
| --- | --- | --- |
| **Frontend – Vercel** | `amondnet/vercel-action` or Vercel GitHub integration | `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` |
| **Frontend – Netlify** | Netlify site + deploy from artifact | `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID` |
| **Backend – Render** | Deploy hook on push | `RENDER_DEPLOY_HOOK` |
| **Backend – Railway** | Railway GitHub integration or CLI | `RAILWAY_TOKEN` |
| **Docker / VPS** | Build image → push registry → SSH restart | Registry credentials + SSH key |

Also set repository **Variables** (Settings → Secrets and variables → Actions → Variables):

- `VITE_API_URL` — public API URL used when building the frontend (e.g. `https://api.example.com/api`)

Create GitHub **Environments** named `staging` and `production` if you want approval gates before production deploys.

## Local parity

```bash
# Same as CI backend job
cd hrm-backend && npm ci && npm test

# Same as CI frontend job
cd hrm-frontend && npm ci && npm run build

# 🔮 Future Improvements

The architecture provides a foundation for additional HR features.

Potential future improvements include:

* Advanced employee search and filtering.
* Employee profile management.
* Advanced payroll calculations.
* Payslip generation.
* Automated payroll processing.
* Advanced attendance analytics.
* Shift scheduling.
* Overtime tracking.
* Holiday management.
* Employee document management.
* Performance review workflows.
* Advanced reporting dashboards.
* Export reports to PDF/Excel.
* Email notifications.
* Push notifications.
* Audit logs.
* Multi-company support.
* Multi-language support.
* Dark mode.
* Mobile-responsive improvements.
* Progressive Web App support.
* Cloud deployment.
* Automated database backups.
* Advanced analytics.
* HR activity monitoring.

---

# 📱 Responsive & Cross-Platform Goals

The frontend is designed to provide a consistent experience across modern devices.

The long-term goal is to support:

```text
Desktop
   │
   ├── Windows
   ├── macOS
   └── Linux
        │
        ▼
Mobile
   │
   ├── Android
   └── iOS
        │
        ▼
Tablet
```

A future Progressive Web App implementation could allow employees to access the system from mobile devices without requiring a traditional app-store installation.

---

# 🧑‍💻 Contributing

Contributions are welcome.

To contribute:

### 1. Fork the repository

Create your own fork of the project.

### 2. Clone your fork

```bash
git clone https://github.com/naomina1836-netizen/employee-management-system.git
cd employee-management-system
```

### 3. Create a feature branch

```bash
git checkout -b feature/your-feature-name
```

### 4. Make your changes

Implement and test your changes.

### 5. Commit your work

```bash
git add .

git commit -m "feat: add your feature"
```

### 6. Push your branch

```bash
git push origin feature/your-feature-name
```

### 7. Open a Pull Request

Describe:

* What changed.
* Why it was changed.
* How it was tested.
* Any database changes.
* Any configuration changes.

---

# 📄 License

This project is currently maintained as a software development project.

If you intend to distribute or commercialize the application, add an appropriate open-source or proprietary license to the repository.

---

# 👨‍💻 Project Information

**Project:** Employee Management System

**Type:** Full-Stack Human Resource Management System

**Architecture:** Client–Server

**Frontend:** React + Vite

**Backend:** Node.js + Express.js

**Database:** MySQL

**Authentication:** JWT

**Authorization:** Role-Based Access Control

**Primary Roles:**

```text
Admin
HR
Manager
Employee
```

---

# ⭐ Project Status

The Employee Management System is actively developed and can be extended with additional HR, payroll, attendance, reporting, and employee-management functionality.

The project is structured to provide a maintainable foundation for both academic development and future production-oriented HR management features.

---

## Quick Reference

### Start Backend

```bash
cd hrm-backend
npm install
npm run dev
```

### Start Frontend

```bash
cd hrm-frontend
npm install
npm run dev
```

### Backend

```text
http://localhost:5001
```

### API

```text
http://localhost:5001/api
```

### Frontend

```text
http://localhost:5173
```

### Demo Login

```text
Email: admin@hrm.com
Password: password123
```

---

## Built With

```text
React
Vite
Node.js
Express.js
MySQL
JWT
REST API
JavaScript
HTML
CSS
```

**Employee Management System — Centralize HR operations, simplify employee management, and build a more efficient workplace.**
