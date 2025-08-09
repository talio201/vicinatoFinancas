import React, { useState, useMemo, Fragment, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

import { useAuth } from '../../contexts/AuthContext/useAuth';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Dialog, Transition } from '@headlessui/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FiPlus, FiTrash2, FiTrendingUp, FiTrendingDown, FiSun, FiMoon, FiHome, FiShoppingCart, FiFilm, FiHeart, FiDollarSign, FiGift, FiBookOpen, FiMoreVertical } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import Layout from '../../components/Layout';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

interface Transaction { id: string; type: 'income' | 'expense'; amount: number; category_id: string; description: string; date: string; created_at: string; categories: { name: string } | null; }
interface Category { id: string; name: string; }
interface Goal { id: string; user_id: string; category_id: string; amount: number; month: string; }
interface ScheduledTransaction { id: string; type: 'income' | 'expense'; amount: number; category_id: string; description: string; date: string; created_at: string; categories: { name: string } | null; }

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' });
const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;
const getMonthString = (date: Date) => date.toISOString().slice(0, 7) + '-01';

const categoryIcons: { [key: string]: React.ReactNode } = {
  'Moradia': <FiHome />, 'Alimentação': <FiShoppingCart />, 'Lazer': <FiFilm />, 'Saúde': <FiHeart />, 'Transporte': <FiTrendingUp />,
  'Salário': <FiDollarSign />, 'Presentes': <FiGift />, 'Educação': <FiBookOpen />, 'Outros': <FiMoreVertical />,
};

