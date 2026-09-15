# NextApp Auto Parts CRM

A comprehensive auto parts dealer management system with CRM functionality and mobile app support.

For an overview of the project structure, see [docs/architecture.md](docs/architecture.md).

## 🚀 Features

### Frontend (React + TypeScript)
- **Role-based Dashboard** - Different interfaces for Super Admin, Admin, Manager, Storeman, Salesman, and Retailer
- **Company Management** - Multi-company support with logo uploads
- **Store Management** - Branch locations with detailed information and photos
- **User Management** - Complete user lifecycle with profile pictures and role assignments
- **Retailer Management** - Comprehensive retailer database with image support
- **Parts Inventory** - Advanced parts catalog with stock management and images
- **Order Management** - Full order lifecycle from creation to delivery
- **Reports & Analytics** - Export to Excel, PDF, and Word formats
- **Responsive Design** - Works on desktop, tablet, and mobile devices

### Backend (Node.js + Express + MySQL)
- **RESTful API** - Complete API for all CRM operations
- **JWT Authentication** - Secure token-based authentication
- **Role-based Authorization** - Granular permissions system
- **MySQL Database** - Robust relational database with proper indexing
- **File Upload Support** - Handle images and documents
- **API Rate Limiting** - Prevent abuse and ensure stability
- **Comprehensive Logging** - Track all system activities
- **Mobile App Ready** - APIs designed for mobile consumption

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **React Router** for navigation
- **Axios** for API communication
- **Date-fns** for date handling
- **Export utilities** (XLSX, jsPDF, DOCX)

### Backend
- **Node.js** with Express.js
- **MySQL 2** for database operations
- **JWT** for authentication
- **Bcrypt** for password hashing
- **Multer** for file uploads
- **Helmet** for security headers
- **CORS** for cross-origin requests
- **Rate limiting** for API protection

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- MySQL 8.0+
- npm or yarn

### Database Setup
1. Create MySQL database:
```sql
CREATE DATABASE nextapp_crm;
```

2. Run the database schema:
```bash
mysql -u root -p nextapp_crm < server/config/database-schema.sql
```

### Backend Setup
1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Configure your `.env` file:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=nextapp_crm
DB_PORT=3306
JWT_SECRET=your-super-secret-jwt-key-here
PORT=3001
NODE_ENV=development
```

4. Run database migrations (this will also insert sample data):
```bash
cd server && npm run migrate
```

5. Start the backend server:
```bash
npm run server
```

### Frontend Setup
1. Start the development server:
```bash
npm run dev
```

2. Or run both frontend and backend:
```bash
npm run dev:full
```

## 🔐 Default Login Credentials

- **Super Admin**: admin@nextapp.com / password
- **Admin**: admin@company1.com / password  
- **Manager**: manager@store1.com / password
- **Retailer**: retailer@downtownauto.com / password

## 📱 Mobile App API

The backend provides comprehensive APIs for mobile app development:

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/refresh` - Refresh token

### Core Endpoints
- `GET /api/parts` - Get parts catalog
- `GET /api/orders` - Get orders
- `POST /api/orders` - Create new order
- `GET /api/retailers` - Get retailers
- `PATCH /api/orders/:id/status` - Update order status

### API Features
- **JWT Authentication** - Secure token-based auth
- **Role-based Access** - Different permissions per role
- **Pagination** - Efficient data loading
- **Filtering & Search** - Advanced query capabilities
- **File Upload** - Support for images and documents
- **Rate Limiting** - API protection
- **Error Handling** - Consistent error responses

## 🏗️ Database Schema

### Key Tables
- **companies** - Company information and branding
- **stores** - Branch/store locations
- **users** - System users with role-based access
- **retailers** - Customer/retailer database
- **parts** - Parts inventory and catalog
- **order_master** - Order headers
- **order_items** - Order line items
- **regions** - Geographical regions
- **audit_logs** - System activity tracking

### Features
- **Foreign Key Constraints** - Data integrity
- **Indexes** - Optimized query performance
- **Timestamps** - Automatic created/updated tracking
- **JSON Fields** - Flexible data storage
- **Audit Trail** - Complete activity logging

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - Bcrypt with salt rounds
- **Role-based Authorization** - Granular permissions
- **Rate Limiting** - API abuse prevention
- **CORS Protection** - Cross-origin security
- **Helmet Security** - HTTP security headers
- **Input Validation** - Joi schema validation
- **SQL Injection Prevention** - Parameterized queries

## 📊 Role Permissions

### Super Admin
- Full system access
- Manage all companies, stores, users
- System configuration and reports

### Admin  
- Company-level access
- Manage stores and users within company
- Company reports and analytics

### Manager
- Store-level access
- Manage store operations and staff
- Store reports and inventory

### Storeman
- Inventory management
- Order processing and fulfillment
- Stock level updates

### Salesman
- Order creation and management
- Customer/retailer interaction
- Sales reporting

### Retailer
- Place and track orders
- View product catalog
- Account management

## 🚀 Deployment

### Production Setup
1. Set `NODE_ENV=production` in `.env`
2. Configure production database
3. Set secure JWT secret
4. Configure CORS for production domains
5. Set up SSL/HTTPS
6. Configure file upload limits
7. Set up monitoring and logging

### Recommended Stack
- **Database**: MySQL 8.0+ with replication
- **Server**: Node.js with PM2 process manager
- **Reverse Proxy**: Nginx
- **SSL**: Let's Encrypt
- **Monitoring**: PM2 monitoring + custom logging

## 📝 API Documentation

The API follows RESTful conventions with consistent response formats:

### Success Response
```json
{
  "data": {...},
  "message": "Success message",
  "pagination": {...}
}
```

### Error Response  
```json
{
  "error": "Error message",
  "details": ["Validation errors..."]
}
```

### Authentication
Include JWT token in Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is proprietary software for NextApp Inc.

## 🆘 Support

For support and questions:
- Email: support@nextapp.com
- Documentation: [API Docs](http://localhost:3001/api/health)
- API Reference: [docs/api-endpoints.md](docs/api-endpoints.md)
- Issues: Create GitHub issue

---

**NextApp Auto Parts CRM** - Streamlining auto parts distribution with modern technology.