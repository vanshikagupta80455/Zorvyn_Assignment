# EasyFinance — Finance Data Processing & Access Control System

A full-stack finance dashboard application with role-based access control (RBAC), financial record management, and analytics visualization.

## 🏗️ Architecture

```
├── server/                    # Backend (Node.js + Express)
│   ├── db/
│   │   └── database.js        # SQLite initialization, schema, seed data
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication middleware
│   │   ├── rbac.js            # Role-based access control middleware
│   │   └── validate.js        # Input validation middleware
│   ├── routes/
│   │   ├── auth.js            # Login, register, profile endpoints
│   │   ├── dashboard.js       # Summary, trends, category APIs
│   │   ├── records.js         # Financial records CRUD
│   │   └── users.js           # User management CRUD
│   ├── index.js               # Express app entry point
│   └── .env                   # Environment variables
│
├── client/                    # Frontend (React + Vite)
│   └── src/
│       ├── components/        # Reusable UI components
│       ├── contexts/          # React context (Auth)
│       ├── pages/             # Page components
│       ├── utils/             # API client
│       ├── App.jsx            # Router & layout
│       └── index.css          # Design system
```

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- npm

### Installation & Running

> **Important:** This project has two separate apps — a **backend** (`server/`) and a **frontend** (`client/`). Each has its own `package.json` and must be set up independently. Do **not** run `npm` commands from the root `Antigravity/` directory.

#### Step 1 — Start the Backend Server

Open a terminal and navigate to the `server` directory:

```bash
# From the project root (Antigravity/)
cd server

# Install backend dependencies
npm install

# Start the backend server (runs on http://localhost:5000)
npm start
```

> ✅ You should see a message like `Server running on port 5000` in this terminal. **Keep this terminal open.**

#### Step 2 — Start the Frontend Dev Server

Open a **second/new terminal** and navigate to the `client` directory:

```bash
# From the project root (Antigravity/)
cd client

# Install frontend dependencies
npm install

# Start the frontend dev server (runs on http://localhost:5173)
npm run dev
```

> ✅ You should see Vite's output with a local URL. **Keep this terminal open too.**

#### Step 3 — Open the App

Once both servers are running, open **http://localhost:5173** in your browser.

## 🔑 Default Credentials

| Role    | Username  | Password     | Permissions                          |
|---------|-----------|-------------|--------------------------------------|
| Admin   | admin     | admin123    | Full access: CRUD records & users    |
| Analyst | analyst   | analyst123  | View records, analytics, dashboards  |
| Viewer  | viewer    | viewer123   | View dashboard summary & recent activity |

## 📡 API Endpoints

### Authentication
| Method | Endpoint             | Access   | Description                    |
|--------|---------------------|----------|--------------------------------|
| POST   | `/api/auth/login`    | Public   | Authenticate user, return JWT  |
| POST   | `/api/auth/register` | Admin    | Create new user                |
| GET    | `/api/auth/me`       | Auth     | Get current user profile       |

### Users (Admin only)
| Method | Endpoint           | Description                |
|--------|--------------------|----------------------------|
| GET    | `/api/users`       | List all users             |
| GET    | `/api/users/:id`   | Get user by ID             |
| PUT    | `/api/users/:id`   | Update user (role, status) |
| DELETE | `/api/users/:id`   | Soft-delete user           |

### Financial Records
| Method | Endpoint            | Access         | Description                               |
|--------|---------------------|---------------|------------------------------------------|
| GET    | `/api/records`      | Analyst, Admin | List records (with filters & pagination) |
| GET    | `/api/records/:id`  | Analyst, Admin | Get single record                        |
| POST   | `/api/records`      | Admin          | Create record                            |
| PUT    | `/api/records/:id`  | Admin          | Update record                            |
| DELETE | `/api/records/:id`  | Admin          | Soft-delete record                       |

**Query Parameters for GET /api/records:**
- `page`, `limit` — Pagination
- `type` — Filter by `income` or `expense`
- `category` — Filter by category
- `start_date`, `end_date` — Date range filter
- `search` — Search in description and category
- `sort_by` — Sort column (`date`, `amount`, `category`, `type`)
- `sort_order` — `asc` or `desc`

### Dashboard Analytics
| Method | Endpoint                      | Access         | Description                     |
|--------|-------------------------------|---------------|--------------------------------|
| GET    | `/api/dashboard/summary`      | All roles     | Income, expenses, net balance  |
| GET    | `/api/dashboard/category-totals` | Analyst, Admin | Category-wise totals          |
| GET    | `/api/dashboard/trends`       | Analyst, Admin | Monthly income/expense trends  |
| GET    | `/api/dashboard/recent`       | All roles     | Recent financial activity      |

## 🛡️ Access Control Matrix

| Action                      | Viewer | Analyst | Admin |
|-----------------------------|--------|---------|-------|
| View dashboard summary      | ✅     | ✅      | ✅    |
| View recent activity        | ✅     | ✅      | ✅    |
| View analytics/charts       | ❌     | ✅      | ✅    |
| View financial records      | ❌     | ✅      | ✅    |
| Create/Edit/Delete records  | ❌     | ❌      | ✅    |
| Manage users                | ❌     | ❌      | ✅    |

## 🛠️ Tech Stack

| Component     | Technology              |
|--------------|------------------------|
| Backend      | Node.js + Express      |
| Database     | SQLite (sql.js)        |
| Auth         | JWT + bcryptjs         |
| Frontend     | React 18 + Vite        |
| Charts       | Recharts               |
| Icons        | Lucide React           |
| Styling      | Vanilla CSS (dark theme) |

## 📐 Design & Assumptions

### Design Decisions
1. **SQLite via sql.js** — Pure JavaScript SQLite implementation. No native compilation needed. File-based persistence with auto-save every 30 seconds.
2. **JWT Authentication** — Stateless token authentication. Tokens expire after 24 hours.
3. **Soft Deletes** — Both users and records use soft delete (`deleted_at` timestamp) for data safety.
4. **Role-Based Middleware** — `requireRole()` factory function as Express middleware for clean, composable access control.
5. **Input Validation Middleware** — Dedicated validation layer separate from business logic.

### Assumptions
- This is a single-tenant system (one organization)
- Passwords are hashed with bcrypt (10 rounds)
- The admin user cannot demote themselves or deactivate their own account
- Financial amounts are stored as floating-point numbers (suitable for this scope; production would use fixed-point/decimal)
- The database auto-seeds with sample data on first run

### Tradeoffs
- **sql.js vs. PostgreSQL/MySQL**: Chosen for zero-config setup. Production would use a proper RDBMS.
- **In-process auth vs. separate auth service**: Suitable for this scope; microservices would extract auth.
- **No rate limiting**: Could be added with `express-rate-limit` for production.
- **No refresh tokens**: Single JWT with 24h expiry. Production would use refresh token rotation.

## 📋 Features Implemented

### Core
- ✅ User & Role Management (CRUD, role assignment, status toggle)
- ✅ Financial Records Management (CRUD with filtering, pagination, sorting, search)
- ✅ Dashboard Summary APIs (totals, category breakdown, monthly trends, recent activity)
- ✅ Role-Based Access Control (middleware enforcement)
- ✅ Input Validation & Error Handling
- ✅ SQLite Data Persistence (file-based)

### Optional Enhancements
- ✅ JWT Token Authentication
- ✅ Pagination for record listing
- ✅ Search support
- ✅ Soft delete functionality
- ✅ API documentation (this README)
- ✅ Modern, responsive UI with dark theme

## 📄 License

MIT
