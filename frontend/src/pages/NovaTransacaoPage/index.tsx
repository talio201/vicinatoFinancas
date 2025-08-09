import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext/useAuth';
import { useFormik } from 'formik';
import * as Yup from 'yup';


// Tipagem para os dados do formulário
type FormInputs = {
  type: 'income' | 'expense';
  amount: number;
  category_id: string;
  description: string;
  date: string;
};

const transactionSchema = Yup.object().shape({
  type: Yup.string().oneOf(['income', 'expense']).required('O tipo é obrigatório'),
  amount: Yup.number().positive('O valor deve ser positivo').required('O valor é obrigatório'),
  category_id: Yup.string().uuid('Selecione uma categoria válida').required('A categoria é obrigatória'),
  description: Yup.string().optional(),
  date: Yup.string().required('A data é obrigatória'),
});

type Category = {
  id: string;
  name: string;
  user_id: string;
};
export function NovaTransacaoPage() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  const navigate = useNavigate();
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const formik = useFormik({
    initialValues: {
      type: 'expense',
      amount: 0,
      category_id: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    },
    validationSchema: transactionSchema,
    onSubmit: (values) => {
      console.log('Submitting values:', values);
      createTransactionMutation.mutate(values);
    },
  });

  // Redireciona se o usuário não estiver logado
  useEffect(() => {
    if (!session) {
      toast.error("Acesso negado. Faça login para criar uma transação.");
      navigate('/login');
    }
  }, [session, navigate]);

  

  // Busca de categorias com React Query
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
    enabled: !!session, // A query só será executada se a sessão existir
  });
  const createTransactionMutation = useMutation<Transaction, Error, FormInputs>({
    mutationFn: async (newTransaction) => {
      if (!session) {
        throw new Error("Autenticação necessária.");
      }

      const response = await fetch(`${API_BASE_URL}/api/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(newTransaction),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Não foi possível salvar a transação.');
      }

      return response.json();
    },
    onSuccess: (data: Transaction) => {
      const transactionDate = new Date(data.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (transactionDate > today) {
        toast.success("Transação agendada com sucesso!");
        queryClient.invalidateQueries({ queryKey: ['scheduledTransactions'] }); // Invalida a query de transações agendadas
      } else {
        toast.success("Transação salva com sucesso!");
        queryClient.invalidateQueries({ queryKey: ['transactions'] }); // Invalida a query de transações normais
      }
      navigate('/dashboard'); // Redireciona para o dashboard
    },
    onError: (error) => {
      toast.error(`Erro ao salvar a transação: ${error.message}`);
    },
  });

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
            Criar Nova Transação
          </h1>
          
          {/* Formulário de Transação */}
          <form onSubmit={formik.handleSubmit} noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Tipo de Transação */}
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo
                </label>
                <select
                  id="type"
                  {...formik.getFieldProps('type')}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="expense">Saída</option>
                  <option value="income">Entrada</option>
                </select>
                {formik.touched.type && formik.errors.type && <p className="text-red-500 text-xs mt-1">{formik.errors.type}</p>}
              </div>

              {/* Valor */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valor (R$)
                </label>
                <input
                  type="number"
                  id="amount"
                  {...formik.getFieldProps('amount')}
                  step="0.01"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                  placeholder="150,00"
                />
                {formik.touched.amount && formik.errors.amount && <p className="text-red-500 text-xs mt-1">{formik.errors.amount}</p>}
              </div>
            </div>

            {/* Categoria */}
            <div className="mb-4">
              <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Categoria
              </label>
              <select
                id="category_id"
                {...formik.getFieldProps('category_id')}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                disabled={isLoadingCategories || !!categoriesError}
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
              {formik.touched.category_id && formik.errors.category_id && <p className="text-red-500 text-xs mt-1">{formik.errors.category_id}</p>}
            </div>

            {/* Descrição */}
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descrição (Opcional)
              </label>
              <textarea
                id="description"
                {...formik.getFieldProps('description')}
                rows={3}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Compras do mês no supermercado"
              />
            </div>

            {/* Data */}
            <div className="mb-6">
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data
              </label>
              <input
                type="date"
                id="date"
                {...formik.getFieldProps('date')}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
              />
              {formik.touched.date && formik.errors.date && <p className="text-red-500 text-xs mt-1">{formik.errors.date}</p>}
            </div>

            {/* Botões de Ação */}
            <div className="flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="py-2 px-4 border border-gray-300 dark:border-gray-500 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createTransactionMutation.isPending}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {createTransactionMutation.isPending ? 'Salvando...' : 'Salvar Transação'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}