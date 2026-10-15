# ExpenseFlow — Smart Expense Tracker 💰📊

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-brightgreen.svg)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-30%20Passed-success.svg)]()

> A full-stack, college-grade personal finance and database management system powered by **React 18**, **Express.js**, and **MongoDB with Mongoose ODM**. Demonstrates real-world document schema architecture, compound indexing, referential integrity guards, and eight advanced server-side MongoDB aggregation pipelines.

---

## 🚀 Key Highlights & Capabilities

- 🔐 **Authentication & Security**: Salted bcrypt password hashing, stateless JWT session verification, HTTP-only cookie support, and rate-limited authentication endpoints.
- 🗃️ **Strict MongoDB Document Architecture**:
  - `users`: Authenticated user accounts, currency preference, and financial benchmarks.
  - `categories`: Income and expense categorization with compound uniqueness and referential integrity protection.
  - `transactions`: High-performance indexed ledger with numeric currency precision rounding.
  - `budgets`: Category budget ceilings with spending derived dynamically from real transaction documents.
- 📈 **8 Advanced MongoDB Aggregation Pipelines**:
  1. **Total Cash Flow Summary**: `$match`, `$group` conditional sums, net balance, and savings rate.
  2. **Category Expense Breakdown**: Category share distribution with `$lookup` and `$unwind`.
  3. **Multi-Month Financial Trends**: 6-month chronological cash flow trajectory.
  4. **Daily Spending Curves**: Day-by-day expense progression across custom intervals.
  5. **Dynamic Budget Utilization**: Sub-pipeline `$lookup` comparing limits with real-time expenses.
  6. **Top Spending Categories**: Top $N$ expenditure drains with sorting and limits.
  7. **Payment-Method Analysis**: Spending grouped across payment channels (UPI, Card, Cash, etc.).
  8. **Month-over-Month Variance**: Differential comparative analysis with division-by-zero protection.
- 📥 **RFC 4180 CSV Export**: Server-side authorized transaction export with formula injection mitigations.
- 🎨 **Modern SaaS Dashboard**: Light and dark mode support, Recharts visualizations, responsive sidebar and mobile navigation, loading skeletons, and interactive modals.
- 🧪 **100% Automated Test Coverage**: Vitest suites running against `mongodb-memory-server` and React Testing Library.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, Axios, Recharts, Lucide Icons |
| **Backend** | Node.js, Express.js, Mongoose ODM, JSON Web Tokens (JWT), bcryptjs, Zod, Helmet, Morgan |
| **Database** | MongoDB Community Server / MongoDB Atlas / Embedded MongoMemoryServer |
| **Testing** | Vitest, Supertest, React Testing Library, jsdom, mongodb-memory-server |

---

## 📋 Prerequisites

