# 🚀 Cursor Agents Layout - Quick Reference Card

## ⚡ Quick Start (30 seconds)

1. **Open Agents Layout**: `Cmd/Ctrl + Shift + P` → "Agents Layout"
2. **Add Agent Panel**: Click "+" button
3. **Set Context**: Paste template below, fill in [BRACKETS]
4. **Assign Task**: Be specific about what to do
5. **Let it work**: Review and integrate results

---

## 📋 Agent Context Templates (Copy & Paste)

### Frontend Agent (React/TypeScript)
```
Focus: client/src/pages/[MODULE]/
Task: [SPECIFIC TASK]
Reference: [SIMILAR_FILE.tsx]
Pattern: Follow [EXISTING_FILE.tsx] structure
Tech: React, TypeScript, Material-UI, RTL layout
```

### Backend Agent (Node.js/Express)
```
Focus: server/routes/[module].js
Task: [SPECIFIC TASK]
Reference: [SIMILAR_ROUTE.js]
Pattern: Follow existing route structure
Tech: Express, MongoDB, Mongoose, async/await
```

### Database Agent (MongoDB/Mongoose)
```
Focus: server/models/[Model].js
Task: [SPECIFIC TASK]
Reference: [SIMILAR_MODEL.js]
Pattern: Follow existing schema structure
Tech: Mongoose, MongoDB, indexes, validation
```

---

## 🎯 Common Tasks for Your Project

### Adding New Invoice Feature
```
Agent 1 (Frontend):
File: client/src/pages/[module]/[Module]Invoices.tsx
Task: Add [FEATURE] to invoice list
Reference: FursatkumInvoices.tsx

Agent 2 (Backend):
File: server/routes/[module].js
Task: Add [FEATURE] endpoint
Reference: routes/fursatkum.js
```

### Creating New Module Page
```
Agent 1 (Frontend):
File: client/src/pages/[module]/[Module]Page.tsx
Task: Create new page component
Reference: client/src/pages/fursatkum/FursatkumDashboard.tsx

Agent 2 (Backend):
File: server/routes/[module].js
Task: Add API endpoints for page
Reference: server/routes/fursatkum.js

Agent 3 (Database):
File: server/models/[Module]Model.js
Task: Create Mongoose model
Reference: server/models/FursatkumInvoice.js
```

### Refactoring Duplicate Code
```
Agent 1 (Analyzer):
Files: [FILE1.tsx], [FILE2.tsx]
Task: Identify common code, create base component
Reference: FarwaniyaInvoicesBase.tsx pattern

Agent 2 (Refactorer):
File: [FILE1.tsx]
Task: Refactor to use base component
```

---

## 🔑 Key File Paths in Your Project

### Frontend Pages
- Fursatkum: `client/src/pages/fursatkum/`
- Farwaniya 1: `client/src/pages/farwaniya/FW1*.tsx`
- Farwaniya 2: `client/src/pages/farwaniya/FW2*.tsx`
- Home Service: `client/src/pages/home-service/HS*.tsx`
- Rentals: `client/src/pages/Rental*.tsx`
- Visas: `client/src/pages/Visas.tsx`

### Backend Routes
- Fursatkum: `server/routes/fursatkum.js`
- Farwaniya 1: `server/routes/farwaniya1.js`
- Farwaniya 2: `server/routes/farwaniya2.js`
- Home Service: `server/routes/home-service.js`
- Rentals: `server/routes/rental-*.js`

### Models
- Fursatkum: `server/models/Fursatkum*.js`
- Farwaniya: `server/models/FW1*.js`, `server/models/FW2*.js`
- Home Service: `server/models/HS*.js`
- Rentals: `server/models/Rental*.js`

---

## 💡 Pro Tips

1. **Always reference existing files** - "Follow FursatkumInvoices.tsx pattern"
2. **Be specific about file paths** - Use full paths
3. **One agent, one responsibility** - Don't mix frontend/backend
4. **Start simple** - One agent first, then add more
5. **Test incrementally** - Get one part working before next

---

## 🚨 Common Mistakes to Avoid

❌ "Make a page" → ✅ "Create FursatkumReports.tsx following FursatkumInvoices.tsx pattern"
❌ "Add API" → ✅ "Add GET /api/fursatkum/reports endpoint in routes/fursatkum.js"
❌ "Fix bug" → ✅ "Fix pagination issue in FursatkumInvoices.tsx line 312"
❌ Too many agents → ✅ 2-3 focused agents work best
❌ Vague context → ✅ Always provide file paths and references

---

## 📊 Agent Workflow Diagram

```
┌─────────────────────────────────────────┐
│  1. Define Feature/Task                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  2. Break into Frontend/Backend/DB     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  3. Create Agent Panels (2-3 agents)   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  4. Set Context (use templates above)  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  5. Assign Specific Tasks               │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  6. Let Agents Work in Parallel        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  7. Review & Integrate Results         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  8. Test & Iterate                     │
└─────────────────────────────────────────┘
```

---

## 🎯 Your Project's Module Structure

```
Accounting System
│
├── Fursatkum (Main Accounting)
│   ├── Frontend: client/src/pages/fursatkum/
│   ├── Backend: server/routes/fursatkum.js
│   └── Models: server/models/Fursatkum*.js
│
├── Farwaniya 1 & 2 (Office Systems)
│   ├── Frontend: client/src/pages/farwaniya/FW1*.tsx, FW2*.tsx
│   ├── Backend: server/routes/farwaniya1.js, farwaniya2.js
│   └── Models: server/models/FW1*.js, FW2*.js
│
├── Home Service
│   ├── Frontend: client/src/pages/home-service/HS*.tsx
│   ├── Backend: server/routes/home-service.js
│   └── Models: server/models/HS*.js
│
└── Other Modules (Rentals, Visas, etc.)
    ├── Frontend: client/src/pages/[Module]*.tsx
    ├── Backend: server/routes/[module].js
    └── Models: server/models/[Module]*.js
```

---

## 🔄 Example: Complete Feature Implementation

**Feature**: Add "Export Filtered Results" to Fursatkum Invoices

**Step 1 - Frontend Agent**:
```
File: client/src/pages/fursatkum/FursatkumInvoices.tsx
Task: Add "Export Filtered" button next to existing "Export Excel" button
Context: Button should export only currently filtered invoices
Reference: Existing handleExport function in same file
```

**Step 2 - Backend Agent**:
```
File: server/routes/fursatkum.js
Task: Modify export endpoint to accept filter parameters
Context: Add query params (type, ledger, status, dateRange) to export
Reference: Existing GET /api/fursatkum/invoices endpoint filters
```

**Step 3 - Integration Agent**:
```
Files: Both files above
Task: Ensure frontend passes filters to backend correctly
Context: Test the integration, handle edge cases
```

---

## 📝 Quick Checklist

Before starting agents:
- [ ] I know which module I'm working on
- [ ] I've identified the files involved
- [ ] I have a similar file to reference
- [ ] I've broken down the task clearly
- [ ] I know how many agents I need (2-3 usually)

While agents work:
- [ ] Monitor their progress
- [ ] Review generated code
- [ ] Check for conflicts
- [ ] Ensure they follow patterns

After agents finish:
- [ ] Review all generated code
- [ ] Test integration
- [ ] Fix any issues
- [ ] Final code review

---

**Keep this file open while using Agents Layout!** 🚀


