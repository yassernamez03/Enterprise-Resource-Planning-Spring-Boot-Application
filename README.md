# SecureOps Enterprise Resource Planning - Backend API

> **Branch: `backend`** | **Version:** 0.0.1-SNAPSHOT | **Spring Boot:** 3.4.5 | **Java:** 21

A production-ready, enterprise-grade RESTful API backend for a comprehensive ERP system. Built with Spring Boot 3.x, this backend provides robust security, real-time communication, and comprehensive business operation management capabilities.

---

## 🎯 Overview

The **SecureOps Backend** is the core API layer of a full-featured Enterprise Resource Planning system designed for modern business operations. It implements industry-standard security practices, real-time messaging infrastructure, and a modular architecture to support sales, HR, task management, and organizational workflows.

### Key Highlights

- **Secure by Design**: JWT authentication, role-based access control (RBAC), and comprehensive audit logging
- **Real-Time Communication**: WebSocket-based chat system with typing indicators and file sharing
- **Modular Architecture**: Clean separation of concerns with dedicated modules for HR, Sales, and core operations
- **Production-Ready**: SSL/TLS support, extensive logging, error handling, and monitoring capabilities
- **Scalable Design**: Stateless authentication, efficient database queries, and optimized for horizontal scaling

---

## ✨ Core Features

### Authentication & Security
- **JWT Token-based Authentication** with configurable expiration
- **Role-Based Access Control (RBAC)** for granular permissions
- **Password Reset Flow** with secure token generation and email verification
- **Google reCAPTCHA Integration** for bot prevention
- **Security Audit Logging** with detailed event tracking
- **Failed Login Attempt Monitoring** with configurable lockout policies
- **SSL/TLS Support** for encrypted communications

### Real-Time Messaging
- **WebSocket Communication** for instant message delivery
- **Chat Management** with archive and search capabilities
- **File Sharing** with secure upload/download endpoints
- **Typing Indicators** for enhanced user experience
- **Message Threading** and conversation history
- **Real-Time Notifications** for system events

### Task & Event Management
- **Task Creation and Assignment** with priority levels
- **Event Scheduling** and calendar integration
- **Status Tracking** and progress monitoring
- **User Activity Logging** for accountability
- **Deadline Management** with automated reminders

### Security Monitoring & Alerts
- **Real-Time Threat Detection** from application logs
- **Security Incident Tracking** with severity classification
- **Automated Alert Generation** for suspicious activities
- **Attack Pattern Recognition** (SQL injection, XSS, brute force)
- **IP-Based Threat Analysis** and blocking capabilities
- **Comprehensive Security Dashboard** metrics

### User Management
- **User Registration & Profile Management**
- **Email Verification Workflow**
- **Password Change & Reset Functionality**
- **User Role Management** (Admin, User, HR, Sales)
- **Account Activation/Deactivation**
- **Profile Picture Upload** and management

### Logging & Monitoring
- **Structured Logging** with Logback
- **Separate Log Streams** (application, security, error)
- **Log Rotation** with configurable retention policies
- **Admin Log Viewer** with filtering and search
- **Security Event Log** for audit compliance
- **Performance Metrics** via Spring Actuator

---

## 🏗️ Technology Stack

### Core Framework
- **Spring Boot** 3.4.5
- **Spring Security** 6.x - Authentication & authorization
- **Spring Data JPA** - ORM and database abstraction
- **Spring WebSocket** - Real-time bidirectional communication
- **Spring Mail** - Email notifications
- **Spring Actuator** - Monitoring and health checks

### Database & Persistence
- **PostgreSQL** - Primary relational database
- **Hibernate ORM** - JPA implementation
- **HikariCP** - High-performance connection pooling

### Security & Authentication
- **JJWT** 0.11.5 - JSON Web Token implementation
- **BCrypt** - Password hashing
- **Google reCAPTCHA** - Bot prevention