Before getting started, ensure you have the following installed on your machine:
- **Node.js**: Version `20.x` or higher LTS ([Download Node.js](https://nodejs.org/))
- **npm**: Version `10.x` or higher (bundled with Node.js)
- **MongoDB**: Either:
  - Local MongoDB Community Server running on `localhost:27017`, **OR**
  - A free cloud MongoDB Atlas cluster connection string, **OR**
  - Nothing! ExpenseFlow includes automatic in-memory MongoDB fallback in development/test modes!

---

## ⚡ Quick Start & Installation

### 1. Clone or Open Workspace
Ensure you are located inside the project directory:
```bash
cd expenseflow
```

### 2. Configure Environment Variables
Copy `.env.example` into `server/.env` (or configure root environment variables):
```bash
cp .env.example server/.env
```

Default configuration in `.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/expenseflow
JWT_SECRET=super_secret_jwt_signing_key_replace_with_32_char_minimum_random_string
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

DEMO_USER_EMAIL=demo@expenseflow.app
DEMO_USER_PASSWORD=DemoPassword123!
DEMO_USER_NAME="Demo Student"
```

### 3. Install Dependencies
Run `npm install` from the root directory (this installs dependencies for both `server` and `client` workspaces):
```bash
npm install
```

---

## 🧪 Running Tests

ExpenseFlow includes 30 automated integration and unit tests that run against a dedicated in-memory MongoDB replica:

```bash
# Run all tests (Server + Client)
npm run test

# Run backend tests only (20 tests)
npm run test:server

# Run frontend tests only (10 tests)
npm run test:client
```

---

## 🗄️ Seeding Demo Data

To populate the database with a demonstration account and over 3 months of realistic transactions, categories, and budgets:

```bash
npm run seed
```

### Demo Credentials:
- **Email**: `demo@expenseflow.app`
- **Password**: `DemoPassword123!`
*(The login page also provides a 1-click "Fill Demo Account" helper for quick demonstration!)*

---

## 🚀 Running the Application

### Option A: Run Both Client & Server Concurrently
```bash
npm run dev
```

### Option B: Run in Separate Terminals
**Terminal 1 (Backend Server):**
```bash
npm run dev:server
# Server starts at http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
npm run dev:client
# Vite client starts at http://localhost:5173
```

Now open **http://localhost:5173** in your web browser.

---

## 🏗️ Production Build

To build the client application for production:
```bash
npm run build
```
Optimized assets will be compiled into `client/dist/`.

---

## 📂 Project Directory Structure

```
expenseflow/
├── client/                     # Frontend Application
│   ├── src/
│   │   ├── api/                # Axios API client & interceptors
│   │   ├── components/         # Reusable UI widgets (Card, Button, Modal, Badge, etc.)
│   │   ├── context/            # AuthContext and ThemeContext
│   │   ├── layouts/            # DashboardLayout with Sidebar & Navbar
│   │   ├── pages/              # Dashboard, Transactions, Budgets, Categories, Reports, Profile
│   │   ├── routes/             # AppRoutes and ProtectedRoute guards
│   │   ├── utils/              # Currency, date, and percentage formatters
│   │   ├── __tests__/          # Frontend unit & component tests
│   │   ├── App.jsx             # Root React component
│   │   └── main.jsx            # React DOM entry
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/                     # Backend API Service
│   ├── src/
│   │   ├── config/             # MongoDB connection with memory-server fallback
│   │   ├── controllers/        # Express route controllers (Auth, Tx, Budget, Category, Analytics)
│   │   ├── middleware/         # JWT authentication, Zod validation, error handling
│   │   ├── models/             # Mongoose schemas (User, Category, Transaction, Budget)
│   │   ├── routes/             # Express API routes
│   │   ├── seed/               # Realistic 3-month demo seed script
│   │   ├── services/           # 8 Core MongoDB Aggregation Pipelines
│   │   ├── utils/              # RFC 4180 CSV serialization utility
│   │   ├── validators/         # Zod request validation schemas
│   │   ├── app.js              # Express app definition
│   │   └── server.js           # Server listener entry point
│   ├── tests/                  # Integration tests with Supertest
│   ├── package.json
│   └── vitest.config.js
├── docs/                       # Comprehensive Academic Documentation
│   ├── project-report.md       # Complete 28-section academic project report
│   ├── database-schema.md      # Detailed database schema and index specifications
│   ├── api-documentation.md    # REST API endpoints, queries, and JSON payloads
│   └── viva-questions.md       # 30 likely college viva questions & in-depth answers
├── .env.example                # Sample environment configuration template
├── .gitignore
├── package.json                # Root npm workspace configuration
└── README.md                   # Setup guide and documentation
```

---

## 📚 Documentation Reference

Detailed academic documentation is included inside the `/docs` directory:
- [Academic Project Report](docs/project-report.md): Formal 28-section submission report with system architecture, ER diagrams, testing tables, and screenshots checklist.
- [Database Schema Reference](docs/database-schema.md): Complete BSON schema types, indexes, and referential integrity strategies.
- [API Documentation](docs/api-documentation.md): Comprehensive REST endpoint contracts, query parameters, and JSON responses.
- [College Viva Preparation Guide](docs/viva-questions.md): 30 in-depth viva questions covering MongoDB architecture, aggregations, indexing, and security.

---

## 🔧 Troubleshooting

- **Port 5000 Already In Use**: Set `PORT=5001` in your `.env` file; the Vite proxy and frontend API client will connect accordingly.
- **MongoDB Connection Error**: If local MongoDB is not running, the development server and test suite automatically initialize the embedded in-memory MongoDB engine.
- **Node/npm Not Recognized**: Ensure Node.js is added to your system's `PATH` environment variable.

---

## 📄 License

This project is licensed under the MIT License for educational and academic submission purposes.
