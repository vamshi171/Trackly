import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ThemeProvider } from "./context/ThemeContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import Categories from "./pages/Categories";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Budget from "./pages/Budget";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminExpenses from "./pages/AdminExpenses";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>
          {/* 🔓 PUBLIC ROUTES */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* 🔒 USER ROUTES (USER + ADMIN accessible) */}
          <Route
            path="/dashboard"
            element={<ProtectedRoute element={<Dashboard />} requiredRole="USER" />}
          />

          <Route
            path="/expenses"
            element={<ProtectedRoute element={<Expenses />} requiredRole="USER" />}
          />

          <Route
            path="/categories"
            element={<ProtectedRoute element={<Categories />} requiredRole="USER" />}
          />

          <Route
            path="/reports"
            element={<ProtectedRoute element={<Reports />} requiredRole="USER" />}
          />

          <Route
            path="/settings"
            element={<ProtectedRoute element={<Settings />} requiredRole="USER" />}
          />

          <Route
            path="/budget"
            element={<ProtectedRoute element={<Budget />} requiredRole="USER" />}
          />

          {/* 🔒 ADMIN ROUTES (ADMIN ONLY) */}
          <Route
            path="/admin"
            element={<ProtectedRoute element={<AdminDashboard />} requiredRole="ADMIN" />}
          />

          <Route
            path="/admin/users"
            element={<ProtectedRoute element={<AdminUsers />} requiredRole="ADMIN" />}
          />

          <Route
            path="/admin/expenses"
            element={<ProtectedRoute element={<AdminExpenses />} requiredRole="ADMIN" />}
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;