### Utilities & Tools
- **Lombok** 1.18.30 - Boilerplate code reduction
- **MapStruct** 1.5.5 - DTO mapping
- **Logback** - Logging framework
- **Maven** - Build automation and dependency management

---

## 📋 Prerequisites

Before setting up the backend, ensure you have the following installed:

| Requirement | Version | Notes |
|-------------|---------|-------|
| **Java JDK** | 21+ | OpenJDK or Oracle JDK |
| **PostgreSQL** | 12+ | Database server |
| **Maven** | 3.6+ | Build tool (or use included wrapper) |
| **SSL Certificate** | - | Required for production (optional for dev) |

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/yassernamez03/Enterprise-Resource-Planning-Spring-Boot-Application.git

# Navigate to the project directory
cd Enterprise-Resource-Planning-Spring-Boot-Application

# Checkout the backend branch
git checkout backend
```

### 2. Database Configuration

Create a PostgreSQL database and user:

```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create database
CREATE DATABASE secureops_db;

-- Create user (optional - for better security)
CREATE USER secureops_user WITH ENCRYPTED PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE secureops_db TO secureops_user;

### 4. SSL Certificate Setup

#### Development Environment (Self-Signed Certificate)

```bash
keytool -genkeypair \
  -alias localhost \
  -keyalg RSA \
  -keysize 2048 \
  -storetype PKCS12 \
  -keystore src/main/resources/keystore.p12 \
  -validity 3650 \
  -storepass your-keystore-password
```

#### Production Environment

