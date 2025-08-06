# 🚀 Deployment Guide - Arabic Visa Management System

## 📋 Prerequisites
- GitHub account
- MongoDB Atlas account (free)
- Railway account (free tier available)

---

## 🗄️ Step 1: MongoDB Atlas Setup

### 1.1 Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Click "Try Free" and create an account
3. Choose "Free" tier (M0)

### 1.2 Create Database Cluster
1. **Choose Provider**: AWS, Google Cloud, or Azure (any is fine)
2. **Choose Region**: Select closest to your users
3. **Cluster Tier**: M0 (Free) - 512MB storage
4. Click "Create"

### 1.3 Configure Database Access
1. Go to "Database Access" in left sidebar
2. Click "Add New Database User"
3. **Username**: `admin` (or your preferred username)
4. **Password**: Generate a strong password
5. **Database User Privileges**: "Read and write to any database"
6. Click "Add User"

### 1.4 Configure Network Access
1. Go to "Network Access" in left sidebar
2. Click "Add IP Address"
3. **Option A**: Click "Allow Access from Anywhere" (0.0.0.0/0)
4. **Option B**: Add specific IP addresses
5. Click "Confirm"

### 1.5 Get Connection String
1. Go to "Database" in left sidebar
2. Click "Connect"
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your actual password
6. Replace `<dbname>` with `visa_system` (or your preferred name)

**Example connection string:**
```
mongodb+srv://admin:yourpassword@cluster0.xxxxx.mongodb.net/visa_system?retryWrites=true&w=majority
```

---

## ☁️ Step 2: Railway Deployment

### 2.1 Prepare Your Code

#### Update Environment Variables
Create `.env` file in your project root:

```env
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://admin:yourpassword@cluster0.xxxxx.mongodb.net/visa_system?retryWrites=true&w=majority

# Server Configuration
PORT=5000
NODE_ENV=production

# CORS Configuration (for production)
CORS_ORIGIN=https://your-frontend-domain.railway.app
```

#### Update package.json
Add build scripts:

```json
{
  "scripts": {
    "start": "node server/index.js",
    "build": "cd client && npm install && npm run build",
    "dev": "concurrently \"npm run server\" \"npm run client\"",
    "server": "nodemon server/index.js",
    "client": "cd client && npm start"
  }
}
```

#### Create Railway Configuration
Create `railway.json` in project root:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 2.2 Deploy to Railway

#### 2.2.1 Connect GitHub
1. Go to [Railway](https://railway.app)
2. Sign up with GitHub
3. Click "New Project"
4. Choose "Deploy from GitHub repo"
5. Select your repository

#### 2.2.2 Configure Environment Variables
1. In Railway dashboard, go to "Variables" tab
2. Add your environment variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `CORS_ORIGIN`: Your frontend URL

#### 2.2.3 Deploy
1. Railway will automatically detect your Node.js app
2. It will install dependencies and build your project
3. Your API will be available at: `https://your-app-name.railway.app`

---

## 🌐 Step 3: Frontend Deployment

### 3.1 Update API Base URL
In `client/src/App.tsx` or wherever you configure axios:

```javascript
// For development
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-app.railway.app' 
  : 'http://localhost:5000';

axios.defaults.baseURL = API_BASE_URL;
```

### 3.2 Deploy Frontend
You can deploy the frontend to:
- **Railway** (same project, different service)
- **Vercel** (recommended for React apps)
- **Netlify**
- **GitHub Pages**

#### Railway Frontend Deployment
1. In your Railway project, click "New Service"
2. Choose "GitHub Repo"
3. Select your repository
4. Set root directory to `client`
5. Set build command: `npm run build`
6. Set start command: `npx serve -s build -l 3000`

---

## 🔧 Step 4: Production Optimizations

### 4.1 Add Health Check Endpoint
Add to `server/index.js`:

```javascript
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

### 4.2 Add Error Handling
```javascript
// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});
```

### 4.3 Add CORS Configuration
```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
```

---

## 🔒 Step 5: Security Considerations

### 5.1 Environment Variables
- ✅ Never commit `.env` files to GitHub
- ✅ Use Railway's environment variables
- ✅ Rotate passwords regularly

### 5.2 MongoDB Atlas Security
- ✅ Use strong passwords
- ✅ Enable IP whitelist (or allow all IPs for global access)
- ✅ Enable database encryption
- ✅ Set up backup schedules

### 5.3 API Security
- ✅ Add rate limiting
- ✅ Validate all inputs
- ✅ Use HTTPS in production
- ✅ Add API authentication if needed

---

## 📊 Step 6: Monitoring & Maintenance

### 6.1 MongoDB Atlas Monitoring
- Monitor database performance
- Set up alerts for storage usage
- Review access logs

### 6.2 Railway Monitoring
- Monitor application logs
- Set up uptime monitoring
- Configure auto-scaling if needed

### 6.3 Backup Strategy
- MongoDB Atlas provides automatic backups
- Consider additional backup solutions
- Test restore procedures regularly

---

## 🚨 Troubleshooting

### Common Issues:

1. **Connection Refused**
   - Check MongoDB Atlas IP whitelist
   - Verify connection string
   - Check network access settings

2. **Build Failures**
   - Check package.json scripts
   - Verify all dependencies are installed
   - Check for TypeScript errors

3. **CORS Errors**
   - Update CORS_ORIGIN in environment variables
   - Check frontend API base URL
   - Verify HTTPS/HTTP protocols match

4. **Database Connection Issues**
   - Verify MongoDB Atlas cluster is running
   - Check username/password in connection string
   - Ensure database name is correct

---

## 💰 Cost Estimation

### Free Tier (Recommended for starting):
- **MongoDB Atlas**: Free (512MB storage)
- **Railway**: Free tier available
- **Total**: $0/month

### Production Tier:
- **MongoDB Atlas**: $9/month (2GB storage)
- **Railway**: $5/month
- **Total**: ~$14/month

---

## 🎯 Next Steps

1. ✅ Set up MongoDB Atlas
2. ✅ Deploy backend to Railway
3. ✅ Deploy frontend
4. ✅ Configure environment variables
5. ✅ Test all functionality
6. ✅ Set up monitoring
7. ✅ Configure custom domain (optional)

Your application will now be:
- 🌐 **Always online** (99.9%+ uptime)
- 🌍 **Accessible from anywhere**
- 🔒 **Secure and encrypted**
- 📊 **Monitored and backed up**
- ⚡ **Fast and scalable** 