const FinancialSummaryCard: React.FC<{ title: string; amount: number; color: string; icon: React.ReactNode; animate?: boolean }> = ({ title, amount, color, icon, animate }) => (
    <div className={`bg-white rounded-2xl p-6 shadow-md flex flex-col justify-between ${animate ? 'animate-pulse' : ''}`}>
        <div className="flex justify-between items-center">
            <h3 className="text-base font-semibold text-gray-500">{title}</h3>
            <div className={`text-2xl ${color}`}>{icon}</div>
        </div>
        <p className="text-3xl font-bold text-gray-800 my-2">{formatCurrency(amount)}</p>
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
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Balanço Mensal</h2>
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

const GoalsTracker: React.FC<{ goals: Goal[], transactions: Transaction[], onManageGoals: () => void }> = ({ goals, transactions, onManageGoals }) => {
    const expensesByCategory = useMemo(() => {
        return transactions
            .filter(tx => tx.type === 'expense')
            .reduce((acc, tx) => {
                const categoryName = tx.categories?.name || 'Outros';
                if (!acc[categoryName]) { acc[categoryName] = 0; }
                acc[categoryName] += tx.amount;
                return acc;
            }, {} as Record<string, number>);
    }, [transactions]);

    const getProgressColor = (percentage: number) => {
        if (percentage > 100) return 'bg-red-500';
        if (percentage > 80) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Metas do Mês</h2>
                <button onClick={onManageGoals} className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm">Gerenciar</button>
            </div>
            <div className="space-y-4">
                {goals.length > 0 ? goals.map(goal => {
                    const spent = expensesByCategory[goal.category] || 0;
                    const percentage = (spent / goal.amount) * 100;
                    return (
                        <div key={goal.id}>
                            <div className="flex justify-between mb-1 text-sm font-medium">
                                <span className="text-gray-700">{goal.category}</span>
                                <span className="text-gray-500">{formatCurrency(spent)} / {formatCurrency(goal.amount)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div className={`h-2.5 rounded-full ${getProgressColor(percentage)}`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                            </div>
                        </div>
                    );
                }) : (
                    <p className="text-gray-500 text-center py-4">Nenhuma meta definida para este mês.</p>
                )}
            </div>
        </div>
    );
};

interface ManageGoalsModalProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  session: Session | null;
  categories: Category[];
  goals: Goal[];
  onGoalsUpdate: () => void;
}

const ManageGoalsModal: React.FC<ManageGoalsModalProps> = ({ isOpen, setIsOpen, session, categories, goals, onGoalsUpdate }) => {
    const [monthlyGoals, setMonthlyGoals] = useState<Partial<Goal>[]>([]);

    useEffect(() => {
        if (!Array.isArray(goals) || !Array.isArray(categories)) {
            console.error("Goals or categories prop is not an array:", { goals, categories });
            return;
        }
        const expenseCategories = categories.filter((c: Category) => c.name !== 'Salário');
        const goalsMap = new Map(goals.map((g: Goal) => [g.category_id, g]));
        const initialGoals = expenseCategories.map((cat: Category) => {
            return goalsMap.get(cat.id) || { category_id: cat.id, amount: 0, month: getMonthString(new Date()) };
        });
        setMonthlyGoals(initialGoals);
    }, [goals, categories, isOpen]);

    const handleGoalChange = (categoryId: string, amount: string) => {
        setMonthlyGoals(prev => prev.map(g => g.category_id === categoryId ? { ...g, amount: parseFloat(amount) || 0 } : g));
    };

    const handleSave = async () => {
        try {
            const month = getMonthString(new Date());
            const promises = monthlyGoals.map(async goal => {
                if (goal.amount && goal.amount > 0) {
                    const response = await fetch(`${API_BASE_URL}/api/goals`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`,
                        },
                        body: JSON.stringify({ ...goal, month }),
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Erro ao salvar meta.');
                    }
                    return response.json();
                }
                return null;
            }).filter(Boolean);
            
            await Promise.all(promises);
            toast.success('Metas salvas com sucesso!');
            onGoalsUpdate();
            setIsOpen(false);
        } catch (error: Error) {
            toast.error(error.message || 'Erro ao salvar metas.');
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black bg-opacity-40" />
                </Transition.Child>
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-gray-900">Gerenciar Metas do Mês</Dialog.Title>
                                <div className="mt-4 space-y-4 max-h-96 overflow-y-auto">
                                    {monthlyGoals.map(goal => (
                                        <div key={goal.category_id} className="grid grid-cols-3 items-center gap-4">
                                            <label className="col-span-1 text-sm font-medium text-gray-700">{categories.find(cat => cat.id === goal.category_id)?.name}</label>
                                            <input 
                                                type="number" 
                                                value={goal.amount || ''} 
                                                onChange={(e) => handleGoalChange(goal.category_id!, e.target.value)} 
                                                className="col-span-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                placeholder="R$ 0,00"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 flex justify-end space-x-2">
                                    <button type="button" onClick={() => setIsOpen(false)} className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">Cancelar</button>
                                    <button type="button" onClick={handleSave} className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Salvar Metas</button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

interface RecentTransactionsProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

const RecentTransactions: React.FC<RecentTransactionsProps> = ({ transactions, onDelete }) => (
  <div className="bg-white p-6 rounded-2xl shadow-md">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Últimas Transações</h2>
    <div className="space-y-4">
      {transactions.length > 0 ? (
        transactions.map((tx: Transaction) => (
          <div key={tx.id} className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">{categoryIcons[tx.categories?.name || 'Outros'] || <FiMoreVertical />}</div>
            <div className="flex-grow">
              <p className="font-bold text-gray-800">{tx.description || 'Transação'}</p>
              <p className="text-sm text-gray-500">{tx.categories?.name || 'Sem Categoria'} • {formatDate(tx.date)}</p>
            </div>
            <div className="text-right">
              <p className={`font-bold ${tx.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>{tx.type === 'expense' ? '-' : '+'}{formatCurrency(tx.amount || 0)}</p>
              <div className="flex items-center justify-end space-x-2 text-gray-400">
                <button onClick={() => onDelete(tx.id)} className="hover:text-red-600"><FiTrash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-500 text-center py-8">Nenhuma transação ainda.</p>
      )}
    </div>
  </div>
);

const DashboardPage: React.FC = () => {
  const { session, loading: authLoading, fullName } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const getGreeting = () => {
    const hour = new Date().getHours();
    let greeting = "Olá";
    let icon = null;

    if (hour >= 5 && hour < 12) {
      greeting = "Bom dia";
      icon = <FiSun className="text-yellow-500" />;
    } else if (hour >= 12 && hour < 18) {
      greeting = "Boa tarde";
      icon = <FiSun className="text-yellow-500" />;
    } else {
      greeting = "Boa noite";
      icon = <FiMoon className="text-indigo-500" />;
    }
    return { greeting, icon };
  };

  const { data: transactions = [], isLoading: isLoadingTransactions, error: transactionsError } = useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: async () => {
      
      if (!session || !session.access_token) {
        throw new Error('Session or access token not found');
      }
      const response = await fetch(`${API_BASE_URL}/api/transactions`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch transactions');
      }
      const data = await response.json();
      return data.sort((a: Transaction, b: Transaction) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    enabled: !!session && !!session.access_token,
  });

  const { data: scheduledTransactions = [], isLoading: isLoadingScheduledTransactions, error: scheduledTransactionsError } = useQuery<ScheduledTransaction[]>({
    queryKey: ['scheduledTransactions'],
    queryFn: async () => {
      if (!session || !session.access_token) {
        throw new Error('Session or access token not found');
      }
      const response = await fetch(`${API_BASE_URL}/api/scheduled-transactions?select=*,categories(name)`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch scheduled transactions');
      }
      const data = await response.json();
      return data;
    },
    enabled: !!session && !!session.access_token,
  });

  const [isGoalModalOpen, setGoalModalOpen] = useState(false);
  const [animateBalance, setAnimateBalance] = useState(false);

  useEffect(() => {
    const summary = transactions.reduce((acc, tx) => {
      if (tx.type === 'income') acc.income += tx.amount;
      else acc.expense += tx.amount;
      return acc;
    }, { income: 0, expense: 0 });

    if (summary.income - summary.expense < 0) {
      setAnimateBalance(true);
      const timer = setTimeout(() => setAnimateBalance(false), 20000);
      return () => clearTimeout(timer);
    }
  }, [transactions]);

  const { data: categories = [], isLoading: isLoadingCategories, error: categoriesError } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      if (!session || !session.access_token) {
        throw new Error('Session or access token not found');
      }
      const response = await fetch(`${API_BASE_URL}/api/categories`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch categories');
      }
      return response.json();
    },
    enabled: !!session && !!session.access_token,
  });

  const { data: goals = [], isLoading: isLoadingGoals, error: goalsError } = useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: async () => {
      if (!session.access_token) throw new Error('Session not found');
      const month = getMonthString(new Date());
      const response = await fetch(`${API_BASE_URL}/api/goals?month=${month}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch goals');
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!session && !!session.access_token,
  });

  const isLoading = isLoadingTransactions || isLoadingCategories || isLoadingGoals || isLoadingScheduledTransactions;

  useEffect(() => {
    if (transactionsError) toast.error(transactionsError.message);
    if (categoriesError) toast.error(categoriesError.message);
    if (goalsError) toast.error(goalsError.message);
    if (scheduledTransactionsError) toast.error(scheduledTransactionsError.message);
  }, [transactionsError, categoriesError, goalsError, scheduledTransactionsError]);

  useEffect(() => {
    const hasNotified = sessionStorage.getItem('hasNotifiedScheduledTransactions');

    if (scheduledTransactions && scheduledTransactions.length > 0 && !hasNotified) {
      const today = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(today.getDate() + 7);

      let notifiedCount = 0;
      scheduledTransactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        if (transactionDate >= today && transactionDate <= sevenDaysFromNow) {
          toast(`Transação agendada em breve: ${transaction.description || transaction.categories?.name || 'Sem descrição'} em ${formatDate(transaction.date)} no valor de ${formatCurrency(transaction.amount)}`, {
            icon: '🔔',
            duration: 5000,
          });
          notifiedCount++;
        }
      });

      if (notifiedCount > 0) {
        sessionStorage.setItem('hasNotifiedScheduledTransactions', 'true');
      }
    }
  }, [scheduledTransactions]);

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!session.access_token) throw new Error('Sessão não encontrada. Faça login novamente.');
      const response = await fetch(`${API_BASE_URL}/api/transactions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir transação.');
      }
    },
    onSuccess: () => {
      toast.success('Transação excluída!');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao excluir.');
    },
  });

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
      deleteTransactionMutation.mutate(id);
    }
  };

  const financialSummary = useMemo(() => {
    return transactions.reduce((acc, tx) => {
      if (tx.type === 'income') acc.income += tx.amount;
      else acc.expense += tx.amount;
      return acc;
    }, { income: 0, expense: 0 });
  }, [transactions]);

  if (authLoading) {
    return <div className="w-full h-screen flex items-center justify-center bg-gray-50">Carregando sessão...</div>;
  }

  if (isLoading) {
    return <div className="w-full h-screen flex items-center justify-center bg-gray-50">Carregando...</div>;
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {getGreeting().icon} {getGreeting().greeting}, {fullName || 'Usuário'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Bem-vindo(a) de volta ao seu dashboard.</p>
        </motion.div>

        <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8" variants={{ visible: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="visible">
          <FinancialSummaryCard title="Receita Total" amount={financialSummary.income} color="text-green-500" icon={<FiTrendingUp />} />
          <FinancialSummaryCard title="Despesa Total" amount={financialSummary.expense} color="text-red-500" icon={<FiTrendingDown />} />
          <div className={`bg-white rounded-2xl p-6 shadow-md flex flex-col justify-center items-center text-center ${animateBalance ? 'animate-pulse' : ''}`}>
              <h3 className="text-base font-semibold text-gray-500">Saldo Atual</h3>
              <p className={`text-4xl font-bold my-2 ${financialSummary.income - financialSummary.expense >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(financialSummary.income - financialSummary.expense)}</p>
              <p className="text-sm text-gray-400">Balanço de todas as transações</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <MainChart data={transactions} />
            <GoalsTracker goals={goals} transactions={transactions} onManageGoals={() => setGoalModalOpen(true)} />
          </div>
          <div className="lg:col-span-1">
            <RecentTransactions transactions={transactions} onDelete={handleDeleteTransaction} />
          </div>
        </div>

        <button onClick={() => navigate('/nova-transacao')} className="fixed bottom-8 right-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-lg transform hover:scale-110 transition-transform duration-200 z-40" aria-label="Adicionar Transação">
          <FiPlus size={24} />
        </button>

        
        <ManageGoalsModal isOpen={isGoalModalOpen} setIsOpen={setGoalModalOpen} session={session} categories={categories} goals={goals} onGoalsUpdate={() => queryClient.invalidateQueries({ queryKey: ['goals'] })} />
      </div>
    </Layout>
  );
};

export default DashboardPage;