Use a valid SSL certificate from a Certificate Authority (Let's Encrypt, DigiCert, etc.)

⚠️ **Security Warning**: The `keystore.p12` file is excluded from version control. Never commit certificates to Git.

### 5. Build the Application
---

## ⚙️ Configuration

### Application Profiles

The backend supports environment-specific configurations:

| Profile | Purpose | Configuration File |
|---------|---------|-------------------|
| `dev` | Development | `application-dev.properties` |
| `prod` | Production | `application-prod.properties` |
| `default` | Base config | `application.properties` |

**Activate a profile:**

```bash
# Via environment variable
export SPRING_PROFILES_ACTIVE=prod
./mvnw spring-boot:run

# Via command line argument
./mvnw spring-boot:run -Dspring-boot.run.profiles=prod

# Via JAR execution
java -jar -Dspring.profiles.active=prod target/secureops-0.0.1-SNAPSHOT.jar
```

### Key Configuration Properties

```properties
# Server Configuration
server.port=8443
server.ssl.enabled=true

# Database Connection Pool
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=5

# JPA Settings
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false

# Logging Levels
logging.level.com.secureops=DEBUG
logging.level.org.springframework.security=INFO

# File Upload
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB

# Security
app.security.max-login-attempts=5
app.security.lockout-duration-minutes=15
```
### 6. Run the Application

```bash
# Development mode (with auto-reload)
./mvnw spring-boot:run

# Or run with specific profile
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
---

## 📁 Project Structure

```
secureops-backend/
├── src/
│   ├── main/
│   │   ├── java/com/secureops/
│   │   │   ├── SecureOpsApplication.java          # Main application entry point
│   │   │   ├── config/                            # Configuration classes
│   │   │   │   ├── SecurityConfig.java            # Spring Security configuration
│   │   │   │   ├── JwtTokenProvider.java          # JWT token generation/validation
│   │   │   │   ├── JwtAuthenticationFilter.java   # JWT filter for requests
│   │   │   │   ├── WebSocketConfig.java           # WebSocket configuration
│   │   │   │   ├── MailConfig.java                # Email configuration
│   │   │   │   ├── RecaptchaConfig.java           # reCAPTCHA setup
│   │   │   │   └── ...                            # Other configs
│   │   │   ├── controller/                        # REST API endpoints
│   │   │   │   ├── AuthController.java            # Authentication endpoints
│   │   │   │   ├── UserController.java            # User management
│   │   │   │   ├── ChatController.java            # Chat operations
│   │   │   │   ├── MessageController.java         # Messaging
│   │   │   │   ├── TaskEventController.java       # Task management
│   │   │   │   ├── AlertsController.java          # Security alerts
│   │   │   │   ├── FileController.java            # File upload/download
│   │   │   │   ├── LogAdminController.java        # Admin log access
│   │   │   │   └── LogSecurityController.java     # Security logs
│   │   │   ├── dto/                               # Data Transfer Objects
│   │   │   │   ├── JwtAuthResponse.java
│   │   │   │   ├── LoginDto.java
│   │   │   │   ├── UserRegistrationDto.java
│   │   │   │   ├── MessageDto.java
│   │   │   │   ├── TaskEventDto.java
│   │   │   │   └── ...
│   │   │   ├── entity/                            # JPA entities
│   │   │   │   ├── User.java                      # User entity
│   │   │   │   ├── Chat.java                      # Chat entity
│   │   │   │   ├── Message.java                   # Message base class
│   │   │   │   ├── TextMessage.java               # Text message type
│   │   │   │   ├── FileMessage.java               # File message type
│   │   │   │   ├── TaskEvent.java                 # Task/Event entity
│   │   │   │   └── Log.java                       # Audit log entity
│   │   │   ├── repository/                        # Data access layer
│   │   │   │   ├── UserRepository.java
│   │   │   │   ├── ChatRepository.java
│   │   │   │   ├── MessageRepository.java
│   │   │   │   ├── TaskEventRepository.java
│   │   │   │   └── LogRepository.java
│   │   │   ├── service/                           # Business logic layer
│   │   │   │   ├── AuthService.java               # Authentication logic
│   │   │   │   ├── UserService.java               # User operations
│   │   │   │   ├── ChatService.java               # Chat management
---

## 📡 API Reference

### Base URL
```
https://localhost:8443/api
```

### Authentication Endpoints

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| `POST` | `/auth/register` | User registration with email verification | None |
| `POST` | `/auth/login` | User login (returns JWT token) | None |
| `POST` | `/auth/verify-email` | Verify email with code | None |
| `POST` | `/auth/request-password-reset` | Request password reset email | None |
| `POST` | `/auth/reset-password` | Reset password with token | None |
| `POST` | `/auth/resend-verification` | Resend verification email | None |

**Example Login Request:**
```json
POST /api/auth/login
{
  "emailOrUsername": "user@example.com",
  "password": "SecurePass123!",
  "recaptchaResponse": "03AGdBq..."
}
```

**Example Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 86400000
}
```
---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
./mvnw test

# Run with coverage
./mvnw test jacoco:report

# Run specific test class
./mvnw test -Dtest=UserServiceTest

# Run integration tests only
./mvnw verify -P integration-tests
```

### Test Structure

- **Unit Tests**: Service and utility layer tests
- **Integration Tests**: Repository and API endpoint tests
- **Security Tests**: Authentication and authorization tests

---

## 📊 Monitoring & Observability

### Spring Actuator Endpoints

| Endpoint | Description |
|----------|-------------|
| `/actuator/health` | Application health status |
| `/actuator/info` | Application information |
| `/actuator/metrics` | Application metrics |
| `/actuator/loggers` | Logging configuration |

### Logging

Three separate log files are maintained:

- **`logs/application.log`** - General application logs
- **`logs/error.log`** - Error and exception logs
- **`logs/security.log`** - Security-related events

**Log rotation** is configured in `logback-spring.xml`:
- Daily rotation
- Maximum 30 days retention
- Size-based rotation (100MB per file)

---

## 🚢 Deployment

### Production Deployment Checklist

- [ ] Set `spring.profiles.active=prod`
- [ ] Configure production database
- [ ] Use valid SSL certificate
- [ ] Set strong environment variables
- [ ] Configure reverse proxy (Nginx/Apache)
- [ ] Enable firewall rules
- [ ] Set up database backups
- [ ] Configure log aggregation
- [ ] Enable monitoring and alerts
- [ ] Review security headers
- [ ] Set up CI/CD pipeline

