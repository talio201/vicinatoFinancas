import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiEdit, FiTrash2, FiCalendar } from 'react-icons/fi';
import Modal from '../../components/Modal';
import { motion } from 'framer-motion';
import Layout from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext/useAuth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

interface ScheduledTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  category_id: string;
  status: string;
  categories?: { name: string } | null;
}

interface Category {
    id: string;
    name: string;
}

interface FormInputs {
  type: 'income' | 'expense';
  amount: number;
  category_id: string;
  description: string;
  date: string;
}

interface FormErrors {
  type?: string;
  amount?: string;
  category_id?: string;
  description?: string;
  date?: string;
}

const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

export function ScheduledTransactionsPage() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<ScheduledTransaction | null>(null);
  const [editFormData, setEditFormData] = useState<FormInputs>({
    type: 'expense',
    amount: 0,
    category_id: '',
    description: '',
    date: '',
  });
  const [editFormErrors, setEditFormErrors] = useState<FormErrors>({});

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [id]: id === 'amount' ? parseFloat(value) : value,
    }));
    setEditFormErrors((prev) => ({ ...prev, [id]: undefined }));
  };

  const validateEditForm = (): boolean => {
    const errors: FormErrors = {};
    if (!editFormData.type) errors.type = 'O tipo é obrigatório';
    if (!editFormData.amount || isNaN(editFormData.amount) || editFormData.amount <= 0) errors.amount = 'O valor deve ser positivo';
    if (!editFormData.category_id) errors.category_id = 'A categoria é obrigatória';
    if (!editFormData.date) errors.date = 'A data é obrigatória';

    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Fetch scheduled transactions
  const { data: scheduledTransactions, isLoading, error } = useQuery<ScheduledTransaction[]>({
    queryKey: ['scheduledTransactions'],
    queryFn: async () => {
      if (!session) throw new Error('Autenticação necessária.');
      const response = await fetch(`${API_BASE_URL}/api/scheduled-transactions?select=*,categories(name)`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) {
        throw new Error('Não foi possível buscar as transações agendadas.');
      }
      return response.json();
    },
    enabled: !!session,
  });

  const { data: categories, isLoading: isLoadingCategories, error: categoriesError } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      if (!session) return [];

      const response = await fetch(`${API_BASE_URL}/api/categories`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Não foi possível buscar as categorias.');
      }

      return response.json();
    },
    enabled: !!session,
  });

  // Update scheduled transaction mutation
  const updateTransactionMutation = useMutation({
    mutationFn: async (updatedTransaction: FormInputs) => {
      if (!session || !selectedTransaction) throw new Error('Autenticação necessária ou transação não selecionada.');
      const response = await fetch(`${API_BASE_URL}/api/scheduled-transactions/${selectedTransaction.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(updatedTransaction),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Não foi possível atualizar a transação.');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Transação agendada atualizada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['scheduledTransactions'] });
      setIsEditModalOpen(false);
      setSelectedTransaction(null);
    },
    onError: (err: Error) => {
      toast.error(`Erro: ${err.message}`);
    },
  });

  // Delete scheduled transaction mutation
  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!session) throw new Error('Autenticação necessária.');
      const response = await fetch(`${API_BASE_URL}/api/scheduled-transactions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) {
        throw new Error('Não foi possível excluir a transação agendada.');
      }
    },
    onSuccess: () => {
      toast.success('Transação agendada excluída com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['scheduledTransactions'] });
    },
    onError: (err: Error) => {
      toast.error(`Erro: ${err.message}`);
    },
  });

  const handleEditClick = (transaction: ScheduledTransaction) => {
    setSelectedTransaction(transaction);
    setEditFormData({
      type: transaction.type,
      amount: transaction.amount,
      category_id: transaction.category_id,
      description: transaction.description || '',
      date: transaction.date.split('T')[0],
    });
    setEditFormErrors({}); // Clear previous errors
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateEditForm()) {
      updateTransactionMutation.mutate(editFormData);
    }
  };

  const handleDeleteClick = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta transação agendada?')) {
      deleteTransactionMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <Layout><div className="text-center py-8">Carregando transações agendadas...</div></Layout>;
  }

  if (error) {
    return <Layout><div className="text-center py-8 text-red-500">Erro ao carregar transações: {error.message}</div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Transações Agendadas</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Gerencie suas despesas e receitas futuras.</p>
        </motion.div>

        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          {scheduledTransactions && scheduledTransactions.length > 0 ? (
            <div className="space-y-4">
              {scheduledTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-full ${transaction.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      <FiCalendar />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 dark:text-white">{transaction.description || 'Transação Agendada'}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{transaction.categories?.name || 'Sem Categoria'} • {formatDate(transaction.date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${transaction.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                      {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}
                    </p>
                    <div className="flex items-center justify-end space-x-2 text-gray-400 mt-1">
                      <button onClick={() => handleEditClick(transaction)} className="hover:text-blue-600" title="Editar Transação">
                        <FiEdit size={18} />
                      </button>
                      <button onClick={() => handleDeleteClick(transaction.id)} className="hover:text-red-600" title="Excluir Transação">
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Nenhuma transação agendada encontrada.</p>
          )}
        </div>

        {/* Edit Modal */}
        {isEditModalOpen && selectedTransaction && (
          <Modal title="Editar Transação Agendada" isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</label>
                <select
                  id="type"
                  value={editFormData.type}
                  onChange={handleEditInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="income">Entrada</option>
                  <option value="expense">Saída</option>
                </select>
                {editFormErrors.type && <p className="text-red-500 text-xs mt-1">{editFormErrors.type}</p>}
              </div>
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Valor (R$)</label>
                <input
                  type="number"
                  id="amount"
                  value={editFormData.amount}
                  onChange={handleEditInputChange}
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                {editFormErrors.amount && <p className="text-red-500 text-xs mt-1">{editFormErrors.amount}</p>}
              </div>
              <div>
                <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoria</label>
                <select
                  id="category_id"
                  value={editFormData.category_id}
                  onChange={handleEditInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {isLoadingCategories ? (
                    <option>Carregando categorias...</option>
                  ) : categoriesError ? (
                    <option>Erro ao carregar categorias</option>
                  ) : (
                    <>
                      <option value="">Selecione uma categoria</option>
                      {categories?.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                {editFormErrors.category_id && <p className="text-red-500 text-xs mt-1">{editFormErrors.category_id}</p>}
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição (Opcional)</label>
                <textarea
                  id="description"
                  value={editFormData.description}
                  onChange={handleEditInputChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data</label>
                <input
                  type="date"
                  id="date"
                  value={editFormData.date}
                  onChange={handleEditInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                {editFormErrors.date && <p className="text-red-500 text-xs mt-1">{editFormErrors.date}</p>}
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">Cancelar</button>
                <button type="submit" disabled={updateTransactionMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">{updateTransactionMutation.isPending ? 'Atualizando...' : 'Atualizar Transação'}</button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </Layout>
  );
}