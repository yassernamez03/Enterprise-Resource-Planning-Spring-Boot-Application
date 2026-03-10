# Enterprise-Resource-Planning-Spring-Boot-Application

A modular Enterprise Resource Planning (ERP) system built with Spring Boot and React to manage business operations like inventory, HR, sales, and finance.

##  Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- Java JDK (for backend)
- Maven (for backend)

### Frontend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yassernamez03/Enterprise-Resource-Planning-Spring-Boot-Application.git
   cd Enterprise-Resource-Planning-Spring-Boot-Application
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   ```
   
   Then edit `.env` and fill in your configuration values. See [ENV_SETUP.md](./ENV_SETUP.md) for detailed instructions.

4. **Generate SSL certificates for local development**
   
   See [ENV_SETUP.md](./ENV_SETUP.md) for detailed certificate generation instructions.

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The application will be available at `https://localhost:3000`

### Backend Setup

Please refer to the backend documentation for Spring Boot setup instructions.

## 🔒 Security & Configuration

**IMPORTANT**: Before running the application, you must configure environment variables:

1. Review [ENV_SETUP.md](./ENV_SETUP.md) for complete setup instructions
2. Never commit `.env` files or SSL certificates to version control
3. Use different credentials for development, staging, and production environments

### Required Environment Variables

- `VITE_BACKEND_URL` - Backend API URL
- `VITE_API_URL` - API URL for services
- `VITE_RECAPTCHA_SITE_KEY` - Google reCAPTCHA v2 site key

See [ENV_SETUP.md](./ENV_SETUP.md) for details on obtaining and configuring these values.

## 📁 Project Structure

```
├── src/
│   ├── Components/     # React components
│   ├── context/        # React context providers
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components
│   ├── services/       # API services
│   ├── Router/         # Route configurations
│   └── utils/          # Utility functions
├── public/             # Static assets
├── cert/              # SSL certificates (not in version control)
├── .env.example       # Example environment variables
└── ENV_SETUP.md       # Environment setup documentation
```

## 🚀 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## 🛡️ Features

- **Account Management** - User account creation and management
- **Calendar** - Event scheduling and management
- **Chat** - Real-time messaging system
- **Employee Management** - HR and employee tracking
- **Sales Module** - Sales tracking and invoicing
- **Security Dashboard** - Security monitoring and alerts
- **Task Management** - Project and task tracking

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please ensure you:

1. Never commit sensitive information (API keys, passwords, certificates)
2. Follow the existing code style
3. Update documentation as needed
4. Test your changes thoroughly

## ⚠️ Important Notes

- **DO NOT** commit `.env` files to version control
- **DO NOT** commit SSL certificates or private keys
- **DO NOT** hardcode API keys or secrets in source code
- Always use environment variables for configuration
- Review [ENV_SETUP.md](./ENV_SETUP.md) before contributing