### Docker Deployment (Optional)

```dockerfile
# Example Dockerfile
FROM openjdk:21-jdk-slim
WORKDIR /app
COPY target/secureops-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8443
ENTRYPOINT ["java", "-jar", "app.jar"]
```

```bash
# Build and run
docker build -t secureops-backend .
docker run -p 8443:8443 --env-file .env.properties secureops-backend
```

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork** the repository
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Contribution Guidelines

- Follow Java coding conventions
- Write unit tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting
- Never commit sensitive information (secrets, keys, passwords)

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/yassernamez03/Enterprise-Resource-Planning-Spring-Boot-Application/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yassernamez03/Enterprise-Resource-Planning-Spring-Boot-Application/discussions)
- **Security**: For security vulnerabilities, please see [SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md)

---

## 🙏 Acknowledgments

- Spring Boot team for the excellent framework
- PostgreSQL community for the robust database
- All contributors who have helped improve this project

---

## 📚 Additional Resources

- [Spring Boot Documentation](https://docs.spring.io/spring-boot/docs/current/reference/html/)
- [Spring Security Reference](https://docs.spring.io/spring-security/reference/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

**Built with ❤️ using Spring Boot**

| Method | Endpoint | Description | Authorization |
|--------|----------|-------------|---------------|
| `GET` | `/chats` | Get user's chats | User |
| `POST` | `/chats` | Create new chat | User |
| `GET` | `/chats/{id}` | Get chat details | User |
| `PUT` | `/chats/{id}/archive` | Archive chat | User |
| `GET` | `/messages` | Get messages (paginated) | User |
| `POST` | `/messages/text` | Send text message | User |
| `POST` | `/messages/file` | Send file message | User |
| `DELETE` | `/messages/{id}` | Delete message | User |

**WebSocket Endpoint:**
```
wss://localhost:8443/ws
```

**Topics:**
- `/topic/chat/{chatId}` - Chat messages
- `/topic/typing/{chatId}` - Typing indicators
- `/user/queue/notifications` - Personal notifications

### Task & Event Management

| Method | Endpoint | Description | Authorization |
|--------|----------|-------------|---------------|
| `GET` | `/tasks` | Get tasks (paginated) | User |
| `POST` | `/tasks` | Create task | User |
| `GET` | `/tasks/{id}` | Get task details | User |
| `PUT` | `/tasks/{id}` | Update task | User |
| `DELETE` | `/tasks/{id}` | Delete task | User |
| `PUT` | `/tasks/{id}/status` | Update task status | User |

### Security & Alerts

| Method | Endpoint | Description | Authorization |
|--------|----------|-------------|---------------|
| `GET` | `/alerts` | Get security alerts | Admin |
| `GET` | `/alerts/summary` | Get alert summary | Admin |
| `PUT` | `/alerts/{id}/status` | Update alert status | Admin |

### Logging & Monitoring

| Method | Endpoint | Description | Authorization |
|--------|----------|-------------|---------------|
| `GET` | `/logs/admin` | View application logs | Admin |
| `GET` | `/logs/security` | View security logs | Admin |
| `GET` | `/actuator/health` | Application health status | Public |
| `GET` | `/actuator/info` | Application information | Public |

### File Management

| Method | Endpoint | Description | Authorization |
|--------|----------|-------------|---------------|
| `POST` | `/files/upload` | Upload file | User |
| `GET` | `/files/{filename}` | Download file | User |
| `DELETE` | `/files/{filename}` | Delete file | User/Admin |

---

## 🔐 Security Features

### Authentication Flow

1. **User Registration** → Email verification → Account activation
2. **Login** → JWT token generation → Token-based access
3. **Password Reset** → Email token → Secure password update

### Security Measures

| Feature | Implementation |
|---------|----------------|
| **Password Hashing** | BCrypt with configurable strength |
| **JWT Tokens** | HS256 algorithm, configurable expiration |
| **CSRF Protection** | Enabled for state-changing operations |
| **CORS** | Configured for trusted origins |
| **SQL Injection Prevention** | JPA parameterized queries |
| **XSS Protection** | Input validation and output encoding |
| **Rate Limiting** | Login attempt throttling |
| **Session Management** | Stateless JWT-based sessions |
| **Audit Logging** | All security events logged |

### Security Best Practices

⚠️ **Before deploying to production:**

1. ✅ Generate a strong JWT secret (256+ bits)
2. ✅ Use valid SSL certificates (not self-signed)
3. ✅ Change all default passwords
4. ✅ Configure firewall rules (allow only 443, 8443)
5. ✅ Enable database connection pooling
6. ✅ Set up automated backups
7. ✅ Review and configure CORS settings
8. ✅ Implement rate limiting at reverse proxy
9. ✅ Configure log rotation and archiving
10. ✅ Enable Spring Actuator security
11. ✅ Set up monitoring and alerting
12. ✅ Review all environment variablesg secret)
JWT_SECRET=your-256-bit-secret-key-here
JWT_EXPIRATION=86400000

# Email Configuration (SMTP)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@example.com
MAIL_PASSWORD=your-app-specific-password

# Admin User (Will be created on first startup)
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=StrongAdm!nP@ssw0rd

# Google reCAPTCHA
RECAPTCHA_SECRET=your-recaptcha-secret-key

# SSL Configuration
SSL_KEY_STORE_PASSWORD=your-keystore-password
```

**💡 Tips:**
- Generate a secure JWT secret: `openssl rand -base64 64`
- For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833)
- Get reCAPTCHA keys from [Google reCAPTCHA Console](https://www.google.com/recaptcha/admin)

### 4. SSL Certificate (Optional for Development)

For development, you can generate a self-signed certificate:

```bash
keytool -genkeypair -alias localhost -keyalg RSA -keysize 2048 -storetype PKCS12 -keystore src/main/resources/keystore.p12 -validity 3650
```

⚠️ **Important**: Never commit the `keystore.p12` file to version control. It's already in `.gitignore`.

### 5. Build and Run

```bash
# Build the project
./mvnw clean install

# Run the application
./mvnw spring-boot:run
```

The application will start on `https://localhost:8443`

## Configuration Profiles

The application supports multiple profiles:

- `dev` - Development environment
- `prod` - Production environment

Set the active profile in `application.properties` or via environment variable:

```bash
SPRING_PROFILES_ACTIVE=prod
```

## Security Considerations

⚠️ **Before deploying to production:**

1. Generate strong JWT secret (256+ bits)
2. Use proper SSL certificates (not self-signed)
3. Change all default passwords
4. Configure firewall rules
5. Enable database connection pooling
6. Set up proper backup procedures
7. Review and configure CORS settings
8. Enable rate limiting
9. Configure proper logging rotation

## Project Structure

```
src/
├── main/
│   ├── java/com/secureops/
│   │   ├── config/          # Security, JWT, WebSocket configs
│   │   ├── controller/      # REST API endpoints
│   │   ├── dto/             # Data Transfer Objects
│   │   ├── entity/          # JPA entities
│   │   ├── repository/      # Database repositories
│   │   ├── service/         # Business logic
│   │   └── util/            # Utility classes
│   └── resources/
│       ├── application.properties
│       └── logback-spring.xml
```

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/reset-password` - Password reset

### User Management

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/change-password` - Change password

### Chat & Messaging

- WebSocket endpoint: `wss://localhost:8443/ws`
- `GET /api/messages` - Get messages
- `POST /api/messages` - Send message

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

[Specify your license here]

## Support

For issues and questions, please create an issue in the GitHub repository.
