# ExpenseFlow — REST API Documentation

## 1. API Architecture & Standards

- **Base URL**: `http://localhost:5000/api`
- **Protocol**: HTTP/1.1 over JSON
- **Authentication**: JWT Bearer Token in `Authorization: Bearer <token>` or HTTP-only signed cookies.
- **Error Format**: All errors return a uniform JSON structure:
```json
{
  "success": false,
  "message": "Human-readable explanation of error",
  "errors": [
    { "field": "amount", "message": "Amount must be greater than zero" }
  ]
}
```

---

## 2. Authentication Endpoints (`/api/auth`)

### 1. User Registration
- **Endpoint**: `POST /api/auth/register`
- **Access**: Public (Rate-limited: 30 req / 15 min)
- **Request Body**:
```json
{
  "name": "Ananya Sharma",
  "email": "ananya@example.com",
  "password": "SecurePassword123!",
  "currency": "INR",
  "monthlyIncomeTarget": 60000
}
```
- **Response `(201 Created)`**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "670c79e62f026a0f67000001",
    "name": "Ananya Sharma",
    "email": "ananya@example.com",
    "currency": "INR",
    "monthlyIncomeTarget": 60000,
    "theme": "light",
    "createdAt": "2026-10-14T01:00:00.000Z"
  }
}
```

### 2. User Login
- **Endpoint**: `POST /api/auth/login`
- **Access**: Public (Rate-limited: 30 req / 15 min)
- **Request Body**:
```json
{
  "email": "ananya@example.com",
  "password": "SecurePassword123!"
}
```
- **Response `(200 OK)`**: Returns token and user object, sets HTTP-only cookie.

### 3. User Logout
- **Endpoint**: `POST /api/auth/logout`
- **Access**: Public
- **Response `(200 OK)`**: Clears HTTP-only token cookie.

### 4. Authenticate Me Check
- **Endpoint**: `GET /api/auth/me`
- **Access**: Protected (Bearer Token)
- **Response `(200 OK)`**: Returns authenticated user profile.

---

## 3. Transaction Endpoints (`/api/transactions`)

### 1. Get Transactions (Paginated, Filtered, Sorted)
- **Endpoint**: `GET /api/transactions`
- **Access**: Protected
- **Query Parameters**:
  - `page`: Integer (default 1)
  - `limit`: Integer (default 20, max 100)
  - `sortBy`: 'date' | 'amount' | 'description' (default 'date')
  - `sortOrder`: 'desc' | 'asc' (default 'desc')
  - `type`: 'income' | 'expense' (optional)
  - `categoryId`: ObjectId (optional)
  - `paymentMethod`: 'UPI' | 'card' | 'cash' | 'bank transfer' | 'other' (optional)
  - `startDate`: ISO Date YYYY-MM-DD (optional)
  - `endDate`: ISO Date YYYY-MM-DD (optional)
  - `search`: String (searches description, notes, and tags)
- **Response `(200 OK)`**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "670c79e62f026a0f67000010",
      "userId": "670c79e62f026a0f67000001",
      "type": "expense",
      "amount": 1450.00,
      "categoryId": {
        "_id": "670c79e62f026a0f67000005",
        "name": "Food & Dining",
        "type": "expense",
        "color": "#ef4444",
        "icon": "utensils"
      },
      "description": "Weekly Groceries",
      "date": "2026-10-12T14:30:00.000Z",
      "paymentMethod": "UPI",
      "notes": "Produce and spices",
      "tags": ["groceries", "home"],
      "createdAt": "2026-10-12T14:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalRecords": 45,
    "totalPages": 3
  },
  "summary": {
    "totalIncome": 75000,
    "totalExpense": 32450.50,
    "netBalance": 42549.50
  }
}
```

### 2. Export Transactions to CSV
- **Endpoint**: `GET /api/transactions/export/csv`
- **Access**: Protected
- **Query Parameters**: Accepts identical filter parameters as `GET /api/transactions`.
- **Response `(200 OK)`**: RFC 4180 compliant CSV stream with `Content-Type: text/csv`.

### 3. Create Transaction
- **Endpoint**: `POST /api/transactions`
- **Access**: Protected
- **Request Body**:
```json
{
  "type": "expense",
  "amount": 850.00,
  "categoryId": "670c79e62f026a0f67000005",
  "description": "Campus Bookstore Supplies",
  "date": "2026-10-14T10:00:00.000Z",
  "paymentMethod": "card",
  "notes": "Study notebooks and pens",
  "tags": ["college", "supplies"]
}
```
- **Response `(201 Created)`**: Returns created transaction.

