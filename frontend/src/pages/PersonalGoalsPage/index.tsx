import React, { useState } from 'react';
// Removed: import { useForm, type SubmitHandler } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiDollarSign } from 'react-icons/fi';
import { motion } from 'framer-motion';
import Layout from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext/useAuth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

interface PersonalGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  created_at: string;
  updated_at: string;
}

type FormInputs = {
  name: string;
  target_amount: number;
};

type AddFundsFormInputs = {
  amount: number;
};

const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

export function PersonalGoalsPage() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  // State for Add Goal form
  const [addGoalFormData, setAddGoalFormData] = useState<FormInputs>({
    name: '',
    target_amount: 0,
  });
  const [addGoalFormErrors, setAddGoalFormErrors] = useState<Partial<FormInputs>>({});

  // State for Add Funds form
  const [addFundsFormData, setAddFundsFormData] = useState<AddFundsFormInputs>({
    amount: 0,
  });
  const [addFundsFormErrors, setAddFundsFormErrors] = useState<Partial<AddFundsFormInputs>>({});

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<PersonalGoal | null>(null);

  // Handlers for Add Goal form inputs
  const handleAddGoalInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setAddGoalFormData((prev) => ({
      ...prev,
      [id]: id === 'target_amount' ? parseFloat(value) : value,
    }));
    setAddGoalFormErrors((prev) => ({ ...prev, [id]: undefined })); // Clear error on change
  };

  // Handlers for Add Funds form inputs
  const handleAddFundsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setAddFundsFormData((prev) => ({
      ...prev,
      [id]: parseFloat(value),
    }));
    setAddFundsFormErrors((prev) => ({ ...prev, [id]: undefined })); // Clear error on change
  };

  // Validation for Add Goal form
  const validateAddGoalForm = (): boolean => {
    const errors: Partial<FormInputs> = {};
    if (!addGoalFormData.name.trim()) errors.name = 'Nome da meta é obrigatório';
    if (!addGoalFormData.target_amount || isNaN(addGoalFormData.target_amount) || addGoalFormData.target_amount <= 0) {
      errors.target_amount = 'Valor alvo deve ser positivo';
    }
    setAddGoalFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validation for Add Funds form
  const validateAddFundsForm = (): boolean => {
    const errors: Partial<AddFundsFormInputs> = {};
    if (!addFundsFormData.amount || isNaN(addFundsFormData.amount) || addFundsFormData.amount <= 0) {
      errors.amount = 'Valor é obrigatório e deve ser positivo';
    }
    setAddFundsFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Fetch personal goals
  const { data: personalGoals, isLoading, error } = useQuery<PersonalGoal[]>({
    queryKey: ['personalGoals'],
    queryFn: async () => {
      if (!session) throw new Error('Autenticação necessária.');
      const response = await fetch(`${API_BASE_URL}/api/personal-goals`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) {
        throw new Error('Não foi possível buscar as metas pessoais.');
      }
      return response.json();
    },
    enabled: !!session,
  });

  // Add personal goal mutation
  const addGoalMutation = useMutation({
    mutationFn: async (newGoal: FormInputs) => {
      if (!session) throw new Error('Autenticação necessária.');
      const response = await fetch(`${API_BASE_URL}/api/personal-goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ ...newGoal, current_amount: 0 }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Não foi possível adicionar a meta.');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Meta pessoal adicionada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['personalGoals'] });
      setIsAddModalOpen(false);
      setAddGoalFormData({ name: '', target_amount: 0 }); // Reset form
      setAddGoalFormErrors({}); // Clear errors
    },
    onError: (err) => {
      toast.error(`Erro: ${err.message}`);
    },
  });

  // Add funds to goal mutation
  const addFundsMutation = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      if (!session || !selectedGoal) throw new Error('Autenticação necessária ou meta não selecionada.');
      const updatedAmount = selectedGoal.current_amount + amount;
      const response = await fetch(`${API_BASE_URL}/api/personal-goals/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ ...selectedGoal, current_amount: updatedAmount }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Não foi possível adicionar fundos.');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Fundos adicionados com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['personalGoals'] });
      setIsAddFundsModalOpen(false);
      setSelectedGoal(null);
      setAddFundsFormData({ amount: 0 }); // Reset form
      setAddFundsFormErrors({}); // Clear errors
    },
    onError: (err) => {
      toast.error(`Erro: ${err.message}`);
    },
  });

  // Delete personal goal mutation
  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!session) throw new Error('Autenticação necessária.');
      const response = await fetch(`${API_BASE_URL}/api/personal-goals/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) {
        throw new Error('Não foi possível excluir a meta.');
      }
    },
    onSuccess: () => {
      toast.success('Meta pessoal excluída com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['personalGoals'] });
    },
    onError: (err) => {
      toast.error(`Erro: ${err.message}`);
    },
  });

  const handleAddGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateAddGoalForm()) {
      addGoalMutation.mutate(addGoalFormData);
    }
  };

  const handleAddFundsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateAddFundsForm() && selectedGoal) {
      addFundsMutation.mutate({ id: selectedGoal.id, amount: addFundsFormData.amount });
    }
  };

  const handleDeleteGoal = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta meta?')) {
      deleteGoalMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <Layout><div className="text-center py-8">Carregando metas...</div></Layout>;
  }

  if (error) {
    return <Layout><div className="text-center py-8 text-red-500">Erro ao carregar metas: {error.message}</div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Minhas Metas Pessoais</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Crie e acompanhe suas caixinhas de investimento para realizar seus sonhos!</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {personalGoals?.map((goal) => {
            const progress = (goal.current_amount / goal.target_amount) * 100;
            const progressColor = progress >= 100 ? 'bg-green-500' : 'bg-blue-500';
            return (
              <motion.div
                key={goal.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col justify-between"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{goal.name}</h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Alvo: <span className="font-bold">{formatCurrency(goal.target_amount)}</span></p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Atual: <span className="font-bold">{formatCurrency(goal.current_amount)}</span></p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
                    <div className={`${progressColor} h-2.5 rounded-full`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{progress.toFixed(2)}% alcançado</p>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    onClick={() => {
                      setSelectedGoal(goal);
                      setIsAddFundsModalOpen(true);
                      setAddFundsFormData({ amount: 0 }); // Reset add funds form when opening modal
                      setAddFundsFormErrors({}); // Clear add funds errors
                    }}
                    className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition duration-300"
                    title="Adicionar Fundos"
                  >
                    <FiDollarSign size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition duration-300"
                    title="Excluir Meta"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </motion.div>
            );
          })}

          <motion.button
            onClick={() => {
              setIsAddModalOpen(true);
              setAddGoalFormData({ name: '', target_amount: 0 }); // Reset add goal form when opening modal
              setAddGoalFormErrors({}); // Clear add goal errors
            }}
            className="bg-gray-100 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 dark:text-gray-300 hover:border-blue-500 hover:text-blue-500 transition duration-300"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <FiPlus size={36} className="mb-2" />
            <span className="text-lg font-semibold">Adicionar Nova Meta</span>
          </motion.button>
        </div>

        {/* Add Goal Modal */}
        {isAddModalOpen && (
          <Modal title="Adicionar Nova Meta" isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}>
            <form onSubmit={handleAddGoalSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome da Meta</label>
                <input
                  type="text"
                  id="name"
                  value={addGoalFormData.name}
                  onChange={handleAddGoalInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                {addGoalFormErrors.name && <p className="text-red-500 text-xs mt-1">{addGoalFormErrors.name}</p>}
              </div>
              <div>
                <label htmlFor="target_amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Valor Alvo (R$)</label>
                <input
                  type="number"
                  id="target_amount"
                  value={addGoalFormData.target_amount}
                  onChange={handleAddGoalInputChange}
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                {addGoalFormErrors.target_amount && <p className="text-red-500 text-xs mt-1">{addGoalFormErrors.target_amount}</p>}
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">Cancelar</button>
                <button type="submit" disabled={addGoalMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">{addGoalMutation.isPending ? 'Adicionando...' : 'Adicionar Meta'}</button>
              </div>
            </form>
          </Modal>
        )}

        {/* Add Funds Modal */}
        {isAddFundsModalOpen && selectedGoal && (
          <Modal title={`Adicionar Fundos a ${selectedGoal.name}`} isOpen={isAddFundsModalOpen} onClose={() => setIsAddFundsModalOpen(false)}>
            <form onSubmit={handleAddFundsSubmit} className="space-y-4">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Valor a Adicionar (R$)</label>
                <input
                  type="number"
                  id="amount"
                  value={addFundsFormData.amount}
                  onChange={handleAddFundsInputChange}
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                {addFundsFormErrors.amount && <p className="text-red-500 text-xs mt-1">{addFundsFormErrors.amount}</p>}
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button type="button" onClick={() => setIsAddFundsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">Cancelar</button>
                <button type="submit" disabled={addFundsMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">{addFundsMutation.isPending ? 'Adicionando...' : 'Adicionar'}</button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </Layout>
  );
}

interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ title, isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            &times;
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};