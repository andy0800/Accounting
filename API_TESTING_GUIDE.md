# 🧪 API Testing Guide for Arabic Visa Management System

## 📋 Overview
This guide provides comprehensive API tests for your deployed backend on Render. Replace `YOUR_RENDER_URL` with your actual Render deployment URL.

**Base URL**: `https://your-app-name.onrender.com`

---

## 🔧 Prerequisites
- **Postman** or **curl** or **Thunder Client** (VS Code extension)
- Your deployed Render URL
- Valid test data

---

## 🚀 **1. Health Check Tests**

### Test Server Status
```bash
GET https://your-app-name.onrender.com/api/health
```
**Expected Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 123.45,
  "environment": "production"
}
```

---

## 👥 **2. Secretaries API Tests**

### 2.1 Get All Secretaries
```bash
GET https://your-app-name.onrender.com/api/secretaries
```

### 2.2 Create New Secretary
```bash
POST https://your-app-name.onrender.com/api/secretaries
Content-Type: application/json

{
  "name": "فاطمة أحمد",
  "email": "fatima@example.com",
  "phone": "+966501234567"
}
```

### 2.3 Get Secretary by ID
```bash
GET https://your-app-name.onrender.com/api/secretaries/{secretary_id}
```

### 2.4 Update Secretary
```bash
PUT https://your-app-name.onrender.com/api/secretaries/{secretary_id}
Content-Type: application/json

{
  "name": "فاطمة أحمد محمد",
  "email": "fatima.updated@example.com",
  "phone": "+966501234568"
}
```

### 2.5 Delete Secretary
```bash
DELETE https://your-app-name.onrender.com/api/secretaries/{secretary_id}
```

---

## 📄 **3. Visas API Tests**

### 3.1 Get All Visas
```bash
GET https://your-app-name.onrender.com/api/visas
```

### 3.2 Get Visas with Filters
```bash
# Filter by status
GET https://your-app-name.onrender.com/api/visas?status=قيد_الشراء

# Filter by stage
GET https://your-app-name.onrender.com/api/visas?stage=أ

# Filter by secretary
GET https://your-app-name.onrender.com/api/visas?secretary={secretary_id}
```

### 3.3 Create New Visa (Stage A)
```bash
POST https://your-app-name.onrender.com/api/visas
Content-Type: application/json

{
  "name": "أحمد محمد علي",
  "dateOfBirth": "1990-05-15",
  "nationality": "مصري",
  "passportNumber": "A1234567",
  "visaNumber": "V7890123",
  "secretaryId": "{secretary_id}",
  "middlemanName": "محمد الوسيط",
  "visaSponsor": "شركة الكفيل",
  "visaIssueDate": "2024-01-01",
  "visaExpiryDate": "2024-12-31",
  "visaDeadline": "2024-02-15",
  "secretaryProfitPercentage": 30
}
```

### 3.4 Get Visa by ID
```bash
GET https://your-app-name.onrender.com/api/visas/{visa_id}
```

### 3.5 Add Expense to Visa
```bash
POST https://your-app-name.onrender.com/api/visas/{visa_id}/expenses
Content-Type: application/json

{
  "amount": 500,
  "description": "رسوم المرحلة أ",
  "stage": "أ",
  "date": "2024-01-15"
}
```

### 3.6 Complete Stage A
```bash
PUT https://your-app-name.onrender.com/api/visas/{visa_id}/stage-a
Content-Type: application/json

{
  "stageACompleted": true
}
```

### 3.7 Complete Stage B
```bash
PUT https://your-app-name.onrender.com/api/visas/{visa_id}/complete-stage-b
```

### 3.8 Complete Stage C
```bash
PUT https://your-app-name.onrender.com/api/visas/{visa_id}/complete-stage-c
```

### 3.9 Complete Stage D
```bash
PUT https://your-app-name.onrender.com/api/visas/{visa_id}/complete-stage-d
```

### 3.10 Sell Visa
```bash
PUT https://your-app-name.onrender.com/api/visas/{visa_id}/sell
Content-Type: application/json

