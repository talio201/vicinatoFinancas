import React, { useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FiTrendingUp, FiTrendingDown, FiUsers } from 'react-icons/fi';
import { Link } from 'react-router-dom';

import Layout from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext/useAuth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

interface Transaction { id: string; type: 'income' | 'expense'; amount: number; category: string; description: string; date: string; created_at: string; }
interface CoupleRelationship {
  id: string;
  status: 'pending' | 'accepted' | 'rejected';
  user1_id: string;
  user2_id: string;
}

const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

const FinancialSummaryCard: React.FC<{ title: string; amount: number; color: string; icon: React.ReactNode; animate?: boolean }> = ({ title, amount, color, icon, animate }) => (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md flex flex-col justify-between ${animate ? 'animate-pulse' : ''}`}>
        <div className="flex justify-between items-center">
            <h3 className="text-base font-semibold text-gray-500">{title}</h3>
            <div className={`text-2xl ${color}`}>{icon}</div>
        </div>
        <p className="text-3xl font-bold text-gray-800 dark:text-white my-2">{formatCurrency(amount)}</p>
    </div>
);

import { useTheme } from '../../contexts/ThemeContext/useTheme';

const MainChart: React.FC<{ data: Transaction[] }> = ({ data }) => {
    const { theme } = useTheme();
    const chartData = useMemo(() => {
        const monthlyData = data.reduce((acc, tx) => {
            const month = new Date(tx.date).toLocaleString('pt-BR', { month: 'short', year: 'numeric', timeZone: 'UTC' });
            if (!acc[month]) { acc[month] = { name: month, Receitas: 0, Despesas: 0 }; }
            if (tx.type === 'income') acc[month].Receitas += tx.amount; else acc[month].Despesas += tx.amount;
            return acc;
        }, {} as Record<string, { name: string; Receitas: number; Despesas: number }>);
        return Object.values(monthlyData).reverse();
    }, [data]);

    const axisColor = theme === 'dark' ? '#E5E7EB' : '#6B7280';
    const tooltipBackgroundColor = theme === 'dark' ? '#1F2937' : '#FFFFFF';
    const tooltipBorderColor = theme === 'dark' ? '#4B5563' : '#DDDDDD';

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md h-[400px]">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Balanço Mensal do Casal</h2>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#4B5563' : '#E5E7EB'} />
                    <XAxis dataKey="name" stroke={axisColor} />
                    <YAxis stroke={axisColor} tickFormatter={(value) => `R${value / 1000}k`} />
                    <Tooltip cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }} contentStyle={{ backgroundColor: tooltipBackgroundColor, border: `1px solid ${tooltipBorderColor}`, borderRadius: '0.5rem' }} />
                    <Legend wrapperStyle={{ color: axisColor }} />
                    <Bar dataKey="Receitas" fill="#34D399" name="Receitas" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Despesas" fill="#F87171" name="Despesas" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export function CoupleDashboardPage() {
  const { session, user, loading: authLoading } = useAuth();

  const { data: relationship, isLoading: isLoadingRelationship } = useQuery<CoupleRelationship | null>({
    queryKey: ['coupleRelationship', user?.id, 'accepted'],
    queryFn: async () => {
      if (!session) return null;
      const response = await fetch(`${API_BASE_URL}/api/couple-relationships`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) throw new Error('Não foi possível buscar o relacionamento.');
      const relationships: CoupleRelationship[] = await response.json();
      console.log("Fetched couple relationships:", relationships);
      const acceptedRelationship = relationships.find(rel => rel.status === 'accepted' && (rel.user1_id === user?.id || rel.user2_id === user?.id));
      return acceptedRelationship || null;
    },
    enabled: !!session && !!user?.id,
  });

  const hasAcceptedRelationship = !!relationship;
  const { data: transactions = [], isLoading: isLoadingTransactions, error: transactionsError } = useQuery<Transaction[]>({
    queryKey: ['transactions', 'couple', user?.id],
    queryFn: async () => {
      if (!session || !hasAcceptedRelationship) return [];
      const response = await fetch(`${API_BASE_URL}/api/transactions?scope=couple`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch transactions');
      }
      const data = (await response.json()).sort((a: Transaction, b: Transaction) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      console.log("Fetched couple transactions:", data);
      return data;
    },
    enabled: !!session && hasAcceptedRelationship,
  });

  

  const isLoading = authLoading || isLoadingRelationship || (hasAcceptedRelationship && isLoadingTransactions);

  useEffect(() => {
    if (transactionsError) toast.error(transactionsError.message);
  }, [transactionsError]);

  const financialSummary = useMemo(() => {
    return transactions.reduce((acc, tx) => {
      if (tx.type === 'income') acc.income += tx.amount;
      else acc.expense += tx.amount;
      return acc;
    }, { income: 0, expense: 0 });
  }, [transactions]);

  if (isLoading) {
    return <Layout><div className="w-full h-screen flex items-center justify-center">Carregando dashboard do casal...</div></Layout>;
  }

  if (!hasAcceptedRelationship) {
    return (
      <Layout>
        <div className="text-center py-20">
          <FiUsers className="mx-auto text-6xl text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Conecte-se com seu parceiro(a)</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2 mb-6">Para visualizar o dashboard do casal, você precisa estar conectado com seu parceiro(a).</p>
          <Link to="/perfil">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Ir para a página de perfil para conectar
            </button>
          </Link>
        </div>
      </Layout>
    );
  }

  if (transactionsError) {
    return <Layout><div className="text-center py-8 text-red-500">Erro ao carregar transações do casal: {transactionsError.message}</div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Dashboard do Casal</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Visão consolidada das finanças de vocês dois.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
          <FinancialSummaryCard title="Receita Total do Casal" amount={financialSummary.income} color="text-green-500" icon={<FiTrendingUp />} />
          <FinancialSummaryCard title="Despesa Total do Casal" amount={financialSummary.expense} color="text-red-500" icon={<FiTrendingDown />} />
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md flex flex-col justify-center items-center text-center">
              <h3 className="text-base font-semibold text-gray-500">Saldo Atual do Casal</h3>
              <p className={`text-4xl font-bold my-2 ${financialSummary.income - financialSummary.expense >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(financialSummary.income - financialSummary.expense)}</p>
              <p className="text-sm text-gray-400">Balanço de todas as transações do casal</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-1 space-y-6">
            {transactions.length > 0 ? (
              <MainChart data={transactions} />
            ) : (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md h-[400px] flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">Nenhuma transação encontrada para o casal.</p>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </Layout>
  );
}