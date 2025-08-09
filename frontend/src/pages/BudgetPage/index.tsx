import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext/useAuth';
import Layout from '../../components/Layout';
import BudgetForm from '../../components/Budget/BudgetForm';
import BudgetCard from '../../components/Budget/BudgetCard';
import toast from 'react-hot-toast';

interface Budget {
  id: string;
  category_id: string;
  budget_amount: number;
  start_date: string;
  end_date: string;
  user_id: string;
}

const BudgetPage: React.FC = () => {
  const { supabase } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching budgets:', error.message);
      toast.error('Erro ao buscar orçamentos.');
    } else {
      setBudgets(data || []);
    }
    setLoading(false);
  };

  const handleBudgetCreated = () => {
    fetchBudgets();
  };

  const handleBudgetDeleted = () => {
    fetchBudgets();
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-full">
          <p className="text-white">Carregando orçamentos...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold text-white mb-6">Meus Orçamentos</h1>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Criar Novo Orçamento</h2>
          <BudgetForm onBudgetCreated={handleBudgetCreated} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.length === 0 ? (
            <p className="text-white col-span-full text-center">Nenhum orçamento encontrado. Crie um novo!</p>
          ) : (
            budgets.map((budget) => (
              <BudgetCard key={budget.id} budget={budget} onBudgetDeleted={handleBudgetDeleted} />
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default BudgetPage;
