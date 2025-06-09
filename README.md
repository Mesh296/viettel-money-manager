# Personal Finance Management Application

## Overview
This is a full-stack web application designed for personal finance management, allowing users to track transactions, set budgets, receive alerts, and visualize financial data through charts. The application is built with a React frontend and a Node.js/Express backend, using PostgreSQL for data storage and Redis for caching.

## Features
- **User Authentication**: Secure user registration and login with JWT-based authentication
- **Transaction Management**: Create, edit, delete, and filter transactions (income/expense)
- **Budget Tracking**: Set monthly and category-specific budgets
- **Alerts System**: Receive notifications for budget thresholds (90% and 100% of monthly budget, category limits)
- **Financial Insights**: Visualize spending trends through:
  - Monthly income vs. expense charts
  - Category spending breakdown (pie chart)
  - Category trend analysis (line chart)
- **Transaction Filtering**: Advanced filtering by date, category, type, amount, and keywords
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Chatbot Integration**: AI-powered assistant for financial queries (server-side)
- **Caching**: Redis-based caching for improved performance

## Tech Stack
- **Frontend**:
  - React
  - Vite
  - Tailwind CSS
  - Chart.js for visualizations
  - React Router for navigation
  - Axios for API requests
- **Backend**:
  - Node.js with Express
  - Sequelize ORM for PostgreSQL
  - Redis for caching
  - JWT for authentication
- **Database**:
  - PostgreSQL
- **Tools**:
  - Postman for API Testing

## Project Structure
```
├── client/                     # Frontend code
│   ├── src/
│   │   ├── components/        # Reusable React components
│   │   ├── context/           # React context for authentication
│   │   ├── pages/             # Page components (Dashboard, Transactions, etc.)
│   │   ├── services/          # API service functions
│   │   ├── utils/             # Utility functions (auth, axios config)
│   │   ├── assets/            # Static assets (images, etc.)
│   │   └── App.jsx            # Main app component
│   ├── public/                # Public assets
│   ├── eslint.config.js       # ESLint configuration
│   ├── tailwind.config.js     # Tailwind CSS configuration
│   └── vite.config.js         # Vite configuration
├── server/                    # Backend code
│   ├── src/
│   │   ├── controllers/       # Request handlers
│   │   ├── middlewares/       # Authentication and caching middleware
│   │   ├── models/            # Sequelize models
│   │   ├── routes/            # Express routes
│   │   ├── services/          # Business logic
│   │   ├── providers/         # Database and Redis connections
│   │   └── utils/             # Utility functions
│   ├── config/                # Database configuration
│   ├── migrations/            # Database migrations
│   └── seeds/                 # Database seed data
├── README.md                  # Project documentation
└── package.json               # Project dependencies and scripts
```

## Prerequisites
- Node.js (v16 or higher)
- PostgreSQL
- Redis
- Git

## Installation
1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd <repository-name>
   ```

2. **Install dependencies**:
   - For the frontend:
     ```bash
     cd client
     npm install
     ```
   - For the backend:
     ```bash
     cd server
     npm install
     ```

3. **Set up environment variables**:
   - Create a `.env` file in the `server` directory with the following:
     ```env
     NODE_ENV=development
     DB_HOST=127.0.0.1
     DB_USER=root
     DB_PASSWORD=
     DB_NAME=database_development
     JWT_SECRET=your_jwt_secret
     REDIS_URL=redis://localhost:6379
     ```
   - Update `client/src/services/config.js` if the API URL differs:
     ```javascript
     export const API_URL = 'http://localhost:3000/api';
     ```

4. **Set up the database**:
   - Ensure PostgreSQL is running
   - Create the database:
     ```sql
     CREATE DATABASE database_development;
     ```
   - Run migrations:
     ```bash
     cd server
     npx sequelize-cli db:migrate
     ```
   - (Optional) Seed initial data:
     ```bash
     npx sequelize-cli db:seed:all
     ```

5. **Start Redis**:
   - Ensure Redis is running on the default port (6379) or update the `REDIS_URL` in `.env`

6. **Start the application**:
   - Start the backend:
     ```bash
     cd server
     npm run dev
     ```
   - Start the frontend:
     ```bash
     cd client
     npm run dev
     ```
   - The application will be available at `http://localhost:5173`

## Usage
1. **Register/Login**: Create an account or log in via the `/register` or `/login` pages
2. **Dashboard**: View financial summaries, recent transactions, and charts
3. **Transactions**: Add, edit, delete, or filter transactions
4. **Budgets**: Set monthly and category-specific budgets
5. **Alerts**: Monitor spending alerts on the dashboard or alerts page
6. **Chatbot**: Use the chatbot for financial insights or transaction management

## Alerts System
Refer to `client/README-ALERTS.md` for detailed information on the alert system, including:
- Types of alerts (monthly budget, category budget)
- Trigger conditions (90% and 100% thresholds)
- Setup and troubleshooting

## API Endpoints
The backend provides RESTful APIs under `/api`:
- `/users`: User management (register, login)
- `/transactions`: Transaction CRUD operations
- `/categories`: Category management
- `/budgets`: Budget management
- `/alerts`: Alert management
- `/statistics`: Financial statistics
- `/chatbot`: Chatbot interactions

For detailed API documentation, refer to the respective controller and service files in `server/src`.

## Development
- **Frontend**:
  - Use `npm run dev` for development with hot module replacement (HMR)
  - Run `npm run build` for production builds
- **Backend**:
  - Use `nodemon` for automatic server restarts during development
  - Run migrations before deploying changes to the database schema
- **Caching**: Redis caches API responses; clear cache when updating data
