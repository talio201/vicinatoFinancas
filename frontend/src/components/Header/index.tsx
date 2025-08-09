
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext/useTheme';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';
import { FiSun, FiMoon } from 'react-icons/fi';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Erro ao sair.');
    } else {
      toast.success('Você saiu da sua conta.');
      navigate('/login');
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 p-4 shadow-md flex justify-between items-center">
      <Link to="/" className="text-2xl font-bold text-cyan-500">Nós Dois</Link>
      <nav>
        <ul className="flex space-x-6 items-center">
          <li>
            <Link to="/dashboard" className="relative text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-300 after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-[2px] after:w-[40px] after:bg-[#00f7ff] after:origin-center after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100">Dashboard</Link>
          </li>
          <li>
            <Link to="/personal-goals" className="relative text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-300 after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-[2px] after:w-[40px] after:bg-[#00f7ff] after:origin-center after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100">Metas Pessoais</Link>
          </li>
          <li>
            <Link to="/scheduled-transactions" className="relative text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-300 after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-[2px] after:w-[40px] after:bg-[#00f7ff] after:origin-center after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100">Agendadas</Link>
          </li>
          <li>
            <Link to="/profile" className="relative text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-300 after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-[2px] after:w-[40px] after:bg-[#00f7ff] after:origin-center after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100">Perfil</Link>
          </li>
          <li>
            <Link to="/couple-dashboard" className="relative text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-300 after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-[2px] after:w-[40px] after:bg-[#00f7ff] after:origin-center after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100">Dashboard Casal</Link>
          </li>
          
          <li>
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-300"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <FiSun className="h-6 w-6 text-yellow-400" /> : <FiMoon className="h-6 w-6 text-gray-800" />}
            </button>
          </li>
          <li>
            <button 
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
            >
              Sair
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
