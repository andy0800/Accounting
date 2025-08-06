# 🌟 Arabic Visa Management System

A comprehensive visa management system built with React, Node.js, and MongoDB, featuring Arabic language support and RTL layout.

## ✨ Features

- **📋 Visa Management**: Complete visa lifecycle management
- **👥 Secretary Management**: Individual secretary accounts and tracking
- **💰 Financial Tracking**: Company and secretary profit calculations
- **📊 Detailed Reports**: Excel export functionality
- **🌐 Arabic Interface**: Full RTL support with Arabic UI
- **📱 Responsive Design**: Works on all devices
- **🔒 Commission System**: Selling commission tracking
- **⏰ Deadline Management**: Automatic visa cancellation for overdue visas

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB (local or Atlas)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd arabic-visa-management-system
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your MongoDB connection string
   ```

4. **Start development servers**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 🗄️ Database Setup

### Option 1: MongoDB Atlas (Recommended for Production)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster (M0 Free tier)
3. Configure network access (allow all IPs: 0.0.0.0/0)
4. Create a database user
5. Get your connection string and add it to `.env`

### Option 2: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/visa_system`

## 🌐 Deployment

### Quick Deployment with Railway

1. **Fork this repository** to your GitHub account

2. **Set up MongoDB Atlas** (see Database Setup above)

3. **Deploy to Railway**:
   - Go to [Railway](https://railway.app)
   - Sign up with GitHub
   - Create new project from GitHub repo
   - Add environment variables:
     - `MONGODB_URI`: Your MongoDB Atlas connection string
     - `NODE_ENV`: `production`
     - `PORT`: `5000`

4. **Your app will be live** at `https://your-app-name.railway.app`

### Manual Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

## 📁 Project Structure

```
arabic-visa-management-system/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   └── App.tsx        # Main app component
│   └── package.json
├── server/                 # Node.js backend
│   ├── models/            # Mongoose models
│   ├── routes/            # API routes
│   ├── uploads/           # File uploads
│   └── index.js           # Server entry point
├── package.json           # Root package.json
└── README.md
```

## 🔧 API Endpoints

### Secretaries
- `GET /api/secretaries` - Get all secretaries
- `POST /api/secretaries` - Create new secretary
- `GET /api/secretaries/:id` - Get secretary details
- `PUT /api/secretaries/:id` - Update secretary
- `DELETE /api/secretaries/:id` - Delete secretary

### Visas
- `GET /api/visas` - Get all visas
- `POST /api/visas` - Create new visa
- `GET /api/visas/:id` - Get visa details
- `PUT /api/visas/:id` - Update visa
- `POST /api/visas/:id/expenses` - Add expense to visa
- `PUT /api/visas/:id/complete-stage-*` - Complete visa stages
- `PUT /api/visas/:id/sell` - Sell visa

### Accounts
- `GET /api/accounts/company` - Get company account
- `GET /api/accounts/secretaries` - Get all secretary accounts

### Exports
- `GET /api/exports/visas/all` - Export all visas to Excel
- `GET /api/exports/company-report` - Export company report

## 🎨 Features in Detail

### Visa Management
- **4-Stage Process**: أ → ب → ج → د → مكتملة
- **Expense Tracking**: Track all visa-related expenses
- **Profit Calculation**: Automatic profit calculation per visa
- **Deadline Management**: Automatic cancellation for overdue visas
- **Commission System**: Track selling commissions

### Secretary Management
- **Individual Accounts**: Each secretary has their own account
- **Profit Tracking**: Track earnings and expenses per secretary
- **Commission Tracking**: Monitor selling commissions
- **Performance Analytics**: Detailed statistics and reports

### Company Account
- **Financial Overview**: Total expenses, profits, and statistics
- **Visa Analytics**: Detailed breakdown of all visas
- **Profit Analysis**: Company profit per visa
- **Monthly/Yearly Reports**: Performance over time

## 🔒 Security Features

- **Input Validation**: All inputs are validated
- **Error Handling**: Comprehensive error handling
- **CORS Configuration**: Proper CORS setup for production
- **Environment Variables**: Secure configuration management

## 📊 Data Export

- **Excel Reports**: Export visa data to Excel
- **Company Reports**: Comprehensive financial reports
- **Custom Formatting**: Arabic-friendly Excel formatting

## 🌍 Internationalization

- **Arabic Language**: Full Arabic interface
- **RTL Layout**: Right-to-left text direction
- **Arabic Numbers**: Proper number formatting
- **Arabic Dates**: Hijri date support

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development servers
npm run build        # Build for production
npm run start        # Start production server
npm run install-all  # Install all dependencies
```

### Adding New Features

1. **Backend**: Add routes in `server/routes/`
2. **Frontend**: Add pages in `client/src/pages/`
3. **Database**: Add models in `server/models/`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check the [troubleshooting guide](./DEPLOYMENT_GUIDE.md#troubleshooting)
2. Review the logs in Railway dashboard
3. Check MongoDB Atlas connection
4. Verify environment variables

## 🎯 Roadmap

- [ ] User authentication and authorization
- [ ] Email notifications
- [ ] Mobile app
- [ ] Advanced reporting
- [ ] Multi-language support
- [ ] API documentation with Swagger

---

**Built with ❤️ for the Arabic business community** 