{
  "sellingPrice": 5000,
  "customerName": "سالم العميل",
  "customerPhone": "+966501234569",
  "sellingSecretary": "{secretary_id}",
  "sellingCommission": 200
}
```

### 3.11 Cancel Visa
```bash
PUT https://your-app-name.onrender.com/api/visas/{visa_id}/cancel
Content-Type: application/json

{
  "reason": "طلب العميل"
}
```

### 3.12 Replace Visa
```bash
POST https://your-app-name.onrender.com/api/visas/{visa_id}/replace
Content-Type: application/json

{
  "name": "محمد أحمد جديد",
  "dateOfBirth": "1985-03-20",
  "nationality": "سعودي",
  "passportNumber": "B7654321",
  "visaNumber": "V9876543",
  "middlemanName": "علي الوسيط",
  "visaSponsor": "شركة الكفيل الجديد",
  "visaIssueDate": "2024-01-20",
  "visaExpiryDate": "2024-12-31",
  "visaDeadline": "2024-02-20"
}
```

### 3.13 Check Overdue Visas
```bash
POST https://your-app-name.onrender.com/api/visas/check-overdue
```

---

## 💰 **4. Accounts API Tests**

### 4.1 Get Company Account
```bash
GET https://your-app-name.onrender.com/api/accounts/company
```

### 4.2 Get All Secretary Accounts
```bash
GET https://your-app-name.onrender.com/api/accounts/secretaries
```

### 4.3 Get Secretary Account by ID
```bash
GET https://your-app-name.onrender.com/api/accounts/secretaries/{secretary_id}
```

### 4.4 Update Statistics
```bash
PUT https://your-app-name.onrender.com/api/accounts/update-statistics
Content-Type: application/json

{
  "secretaryId": "{secretary_id}"
}
```

### 4.5 Get Financial Summary
```bash
GET https://your-app-name.onrender.com/api/accounts/summary
```

---

## 🏠 **5. Rental System API Tests**

### 5.1 Renting Secretaries
```bash
# Get all renting secretaries
GET https://your-app-name.onrender.com/api/renting-secretaries

# Create new renting secretary
POST https://your-app-name.onrender.com/api/renting-secretaries
Content-Type: application/json

{
  "name": "عبدالله المؤجر",
  "email": "abdullah@rental.com",
  "phone": "+966501234570"
}
```

### 5.2 Rental Units
```bash
# Get all rental units
GET https://your-app-name.onrender.com/api/rental-units

# Create new rental unit
POST https://your-app-name.onrender.com/api/rental-units
Content-Type: application/json

{
  "unitType": "شقة",
  "unitNumber": "A-101",
  "address": "شارع الملك فهد، الرياض",
  "monthlyRent": 3000,
  "description": "شقة 3 غرف نوم"
}
```

### 5.3 Rental Contracts
```bash
# Get all rental contracts
GET https://your-app-name.onrender.com/api/rental-contracts

# Create new rental contract
POST https://your-app-name.onrender.com/api/rental-contracts
Content-Type: application/json

{
  "secretaryId": "{renting_secretary_id}",
  "unitType": "شقة",
  "unitNumber": "A-101",
  "address": "شارع الملك فهد، الرياض",
  "rentAmount": 3000,
  "startDate": "2024-01-01",
  "dueDay": 1
}
```

### 5.4 Rental Payments
```bash
# Get payments for a contract
GET https://your-app-name.onrender.com/api/rental-payments/{contract_id}

# Add new payment
POST https://your-app-name.onrender.com/api/rental-payments
Content-Type: application/json

{
  "contractId": "{contract_id}",
  "amount": 3000,
  "paymentDate": "2024-01-01",
  "paymentMethod": "تحويل بنكي",
  "notes": "دفعة شهر يناير"
}
```

### 5.5 Rental Reports
```bash
# Get rental reports
GET https://your-app-name.onrender.com/api/renting-reports
```

---

## 📊 **6. Export API Tests**

### 6.1 Export All Visas
```bash
GET https://your-app-name.onrender.com/api/exports/visas
```

### 6.2 Export Visas by Secretary
```bash
GET https://your-app-name.onrender.com/api/exports/visas/secretary/{secretary_id}
```

### 6.3 Export Financial Report
```bash
GET https://your-app-name.onrender.com/api/exports/financial
```

---

## 🧪 **7. Error Handling Tests**

### 7.1 Test Invalid Endpoints
```bash
GET https://your-app-name.onrender.com/api/invalid-endpoint
# Expected: 404 Not Found
```

### 7.2 Test Invalid Data
```bash
POST https://your-app-name.onrender.com/api/secretaries
Content-Type: application/json

