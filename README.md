# Enterprise Resource Planning System

A full-stack Enterprise Resource Planning (ERP) system built with **Spring Boot** (backend) and **React** (frontend) to streamline business operations including HR, sales, inventory, finance, and security management.

## 🎯 Overview

This ERP system provides a comprehensive solution for managing enterprise operations with a modern, secure, and scalable architecture. Built for Union Concept, it features real-time collaboration, task management, calendar scheduling, sales tracking, and security monitoring.

## ✨ Key Features

### 👥 Account & User Management
- User registration and authentication with reCAPTCHA protection
- Role-based access control (Admin, Employee, Security)
- Password reset with email verification
- Profile management and account settings
- Admin dashboard for user management

### 📅 Calendar & Scheduling
- Interactive calendar with event management
- Create, edit, and delete events
- Mini calendar view with upcoming events
- Event notifications and reminders
- Multi-user scheduling support

### 💬 Real-Time Chat System
- Instant messaging between users
- Conversation management and search
- Message replies and threading
- Date separators for better organization
- Filter conversations by status

### 📊 Task Management
- Create and assign tasks to employees
- Track task status and progress
- Task detail view with full information
- All tasks overview dashboard
- Deadline management and notifications

### 💼 Employee Management
- Employee profile creation and editing
- Task assignment and tracking
- Employee performance monitoring
- Department and role management

### 💰 Sales Module
- Sales order management
- Quote generation and tracking
- Invoice creation and email delivery
- Product sales reports
- Sales summary analytics
- Customer management

### 🔒 Security Dashboard
- Security incident monitoring
- Alert management system
- Log tracking and analysis
- Access control monitoring
- Security metrics and reports

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI framework
- **React Router** - Navigation and routing
- **Axios** - HTTP client for API calls
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **WebSocket** - Real-time communication
- **Google reCAPTCHA v2** - Bot protection
- **jsPDF** - PDF generation for invoices
- **FullCalendar** - Calendar interface

### Backend
- **Spring Boot** - Java application framework
- **Spring Security** - Authentication and authorization
- **Spring Data JPA** - Database access
- **WebSocket** - Real-time messaging
- **Maven** - Build and dependency management
- **PostgreSQL/MySQL** - Database (configurable)

### Security & Infrastructure
- **HTTPS/SSL** - Secure communication
- **JWT** - Token-based authentication
- **CORS** - Cross-origin resource sharing
- **Environment Variables** - Secure configuration

## 📁 Project Structure

```
├── frontend/                    # React application
│   ├── src/
│   │   ├── Components/         # Reusable UI components
│   │   │   ├── Account/       # Account management
│   │   │   ├── Calendar/      # Calendar components
│   │   │   ├── Chat/          # Chat interface
│   │   │   ├── Common/        # Shared components
│   │   │   ├── Employes/      # Employee management
│   │   │   ├── Sales/         # Sales module
│   │   │   ├── Security/      # Security features
│   │   │   └── UI/            # UI elements
│   │   ├── context/           # React Context providers
│   │   ├── hooks/             # Custom React hooks
│   │   ├── pages/             # Page components
│   │   ├── Router/            # Route configuration
│   │   ├── services/          # API service layer
│   │   ├── styles/            # CSS stylesheets
│   │   └── utils/             # Utility functions
│   ├── public/                # Static assets
│   └── cert/                  # SSL certificates (local dev)
│
└── backend/                    # Spring Boot application
    └── src/main/java/         # Java source code
        ├── controllers/       # REST API endpoints
        ├── models/           # Data models
        ├── repositories/     # Data access layer
        ├── services/         # Business logic
        ├── security/         # Security configuration
        └── config/           # Application configuration

```

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v16 or higher)
- **Java JDK** (11 or higher)
- **Maven** (3.6 or higher)
- **PostgreSQL** or **MySQL** database
- **Git**

