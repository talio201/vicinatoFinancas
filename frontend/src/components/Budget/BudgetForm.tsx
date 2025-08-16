import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../contexts/AuthContext/useAuth';
import toast from 'react-hot-toast';

interface BudgetFormProps {
  onBudgetCreated: () => void;
}

interface Category {
  id: string;
  name: string;
}

const budgetFormSchema = Yup.object().shape({
  category_id: Yup.string().uuid('Selecione uma categoria válida').required('Categoria é obrigatória'),
  budget_amount: Yup.number().positive('O valor do orçamento deve ser positivo').required('Valor é obrigatório'),
  start_date: Yup.string().required('Data de início é obrigatória'),
  end_date: Yup.string().required('Data de fim é obrigatória'),
});

const BudgetForm: React.FC<BudgetFormProps> = ({ onBudgetCreated }) => {
  const { supabase } = useAuth();
  const [categories, setCategories] = React.useState<Category[]>([]);

  React.useEffect(() => {
    const fetchCategories = async () => {
      if (!supabase) return;
      const { data, error } = await supabase.from('categories').select('id, name');
      if (error) {
        console.error('Error fetching categories:', error.message);
        toast.error('Erro ao buscar categorias.');
      } else {
        setCategories(data || []);
      }
    };
    fetchCategories();
  }, [supabase]);

  const formik = useFormik({
    initialValues: {
      category_id: '',
      budget_amount: '',
      start_date: '',
      end_date: '',
    },
    validationSchema: budgetFormSchema,
    onSubmit: async (values, { resetForm }) => {
      if (!supabase) return;
      const { error } = await supabase.from('budgets').insert(values).select().single();

      if (error) {
        console.error('Error creating budget:', error.message);
        toast.error('Erro ao criar orçamento.');
      } else {
        toast.success('Orçamento criado com sucesso!');
        onBudgetCreated();
        resetForm();
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="category_id" className="block text-gray-300 text-sm font-bold mb-2">Categoria</label>
        <select
          id="category_id"
          name="category_id"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.category_id}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
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
        <label htmlFor="budget_amount" className="block text-gray-300 text-sm font-bold mb-2">Valor do Orçamento</label>
        <input
          type="number"
          id="budget_amount"
          name="budget_amount"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.budget_amount}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          placeholder="Ex: 500.00"
        />
        {formik.touched.budget_amount && formik.errors.budget_amount && (
          <p className="text-red-500 text-xs italic">{formik.errors.budget_amount}</p>
        )}
      </div>
      <div>
        <label htmlFor="start_date" className="block text-gray-300 text-sm font-bold mb-2">Data de Início</label>
        <input
          type="date"
          id="start_date"
          name="start_date"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.start_date}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
        {formik.touched.start_date && formik.errors.start_date && (
          <p className="text-red-500 text-xs italic">{formik.errors.start_date}</p>
        )}
      </div>
      <div>
        <label htmlFor="end_date" className="block text-gray-300 text-sm font-bold mb-2">Data de Fim</label>
        <input
          type="date"
          id="end_date"
          name="end_date"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.end_date}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
        {formik.touched.end_date && formik.errors.end_date && (
          <p className="text-red-500 text-xs italic">{formik.errors.end_date}</p>
        )}
      </div>
      <button
        type="submit"
        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        disabled={formik.isSubmitting}
      >
        {formik.isSubmitting ? 'Criando...' : 'Criar Orçamento'}
      </button>
    </form>
  );
};

export default BudgetForm;
