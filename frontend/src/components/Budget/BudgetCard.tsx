import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext/useAuth';
import toast from 'react-hot-toast';

interface Budget {
  id: string;
  category_id: string;
  budget_amount: number;
  start_date: string;
  end_date: string;
  user_id: string;
}

interface Category {
  id: string;
  name: string;
}

interface BudgetCardProps {
  budget: Budget;
  onBudgetDeleted: () => void;
}

const BudgetCard: React.FC<BudgetCardProps> = ({ budget, onBudgetDeleted }) => {
  const { supabase } = useAuth();
  const [categoryName, setCategoryName] = useState('Carregando...');
  const [currentSpend, setCurrentSpend] = useState(0);
  const [loadingSpend, setLoadingSpend] = useState(true);
  const [notifiedExceeded, setNotifiedExceeded] = useState(false);

  // Effect to fetch category name
  useEffect(() => {
    const fetchCategoryName = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('name')
        .eq('id', budget.category_id)
        .single();

      if (error) {
        console.error('Error fetching category name:', error.message);
        setCategoryName('Desconhecida');
      } else {
        setCategoryName(data?.name || 'Desconhecida');
      }
    };
    fetchCategoryName();
  }, [budget.category_id, supabase]); // Depend on budget.category_id and supabase

  // Effect to fetch current spend, dependent on categoryName
  useEffect(() => {
    const fetchCurrentSpend = async () => {
      if (categoryName === 'Carregando...' || categoryName === 'Desconhecida') {
        // Don't fetch if categoryName is not yet resolved or is unknown
        return;
      }

      setLoadingSpend(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', budget.user_id)
        .eq('category_id', budget.category_id) // Use category_id directly
        .gte('date', budget.start_date)
        .lte('date', budget.end_date);

      if (error) {
        console.error('Error fetching current spend:', error.message);
        toast.error('Erro ao calcular gastos atuais.');
      } else {
        const totalSpend = data?.reduce((sum, transaction) => sum + transaction.amount, 0) || 0;
        setCurrentSpend(totalSpend);
      }
      setLoadingSpend(false);
    };

    fetchCurrentSpend();
  }, [budget.category_id, budget.user_id, budget.start_date, budget.end_date, supabase]); // Depend on category_id and other budget properties

  // Effect to notify if budget is exceeded
  useEffect(() => {
    const notificationKey = `budget_exceeded_${budget.id}`;
    const hasNotified = sessionStorage.getItem(notificationKey);

    if (!loadingSpend && currentSpend > budget.budget_amount && !hasNotified) {
      toast.error(`Orçamento de ${categoryName} excedido! Gasto: R$ ${currentSpend.toFixed(2)} de R$ ${budget.budget_amount.toFixed(2)}`);
      sessionStorage.setItem(notificationKey, 'true');
    }
  }, [currentSpend, budget.budget_amount, loadingSpend, categoryName, budget.id]);

  const handleDelete = async () => {
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', budget.id);

    if (error) {
      console.error('Error deleting budget:', error.message);
      toast.error('Erro ao deletar orçamento.');
    } else {
      toast.success('Orçamento deletado com sucesso!');
      onBudgetDeleted();
    }
  };

  const progress = (currentSpend / budget.budget_amount) * 100;
  const progressBarColor = progress < 80 ? 'bg-green-500' : progress < 100 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-white">
      <h3 className="text-xl font-semibold mb-2">{categoryName}</h3>
      <p className="text-gray-400">Período: {budget.start_date} a {budget.end_date}</p>
      <p className="text-lg mt-2">Orçamento: R$ {budget.budget_amount.toFixed(2)}</p>
      <p className="text-lg">Gasto Atual: {loadingSpend ? 'Carregando...' : `R$ ${currentSpend.toFixed(2)}`}</p>
      
      <div className="w-full bg-gray-700 rounded-full h-2.5 mt-4">
        <div className={`${progressBarColor} h-2.5 rounded-full`} style={{ width: `${Math.min(100, progress)}%` }}></div>
      </div>
      <p className="text-sm text-gray-400 mt-1">{progress.toFixed(2)}% do orçamento</p>

      <button
        onClick={handleDelete}
        className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
      >
        Deletar
      </button>
    </div>
  );
};

export default BudgetCard;