import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiBarChart2, FiCreditCard, FiShield, FiTrendingUp, FiCheckCircle, FiLock, FiDollarSign } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext/useAuth';
import { useEffect } from 'react';

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <motion.div
    className="bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-indigo-500/20 transform hover:-translate-y-2 transition-all duration-300"
    variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.6 } } }}
  >
    <div className="text-indigo-400 mb-4 text-4xl">{icon}</div>
    <h3 className="text-2xl font-bold mb-3 text-white">{title}</h3>
    <p className="text-gray-400">{children}</p>
  </motion.div>
);

const LandingPage: React.FC = () => {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) {
      navigate('/dashboard');
    }
  }, [session, loading, navigate]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2, duration: 0.5 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6 } },
  };

  return (
    <motion.div
      className="min-h-screen bg-gray-900 text-white font-sans"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <nav className="fixed top-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm z-50 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center text-3xl font-bold text-white">
              <FiDollarSign className="text-indigo-400 mr-2" />
              Nós<span className="text-indigo-400">Dois</span>
            </Link>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <a href="#features" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Recursos</a>
                <a href="#cta" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Comece Agora</a>
                <Link to="/login" className="text-gray-300 bg-gray-800 hover:bg-gray-700 hover:text-white px-4 py-2 rounded-md text-sm font-bold transition-colors">Login</Link>
                <Link to="/register" className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-md text-sm transition-transform transform hover:scale-105 shadow-lg">Criar Conta</Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <section className="h-screen flex items-center justify-center text-center bg-cover bg-center" style={{ backgroundImage: "linear-gradient(to bottom, rgba(17, 24, 39, 0.9), rgba(17, 24, 39, 1)), url('https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1350&q=80')" }}>
        <div className="relative z-10 p-8 max-w-4xl mx-auto">
          <motion.h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 text-white drop-shadow-xl" variants={itemVariants}>Transforme sua Vida Financeira em Casal</motion.h1>
          <motion.p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto" variants={itemVariants}>Com o NósDois, vocês organizam despesas, alcançam metas e constroem um futuro próspero juntos. Simples, inteligente e sincronizado.</motion.p>
          <motion.div variants={itemVariants}>
            <Link to="/register" className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-4 px-10 rounded-full text-lg transition-transform transform hover:scale-105 shadow-2xl">Começar Gratuitamente</Link>
          </motion.div>
        </div>
      </section>

      <section id="features" className="py-24 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2 className="text-4xl font-bold mb-4 text-indigo-400" variants={itemVariants}>Tudo que vocês precisam em um só lugar</motion.h2>
          <motion.p className="text-lg text-gray-400 mb-16 max-w-3xl mx-auto" variants={itemVariants}>Ferramentas poderosas para um controle financeiro descomplicado e eficiente, pensado para a vida a dois.</motion.p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <FeatureCard icon={<FiCreditCard />} title="Gestão de Despesas">Adicionem e categorizem despesas e receitas em segundos. Vejam para onde o dinheiro está indo em tempo real.</FeatureCard>
            <FeatureCard icon={<FiBarChart2 />} title="Relatórios Inteligentes">Gráficos e relatórios claros que ajudam a entender seus hábitos financeiros e a tomar decisões melhores.</FeatureCard>
            <FeatureCard icon={<FiTrendingUp />} title="Metas em Comum">Definam objetivos financeiros, como uma viagem ou a compra de um imóvel, e acompanhem o progresso juntos.</FeatureCard>
            <FeatureCard icon={<FiCheckCircle />} title="Categorias Flexíveis">Crie categorias personalizadas que se adaptam ao estilo de vida e às necessidades de vocês.</FeatureCard>
            <FeatureCard icon={<FiShield />} title="Visão Individual e Conjunta">Mantenham despesas pessoais separadas, mas com uma visão clara do orçamento total do casal.</FeatureCard>
            <FeatureCard icon={<FiLock />} title="Segurança de Ponta">Seus dados são protegidos com as melhores práticas de segurança. Fiquem tranquilos, suas finanças estão seguras.</FeatureCard>
          </div>
        </div>
      </section>

      <section id="testimonial" className="py-24 bg-gray-800">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <motion.h2 className="text-4xl font-bold mb-6 text-white" variants={itemVariants}>O que nossos usuários dizem</motion.h2>
          <motion.div variants={itemVariants} className="bg-gray-900 p-8 rounded-xl shadow-lg">
            <p className="text-xl text-gray-300 mb-6">"O NósDois transformou a maneira como lidamos com o dinheiro. Agora, estamos mais alinhados e confiantes em nosso futuro financeiro."</p>
            <p className="text-indigo-400 font-bold">- Ana e João</p>
          </motion.div>
        </div>
      </section>

      <section id="cta" className="py-24 bg-gray-900">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <motion.h2 className="text-4xl font-bold mb-6 text-white" variants={itemVariants}>Prontos para dar o próximo passo?</motion.h2>
          <motion.p className="text-xl text-gray-300 mb-10" variants={itemVariants}>Junte-se a milhares de casais que estão construindo um futuro financeiro mais sólido e tranquilo.</motion.p>
          <motion.div variants={itemVariants}>
            <Link to="/register" className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-4 px-10 rounded-full text-lg transition-transform transform hover:scale-105 shadow-2xl">Crie sua conta gratuita agora</Link>
          </motion.div>
        </div>
      </section>

      <footer className="bg-gray-900 border-t border-gray-800 py-8 text-center text-gray-500">
        <p>&copy; {new Date().getFullYear()} NósDois. Todos os direitos reservados.</p>
        <div className="mt-4 space-x-6">
          <Link to="/privacy" className="hover:text-indigo-400 transition-colors">Política de Privacidade</Link>
          <Link to="/terms" className="hover:text-indigo-400 transition-colors">Termos de Uso</Link>
        </div>
      </footer>
    </motion.div>
  );
};

export default LandingPage;