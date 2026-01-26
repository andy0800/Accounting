# 🎯 Real-World Agent Workflow Examples for Your Accounting System

This document provides step-by-step, copy-paste ready examples for common tasks in your project.

---

## Example 1: Adding a "Reports" Feature to Fursatkum Module

### Step 1: Setup Agents (3 agents)

**Agent 1: Frontend Developer**
```
You are a React + TypeScript frontend developer.

Project: Arabic Accounting System - Fursatkum Module
Focus: client/src/pages/fursatkum/

Current Task: Create a new Reports page component

Requirements:
1. Create file: client/src/pages/fursatkum/FursatkumReports.tsx
2. Component should have:
   - Date range picker (startDate, endDate)
   - Filter dropdowns (type: all/income/spending, ledger: all/cash/bank)
   - Table showing aggregated invoice data
   - Export to Excel button
   - Loading and error states
3. Use Material-UI components
4. Follow RTL layout (Arabic)
5. Use apiClient from config/axios.js for API calls

Reference Files:
- client/src/pages/fursatkum/FursatkumInvoices.tsx (for structure and patterns)
- client/src/pages/fursatkum/FursatkumDashboard.tsx (for styling)

Patterns to Follow:
- Use the same theme and styling as other Fursatkum pages
- Handle loading with CircularProgress
- Display errors in Card component
- Use TableContainer and Table for data display
- Use TextField with type="date" for date inputs
```

**Agent 2: Backend Developer**
```
You are a Node.js + Express backend developer.

Project: Arabic Accounting System - Fursatkum Module
Focus: server/routes/fursatkum.js

Current Task: Add reports API endpoint

Requirements:
1. Add new route: GET /api/fursatkum/reports
2. Accept query parameters:
   - startDate (optional, ISO date string)
   - endDate (optional, ISO date string)
   - type (optional: 'all', 'income', 'spending')
   - ledger (optional: 'all', 'cash', 'bank')
3. Return aggregated data:
   - Total income
   - Total spending
   - Net profit
   - Count of invoices
   - Breakdown by type and ledger
4. Use FursatkumInvoice model for queries
5. Validate inputs
6. Handle errors properly

Reference Files:
- server/routes/fursatkum.js (existing invoice routes)
- server/models/FursatkumInvoice.js (for schema)

Patterns to Follow:
- Use async/await
- Return JSON: { success: true, data: {...}, message: '...' }
- Use try/catch for error handling
- Validate date formats
- Use MongoDB aggregation if needed
```

**Agent 3: Integration Specialist**
```
You are an integration specialist.

Project: Arabic Accounting System - Fursatkum Module
Focus: Connecting frontend and backend

Current Task: Ensure frontend and backend work together

Requirements:
1. Verify frontend calls correct API endpoint
2. Ensure query parameters are passed correctly
3. Handle API responses properly
4. Add error handling for API failures
5. Test the complete flow

Files to Review:
- client/src/pages/fursatkum/FursatkumReports.tsx
- server/routes/fursatkum.js

Check:
- API endpoint URL matches
- Query parameter names match
- Response structure is handled correctly
- Error messages are user-friendly
- Loading states work properly
```

### Step 2: Execute and Review

1. Start all 3 agents
2. Let them generate code
3. Review each agent's output
4. Test the integration
5. Fix any issues

---

## Example 2: Refactoring Farwaniya Modules to Use Base Component

### Step 1: Setup Agents (3 agents)

**Agent 1: Code Analyzer**
```
You are a code refactoring specialist.

Project: Arabic Accounting System - Farwaniya Module
Focus: Identifying duplicate code

Current Task: Analyze and create base component

Requirements:
1. Compare these files:
   - client/src/pages/farwaniya/FW1Invoices.tsx
   - client/src/pages/farwaniya/FW2Invoices.tsx
2. Identify all common code
3. Identify differences (office-specific logic)
4. Create base component: FarwaniyaInvoicesBase.tsx
5. Base component should:
   - Accept 'office' prop ('fw1' or 'fw2')
   - Contain all common code
   - Handle office-specific differences via props or conditional logic
   - Use TypeScript with proper interfaces

Reference:
- Check if FarwaniyaInvoicesBase.tsx already exists
- Look at other base components in the project

Deliverable: Complete base component file
```

**Agent 2: FW1 Refactorer**
```
You are a React refactoring specialist.

Project: Arabic Accounting System - Farwaniya Module
Focus: client/src/pages/farwaniya/FW1Invoices.tsx

Current Task: Refactor FW1 to use base component

Requirements:
1. Refactor FW1Invoices.tsx to use FarwaniyaInvoicesBase
2. Pass office='fw1' prop
3. Remove all duplicate code
4. Keep only FW1-specific logic if any
5. Ensure all functionality is preserved
6. Test that the component still works

Reference:
- FarwaniyaInvoicesBase.tsx (created by Agent 1)
- Original FW1Invoices.tsx (for comparison)

Deliverable: Refactored FW1Invoices.tsx
```

