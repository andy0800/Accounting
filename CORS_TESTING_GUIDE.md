# 🔒 CORS Configuration & Testing Guide

## 📋 Current CORS Setup

Your server now has **secure CORS configuration** that only allows specific domains instead of allowing all domains.

### ✅ **Allowed Origins (by default):**
- `http://localhost:3000` - Development frontend
- `http://localhost:3001` - Alternative dev port
- `https://fursatkum-frontend.onrender.com` - Production frontend
- `https://fursatkum-backend.onrender.com` - Production backend (for internal API calls)
- `process.env.CORS_ORIGIN` - From environment variable
- `process.env.FRONTEND_URL` - Alternative environment variable

---

## 🧪 **CORS Testing Commands**

### 1. Test Allowed Origins (Should Work)
```bash
# Test localhost:3000 (development)
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://fursatkum-backend.onrender.com/api/health

# Test localhost:3001 (alternative dev)
curl -H "Origin: http://localhost:3001" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://fursatkum-backend.onrender.com/api/health

# Test production frontend
curl -H "Origin: https://fursatkum-frontend.onrender.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://fursatkum-backend.onrender.com/api/health

# Test production backend (internal calls)
curl -H "Origin: https://fursatkum-backend.onrender.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://fursatkum-backend.onrender.com/api/health
```

### 2. Test Blocked Origins (Should Fail)
```bash
# Test unauthorized domain (should be blocked)
curl -H "Origin: https://malicious-site.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://your-app-name.onrender.com/api/health

# Expected response: CORS error
```

### 3. Test No Origin (Should Work)
```bash
# Test requests without origin (mobile apps, curl, etc.)
curl -X GET https://your-app-name.onrender.com/api/health
```

---

## 🔧 **Environment Variables for CORS**

### For Development:
```bash
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

### For Production:
```bash
CORS_ORIGIN=https://your-frontend-domain.com
FRONTEND_URL=https://your-frontend-domain.com
```

### For Multiple Domains:
```bash
# You can add multiple domains by modifying the server code
CORS_ORIGIN=https://your-frontend-domain.com,https://admin.your-domain.com
FRONTEND_URL=https://your-frontend-domain.com
```

---

## 🚨 **Common CORS Issues & Solutions**

### Issue 1: "Access to fetch at '...' from origin '...' has been blocked by CORS policy"
**Solution**: Add your frontend domain to the allowed origins list

### Issue 2: "Preflight request doesn't pass access control check"
**Solution**: Ensure your domain is in the allowed origins and OPTIONS method is allowed

### Issue 3: "Credentials mode is 'include' but Access-Control-Allow-Credentials is not 'true'"
**Solution**: The server already has `credentials: true` configured

### Issue 4: "Request header field authorization is not allowed by Access-Control-Allow-Headers"
**Solution**: The server already includes 'Authorization' in allowed headers

---

## 🔍 **CORS Headers Explained**

### Request Headers (from browser):
- `Origin`: The domain making the request
- `Access-Control-Request-Method`: The HTTP method being used
- `Access-Control-Request-Headers`: Headers being sent

### Response Headers (from server):
- `Access-Control-Allow-Origin`: Which origins are allowed
- `Access-Control-Allow-Methods`: Which HTTP methods are allowed
- `Access-Control-Allow-Headers`: Which headers are allowed
- `Access-Control-Allow-Credentials`: Whether cookies/auth headers are allowed

---

## 🛠️ **How to Add New Domains**

### Method 1: Environment Variables (Recommended)
```bash
# Add to your .env file
CORS_ORIGIN=https://new-domain.com
FRONTEND_URL=https://new-domain.com
```

### Method 2: Modify Server Code
```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'https://your-frontend-domain.com',
  'https://new-domain.com',        // Add new domain here
  'https://admin.your-domain.com', // Add admin domain here
  process.env.CORS_ORIGIN,
  process.env.FRONTEND_URL
].filter(Boolean);
```

---

## 🧪 **Testing CORS with Different Tools**

### 1. Browser DevTools
1. Open your frontend in browser
2. Open DevTools → Network tab
3. Make API request
4. Check for CORS errors in console
5. Look at response headers for CORS headers

### 2. Postman
1. Set Origin header in request
2. Send OPTIONS request first (preflight)
3. Check response headers
4. Send actual request

### 3. curl
```bash
# Test preflight request
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://your-app-name.onrender.com/api/visas

# Test actual request
curl -H "Origin: http://localhost:3000" \
     -H "Content-Type: application/json" \
     -X GET \
     https://your-app-name.onrender.com/api/visas
```

---

## 🔒 **Security Best Practices**

### ✅ **Do:**
- Only allow specific domains you control
- Use HTTPS in production
- Regularly review allowed origins
- Use environment variables for configuration
- Log blocked requests for monitoring

### ❌ **Don't:**
- Use `*` for origin (allows all domains)
- Allow HTTP in production
- Forget to update CORS when adding new domains
- Ignore CORS warnings in logs

---

## 📊 **CORS Monitoring**

### Check Server Logs for CORS Warnings:
```bash
# Look for this in your Render logs:
⚠️  CORS blocked request from origin: https://unauthorized-domain.com
```

### Monitor Allowed Requests:
- Check that legitimate requests are not being blocked
- Verify preflight requests are working
- Ensure credentials are being sent correctly

---

## 🚀 **Deployment Checklist**

- [ ] Update CORS_ORIGIN with your production frontend URL
- [ ] Test CORS with your actual frontend domain
- [ ] Verify preflight requests work
- [ ] Check that unauthorized domains are blocked
- [ ] Monitor logs for CORS warnings
- [ ] Test with different browsers
- [ ] Verify mobile app requests work (if applicable)

---

## 🆘 **Troubleshooting**

### If CORS is still blocking requests:
1. Check that your domain is in the allowed origins list
2. Verify environment variables are set correctly
3. Restart your server after making changes
4. Check server logs for CORS warnings
5. Test with curl to isolate the issue

### If you need to temporarily allow all origins (NOT RECOMMENDED):
```javascript
// TEMPORARY - Only for debugging
app.use(cors({
  origin: true, // Allow all origins
  credentials: true
}));
```

**Remember**: Always restrict CORS to specific domains in production! 🔒
