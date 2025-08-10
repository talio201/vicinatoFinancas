import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './pages/Dashboard';
import { NovaTransacaoPage } from './pages/NovaTransacaoPage';
import { PersonalGoalsPage } from './pages/PersonalGoalsPage';
import { ScheduledTransactionsPage } from './pages/ScheduledTransactionsPage';
import { ProfilePage } from './pages/ProfilePage';
import { CoupleDashboardPage } from './pages/CoupleDashboardPage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import BudgetPage from './pages/BudgetPage';
import ReportsPage from './pages/ReportsPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router basename="/vicinatoFinancas/" future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
        <Route
          path="/nova-transacao"
          element={
            <ProtectedRoute>
              <NovaTransacaoPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/personal-goals"
          element={
            <ProtectedRoute>
              <PersonalGoalsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scheduled-transactions"
          element={
            <ProtectedRoute>
              <ScheduledTransactionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/couple-dashboard"
          element={
            <ProtectedRoute>
              <CoupleDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/budgets"
          element={
            <ProtectedRoute>
              <BudgetPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
// Trigger new build for backend URL update - 2