{
  "name": ""  // Empty name should fail
}
# Expected: 400 Bad Request
```

### 7.3 Test Missing Required Fields
```bash
POST https://your-app-name.onrender.com/api/visas
Content-Type: application/json

{
  "name": "Test"
  // Missing required fields
}
# Expected: 400 Bad Request
```

---

## 📁 **8. File Upload Tests**

### 8.1 Upload Visa Document
```bash
POST https://your-app-name.onrender.com/api/visas
Content-Type: multipart/form-data

# Form data:
# - name: "أحمد محمد"
# - dateOfBirth: "1990-05-15"
# - nationality: "مصري"
# - passportNumber: "A1234567"
# - visaNumber: "V7890123"
# - secretaryId: "{secretary_id}"
# - visaIssueDate: "2024-01-01"
# - visaExpiryDate: "2024-12-31"
# - visaDeadline: "2024-02-15"
# - secretaryProfitPercentage: 30
# - visaDocument: [FILE]
```

---

## 🔍 **9. Performance Tests**

### 9.1 Load Test with Multiple Requests
```bash
# Test multiple simultaneous requests
for i in {1..10}; do
  curl -X GET https://your-app-name.onrender.com/api/visas &
done
wait
```

### 9.2 Test Large Data Sets
```bash
# Test with large number of visas
GET https://your-app-name.onrender.com/api/visas?limit=1000
```

---

## 📝 **10. Test Data Cleanup**

### 10.1 Clean Up Test Data
```bash
# Delete test secretaries
DELETE https://your-app-name.onrender.com/api/secretaries/{test_secretary_id}

# Delete test visas
DELETE https://your-app-name.onrender.com/api/visas/{test_visa_id}
```

---

## ✅ **11. Success Criteria Checklist**

- [ ] Health check returns 200 OK
- [ ] All CRUD operations work for secretaries
- [ ] All CRUD operations work for visas
- [ ] File uploads work correctly
- [ ] Financial calculations are accurate
- [ ] Error handling works properly
- [ ] Arabic text is handled correctly
- [ ] Database connections are stable
- [ ] Response times are acceptable (< 2 seconds)
- [ ] CORS is configured correctly
- [ ] All rental system endpoints work
- [ ] Export functionality works
- [ ] Statistics calculations are correct

---

## 🚨 **12. Common Issues & Troubleshooting**

### Issue: CORS Errors
**Solution**: Check CORS configuration in server/index.js

### Issue: Database Connection Errors
**Solution**: Verify MongoDB URI in environment variables

### Issue: File Upload Failures
**Solution**: Check file size limits and allowed file types

### Issue: Arabic Text Encoding
**Solution**: Ensure proper UTF-8 encoding in requests

### Issue: Slow Response Times
**Solution**: Check Render logs for performance issues

---

## 📞 **13. Monitoring & Logs**

### Check Render Logs
1. Go to your Render dashboard
2. Select your service
3. Click on "Logs" tab
4. Monitor for errors and performance issues

### Key Metrics to Monitor
- Response times
- Error rates
- Database connection status
- Memory usage
- CPU usage

---

## 🎯 **14. Automated Testing Script**

Create a test script using your preferred tool:

```javascript
// Example using Node.js with axios
const axios = require('axios');

const BASE_URL = 'https://your-app-name.onrender.com';

async function runTests() {
  try {
    // Health check
    const health = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Health check passed:', health.data);
    
    // Test secretaries
    const secretaries = await axios.get(`${BASE_URL}/api/secretaries`);
    console.log('✅ Secretaries API working:', secretaries.data.length, 'secretaries');
    
    // Test visas
    const visas = await axios.get(`${BASE_URL}/api/visas`);
    console.log('✅ Visas API working:', visas.data.length, 'visas');
    
    console.log('🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

runTests();
```

---

**Remember**: Replace `your-app-name` with your actual Render app name and test thoroughly before going live! 🚀
