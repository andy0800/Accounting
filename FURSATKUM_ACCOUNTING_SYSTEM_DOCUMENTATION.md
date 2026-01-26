# Fursatkum Accounting System - Complete Documentation

## 📋 Table of Contents
1. [Technology Stack](#technology-stack)
2. [System Architecture](#system-architecture)
3. [Database Structure](#database-structure)
4. [IN/OUT Structure](#inout-structure)
5. [Calculation Logic](#calculation-logic)
6. [Model References](#model-references)
7. [API Endpoints](#api-endpoints)
8. [Frontend Components](#frontend-components)
9. [Example Records](#example-records)
10. [File Structure](#file-structure)

---

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js 4.18.2
- **Database**: MongoDB (MongoDB Atlas)
- **ODM**: Mongoose 8.0.3
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **File Upload**: Multer 1.4.5-lts.2
- **Excel Export**: ExcelJS 4.4.0
- **Other**: bcryptjs, cors, compression, helmet, express-rate-limit

### Frontend
- **Framework**: React 18.2.0
- **Language**: TypeScript 4.9.5
- **UI Library**: Material-UI (MUI) 5.14.20
- **Routing**: React Router DOM 6.20.1
- **HTTP Client**: Axios 1.6.2
- **Charts**: Recharts 2.8.0
- **Date Handling**: date-fns 2.30.0

### Database
- **Type**: MongoDB (NoSQL Document Database)
- **Host**: MongoDB Atlas (Cloud)
- **Connection**: Mongoose ODM
- **Collections**: 3 main collections for Fursatkum system

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + TypeScript)             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Dashboard   │  │   Invoices   │  │  Accounting   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │               │
│         └─────────────────┴──────────────────┘             │
│                           │                                  │
│                    Axios HTTP Client                         │
└───────────────────────────┼─────────────────────────────────┘
                            │
                            │ REST API
                            │
┌───────────────────────────┼─────────────────────────────────┐
│                    Backend (Node.js + Express)               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              API Routes (/api/fursatkum)             │   │
│  │  • GET    /dashboard                                  │   │
│  │  • GET    /invoices                                   │   │
│  │  • POST   /invoices                                   │   │
│  │  • PUT    /invoices/:id                              │   │
│  │  • DELETE /invoices/:id                               │   │
│  │  • GET    /accounting                                 │   │
│  │  • GET    /transactions                               │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
│                    Business Logic                            │
│  • Balance Calculations                                      │
│  • Transaction Recording                                     │
│  • Reference Number Generation                               │
│  • Validation & Authorization                               │
└───────────────────────────┼─────────────────────────────────┘
                            │
                            │ Mongoose ODM
                            │
┌───────────────────────────┼─────────────────────────────────┐
│                    MongoDB Atlas (Cloud)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Invoices   │  │ Transactions │  │   Account     │     │
│  │  Collection  │  │  Collection  │  │  Collection   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Structure

### Collections (MongoDB)

#### 1. **fursatkuminvoices** Collection
**Model**: `FursatkumInvoice`  
**File**: `server/models/FursatkumInvoice.js`

**Schema Fields**:
```javascript
{
  referenceNumber: String (unique, required)  // e.g., "F-INC-001", "F-SPD-001"
  type: Enum ['income', 'spending'] (required)
  ledger: Enum ['cash', 'bank'] (required)
  bankReference: String (optional, required if ledger='bank')
  name: String (required)
  value: Number (required, min: 0.001)
  currency: Enum ['KWD'] (default: 'KWD')
  date: Date (required)
  details: String (optional)
  document: {
    name: String
    filePath: String
    uploadedAt: Date
  } (optional)
  status: Enum ['active', 'deleted'] (default: 'active')
  isEdited: Boolean (default: false)
  editHistory: [{
    field: String
    oldValue: Mixed
    newValue: Mixed
    reason: String
    editedAt: Date
    editedBy: ObjectId (ref: 'User')
  }]
  deletedAt: Date (optional)
  deletedBy: ObjectId (ref: 'User') (optional)
  deleteReason: String (optional)
  createdBy: ObjectId (ref: 'User')
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

**Indexes**:
- `{ type: 1, status: 1 }`
- `{ referenceNumber: 1 }`
- `{ date: -1 }`
- `{ status: 1, date: -1 }`
- `{ ledger: 1, type: 1, status: 1 }`

---

#### 2. **fursatkumtransactions** Collection
**Model**: `FursatkumTransaction`  
**File**: `server/models/FursatkumTransaction.js`

**Schema Fields**:
```javascript
{
  type: Enum [
    'income',
    'spending',
    'income_reversal',
    'spending_reversal',
    'income_adjustment',
    'spending_adjustment'
  ] (required)
  ledger: Enum ['cash', 'bank'] (required)
  amount: Number (required)  // Positive for income, negative for spending
  balanceAfter: Number (required)  // Balance after this transaction
  date: Date (default: Date.now)
  invoiceId: ObjectId (ref: 'FursatkumInvoice') (optional)
  invoiceRef: String (optional)
  description: String (optional)
  reason: String (optional)  // For adjustments/reversals
  performedBy: ObjectId (ref: 'User')
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

**Indexes**:
- `{ ledger: 1, date: -1 }`
- `{ type: 1 }`
- `{ invoiceId: 1 }`
- `{ date: -1 }`

---

#### 3. **fursatkumaccounts** Collection
**Model**: `FursatkumAccount`  
**File**: `server/models/FursatkumAccount.js`

**Schema Fields**:
```javascript
{
  bankBalance: Number (default: 0, min: 0)
  cashBalance: Number (default: 0, min: 0)
  incomeCounter: Number (default: 0)  // For generating income reference numbers
  spendingCounter: Number (default: 0)  // For generating spending reference numbers
  bankInfo: {
    bankName: String (default: 'بنك الكويت الوطني')
    accountName: String (default: 'شركة فرصتكم')
    accountNumber: String (default: '1234567890')
    iban: String (default: 'KW00NBOK0000000000000000000000')
  }
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

**Special Methods**:
- `getAccount()`: Static method to get or create singleton account
- `getNextReference(type)`: Static method to generate next reference number

---

## 📊 IN/OUT Structure

### IN (Income) - فاتورة دخل

**Definition**: Money coming INTO the system (revenue/income)

**Characteristics**:
- **Type**: `'income'`
- **Reference Prefix**: `'F-INC-'` (e.g., F-INC-001, F-INC-002)
- **Balance Effect**: **INCREASES** the ledger balance
- **Transaction Amount**: **Positive** value

**Flow**:
```
User creates Income Invoice
    ↓
System generates reference (F-INC-XXX)
    ↓
Adds value to selected ledger (cash or bank)
    ↓
Creates transaction record with positive amount
    ↓
Updates account balance
```

**Example**:
- Invoice: "فاتورة دخل - بيع خدمة" (Income Invoice - Service Sale)
- Value: 500.000 د.ك
- Ledger: bank
- Result: `bankBalance += 500.000`

---

### OUT (Spending) - إيصال صرف

**Definition**: Money going OUT of the system (expenses/spending)

**Characteristics**:
- **Type**: `'spending'`
- **Reference Prefix**: `'F-SPD-'` (e.g., F-SPD-001, F-SPD-002)
- **Balance Effect**: **DECREASES** the ledger balance
- **Transaction Amount**: **Negative** value
- **Validation**: Must check sufficient balance before creating

**Flow**:
```
User creates Spending Invoice
    ↓
System validates sufficient balance
    ↓
System generates reference (F-SPD-XXX)
    ↓
Subtracts value from selected ledger (cash or bank)
    ↓
Creates transaction record with negative amount
    ↓
Updates account balance
```

**Example**:
- Invoice: "إيصال صرف - مصروفات مكتب" (Spending Receipt - Office Expenses)
- Value: 200.000 د.ك
- Ledger: cash
- Result: `cashBalance -= 200.000` (if balance >= 200.000)

---

### Ledger Types

#### 1. **Cash (صندوق نقدي)**
- Physical cash/on-hand money
- Field: `cashBalance` in Account
- No bank reference required

#### 2. **Bank (حساب بنكي)**
- Bank account money
- Field: `bankBalance` in Account
- **Requires** `bankReference` field (bank transaction reference)

---

## 🧮 Calculation Logic

### 1. Balance Calculations

#### Creating Income Invoice
```javascript
// Location: server/routes/fursatkum.js (line 228-239)

if (type === 'spending') {
  // Validate sufficient balance
  if (numValue > account[ledgerField]) {
    return error('Insufficient balance');
  }
  account[ledgerField] -= numValue;  // Decrease balance
} else {
  account[ledgerField] += numValue;  // Increase balance (income)
}
```

#### Creating Spending Invoice
```javascript
// Same location, but spending path
account[ledgerField] -= numValue;  // Decrease balance
```

#### Editing Invoice Value
```javascript
// Location: server/routes/fursatkum.js (line 300-348)

const difference = newValue - invoice.value;

if (invoice.type === 'income') {
  account[ledgerField] += difference;  // Add difference
} else {
  // Spending: Check if increase is valid
  if (difference > 0 && difference > account[ledgerField]) {
    return error('Insufficient balance for increase');
  }
  account[ledgerField] -= difference;  // Subtract difference
}
```

#### Deleting Invoice (Reversal)
```javascript
// Location: server/routes/fursatkum.js (line 446-451)

if (invoice.type === 'income') {
  account[ledgerField] -= invoice.value;  // Reverse income
  if (account[ledgerField] < 0) account[ledgerField] = 0;  // Prevent negative
} else {
  account[ledgerField] += invoice.value;  // Reverse spending
}
```

---

### 2. Reference Number Generation

```javascript
// Location: server/models/FursatkumAccount.js (line 53-70)

fursatkumAccountSchema.statics.getNextReference = async function(type) {
  const account = await this.getAccount();
  let counter, prefix;

  if (type === 'income') {
    account.incomeCounter += 1;
    counter = account.incomeCounter;
    prefix = 'F-INC';
  } else {
    account.spendingCounter += 1;
    counter = account.spendingCounter;
    prefix = 'F-SPD';
  }

  await account.save();
  return `${prefix}-${counter.toString().padStart(3, '0')}`;
  // Examples: F-INC-001, F-INC-002, F-SPD-001, F-SPD-002
};
```

---

### 3. Transaction Recording

Every invoice operation creates a transaction record:

```javascript
// Location: server/routes/fursatkum.js (line 267-277)

await FursatkumTransaction.create({
  type: type,  // 'income' or 'spending'
  ledger: ledger,  // 'cash' or 'bank'
  amount: type === 'income' ? numValue : -numValue,  // Positive or negative
  balanceAfter: account[ledgerField],  // Balance after transaction
  date: new Date(date),
  invoiceId: invoice._id,
  invoiceRef: referenceNumber,
  description: `${type === 'income' ? 'فاتورة دخل' : 'إيصال صرف'}: ${name}`,
  performedBy: getUserId(req),
});
```

---

### 4. Aggregation Calculations

#### Total Income Calculation
```javascript
// Location: server/routes/fursatkum.js (line 486-489)

FursatkumInvoice.aggregate([
  { $match: { type: 'income', status: 'active' } },
  { $group: { _id: null, total: { $sum: '$value' } } },
])
```

#### Total Spending Calculation
```javascript
// Location: server/routes/fursatkum.js (line 490-493)

FursatkumInvoice.aggregate([
  { $match: { type: 'spending', status: 'active' } },
  { $group: { _id: null, total: { $sum: '$value' } } },
])
```

---

## 🔗 Model References

### Reference Relationships

```
FursatkumInvoice
    ├── createdBy → User (ObjectId reference)
    ├── deletedBy → User (ObjectId reference)
    └── editHistory[].editedBy → User (ObjectId reference)

FursatkumTransaction
    ├── invoiceId → FursatkumInvoice (ObjectId reference)
    └── performedBy → User (ObjectId reference)

FursatkumAccount
    └── (No references - singleton pattern)
```

### Population Examples

```javascript
// Populate user information
invoice.populate('createdBy', 'username')
invoice.populate('deletedBy', 'username')
invoice.populate('editHistory.editedBy', 'username')

// Populate transaction invoice
transaction.populate('invoiceId', 'referenceNumber name')
transaction.populate('performedBy', 'username')
```

---

## 🌐 API Endpoints

### Base URL: `/api/fursatkum`

### Authentication
- **Required**: JWT Bearer Token
- **Role**: Admin only (`requireAdmin` middleware)

---

### 1. Dashboard
```
GET /api/fursatkum/dashboard
```
**Response**:
```json
{
  "bankBalance": 10000.000,
  "cashBalance": 5000.000,
  "bankInfo": {
    "bankName": "بنك الكويت الوطني",
    "accountName": "شركة فرصتكم",
    "accountNumber": "1234567890",
    "iban": "KW00NBOK0000000000000000000000"
  },
  "invoiceCounts": {
    "income": 150,
    "spending": 75,
    "deleted": 5,
    "total": 225
  },
  "recentTransactions": [...]
}
```

---

### 2. List Invoices
```
GET /api/fursatkum/invoices
```
**Query Parameters**:
- `type`: 'all' | 'income' | 'spending'
- `ledger`: 'all' | 'cash' | 'bank'
- `status`: 'active' | 'deleted' (default: 'active')
- `page`: number (default: 1)
- `limit`: number (default: 50, max: 200)
- `search`: string (searches referenceNumber, bankReference, name, details)
- `startDate`: ISO date string
- `endDate`: ISO date string

**Response**:
```json
{
  "invoices": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3
  }
}
```

---

### 3. Get Single Invoice
```
GET /api/fursatkum/invoices/:id
```
**Response**: Single invoice object with populated fields

---

### 4. Create Invoice
```
POST /api/fursatkum/invoices
Content-Type: multipart/form-data
```
**Body** (FormData):
- `type`: 'income' | 'spending' (required)
- `ledger`: 'cash' | 'bank' (required)
- `name`: string (required)
- `value`: number (required, min: 0.001)
- `date`: ISO date string (required)
- `details`: string (optional)
- `bankReference`: string (required if ledger='bank')
- `document`: File (optional, max 15MB, jpeg/jpg/png/pdf)

**Response**:
```json
{
  "message": "تم إنشاء الفاتورة بنجاح",
  "invoice": {...}
}
```

**Validation**:
- Spending invoices: Checks sufficient balance
- Bank ledger: Requires bankReference

---

### 5. Edit Invoice
```
PUT /api/fursatkum/invoices/:id
Content-Type: multipart/form-data
```
**Body**:
- `name`: string (optional)
- `value`: number (optional)
- `date`: ISO date string (optional)
- `details`: string (optional)
- `bankReference`: string (optional, if ledger='bank')
- `reason`: string (required) - Reason for edit
- `document`: File (optional)

**Response**:
```json
{
  "message": "تم تحديث الفاتورة بنجاح",
  "invoice": {...}
}
```

**Behavior**:
- Creates adjustment transaction if value changes
- Records edit history
- Validates balance for spending increases

---

### 6. Delete Invoice (Soft Delete)
```
DELETE /api/fursatkum/invoices/:id
Content-Type: application/json
```
**Body**:
```json
{
  "reason": "string (required)"
}
```

**Response**:
```json
{
  "message": "تم حذف الفاتورة بنجاح",
  "invoice": {...}
}
```

**Behavior**:
- Creates reversal transaction
- Reverses balance changes
- Sets status to 'deleted'
- Records deletion metadata

---

### 7. Get Accounting Summary
```
GET /api/fursatkum/accounting
```
**Response**:
```json
{
  "bankBalance": 10000.000,
  "cashBalance": 5000.000,
  "bankInfo": {...},
  "totalIncome": 50000.000,
  "totalSpendings": 45000.000,
  "transactions": [...]
}
```

---

### 8. List Transactions
```
GET /api/fursatkum/transactions
```
**Query Parameters**:
- `ledger`: 'all' | 'cash' | 'bank'
- `type`: 'all' | 'income' | 'spending' | 'income_reversal' | ...
- `page`: number
- `limit`: number
- `startDate`: ISO date string
- `endDate`: ISO date string

**Response**:
```json
{
  "transactions": [...],
  "pagination": {...}
}
```

---

### 9. Get Deleted Invoices
```
GET /api/fursatkum/deleted
```
**Query Parameters**:
- `page`: number
- `limit`: number

**Response**:
```json
{
  "invoices": [...],
  "pagination": {...}
}
```

---

## 🎨 Frontend Components

### Component Structure

```
client/src/pages/fursatkum/
├── FursatkumDashboard.tsx          # Main dashboard
├── FursatkumInvoices.tsx            # Invoice listing
├── FursatkumNewInvoice.tsx          # Create invoice form
├── FursatkumInvoiceDetails.tsx     # Invoice details & edit
├── FursatkumDeletedInvoices.tsx    # Deleted invoices list
└── FursatkumAccounting.tsx         # Accounting summary & transactions
```

---

### 1. FursatkumDashboard.tsx
**Purpose**: Overview dashboard with key metrics

**Features**:
- Bank balance display
- Cash balance display
- Invoice counts (income, spending, deleted)
- Recent transactions list
- Quick action: Create new invoice

**Data Source**: `GET /api/fursatkum/dashboard`

---

### 2. FursatkumInvoices.tsx
**Purpose**: List and filter invoices

**Features**:
- Filter by type (income/spending/all)
- Filter by ledger (cash/bank/all)
- Filter by status (active/deleted)
- Search by reference, name, details
- Date range filtering
- Pagination
- Export to Excel
- Navigate to invoice details

**Data Source**: `GET /api/fursatkum/invoices`

---

### 3. FursatkumNewInvoice.tsx
**Purpose**: Create new invoice form

**Features**:
- Type selection (income/spending)
- Ledger selection (cash/bank)
- Name input
- Value input (min: 0.001)
- Date picker
- Details textarea
- Bank reference (conditional, if bank ledger)
- Document upload (optional)
- Form validation
- Balance validation (for spending)

**API Call**: `POST /api/fursatkum/invoices`

---

### 4. FursatkumInvoiceDetails.tsx
**Purpose**: View and edit invoice details

**Features**:
- Display all invoice information
- Edit dialog (requires reason)
- Delete dialog (requires reason)
- Edit history display
- Document download link
- Status indicators

**API Calls**:
- `GET /api/fursatkum/invoices/:id`
- `PUT /api/fursatkum/invoices/:id`
- `DELETE /api/fursatkum/invoices/:id`

---

### 5. FursatkumDeletedInvoices.tsx
**Purpose**: View deleted invoices (audit trail)

**Features**:
- List all deleted invoices
- Display deletion reason
- Display deleted by user
- Display deletion date
- Export to Excel
- Pagination

**Data Source**: `GET /api/fursatkum/deleted`

---

### 6. FursatkumAccounting.tsx
**Purpose**: Accounting summary and transaction history

**Features**:
- Bank balance card
- Cash balance card
- Total income card
- Total spending card
- Transaction history table
- Filter by ledger (all/cash/bank)
- Export to Excel

**Data Source**: `GET /api/fursatkum/accounting`

---

## 📝 Example Records

### Example 1: Income Invoice (Bank)

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "referenceNumber": "F-INC-001",
  "type": "income",
  "ledger": "bank",
  "bankReference": "TRX-2024-001234",
  "name": "فاتورة دخل - بيع خدمة تأشيرة",
  "value": 500.000,
  "currency": "KWD",
  "date": "2024-01-15T00:00:00.000Z",
  "details": "بيع تأشيرة للعميل أحمد محمد",
  "status": "active",
  "isEdited": false,
  "editHistory": [],
  "createdBy": {
    "_id": "507f191e810c19729de860ea",
    "username": "admin"
  },
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Associated Transaction**:
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "type": "income",
  "ledger": "bank",
  "amount": 500.000,
  "balanceAfter": 10500.000,
  "date": "2024-01-15T00:00:00.000Z",
  "invoiceId": "507f1f77bcf86cd799439011",
  "invoiceRef": "F-INC-001",
  "description": "فاتورة دخل: فاتورة دخل - بيع خدمة تأشيرة",
  "performedBy": {
    "_id": "507f191e810c19729de860ea",
    "username": "admin"
  }
}
```

---

### Example 2: Spending Invoice (Cash)

```json
{
  "_id": "507f1f77bcf86cd799439013",
  "referenceNumber": "F-SPD-001",
  "type": "spending",
  "ledger": "cash",
  "name": "إيصال صرف - مصروفات مكتب",
  "value": 200.000,
  "currency": "KWD",
  "date": "2024-01-16T00:00:00.000Z",
  "details": "شراء مستلزمات مكتبية",
  "status": "active",
  "isEdited": false,
  "editHistory": [],
  "createdBy": {
    "_id": "507f191e810c19729de860ea",
    "username": "admin"
  },
  "createdAt": "2024-01-16T09:15:00.000Z",
  "updatedAt": "2024-01-16T09:15:00.000Z"
}
```

**Associated Transaction**:
```json
{
  "_id": "507f1f77bcf86cd799439014",
  "type": "spending",
  "ledger": "cash",
  "amount": -200.000,
  "balanceAfter": 4800.000,
  "date": "2024-01-16T00:00:00.000Z",
  "invoiceId": "507f1f77bcf86cd799439013",
  "invoiceRef": "F-SPD-001",
  "description": "إيصال صرف: إيصال صرف - مصروفات مكتب",
  "performedBy": {
    "_id": "507f191e810c19729de860ea",
    "username": "admin"
  }
}
```

---

### Example 3: Account (Singleton)

```json
{
  "_id": "507f1f77bcf86cd799439015",
  "bankBalance": 10500.000,
  "cashBalance": 4800.000,
  "incomeCounter": 1,
  "spendingCounter": 1,
  "bankInfo": {
    "bankName": "بنك الكويت الوطني",
    "accountName": "شركة فرصتكم",
    "accountNumber": "1234567890",
    "iban": "KW00NBOK0000000000000000000000"
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-16T09:15:00.000Z"
}
```

---

### Example 4: Edited Invoice (with History)

```json
{
  "_id": "507f1f77bcf86cd799439016",
  "referenceNumber": "F-INC-002",
  "type": "income",
  "ledger": "bank",
  "bankReference": "TRX-2024-001235",
  "name": "فاتورة دخل - بيع خدمة (معدلة)",
  "value": 600.000,
  "currency": "KWD",
  "date": "2024-01-17T00:00:00.000Z",
  "details": "تم تعديل القيمة من 500 إلى 600",
  "status": "active",
  "isEdited": true,
  "editHistory": [
    {
      "field": "value",
      "oldValue": 500.000,
      "newValue": 600.000,
      "reason": "تصحيح القيمة",
      "editedAt": "2024-01-17T11:00:00.000Z",
      "editedBy": {
        "_id": "507f191e810c19729de860ea",
        "username": "admin"
      }
    }
  ],
  "createdBy": {
    "_id": "507f191e810c19729de860ea",
    "username": "admin"
  },
  "createdAt": "2024-01-17T10:00:00.000Z",
  "updatedAt": "2024-01-17T11:00:00.000Z"
}
```

**Associated Adjustment Transaction**:
```json
{
  "_id": "507f1f77bcf86cd799439017",
  "type": "income_adjustment",
  "ledger": "bank",
  "amount": 100.000,
  "balanceAfter": 10600.000,
  "date": "2024-01-17T11:00:00.000Z",
  "invoiceId": "507f1f77bcf86cd799439016",
  "invoiceRef": "F-INC-002",
  "description": "تعديل فاتورة دخل: فاتورة دخل - بيع خدمة (معدلة)",
  "reason": "تصحيح القيمة",
  "performedBy": {
    "_id": "507f191e810c19729de860ea",
    "username": "admin"
  }
}
```

---

### Example 5: Deleted Invoice

```json
{
  "_id": "507f1f77bcf86cd799439018",
  "referenceNumber": "F-SPD-002",
  "type": "spending",
  "ledger": "cash",
  "name": "إيصال صرف - خطأ",
  "value": 50.000,
  "currency": "KWD",
  "date": "2024-01-18T00:00:00.000Z",
  "details": "تم حذفها بسبب الخطأ",
  "status": "deleted",
  "isEdited": false,
  "editHistory": [],
  "deletedAt": "2024-01-18T14:30:00.000Z",
  "deletedBy": {
    "_id": "507f191e810c19729de860ea",
    "username": "admin"
  },
  "deleteReason": "تم إنشاؤها بالخطأ",
  "createdBy": {
    "_id": "507f191e810c19729de860ea",
    "username": "admin"
  },
  "createdAt": "2024-01-18T14:00:00.000Z",
  "updatedAt": "2024-01-18T14:30:00.000Z"
}
```

**Associated Reversal Transaction**:
```json
{
  "_id": "507f1f77bcf86cd799439019",
  "type": "spending_reversal",
  "ledger": "cash",
  "amount": 50.000,
  "balanceAfter": 4850.000,
  "date": "2024-01-18T14:30:00.000Z",
  "invoiceId": "507f1f77bcf86cd799439018",
  "invoiceRef": "F-SPD-002",
  "description": "حذف إيصال صرف: إيصال صرف - خطأ",
  "reason": "تم إنشاؤها بالخطأ",
  "performedBy": {
    "_id": "507f191e810c19729de860ea",
    "username": "admin"
  }
}
```

---

## 📁 File Structure

### Backend Files

```
server/
├── models/
│   ├── FursatkumInvoice.js          # Invoice model
│   ├── FursatkumTransaction.js       # Transaction model
│   └── FursatkumAccount.js           # Account model
├── routes/
│   ├── fursatkum.js                 # Main API routes
│   └── exports.js                   # Excel export routes
└── index.js                         # Server entry point
```

### Frontend Files

```
client/src/
├── pages/
│   └── fursatkum/
│       ├── FursatkumDashboard.tsx
│       ├── FursatkumInvoices.tsx
│       ├── FursatkumNewInvoice.tsx
│       ├── FursatkumInvoiceDetails.tsx
│       ├── FursatkumDeletedInvoices.tsx
│       └── FursatkumAccounting.tsx
├── config/
│   └── axios.js                     # HTTP client configuration
└── utils/
    └── cacheManager.ts              # Cache management
```

---

## 🔐 Security & Authorization

### Authentication
- **Method**: JWT (JSON Web Tokens)
- **Header**: `Authorization: Bearer <token>`
- **Middleware**: `requireAuth` in `server/routes/fursatkum.js`

### Authorization
- **Required Role**: Admin only
- **Middleware**: `requireAdmin` in `server/routes/fursatkum.js`
- **Validation**: Checks `req.user.role === 'admin'`

### File Upload Security
- **Max Size**: 15MB
- **Allowed Types**: jpeg, jpg, png, pdf
- **Storage**: `server/uploads/fursatkum/`
- **Validation**: File extension and MIME type checking

---

## 📊 Excel Export

### Export Endpoints

1. **Invoices Export**
   ```
   GET /api/exports/fursatkum/invoices
   Query: type, ledger, status
   ```

2. **Deleted Invoices Export**
   ```
   GET /api/exports/fursatkum/deleted
   ```

3. **Accounting Export**
   ```
   GET /api/exports/fursatkum/accounting
   ```

### Export Format
- **Library**: ExcelJS
- **Format**: .xlsx (Excel)
- **Sheets**: Multiple sheets for accounting exports
- **Headers**: Bilingual (Arabic/English)
- **Formatting**: Currency formatting, bold headers, colored rows

---

## 🔄 Transaction Types

| Type | Description | Amount Sign | Balance Effect |
|------|-------------|-------------|----------------|
| `income` | Income invoice created | Positive (+) | Increases balance |
| `spending` | Spending invoice created | Negative (-) | Decreases balance |
| `income_reversal` | Income invoice deleted | Negative (-) | Decreases balance |
| `spending_reversal` | Spending invoice deleted | Positive (+) | Increases balance |
| `income_adjustment` | Income invoice value changed | Positive/Negative | Adjusts balance |
| `spending_adjustment` | Spending invoice value changed | Positive/Negative | Adjusts balance |

---

## 📈 Summary

### Key Features
1. ✅ Dual ledger system (Cash & Bank)
2. ✅ Income and Spending tracking
3. ✅ Complete audit trail (transactions, edit history)
4. ✅ Soft delete with reversal
5. ✅ Balance validation
6. ✅ Reference number auto-generation
7. ✅ Document attachment support
8. ✅ Excel export functionality
9. ✅ Admin-only access control
10. ✅ Real-time balance calculations

### Data Flow
```
Invoice Creation → Balance Update → Transaction Record → Account Update
Invoice Edit → Balance Adjustment → Adjustment Transaction → Account Update
Invoice Delete → Balance Reversal → Reversal Transaction → Account Update
```

### Balance Calculation Formula
```
Current Balance = Initial Balance + Sum(Income Transactions) - Sum(Spending Transactions)
```

---

## 📞 References

### Model Files
- `server/models/FursatkumInvoice.js`
- `server/models/FursatkumTransaction.js`
- `server/models/FursatkumAccount.js`

### Route Files
- `server/routes/fursatkum.js`
- `server/routes/exports.js` (Fursatkum exports)

### Frontend Components
- `client/src/pages/fursatkum/*.tsx`

### Configuration
- `server/index.js` (MongoDB connection)
- `client/src/config/axios.js` (API client)

---

**Document Generated**: 2024  
**System Version**: 1.0.0  
**Last Updated**: Based on current codebase analysis

