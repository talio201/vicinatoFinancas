import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const updatePasswordSchema = Yup.object().shape({
  password: Yup.string().min(6, 'A senha deve ter pelo menos 6 caracteres').required('Senha é obrigatória'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), undefined], 'As senhas devem ser iguais')
    .required('Confirmação de senha é obrigatória'),
});

const UpdatePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validationSchema: updatePasswordSchema,
    onSubmit: async (values) => {
      setLoading(true);
      const { password } = values;
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Senha atualizada com sucesso!');
        navigate('/dashboard'); // Or navigate to login page
      }
      setLoading(false);
    },
  });

  const formVariants: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100 dark:bg-gradient-to-br dark:from-purple-800 dark:to-indigo-900 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      <div className="background-circle circle-1"></div>
      <div className="background-circle circle-2"></div>
      <div className="background-circle circle-3"></div>
      <motion.div
        className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-sm sm:max-w-md md:max-w-lg border border-gray-200 dark:border-gray-700 z-10"
        variants={formVariants}
        initial="hidden"
        animate="visible"
      >
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-white mb-2 sm:mb-4">Redefinir Senha</h2>
        <h3 className="text-lg sm:text-xl font-semibold text-center text-gray-600 dark:text-gray-300 mb-6 sm:mb-8">Insira sua nova senha</h3>
        <form onSubmit={formik.handleSubmit} className="space-y-4 lg:space-y-6">
          <div>
            <label htmlFor="password" className="block text-gray-600 dark:text-gray-400 mb-2 text-lg">Nova Senha</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="********"
            />
            {formik.touched.password && formik.errors.password && (
              <p className="text-red-500 text-sm mt-1">{formik.errors.password}</p>
            )}
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-gray-600 dark:text-gray-400 mb-2 text-lg">Confirmar Nova Senha</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="********"
            />
            {formik.touched.confirmPassword && formik.errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{formik.errors.confirmPassword}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 disabled:opacity-50 text-lg shadow-lg"
          >
            {loading ? 'Redefinindo...' : 'Redefinir Senha'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default UpdatePasswordPage;