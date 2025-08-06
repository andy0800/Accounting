# Quick Start Guide - Arabic Visa Management System

## Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB (v4.4 or higher)
- Git

## Quick Start (Local Development)

### 1. Clone and Setup
```bash
# Navigate to project directory
cd "Accounting System"

# Install all dependencies
npm run install-all
```

### 2. Setup Database
```bash
# Start MongoDB
mongod

# In a new terminal, create database
mongo
use نظام-التأشيرات
exit
```

### 3. Environment Setup
```bash
# Create environment file
cd server
cp env.example .env
```

Edit `server/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/نظام-التأشيرات
PORT=5000
NODE_ENV=development
```

### 4. Run the System
```bash
# From root directory
npm run dev
```

### 5. Access the System
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## Docker Quick Start

### 1. Using Docker Compose
```bash
# Build and run all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

### 2. Access the System
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **MongoDB**: localhost:27017

### 3. Stop the System
```bash
docker-compose down
```

## Production Deployment

### 1. Build for Production
```bash
# Build frontend
cd client
npm run build
cd ..

# Start server
cd server
npm start
```

### 2. Using PM2
```bash
# Install PM2
npm install -g pm2

# Start server
pm2 start server/index.js --name "visa-system"

# Start frontend
pm2 start "npm start" --name "visa-frontend" --cwd client

# Check status
pm2 status
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Error
```bash
# Ensure MongoDB is running
mongod

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

#### 2. Dependencies Installation Error
```bash
# Clean install
rm -rf node_modules
rm -rf server/node_modules
rm -rf client/node_modules
npm run install-all
```

#### 3. Port Already in Use
```bash
# Check what's using the port
lsof -i :3000
lsof -i :5000

# Kill the process
kill -9 <PID>
```

#### 4. Environment File Missing
```bash
cd server
cp env.example .env
```

## System Features

### What's Included
- ✅ Complete visa management with 5 stages
- ✅ Secretary management with automatic codes
- ✅ Financial accounting system
- ✅ Excel export functionality
- ✅ Arabic RTL interface
- ✅ File upload system
- ✅ Comprehensive reporting

### Main Components
- **Dashboard**: Overview and statistics
- **Visa Management**: Create, track, and manage visas
- **Secretary Management**: Manage secretaries and their accounts
- **Financial Reports**: Company and secretary accounting
- **Export System**: Excel reports for all data

## API Endpoints

### Main Endpoints
- `GET /api/visas` - List all visas
- `POST /api/visas` - Create new visa
- `GET /api/secretaries` - List all secretaries
- `GET /api/accounts/company` - Company account
- `GET /api/exports/visas/:status` - Export visas

### Testing API
```bash
# Test server connection
curl http://localhost:5000/api/accounts/summary

# Test frontend
curl http://localhost:3000
```

## File Structure
```
Accounting System/
├── client/          # React frontend
├── server/          # Node.js backend
├── docker-compose.yml
├── package.json
└── README.md
```

## Support

### If you encounter issues:
1. Check the logs
2. Verify environment settings
3. Test database connection
4. Review README.md
5. Contact support team

### Useful Links:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:5000/api
- **MongoDB Compass**: For database access
- **Docker Hub**: For ready images

---

**Note**: Make sure to read all instructions carefully before running the system in production environment. 