### 4. Update Transaction
- **Endpoint**: `PATCH /api/transactions/:id`
- **Access**: Protected
- **Response `(200 OK)`**: Returns modified transaction document.

### 5. Delete Transaction
- **Endpoint**: `DELETE /api/transactions/:id`
- **Access**: Protected
- **Response `(200 OK)`**: `{ "success": true, "message": "Transaction deleted successfully" }`

---

## 4. Category Endpoints (`/api/categories`)

### 1. Get Categories
- **Endpoint**: `GET /api/categories`
- **Access**: Protected
- **Query Parameters**: `type`: 'income' | 'expense' (optional)
- **Response `(200 OK)`**: Array of user categories.

### 2. Create Category
- **Endpoint**: `POST /api/categories`
- **Access**: Protected
- **Request Body**:
```json
{
  "name": "Fitness & Gym",
  "type": "expense",
  "color": "#10b981",
  "icon": "dumbbell"
}
```
- **Response `(201 Created)`**: Returns created category.

### 3. Update Category
- **Endpoint**: `PATCH /api/categories/:id`
- **Access**: Protected

### 4. Delete Category
- **Endpoint**: `DELETE /api/categories/:id`
- **Access**: Protected
- **Referential check**: Returns `400 Bad Request` if category is in use by transactions or budgets.

---

## 5. Budget Endpoints (`/api/budgets`)

### 1. Get Budgets
- **Endpoint**: `GET /api/budgets`
- **Access**: Protected
- **Query Parameters**: `month`: 1-12, `year`: e.g. 2026.
- **Response `(200 OK)`**:
```json
{
  "success": true,
  "month": 10,
  "year": 2026,
  "summary": {
    "totalBudget": 35000,
    "totalSpent": 28450,
    "remaining": 6550,
    "overallPercentage": 81.29
  },
  "budgets": [
    {
      "_id": "670c79e62f026a0f67000030",
      "categoryId": {
        "_id": "670c79e62f026a0f67000005",
        "name": "Food & Dining",
        "color": "#ef4444",
        "icon": "utensils"
      },
      "amount": 10000,
      "actualSpent": 8500,
      "remaining": 1500,
      "percentageUsed": 85.00,
      "alertThreshold": 80,
      "isExceeded": false,
      "isNearThreshold": true
    }
  ]
}
```

### 2. Create Budget
- **Endpoint**: `POST /api/budgets`
- **Access**: Protected
- **Request Body**:
```json
{
  "categoryId": "670c79e62f026a0f67000005",
  "amount": 12000,
  "month": 10,
  "year": 2026,
  "alertThreshold": 80
}
```

---

## 6. MongoDB Aggregation Analytics Endpoints (`/api/analytics`)

| Endpoint | Method | Key Pipeline Operators | Description |
|---|---|---|---|
| `/api/analytics/summary` | GET | `$match`, `$group`, `$cond`, `$project` | Aggregation 1: Total income, expenses, net balance, savings rate |
| `/api/analytics/category-breakdown` | GET | `$match`, `$group`, `$lookup`, `$unwind`, `$project`, `$sort` | Aggregation 2: Category expense breakdown with shares |
| `/api/analytics/monthly-trends` | GET | `$match`, `$group`, `$sort`, `$project` | Aggregation 3: 6-month financial trajectory |
| `/api/analytics/daily-trends` | GET | `$match`, `$group`, `$sort`, `$project` | Aggregation 4: Day-by-day expenditure curve |
| `/api/analytics/budget-utilization` | GET | `$match`, `$lookup` (pipeline), `$addFields`, `$project` | Aggregation 5: Budget limit vs actual transactions |
| `/api/analytics/top-categories` | GET | `$match`, `$group`, `$lookup`, `$sort`, `$limit` | Aggregation 6: Top N highest spending categories |
| `/api/analytics/payment-methods` | GET | `$match`, `$group`, `$project`, `$sort` | Aggregation 7: Payment rail distribution |
| `/api/analytics/month-comparison` | GET | `$match`, `$group`, zero-division protection | Aggregation 8: Month-over-month comparative analysis |
