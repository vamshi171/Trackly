# 💰 ExpenseTracker

A modern, clean web application for tracking personal expenses built with React and Vite.

## ✨ Features

- **Dashboard**: Overview of your expenses with key statistics
- **Expense Management**: Add, view, and delete expenses
- **Categories**: Organize expenses with custom categories
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Clean, gradient-based design with smooth animations
- **Authentication**: Secure login system

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd ExpenseTracker
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open [http://localhost:5174](http://localhost:5174) in your browser

### Backend Setup

This frontend application expects a backend API running on `http://localhost:8080/api` with the following endpoints:

- `POST /auth/login` - User authentication
- `GET /expenses` - Get all expenses
- `POST /expenses` - Add new expense
- `DELETE /expenses/:id` - Delete expense
- `GET /categories` - Get all categories
- `POST /categories` - Add new category
- `DELETE /categories/:id` - Delete category

## 📱 Pages

### Login Page
- Clean authentication interface
- Form validation
- Error handling

### Dashboard
- Total expenses summary
- Monthly expenses
- Categories count
- Recent transactions list
- Quick action buttons

### Expenses Page
- List all expenses with details
- Add new expenses via modal
- Delete expenses
- Total expenses calculation

### Categories Page
- Manage expense categories
- Add new categories
- Delete categories
- Category descriptions

## 🎨 Design Features

- **Gradient Backgrounds**: Beautiful purple-blue gradients
- **Card-based Layout**: Clean white cards with shadows
- **Responsive Grid**: Adapts to different screen sizes
- **Smooth Animations**: Hover effects and transitions
- **Modern Typography**: Clean, readable fonts
- **Icon Integration**: Emoji icons for better UX

## 🛠️ Tech Stack

- **Frontend**: React 19, React Router DOM
- **Build Tool**: Vite
- **Styling**: CSS with modern features
- **HTTP Client**: Axios
- **Linting**: ESLint

## 📦 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
