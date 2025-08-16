import { Link } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext/useAuth';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { exportToCsv } from '../../utils/exportToCsv';
import Layout from '../../components/Layout';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Modal from '../../components/Modal';
import { MonthlyGoalForm } from '../../components/Budget/MonthlyGoalForm'; // Importando o novo componente
import type { Category } from '../../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  categories: { name: string };
  date: string;
}

interface Goal {
  id: string;
  category_id: string;
  amount: number;
  month: string;
}

interface CoupleData {
  transactions: Transaction[];
  goals: Goal[];
}

const fetchTransactions = async (userId: string) => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, categories(name)')
    .eq('user_id', userId);
  if (error) throw error;
  return data || [];
};

const fetchGoals = async (userId: string, month: string) => {
  const monthAsDate = `${month}-01`;
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .eq('month', monthAsDate);
  if (error) throw error;
  return data || [];
};

const fetchCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name');
  if (error) throw error;
  return data || [];
};

const Dashboard = () => {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const [isAddMonthlyGoalModalOpen, setIsAddMonthlyGoalModalOpen] = useState(false);

  const { data: transactions = [], isLoading: isLoadingTransactions, error: transactionsError } = useQuery<Transaction[]>({ 
    queryKey: ['transactions', user?.id],
    queryFn: () => fetchTransactions(user!.id),
    enabled: !!user?.id,
  });

  const { data: goals = [], isLoading: isLoadingGoals, error: goalsError } = useQuery<Goal[]>({ 
    queryKey: ['goals', user?.id, new Date().toISOString().substring(0, 7)],
    queryFn: () => fetchGoals(user!.id, new Date().toISOString().substring(0, 7)),
    enabled: !!user?.id,
  });

  const { data: categories = [], isLoading: isLoadingCategories, error: categoriesError } = useQuery<Category[]>({ 
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const { data: coupleData, isLoading: isLoadingCoupleData, error: coupleDataError } = useQuery<CoupleData>({
    queryKey: ['coupleData', user?.id],
    queryFn: async () => {
      if (!session) throw new Error('Autenticação necessária.');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/couple-dashboard`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch couple data: ${response.status} ${response.statusText} - ${errorText}`);
      }
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const errorText = await response.text();
        throw new Error(`Expected JSON response, but received ${contentType || 'no content type'}: ${errorText}`);
      }
      return response.json();
    },
    enabled: !!session && !!user?.id,
  });

  const isLoading = isLoadingTransactions || isLoadingGoals || isLoadingCategories || isLoadingCoupleData;
  const error = transactionsError || goalsError || categoriesError || coupleDataError;

  if (isLoading) {
    return <Layout><div className="w-full h-screen flex items-center justify-center">Carregando dashboard...</div></Layout>;
  }

  if (error) {
    return <Layout><div className="text-center py-8 text-red-500">Erro ao carregar dados: {error.message}</div></Layout>;
  }

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  const expenseByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const categoryName = t.categories?.name || 'Uncategorized';
      acc[categoryName] = (acc[categoryName] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const pieChartData = {
    labels: Object.keys(expenseByCategory),
    datasets: [
      {
        label: 'Expenses by Category',
        data: Object.values(expenseByCategory),
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 206, 86, 0.2)',
          'rgba(75, 192, 192, 0.2)',
          'rgba(153, 102, 255, 0.2)',
          'rgba(255, 159, 64, 0.2)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const goalsProgress = goals.map(goal => {
    const categoryName = categories.find(cat => cat.id === goal.category_id)?.name || 'Uncategorized';
    const spent = expenseByCategory[categoryName] || 0;
    const progress = (spent / goal.amount) * 100;
    return { ...goal, spent, progress, categoryName };
  });

  const handleExport = () => {
    const dataToExport = transactions.map(tx => ({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      category: tx.categories?.name || 'Uncategorized',
      date: tx.date,
    }));
    exportToCsv(dataToExport, 'transactions.csv');
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Dashboard Pessoal</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Visão geral das suas finanças.</p>
          <div className="flex gap-4">
            <Link to="/nova-transacao">
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md">
                + Adicionar Nova Transação
              </button>
            </Link>
            <button onClick={handleExport} className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md">
              Exportar para CSV
            </button>
            <button onClick={() => setIsAddMonthlyGoalModalOpen(true)} className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-md">
              + Adicionar Meta Mensal
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md">
            <h2 className="text-base font-semibold text-gray-500">Receita Total</h2>
            <p className="text-3xl font-bold text-green-500 my-2">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md">
            <h2 className="text-base font-semibold text-gray-500">Despesa Total</h2>
            <p className="text-3xl font-bold text-red-500 my-2">{formatCurrency(totalExpense)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md">
            <h2 className="text-base font-semibold text-gray-500">Saldo Atual</h2>
            <p className={`text-3xl font-bold my-2 ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(balance)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md h-[400px]">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Despesas por Categoria</h2>
            {Object.keys(expenseByCategory).length > 0 ? (
              <Pie data={pieChartData} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 dark:text-gray-400">Nenhuma despesa por categoria encontrada.</p>
              </div>
            )}
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Progresso das Metas</h2>
            {goalsProgress.length > 0 ? (
              goalsProgress.map(goal => (
                <div key={goal.id} className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-700 dark:text-gray-300">{goal.categoryName}</span>
                    <span className="text-gray-500 dark:text-gray-400">{formatCurrency(goal.spent)} / {formatCurrency(goal.amount)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${Math.min(100, goal.progress)}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 dark:text-gray-400">Nenhuma meta encontrada.</p>
              </div>
            )}
          </div>
        </div>

        {coupleData && (
          <div className="mt-8 p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Dashboard do Casal</h2>
            {coupleData.transactions.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-green-100 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-700">Receita Total do Casal</h3>
                    <p className="text-2xl text-green-700">{formatCurrency(coupleData.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0))}</p>
                  </div>
                  <div className="bg-red-100 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-700">Despesa Total do Casal</h3>
                    <p className="text-2xl text-red-700">{formatCurrency(coupleData.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0))}</p>
                  </div>
                  <div className="bg-blue-100 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-700">Saldo do Casal</h3>
                    <p className="text-2xl text-blue-700">{formatCurrency(coupleData.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) - coupleData.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0))}</p>
                  </div>
                </div>

              </>
            ) : (
              <p className="text-center text-gray-500">Nenhuma transação do casal encontrada.</p>
            )}
            {coupleData.goals.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Metas do Casal</h3>

                <p className="text-gray-600">Total de metas do casal: {coupleData.goals.length}</p>
              </div>
            )}
          </div>
        )}
        {!coupleData && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg text-center">
            <p className="text-gray-600">Conecte-se com um parceiro para ver o Dashboard do Casal.</p>
          </div>
        )}
      </div>

      {/* Modal para Adicionar Meta Mensal */}
      {isAddMonthlyGoalModalOpen && (
        <Modal title="Adicionar Meta Mensal" isOpen={isAddMonthlyGoalModalOpen} onClose={() => setIsAddMonthlyGoalModalOpen(false)}>
          <MonthlyGoalForm
            categories={categories}
            onGoalCreated={() => {
              setIsAddMonthlyGoalModalOpen(false);
              queryClient.invalidateQueries({ queryKey: ['goals'] });
            }}
          />
        </Modal>
      )}
    </Layout>
  );
};

export default Dashboard;
