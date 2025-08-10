import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext/useAuth';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
);

const ReportsPage: React.FC = () => {
  const { supabase } = useAuth();
  const [expensesByCategory, setExpensesByCategory] = useState<{ [key: string]: number }>({});
  const [incomeExpenseOverTime, setIncomeExpenseOverTime] = useState<Array<{ month: string; income: number; expense: number }>>([]);
  const [budgetVsActual, setBudgetVsActual] = useState<Array<{ categoryName: string; budgeted: number; actual: number; remaining: number }>>([]);
  const [anomalyDetectionResults, setAnomalyDetectionResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchExpensesByCategory = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    let url = '/api/reports/expenses-by-category';
    const params = new URLSearchParams();

    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    if (params.toString()) {
      url = `${url}?${params.toString()}`;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("User not authenticated");

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setExpensesByCategory(data);
    } catch (error: any) {
      console.error('Error fetching expenses by category:', error.message);
      toast.error('Erro ao buscar despesas por categoria.');
    } finally {
      setLoading(false);
    }
  }, [supabase, startDate, endDate]);

  const fetchIncomeExpenseOverTime = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    let url = '/api/reports/income-expense-over-time';
    const params = new URLSearchParams();

    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    if (params.toString()) {
      url = `${url}?${params.toString()}`;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("User not authenticated");

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setIncomeExpenseOverTime(data);
    } catch (error: any) {
      console.error('Error fetching income/expense over time:', error.message);
      toast.error('Erro ao buscar dados de receita/despesa por tempo.');
    } finally {
      setLoading(false);
    }
  }, [supabase, startDate, endDate]);

  const fetchBudgetVsActual = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    let url = '/api/reports/budget-vs-actual';
    const params = new URLSearchParams();

    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    if (params.toString()) {
      url = `${url}?${params.toString()}`;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("User not authenticated");

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setBudgetVsActual(data);
    } catch (error: any) {
      console.error('Error fetching budget vs actual:', error.message);
      toast.error('Erro ao buscar relatório de orçamento vs. real.');
    } finally {
      setLoading(false);
    }
  }, [supabase, startDate, endDate]);

  const runAnomalyDetection = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("User not authenticated");

      // Fetch all transactions for anomaly detection
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('id, type, amount, date, description, category_id');

      if (transactionsError) throw transactionsError;

      const response = await fetch('/api/anomaly-detection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ transactions }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAnomalyDetectionResults(data.filter((tx: any) => tx.is_anomaly));
      toast.success('Detecção de anomalias concluída!');
    } catch (error: any) {
      console.error('Error running anomaly detection:', error.message);
      toast.error('Erro ao executar detecção de anomalias.');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchExpensesByCategory();
    fetchIncomeExpenseOverTime();
    fetchBudgetVsActual();
  }, [fetchExpensesByCategory, fetchIncomeExpenseOverTime, fetchBudgetVsActual]);

  const chartData = {
    labels: Object.keys(expensesByCategory),
    datasets: [
      {
        label: 'Despesas por Categoria',
        data: Object.values(expensesByCategory),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Despesas por Categoria',
      },
    },
  };

  const incomeExpenseChartData = {
    labels: incomeExpenseOverTime.map(data => data.month),
    datasets: [
      {
        label: 'Receita',
        data: incomeExpenseOverTime.map(data => data.income),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1,
      },
      {
        label: 'Despesa',
        data: incomeExpenseOverTime.map(data => data.expense),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.1,
      },
    ],
  };

  const incomeExpenseChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Receita vs. Despesa ao Longo do Tempo',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold text-white mb-6">Relatórios Financeiros</h1>

        <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Despesas por Categoria</h2>
          <div className="flex space-x-4 mb-4">
            <div>
              <label htmlFor="startDate" className="block text-gray-300 text-sm font-bold mb-2">Data de Início</label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-gray-300 text-sm font-bold mb-2">Data de Fim</label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
          </div>
          {loading ? (
            <p className="text-white">Carregando dados do relatório...</p>
          ) : Object.keys(expensesByCategory).length > 0 ? (
            <Bar data={chartData} options={chartOptions} />
          ) : (
            <p className="text-white">Nenhum dado de despesa encontrado para o período selecionado.</p>
          )}
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Receita vs. Despesa ao Longo do Tempo</h2>
          {loading ? (
            <p className="text-white">Carregando dados do relatório...</p>
          ) : incomeExpenseOverTime.length > 0 ? (
            <Line data={incomeExpenseChartData} options={incomeExpenseChartOptions} />
          ) : (
            <p className="text-white">Nenhum dado de receita ou despesa encontrado para o período selecionado.</p>
          )}
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Orçamento vs. Real</h2>
          {loading ? (
            <p className="text-white">Carregando dados do relatório...</p>
          ) : budgetVsActual.length > 0 ? (
            <Bar data={budgetVsActualChartData} options={budgetVsActualChartOptions} />
          ) : (
            <p className="text-white">Nenhum dado de orçamento vs. real encontrado para o período selecionado.</p>
          )}
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Orçamento vs. Real</h2>
          {loading ? (
            <p className="text-white">Carregando dados do relatório...</p>
          ) : budgetVsActual.length > 0 ? (
            <Bar data={budgetVsActualChartData} options={budgetVsActualChartOptions} />
          ) : (
            <p className="text-white">Nenhum dado de orçamento vs. real encontrado para o período selecionado.</p>
          )}
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Detecção de Anomalias</h2>
          <button
            onClick={runAnomalyDetection}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded mb-4 disabled:opacity-50"
          >
            {loading ? 'Detectando...' : 'Executar Detecção de Anomalias'}
          </button>
          {anomalyDetectionResults.length > 0 ? (
            <div className="space-y-2">
              <p className="text-white">Anomalias detectadas:</p>
              <ul className="list-disc list-inside text-white">
                {anomalyDetectionResults.map((anomaly: any) => (
                  <li key={anomaly.id}>
                    {anomaly.description || 'Transação'} de R$ {anomaly.amount} em {new Date(anomaly.date).toLocaleDateString()} (Score: {anomaly.anomaly_score})
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-white">Nenhuma anomalia detectada para o período selecionado.</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ReportsPage;
