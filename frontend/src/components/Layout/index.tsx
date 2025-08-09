import React from 'react';
import Header from '../Header';
import { useTheme } from '../../contexts/ThemeContext/useTheme';

// O componente agora aceita `children` para encapsular o conteúdo da página.
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen flex flex-col relative ${theme}`}>
      <div className="absolute inset-0 overflow-hidden z-0">
        {/* Círculo 1 */}
        <div className="absolute w-96 h-96 top-1/4 left-1/4 border border-gray-300 dark:border-gray-700 opacity-20 rounded-full"></div>
        {/* Círculo 2 */}
        <div className="absolute w-80 h-80 top-3/4 left-1/3 border border-gray-300 dark:border-gray-700 opacity-20 rounded-full"></div>
        {/* Círculo 3 */}
        <div className="absolute w-100 h-100 top-1/2 right-1/4 border border-gray-300 dark:border-gray-700 opacity-20 rounded-full"></div>
      </div>
      <div className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white flex-grow relative z-10">
        <Header />
        {/* Renderiza o conteúdo da página passado como filho */}
        <main className="flex-grow">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
