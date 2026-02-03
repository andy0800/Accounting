# Product Specification Document (PRD)
## Fursatkum Accounting System

**Version:** 1.0.0  
**Last Updated:** January 2026  
**Status:** Production Ready

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Overview](#product-overview)
3. [Core Features](#core-features)
4. [Technical Architecture](#technical-architecture)
5. [User Roles & Permissions](#user-roles--permissions)
6. [Feature Specifications](#feature-specifications)
7. [API Specifications](#api-specifications)
8. [User Interface Specifications](#user-interface-specifications)
9. [Data Models](#data-models)
10. [Business Rules & Logic](#business-rules--logic)
11. [Security & Compliance](#security--compliance)
12. [Future Enhancements](#future-enhancements)

---

## 🎯 Executive Summary

The **Fursatkum Accounting System** is a comprehensive financial management platform designed for businesses requiring dual-ledger accounting (Cash & Bank), invoice management, employee loan tracking, salary processing with automatic loan deductions, and complete audit trail capabilities. The system ensures financial accuracy, prevents negative balances, and maintains a complete history of all financial transactions.

### Key Value Propositions
- ✅ **Dual Ledger Management**: Separate tracking of cash and bank transactions
- ✅ **Complete Audit Trail**: Every action is logged with user attribution
- ✅ **Employee Financial Management**: Integrated loan and salary payment system
- ✅ **Balance Protection**: Automatic validation prevents negative balances
- ✅ **Arabic Language Support**: Full RTL (Right-to-Left) interface
- ✅ **Role-Based Access**: Admin-only access with JWT authentication

---

## 🏗️ Product Overview

### Purpose
The Fursatkum Accounting System serves as the primary financial management tool for businesses that need:
- Accurate tracking of income and expenses
- Separate cash and bank account management
- Employee loan management and salary processing
- Complete financial audit trails
- Document attachment for invoices
- Export capabilities for reporting

### Target Users
- **Primary**: Business administrators and accountants
- **Access Level**: Admin role only
- **Use Cases**: Daily financial operations, monthly reporting, employee payroll management

### System Scope
The system includes:
- Invoice management (Income & Spending)
- Account balance tracking (Cash & Bank)
- Transaction history and audit logs
- Employee management
- Employee loan tracking
- Salary payment processing with automatic loan deductions
- Document management
- Excel export functionality

---

## 🚀 Core Features

### 1. Invoice Management
**Purpose**: Track all income and spending transactions

**Key Capabilities**:
- Create income invoices (money received)
- Create spending invoices (money paid out)
- Edit invoices with reason tracking
- Soft delete invoices with reversal transactions
- Filter by type, ledger, status, date range
- Search by reference number, name, details
- Attach supporting documents (PDF, images)
- Auto-generate unique reference numbers (F-INC-001, F-SPD-001)

**Business Rules**:
- Spending invoices require sufficient balance validation
- All edits require a reason and are logged
- Deleted invoices create reversal transactions
- Reference numbers are sequential and unique

---

### 2. Dual Ledger System
**Purpose**: Separate cash and bank account management

**Key Capabilities**:
- Independent cash balance tracking
- Independent bank balance tracking
- Bank reference number tracking for bank transactions
- Real-time balance updates
- Balance validation before spending

**Business Rules**:
- Each invoice must specify ledger (cash or bank)
- Balances cannot go negative
- Bank transactions can include bank reference numbers
- All balance changes are recorded in transactions

---

### 3. Employee Management
**Purpose**: Manage employee information and monthly salaries

**Key Capabilities**:
- Create employee records with monthly salary
- Update employee information
- Track employee status (active/inactive)
- View employee details and history
- Link employees to loans and salary payments

**Business Rules**:
- Employee names must be unique
- Monthly salary must be positive
- Employees can have multiple active loans
- Employee status affects loan and salary operations

---

### 4. Employee Loan Management
**Purpose**: Track employee loans and repayments

**Key Capabilities**:
- Issue loans to employees
- Set monthly deduction amounts
- Track remaining loan amounts
- Process loan repayments
- View loan history and status
- Auto-generate loan reference numbers (F-LOAN-001)

**Business Rules**:
- Loans require sufficient account balance
- Loans deduct from specified ledger (cash/bank)
- Monthly deduction is optional
- Loans can be repaid partially or fully
- Fully repaid loans are marked as 'paid'
- Multiple active loans per employee are supported

---

### 5. Salary Payment with Loan Deduction
**Purpose**: Process employee salaries with automatic loan deductions

**Key Capabilities**:
- Process salary payments
- Automatically deduct active loans from salary
- Support multiple active loans (oldest first)
- Calculate net paid amount
- Track gross salary, deductions, and net paid
- Auto-generate salary reference numbers (F-SAL-001)

**Business Rules**:
- Deduction = min(monthlyDeduction, remainingAmount, grossSalary)
- Deductions applied to oldest loans first
- Total deduction cannot exceed grossSalary
- Net paid = grossSalary - total deductions
- Net paid amount requires sufficient balance
- Creates two transaction types: salary_payment and salary_loan_deduction

---

### 6. Transaction Audit Trail
**Purpose**: Complete history of all financial operations

**Key Capabilities**:
- Record every balance change
- Track transaction type, amount, date, user
- View transaction history with filters
- Export transaction data
- Link transactions to invoices, loans, salaries

**Transaction Types**:
- `income`: Income invoice created
- `spending`: Spending invoice created
- `income_reversal`: Income invoice deleted
- `spending_reversal`: Spending invoice deleted
- `income_adjustment`: Income invoice edited
- `spending_adjustment`: Spending invoice edited
- `employee_loan_given`: Loan issued to employee
- `employee_loan_repayment`: Loan repayment received
- `salary_payment`: Salary paid to employee
- `salary_loan_deduction`: Loan deducted from salary (audit only, amount: 0)

---

### 7. Dashboard & Reporting
**Purpose**: Overview of financial status and key metrics

**Key Capabilities**:
- View current cash and bank balances
- See invoice counts (income, spending, deleted)
- View recent transactions
- Track outstanding loans total
- View current month salary payments total
- Quick access to common actions

---

## 🏛️ Technical Architecture

### Technology Stack

**Backend**:
- **Runtime**: Node.js (v16+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Other**: bcryptjs, dayjs, exceljs

**Frontend**:
- **Framework**: React 18 with TypeScript
- **UI Library**: Material-UI (MUI) v5
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Date Handling**: date-fns

**Infrastructure**:
- **Database**: MongoDB Atlas (Cloud)
- **File Storage**: Local file system (`server/uploads/`)
- **CORS**: Configured for localhost and production domains

### System Architecture

```
┌─────────────────┐
│   React Client  │ (Port 3000)
│   (TypeScript)  │
└────────┬────────┘
         │ HTTP/REST API
         │ JWT Authentication
         ▼
┌─────────────────┐
│  Express Server │ (Port 5000)
│   (Node.js)     │
└────────┬────────┘
         │
         ├──► MongoDB Atlas
         │    ├──► FursatkumAccount
         │    ├──► FursatkumInvoice
         │    ├──► FursatkumTransaction
         │    ├──► FursatkumEmployee
         │    ├──► FursatkumEmployeeLoan
         │    └──► FursatkumSalaryPayment
         │
         └──► File System
              └──► /uploads/fursatkum/
```

---

## 👥 User Roles & Permissions

### Admin Role
**Access Level**: Full system access

**Permissions**:
- ✅ Create, read, update, delete invoices
- ✅ View and manage account balances
- ✅ Create and manage employees
- ✅ Issue and manage employee loans
- ✅ Process salary payments
- ✅ View all transactions and audit logs
- ✅ Export data to Excel
- ✅ Access dashboard and reports

**Authentication**:
- JWT token required for all API calls
- Token expires after 12 hours
- Hardcoded admin: username='admin', password='Aa@09876'
- Database users supported via User model

---

## 📝 Feature Specifications

### Feature 1: Invoice Creation

**User Story**: As an admin, I want to create income and spending invoices so that I can track all financial transactions.

**Acceptance Criteria**:
1. User can select invoice type (income/spending)
2. User can select ledger (cash/bank)
3. User must enter name, value (min 0.001), and date
4. User can optionally add details and bank reference (for bank ledger)
5. User can optionally attach a document (PDF, JPEG, PNG)
6. System validates sufficient balance for spending invoices
7. System generates unique reference number (F-INC-XXX or F-SPD-XXX)
8. System updates account balance immediately
9. System creates transaction record
10. System returns success message with invoice details

**Validation Rules**:
- Name: Required, string
- Value: Required, number, minimum 0.001
- Date: Required, valid date
- Ledger: Required, enum ['cash', 'bank']
- Bank Reference: Optional, only if ledger='bank'
- Document: Optional, max 15MB, types: PDF, JPEG, PNG

**Error Handling**:
- Insufficient balance: 400 error with available balance
- Invalid file type: 400 error
- File too large: 400 error
- Missing required fields: 400 error

---

### Feature 2: Employee Loan Issuance

**User Story**: As an admin, I want to issue loans to employees so that I can track employee advances and repayments.

**Acceptance Criteria**:
1. User selects employee from list
2. User enters loan amount (min 0.001)
3. User selects ledger (cash/bank)
4. User can optionally set monthly deduction amount
5. User can optionally add description
6. System validates sufficient balance
7. System generates unique reference number (F-LOAN-XXX)
8. System deducts amount from ledger balance
9. System creates loan record with status 'active'
10. System creates transaction (type: employee_loan_given, amount: negative)
11. System returns success message with loan details

**Business Logic**:
- remainingAmount = originalAmount initially
- If monthlyDeduction not set, full remainingAmount can be deducted from salary
- Loan status: 'active', 'paid', or 'cancelled'

---

### Feature 3: Salary Payment with Loan Deduction

**User Story**: As an admin, I want to pay employee salaries with automatic loan deductions so that loans are repaid automatically.

**Acceptance Criteria**:
1. User selects employee
2. User enters gross salary (or uses employee's monthly salary)
3. User selects ledger (cash/bank)
4. User selects payment date
5. System fetches all active loans for employee (sorted by creation date)
6. System calculates deductions:
   - For each loan: deduction = min(monthlyDeduction || remainingAmount, remainingAmount, remainingGrossSalary)
   - Apply deductions oldest loan first
   - Total deduction cannot exceed grossSalary
7. System calculates netPaid = grossSalary - totalDeduction
8. System validates sufficient balance for netPaid
9. System deducts netPaid from ledger balance
10. System reduces loan remainingAmounts
11. System marks loans as 'paid' if remainingAmount reaches 0
12. System generates unique reference number (F-SAL-XXX)
13. System creates salary payment record
14. System creates transaction (type: salary_payment, amount: -netPaid)
15. System creates audit transactions (type: salary_loan_deduction, amount: 0) for each deduction
16. System returns success message with salary details

**Deduction Algorithm**:
```
remainingGrossSalary = grossSalary
totalDeduction = 0

FOR each active loan (sorted by createdAt ASC):
  IF remainingGrossSalary <= 0: BREAK
  
  plannedDeduction = loan.monthlyDeduction ?? loan.remainingAmount
  currentDeduction = min(plannedDeduction, loan.remainingAmount, remainingGrossSalary)
  
  IF currentDeduction > 0:
    totalDeduction += currentDeduction
    remainingGrossSalary -= currentDeduction
    loan.remainingAmount -= currentDeduction
    
    IF loan.remainingAmount <= 0:
      loan.remainingAmount = 0
      loan.status = 'paid'

netPaid = grossSalary - totalDeduction
```

---

### Feature 4: Loan Repayment

**User Story**: As an admin, I want to record loan repayments so that I can track when employees pay back loans directly.

**Acceptance Criteria**:
1. User selects loan to repay
2. User enters repayment amount
3. User selects ledger (cash/bank)
4. System validates amount <= remainingAmount
5. System validates sufficient balance (for direct repayment, balance increases)
6. System increases ledger balance by repayment amount
7. System reduces loan remainingAmount
8. System marks loan as 'paid' if remainingAmount reaches 0
9. System creates transaction (type: employee_loan_repayment, amount: positive)
10. System returns success message with updated loan details

---

## 🔌 API Specifications

### Base URL
- Development: `http://localhost:5000`
- Production: `https://fursatkum-backend.onrender.com`

### Authentication
All endpoints (except `/api/auth/login`) require JWT authentication:
```
Authorization: Bearer <token>
```

### Endpoints Overview

#### Authentication
- `POST /api/auth/login` - User login

#### Dashboard
- `GET /api/fursatkum/dashboard` - Get dashboard data

#### Invoices
- `GET /api/fursatkum/invoices` - List invoices (with filters)
- `GET /api/fursatkum/invoices/:id` - Get invoice details
- `POST /api/fursatkum/invoices` - Create invoice
- `PUT /api/fursatkum/invoices/:id` - Update invoice
- `DELETE /api/fursatkum/invoices/:id` - Delete invoice
- `GET /api/fursatkum/deleted` - Get deleted invoices

#### Employees
- `GET /api/fursatkum/employees` - List employees
- `GET /api/fursatkum/employees/:id` - Get employee details
- `POST /api/fursatkum/employees` - Create employee
- `PUT /api/fursatkum/employees/:id` - Update employee

#### Employee Loans
- `GET /api/fursatkum/employee-loans` - List loans (with filters)
- `GET /api/fursatkum/employee-loans/:id` - Get loan details
- `GET /api/fursatkum/employee-loans/summary` - Get loan summary (outstanding total)
- `POST /api/fursatkum/employee-loans` - Create loan
- `POST /api/fursatkum/employee-loans/:id/repay` - Repay loan

#### Salary Payments
- `GET /api/fursatkum/salaries` - List salary payments (with filters)
- `GET /api/fursatkum/salaries/:id` - Get salary payment details
- `GET /api/fursatkum/salaries/summary` - Get salary summary (by month)
- `POST /api/fursatkum/salaries/pay` - Process salary payment

#### Accounting
- `GET /api/fursatkum/accounting` - Get accounting summary
- `GET /api/fursatkum/transactions` - List transactions (with filters)

### Example API Request/Response

**Create Employee Loan**:
```http
POST /api/fursatkum/employee-loans
Authorization: Bearer <token>
Content-Type: application/json

{
  "employeeId": "507f1f77bcf86cd799439011",
  "amount": 500,
  "ledger": "cash",
  "monthlyDeduction": 100,
  "description": "Advance payment"
}
```

**Response**:
```json
{
  "message": "تم إنشاء قرض الموظف بنجاح",
  "loan": {
    "_id": "507f1f77bcf86cd799439012",
    "employeeId": "507f1f77bcf86cd799439011",
    "referenceNumber": "F-LOAN-001",
    "originalAmount": 500,
    "remainingAmount": 500,
    "monthlyDeduction": 100,
    "status": "active",
    "description": "Advance payment",
    "createdAt": "2026-01-28T10:00:00.000Z"
  }
}
```

---

## 🎨 User Interface Specifications

### Design Principles
- **RTL Support**: Full right-to-left layout for Arabic
- **Material Design**: Consistent MUI components
- **Responsive**: Works on desktop and tablet
- **Accessibility**: ARIA labels and keyboard navigation
- **Color Coding**: 
  - Green: Income/positive amounts
  - Red: Spending/negative amounts
  - Blue: Information/neutral

### Key Pages

#### 1. Dashboard (`/fursatkum`)
- **Layout**: Grid of cards showing balances, counts, recent transactions
- **Components**: Balance cards, invoice count cards, transaction table
- **Actions**: Quick link to create invoice

#### 2. Employees List (`/fursatkum/employees`)
- **Layout**: Table with employee details
- **Columns**: Name, Monthly Salary, Outstanding Loan, Status, Actions
- **Actions**: View details, Create loan, Process salary
- **Filters**: Status (active/inactive), Search by name

#### 3. Employee Details (`/fursatkum/employees/:id`)
- **Layout**: Employee info card + Loans table + Salaries table
- **Components**: Employee info, Loans history, Salary history, Repay loan dialog
- **Actions**: Edit employee, Repay loan, View loan details

#### 4. New Loan (`/fursatkum/loans/new`)
- **Layout**: Form with employee selection, amount, ledger, monthly deduction
- **Validation**: Real-time balance check, amount validation
- **Actions**: Submit, Cancel

#### 5. Salary Processor (`/fursatkum/salaries/process`)
- **Layout**: Form with employee selection, gross salary, ledger, date
- **Features**: 
  - Auto-fill monthly salary from employee
  - Real-time deduction calculation display
  - Shows: Gross Salary, Total Deduction, Net Paid
  - Lists active loans with planned deductions
- **Actions**: Submit, Cancel

#### 6. Invoices List (`/fursatkum/invoices`)
- **Layout**: Table with filters and search
- **Filters**: Type, Ledger, Status, Date Range
- **Search**: Reference, Name, Details
- **Actions**: Create invoice, View details, Export Excel

---

## 💾 Data Models

### FursatkumAccount
```javascript
{
  bankBalance: Number,        // Bank account balance
  cashBalance: Number,        // Cash balance
  bankInfo: {
    name: String,
    accountNumber: String,
    iban: String
  },
  incomeCounter: Number,      // Counter for F-INC-XXX
  spendingCounter: Number,    // Counter for F-SPD-XXX
  loanCounter: Number,        // Counter for F-LOAN-XXX
  salaryCounter: Number       // Counter for F-SAL-XXX
}
```

### FursatkumEmployee
```javascript
{
  name: String,                // Unique employee name
  monthlySalary: Number,       // Monthly salary amount
  status: String,              // 'active' | 'inactive'
  notes: String,               // Optional notes
  createdBy: ObjectId,        // User who created (optional)
  createdAt: Date,
  updatedAt: Date
}
```

### FursatkumEmployeeLoan
```javascript
{
  employeeId: ObjectId,        // Reference to FursatkumEmployee
  referenceNumber: String,     // Unique: F-LOAN-XXX
  originalAmount: Number,      // Original loan amount
  remainingAmount: Number,      // Remaining to be paid
  monthlyDeduction: Number,     // Optional monthly deduction
  status: String,              // 'active' | 'paid' | 'cancelled'
  description: String,         // Optional description
  createdBy: ObjectId,         // User who created (optional)
  createdAt: Date,
  updatedAt: Date
}
```

### FursatkumSalaryPayment
```javascript
{
  employeeId: ObjectId,        // Reference to FursatkumEmployee
  referenceNumber: String,     // Unique: F-SAL-XXX
  grossSalary: Number,          // Gross salary amount
  loanDeducted: Number,         // Total loan deduction
  netPaid: Number,              // Net amount paid
  ledger: String,               // 'cash' | 'bank'
  date: Date,                   // Payment date
  createdBy: ObjectId,         // User who created (optional)
  createdAt: Date,
  updatedAt: Date
}
```

### FursatkumTransaction
```javascript
{
  type: String,                 // Transaction type enum
  ledger: String,              // 'cash' | 'bank'
  amount: Number,               // Positive or negative
  balanceAfter: Number,         // Balance after transaction
  date: Date,                   // Transaction date
  description: String,          // Transaction description
  performedBy: ObjectId,       // User who performed (optional)
  createdAt: Date
}
```

---

## ⚖️ Business Rules & Logic

### Balance Management
1. **No Negative Balances**: System prevents any operation that would result in negative balance
2. **Real-time Updates**: Balances update immediately upon transaction
3. **Dual Ledger**: Cash and Bank balances are independent
4. **Balance Validation**: All spending operations validate balance before execution

### Reference Number Generation
1. **Sequential**: Counters increment for each type
2. **Format**: 
   - Invoices: `F-INC-001`, `F-SPD-001`
   - Loans: `F-LOAN-001`
   - Salaries: `F-SAL-001`
3. **Unique**: Reference numbers are unique across the system
4. **Persistent**: Counters persist in FursatkumAccount document

### Loan Deduction Logic
1. **Multiple Loans**: Employee can have multiple active loans
2. **Order**: Deductions applied to oldest loans first (by createdAt)
3. **Calculation**: 
   - If monthlyDeduction set: use it (up to remainingAmount)
   - If not set: use full remainingAmount
   - Never exceed grossSalary
   - Never exceed remainingAmount
4. **Status Update**: Loan marked 'paid' when remainingAmount reaches 0

### Audit Trail
1. **Every Action**: All balance changes create transaction records
2. **User Attribution**: Transactions include performedBy (when available)
3. **Immutable**: Transactions are never deleted or modified
4. **Complete History**: Full history available for reporting

### Invoice Management
1. **Edit Tracking**: All edits require reason and create adjustment transactions
2. **Soft Delete**: Deletions create reversal transactions, don't remove records
3. **Balance Reversal**: Deleted invoices reverse their original balance impact
4. **Document Storage**: Documents stored in `/uploads/fursatkum/`

---

## 🔒 Security & Compliance

### Authentication
- JWT tokens with 12-hour expiration
- Password hashing with bcryptjs
- Token validation on every request
- Role-based access control (admin only)

### Data Protection
- Input validation on all endpoints
- SQL injection prevention (MongoDB parameterized queries)
- File upload restrictions (type and size)
- CORS configuration for allowed origins

### Audit Requirements
- All financial operations logged
- User attribution for all actions
- Timestamp tracking (createdAt, updatedAt)
- Edit history maintained

### Error Handling
- Consistent error response format
- No sensitive information in error messages
- Proper HTTP status codes
- Client-friendly error messages (Arabic)

---

## 🚀 Future Enhancements

### Phase 2 Features
1. **Multi-Currency Support**: Support for multiple currencies
2. **Recurring Transactions**: Automatic recurring invoices
3. **Budget Management**: Budget planning and tracking
4. **Advanced Reporting**: Custom reports and analytics
5. **Email Notifications**: Email alerts for important events
6. **Mobile App**: Native mobile application
7. **Multi-Company**: Support for multiple companies/accounts
8. **Integration APIs**: Third-party integrations (banks, accounting software)

### Technical Improvements
1. **Caching**: Redis caching for frequently accessed data
2. **Queue System**: Background job processing for exports
3. **Real-time Updates**: WebSocket support for live updates
4. **Advanced Search**: Full-text search capabilities
5. **Bulk Operations**: Bulk import/export functionality

---

## 📊 Success Metrics

### Key Performance Indicators (KPIs)
1. **Transaction Accuracy**: 100% accurate balance calculations
2. **System Uptime**: 99.9% availability
3. **Response Time**: < 500ms for API calls
4. **User Satisfaction**: Positive feedback on ease of use
5. **Data Integrity**: Zero data loss incidents
6. **Audit Compliance**: 100% transaction logging

---

## 📞 Support & Maintenance

### Documentation
- API documentation (this document)
- User guides (Arabic)
- Developer documentation
- Deployment guides

### Maintenance
- Regular database backups
- Security updates
- Performance monitoring
- Bug fixes and patches

---

**Document End**

*This PRD is a living document and will be updated as the system evolves.*

