import { useEffect, useState } from 'react';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

import type { Category } from '../../types';

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

const Dashboard = () => {
  const { user, session } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [coupleData, setCoupleData] = useState<CoupleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Fetch transactions
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select('*, categories(name)')
          .eq('user_id', user.id);

        if (transactionsError) throw transactionsError;
        setTransactions(transactionsData || []);
        console.log("Fetched transactions:", transactionsData);

        // Fetch goals
        const { data: goalsData, error: goalsError } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', user.id);

        if (goalsError) throw goalsError;
        setGoals(goalsData || []);
        console.log("Fetched goals:", goalsData);

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name');

        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);
        console.log("Fetched categories:", categoriesData);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchCoupleData = async () => {
      if (session) {
        try {
          const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/couple-dashboard`, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });
          if (!response.ok) {
            throw new Error('Failed to fetch couple data');
          }
          const data: CoupleData = await response.json();
          setCoupleData(data);
          console.log("Fetched couple data:", data);
        } catch (err: any) {
          console.error("Couple data fetch error:", err.message);
          toast.error(`Erro ao buscar dados do casal: ${err.message}`);
        }
      }
    };

    fetchData();
    fetchCoupleData();
  }, [user, session]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <button
        onClick={handleExport}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
      >
        Export Transactions to CSV
      </button>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-green-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold">Total Income</h2>
          <p className="text-2xl">{totalIncome.toFixed(2)}</p>
        </div>
        <div className="bg-red-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold">Total Expense</h2>
          <p className="text-2xl">{totalExpense.toFixed(2)}</p>
        </div>
        <div className="bg-blue-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold">Balance</h2>
          <p className="text-2xl">{balance.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Expenses by Category</h2>
          {Object.keys(expenseByCategory).length > 0 ? (
            <Pie data={pieChartData} />
          ) : (
            <p className="text-center text-gray-500">Nenhuma despesa por categoria encontrada.</p>
          )}
        </div>
        <div className="bg-white p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Goals Progress</h2>
          {goalsProgress.length > 0 ? (
            goalsProgress.map(goal => (
              <div key={goal.id} className="mb-2">
                <div className="flex justify-between">
                  <span>{goal.categoryName}</span>
                  <span>{goal.spent.toFixed(2)} / {goal.amount.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${goal.progress}%` }}></div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">Nenhuma meta encontrada.</p>
          )}
        </div>
      </div>

      {coupleData && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Couple's Dashboard</h2>
          {/* Render couple's data here */}
        </div>
      )}
    </div>
  );
};

export default Dashboard;