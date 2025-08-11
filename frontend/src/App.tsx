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
import UpdatePasswordPage from './pages/UpdatePasswordPage';
import ProtectedRoute from './components/ProtectedRoute';
import toast from 'react-hot-toast';
import { useEffect } from 'react';
import { supabase } from './services/supabase';

function App() {
  useEffect(() => {
    const channel = supabase
      .channel('public:transactions')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions' },
        (payload) => {
          toast.success(`Nova transação adicionada: ${payload.new.description || 'Sem descrição'} (R$ ${payload.new.amount})`);
        }
      )
      .subscribe();

    const budgetChannel = supabase
      .channel('public:budgets')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'budgets' },
        (payload) => {
          toast.info(`Novo orçamento criado para ${payload.new.category_id} (R$ ${payload.new.budget_amount})`);
        }
      )
      .subscribe();

    const coupleChannel = supabase
      .channel('public:couple_relationships')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'couple_relationships' },
        (payload) => {
          toast.info(`Novo pedido de conexão de casal recebido!`);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'couple_relationships' },
        (payload) => {
          if (payload.new.status === 'accepted') {
            toast.success(`Pedido de conexão de casal aceito!`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(budgetChannel);
      supabase.removeChannel(coupleChannel);
    };
  }, []);

  return (
    <Router basename="/vicinatoFinancas/" future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/update-password" element={<UpdatePasswordPage />} />
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