import React from 'react';
import '../../styles/login-circles.css';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const loginSchema = Yup.object().shape({
  email: Yup.string().email('Email inválido').required('Email é obrigatório'),
  password: Yup.string().required('Senha é obrigatória'),
});

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      const { email, password } = values;
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Login realizado com sucesso!');
        navigate('/dashboard');
      }
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
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-white mb-2 sm:mb-4">Bem-vindo(a) de volta!</h2>
        <h3 className="text-lg sm:text-xl font-semibold text-center text-gray-600 dark:text-gray-300 mb-6 sm:mb-8">Acesse sua conta</h3>
        <form onSubmit={formik.handleSubmit} className="space-y-4 lg:space-y-6">
          <div>
            <label htmlFor="email" className="block text-gray-600 dark:text-gray-400 mb-2 text-lg">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="seu@email.com"
            />
            {formik.touched.email && formik.errors.email && (
              <p className="text-red-500 text-sm mt-1">{formik.errors.email}</p>
            )}
          </div>
          <div>
            <label htmlFor="password" className="block text-gray-600 dark:text-gray-400 mb-2 text-lg">Senha</label>
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
            <div className="text-right mt-2">
              <button
                type="button"
                onClick={async () => {
                  const email = formik.values.email;
                  if (!email) {
                    toast.error('Por favor, insira seu email para redefinir a senha.');
                    return;
                  }
                  const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/update-password`,
                  });
                  if (error) {
                    toast.error(error.message);
                  } else {
                    toast.success('Verifique seu email para o link de redefinição de senha!');
                  }
                }}
                className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
              >
                Esqueceu a senha?
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={formik.isSubmitting}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 disabled:opacity-50 text-lg shadow-lg"
          >
            {formik.isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <p className="text-center text-gray-600 dark:text-gray-400 mt-6 text-md">
          Não tem uma conta? <Link to="/register" className="text-purple-600 dark:text-purple-400 hover:underline font-semibold">Cadastre-se</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;