### Frontend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yassernamez03/Enterprise-Resource-Planning-Spring-Boot-Application.git
   cd Enterprise-Resource-Planning-Spring-Boot-Application
   ```

2. **Switch to frontend branch**
   ```bash
   git checkout frontend
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_BACKEND_URL=https://localhost:8443/api
   VITE_API_URL=https://localhost:8443/api
   VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
   ```

5. **Generate SSL certificates for local development**
   ```bash
   # Install mkcert (one-time setup)
   choco install mkcert  # Windows
   brew install mkcert   # macOS
   
   # Generate certificates
   mkcert -install
   mkdir cert
   cd cert
   mkcert localhost 127.0.0.1 ::1
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```
   Access at: `https://localhost:3000`

### Backend Setup

1. **Switch to backend branch**
   ```bash
   git checkout backend
   ```

2. **Configure application properties**
   
   Edit `src/main/resources/application.properties`:
   ```properties
   spring.datasource.url=jdbc:postgresql://localhost:5432/erp_db
   spring.datasource.username=your_username
   spring.datasource.password=your_password
   server.port=8443
   ```

3. **Build the application**
   ```bash
   mvn clean install
   ```

4. **Run the application**
   ```bash
   mvn spring-boot:run
   ```
   API available at: `https://localhost:8443/api`

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/verify-reset` - Verify reset code

### User Management
- `GET /api/users` - Get all users (Admin)
- `GET /api/users/{id}` - Get user by ID
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user (Admin)

### Task Management
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task

### Sales
- `GET /api/sales/orders` - Get sales orders
- `POST /api/sales/orders` - Create order
- `GET /api/sales/invoices` - Get invoices
- `POST /api/sales/invoices` - Generate invoice
- `GET /api/sales/reports` - Get sales reports

### Calendar
- `GET /api/calendar/events` - Get all events
- `POST /api/calendar/events` - Create event
- `PUT /api/calendar/events/{id}` - Update event
- `DELETE /api/calendar/events/{id}` - Delete event

## 🔐 Security Features

- **Authentication**: JWT-based authentication with refresh tokens
- **Authorization**: Role-based access control (RBAC)
- **Encryption**: HTTPS/SSL for all communications
- **reCAPTCHA**: Bot protection on login and registration
- **Password Security**: Bcrypt hashing for passwords
- **CORS**: Configured for secure cross-origin requests
- **Session Management**: Secure session handling
- **Input Validation**: Server-side validation for all inputs

## 🎨 User Interface

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Mode**: User preference support (coming soon)
- **Intuitive Navigation**: Easy-to-use interface
- **Real-time Updates**: Live data refresh via WebSocket
- **Loading States**: Clear feedback for all operations
- **Error Handling**: User-friendly error messages
- **Toast Notifications**: Success and error notifications

## 📊 Database Schema

The application uses a relational database with the following main entities:

- **Users**: User accounts and authentication
- **Roles**: User roles and permissions
- **Tasks**: Task management and assignments
- **Events**: Calendar events and schedules
- **Messages**: Chat messages and conversations
- **Employees**: Employee information
- **Sales Orders**: Sales transactions
- **Invoices**: Invoice records
- **Products**: Product catalog
- **Security Logs**: Security and audit logs

## 🧪 Testing

```bash
# Frontend tests
npm run test

# Backend tests
mvn test
```

## 📦 Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy dist/ folder
```

### Backend (Heroku/AWS/Azure)
```bash
mvn clean package
# Deploy target/*.jar
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

**Important**: Never commit sensitive information (API keys, passwords, certificates)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Yasser Namez**
- GitHub: [@yassernamez03](https://github.com/yassernamez03)

## 🙏 Acknowledgments

- Built for Union Concept
- Spring Boot and React communities
- Open source contributors

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team

---

**Note**: This is a modular ERP system. Different branches contain different parts of the application:
- `main` - Documentation and project overview
- `frontend` - React application
- `backend` - Spring Boot API server

Make sure to check out the appropriate branch for the code you need.