**Agent 3: FW2 Refactorer**
```
You are a React refactoring specialist.

Project: Arabic Accounting System - Farwaniya Module
Focus: client/src/pages/farwaniya/FW2Invoices.tsx

Current Task: Refactor FW2 to use base component

Requirements:
1. Refactor FW2Invoices.tsx to use FarwaniyaInvoicesBase
2. Pass office='fw2' prop
3. Remove all duplicate code
4. Keep only FW2-specific logic if any
5. Ensure all functionality is preserved
6. Test that the component still works

Reference:
- FarwaniyaInvoicesBase.tsx (created by Agent 1)
- Original FW2Invoices.tsx (for comparison)

Deliverable: Refactored FW2Invoices.tsx
```

---

## Example 3: Adding Search Functionality to Invoice List

### Step 1: Setup Agents (2 agents)

**Agent 1: Frontend Search UI**
```
You are a React frontend developer.

Project: Arabic Accounting System
Focus: client/src/pages/fursatkum/FursatkumInvoices.tsx

Current Task: Add search functionality to invoice list

Requirements:
1. Add search input field in the filters section
2. Search should filter by:
   - Invoice name (name field)
   - Reference number (referenceNumber field)
3. Add search button or search on Enter key
4. Update the filters state when searching
5. Clear search functionality
6. Show search term in the UI

Reference:
- Current FursatkumInvoices.tsx file (check if search already exists)
- Look at the filters section around line 165-246

Patterns:
- Use TextField component from Material-UI
- Add to existing filters Grid
- Use InputAdornment for search icon
- Handle Enter key press
- Update filters.search state
```

**Agent 2: Backend Search Logic**
```
You are a Node.js backend developer.

Project: Arabic Accounting System
Focus: server/routes/fursatkum.js

Current Task: Add search query parameter to invoice endpoint

Requirements:
1. Modify GET /api/fursatkum/invoices endpoint
2. Accept 'search' query parameter (optional)
3. If search provided, filter invoices where:
   - name contains search term (case-insensitive)
   - OR referenceNumber contains search term (case-insensitive)
4. Use MongoDB $or and $regex for searching
5. Combine with existing filters (type, ledger, status, dates)
6. Maintain existing pagination

Reference:
- Current GET /api/fursatkum/invoices route
- Check how other filters are implemented
- Look at FursatkumInvoice model schema

Pattern:
- Use Mongoose query methods
- Case-insensitive search with $regex
- Combine multiple conditions properly
```

---

## Example 4: Optimizing Invoice List Performance

### Step 1: Setup Agents (3 agents)

**Agent 1: Frontend Performance Optimizer**
```
You are a React performance specialist.

Project: Arabic Accounting System
Focus: client/src/pages/fursatkum/FursatkumInvoices.tsx

Current Task: Optimize rendering performance

Requirements:
1. Implement virtualization for the table (if not already done)
2. Use React.memo for table rows
3. Use useMemo for expensive calculations
4. Optimize re-renders
5. Add pagination if missing
6. Lazy load data

Reference:
- client/src/components/VirtualizedTable.tsx (if exists)
- Check current implementation for performance issues
- Look at react-window usage in the project

Optimizations:
- Memoize filtered data
- Memoize table row components
- Use useCallback for event handlers
- Implement proper loading states
```

**Agent 2: Backend Query Optimizer**
```
You are a backend performance specialist.

Project: Arabic Accounting System
Focus: server/routes/fursatkum.js

Current Task: Optimize invoice query endpoint

Requirements:
1. Optimize GET /api/fursatkum/invoices endpoint
2. Add proper database indexes (suggest in comments)
3. Use select() to limit returned fields
4. Optimize pagination queries
5. Add query result caching if appropriate
6. Use lean() for read-only queries if possible

Reference:
- Current invoice endpoint implementation
- server/models/FursatkumInvoice.js (for schema)

Optimizations:
- Use .select() to return only needed fields
- Use .lean() for faster queries (if no virtuals needed)
- Ensure proper indexing
- Optimize aggregation queries
- Add query hints if needed
```

**Agent 3: Database Index Specialist**
```
You are a MongoDB performance specialist.

Project: Arabic Accounting System
Focus: server/models/FursatkumInvoice.js

Current Task: Add database indexes for performance

Requirements:
1. Review FursatkumInvoice schema
2. Identify frequently queried fields:
   - date (for date range queries)
   - type (for filtering)
   - ledger (for filtering)
   - status (for filtering)
   - referenceNumber (for searching)
   - name (for searching)
3. Add appropriate indexes:
   - Single field indexes for common filters
   - Compound indexes for common query patterns
4. Document index usage in comments

Reference:
- server/models/FursatkumInvoice.js
- Check existing indexes
- Look at query patterns in routes/fursatkum.js

Pattern:
- Use index() method in schema
- Create compound indexes for common filter combinations
- Consider text indexes for search fields
```

