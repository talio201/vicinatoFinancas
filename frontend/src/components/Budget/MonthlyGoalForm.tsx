import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext/useAuth';
import type { Category } from '../../types';

interface MonthlyGoalFormProps {
  categories: Category[];
  onGoalCreated: () => void;
}

const monthlyGoalSchema = Yup.object().shape({
  category_id: Yup.string().uuid('Selecione uma categoria válida').required('Categoria é obrigatória'),
  amount: Yup.number().positive('O valor da meta deve ser positivo').required('Valor é obrigatório'),
  month: Yup.string().matches(/^\d{4}-\d{2}$/, 'Mês inválido (YYYY-MM)').required('Mês é obrigatório'),
});

export const MonthlyGoalForm: React.FC<MonthlyGoalFormProps> = ({ categories, onGoalCreated }) => {
  const { session } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

  const addMonthlyGoalMutation = useMutation({
    mutationFn: async (newGoal: { category_id: string; amount: number; month: string }) => {
      if (!session) throw new Error('Autenticação necessária.');
      
      const response = await fetch(`${API_BASE_URL}/api/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ ...newGoal, month: `${newGoal.month}-01` }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Não foi possível adicionar a meta mensal.');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Meta mensal adicionada com sucesso!');
      onGoalCreated();
    },
    onError: (err: Error) => {
      toast.error(`Erro: ${err.message}`);
    },
  });

  const formik = useFormik({
    initialValues: {
      category_id: '',
      amount: '',
      month: new Date().toISOString().substring(0, 7),
    },
    validationSchema: monthlyGoalSchema,
    onSubmit: (values) => {
      addMonthlyGoalMutation.mutate({
        category_id: values.category_id,
        amount: parseFloat(values.amount),
        month: values.month,
      });
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="category_id" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Categoria</label>
        <select
          id="category_id"
          name="category_id"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.category_id}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:text-white"
        >
          <option value="">Selecione uma categoria</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {formik.touched.category_id && formik.errors.category_id && (
          <p className="text-red-500 text-xs italic">{formik.errors.category_id}</p>
        )}
      </div>
      <div>
        <label htmlFor="amount" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Valor da Meta</label>
        <input
          type="number"
          id="amount"
          name="amount"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.amount}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:text-white"
          placeholder="Ex: 500.00"
        />
        {formik.touched.amount && formik.errors.amount && (
          <p className="text-red-500 text-xs italic">{formik.errors.amount}</p>
        )}
      </div>
      <div>
        <label htmlFor="month" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Mês (YYYY-MM)</label>
        <input
          type="month"
          id="month"
          name="month"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.month}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:text-white"
        />
        {formik.touched.month && formik.errors.month && (
          <p className="text-red-500 text-xs italic">{formik.errors.month}</p>
        )}
      </div>
      <button
        type="submit"
        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
        disabled={addMonthlyGoalMutation.isPending}
      >
        {addMonthlyGoalMutation.isPending ? 'Adicionando...' : 'Adicionar Meta'}
      </button>
    </form>
  );
};
