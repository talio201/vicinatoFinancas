
import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Modal from '../../components/Modal';

const registerSchema = Yup.object().shape({
  name: Yup.string().required('Nome é obrigatório'),
  email: Yup.string().email('Email inválido').required('Email é obrigatório'),
  password: Yup.string()
    .min(8, 'A senha deve ter no mínimo 8 caracteres')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      'A senha precisa conter maiúscula, minúscula, número e caractere especial'
    )
    .required('Senha é obrigatória'),
  terms: Yup.boolean().oneOf([true], 'Você deve aceitar os termos de uso'),
});

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [modalContent, setModalContent] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDocument = async (doc: 'terms' | 'privacy') => {
    const filePath = doc === 'terms' ? '/TERMS_OF_USE.md' : '/PRIVACY_POLICY.md';
    const title = doc === 'terms' ? 'Termos de Uso' : 'Política de Privacidade';
    try {
      const response = await fetch(filePath);
      const text = await response.text();
      setModalContent(text);
      setModalTitle(title);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch document:", error);
      toast.error("Não foi possível carregar o documento.");
    }
  };

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      password: '',
      terms: false,
    },
    validationSchema: registerSchema,
    onSubmit: async (values) => {
      const { name, email, password } = values;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          toast.error('Este e-mail já está em uso. Tente fazer login.');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Cadastro realizado! Verifique seu e-mail para confirmar a conta.');
        navigate('/dashboard');
      }
    },
  });

  const formVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gradient-to-br dark:from-purple-800 dark:to-indigo-900 p-4">
        <motion.div
          className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700"
          variants={formVariants}
          initial="hidden"
          animate="visible"
        >
          <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-4">Crie sua conta</h2>
          <h3 className="text-xl font-semibold text-center text-gray-600 dark:text-gray-300 mb-8">Comece a controlar suas finanças hoje!</h3>
          <form onSubmit={formik.handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-gray-600 dark:text-gray-400 mb-2 text-lg">Nome</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Seu nome completo"
              />
              {formik.touched.name && formik.errors.name && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.name}</p>
              )}
            </div>
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
                placeholder="Crie uma senha forte"
              />
              {formik.touched.password && formik.errors.password && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.password}</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="terms"
                name="terms"
                checked={formik.values.terms}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                Eu li e aceito os{' '}
                <button type="button" onClick={() => fetchDocument('terms')} className="font-medium text-purple-600 hover:text-purple-500">
                  Termos de Uso
                </button>
                {' e a '}
                <button type="button" onClick={() => fetchDocument('privacy')} className="font-medium text-purple-600 hover:text-purple-500">
                  Política de Privacidade
                </button>
                .
              </label>
            </div>
            {formik.touched.terms && formik.errors.terms && (
              <p className="text-red-500 text-sm mt-1">{formik.errors.terms}</p>
            )}

            <button
              type="submit"
              disabled={formik.isSubmitting || !formik.values.terms}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 disabled:opacity-50 text-lg shadow-lg"
            >
              {formik.isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          </form>
          <p className="text-center text-gray-600 dark:text-gray-400 mt-6 text-md">
            Já tem uma conta? <Link to="/login" className="text-purple-600 dark:text-purple-400 hover:underline font-semibold">Faça login</Link>
          </p>
        </motion.div>
      </div>

      <Modal title={modalTitle} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="prose dark:prose-invert max-h-96 overflow-y-auto">
          <pre className="whitespace-pre-wrap font-sans">{modalContent}</pre>
        </div>
      </Modal>
    </>
  );
};

export default RegisterPage;