---

## Example 5: Adding Role-Based Access Control

### Step 1: Setup Agents (3 agents)

**Agent 1: Frontend Auth Guard**
```
You are a React authentication specialist.

Project: Arabic Accounting System
Focus: client/src/pages/fursatkum/FursatkumReports.tsx (new page)

Current Task: Add role-based access control

Requirements:
1. Check user role before rendering page
2. Only allow 'admin' role to access
3. Redirect unauthorized users
4. Show appropriate message
5. Use existing auth utility

Reference:
- client/src/utils/auth.ts (check auth functions)
- client/src/App.tsx (see protect() function pattern)
- Check how other admin-only pages handle auth

Implementation:
- Use auth.getRole() to check role
- Use Navigate component for redirect
- Show error message if unauthorized
- Follow existing auth patterns
```

**Agent 2: Backend Auth Middleware**
```
You are a backend authentication specialist.

Project: Arabic Accounting System
Focus: server/routes/fursatkum.js

Current Task: Add authentication middleware to reports endpoint

Requirements:
1. Add JWT authentication to GET /api/fursatkum/reports
2. Verify token on each request
3. Check user role (must be 'admin')
4. Return 401 if not authenticated
5. Return 403 if not authorized (wrong role)

Reference:
- server/routes/auth.js (check existing auth middleware)
- Look at how other protected routes handle auth
- Check JWT verification pattern

Implementation:
- Use existing auth middleware if available
- Or create verifyToken and checkRole middleware
- Follow existing error response format
```

**Agent 3: Route Protector**
```
You are a routing specialist.

Project: Arabic Accounting System
Focus: client/src/App.tsx

Current Task: Add route protection for new Reports page

Requirements:
1. Add route for /fursatkum/reports
2. Use protect() function to guard route
3. Ensure only admin can access
4. Add to Routes component
5. Import the new component

Reference:
- Current App.tsx routing structure
- Look at how /fursatkum/invoices route is protected
- Follow existing route patterns

Implementation:
- Add lazy import for FursatkumReports
- Add Route with protect() wrapper
- Ensure proper role checking
```

---

## Example 6: Adding Export to Excel with Filters

### Step 1: Setup Agents (2 agents)

**Agent 1: Frontend Export Button**
```
You are a React frontend developer.

Project: Arabic Accounting System
Focus: client/src/pages/fursatkum/FursatkumInvoices.tsx

Current Task: Add "Export Filtered" button

Requirements:
1. Add new button: "تصدير النتائج المفلترة" (Export Filtered Results)
2. Place next to existing "تصدير Excel" button
3. Button should:
   - Call export API with current filter parameters
   - Show loading state while exporting
   - Handle errors
   - Download file when ready
4. Pass current filters (type, ledger, status, dates, search) to API

Reference:
- Existing handleExport function in FursatkumInvoices.tsx
- Check how current export works
- Follow same pattern but with filters

Implementation:
- Create handleExportFiltered function
- Use apiClient.get with params from filters state
- Use responseType: 'blob'
- Create download link similar to existing export
```

**Agent 2: Backend Export Endpoint**
```
You are a backend developer.

Project: Arabic Accounting System
Focus: server/routes/fursatkum.js or server/routes/exports.js

Current Task: Modify export endpoint to accept filters

Requirements:
1. Modify export endpoint to accept filter parameters:
   - type (all/income/spending)
   - ledger (all/cash/bank)
   - status (active/deleted)
   - startDate, endDate
   - search (optional)
2. Apply filters to invoice query
3. Generate Excel file with filtered data only
4. Return file as download

Reference:
- Existing export endpoint (check exports.js or fursatkum.js)
- Look at ExcelJS usage
- Check how filters are applied in invoice endpoint

Implementation:
- Use same filter logic as GET /api/fursatkum/invoices
- Apply filters before generating Excel
- Use ExcelJS to create workbook
- Return file with proper headers
```

---

## 🎯 General Workflow Pattern

For any new feature, follow this pattern:

1. **Identify the scope**: Frontend? Backend? Both? Database?
2. **Break into tasks**: One agent per major component
3. **Set clear context**: Use templates above
4. **Reference existing code**: Always point to similar files
5. **Execute in parallel**: Let agents work simultaneously
6. **Review and integrate**: Test and fix together
7. **Iterate**: Refine based on results

---

## 💡 Tips for Success

1. **Start with one agent** if you're new to this
2. **Be specific** about file paths and requirements
3. **Reference existing code** - agents learn from your patterns
4. **Test incrementally** - don't wait for all agents to finish
5. **Use agents to fix issues** - if something breaks, ask an agent to fix it

---

**Copy these examples and modify for your specific needs!** 🚀


