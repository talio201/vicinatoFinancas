import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../Modal';

const Footer: React.FC = () => {
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

  return (
    <>
      <footer className="bg-white dark:bg-gray-800 py-6 text-center text-gray-600 dark:text-gray-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-sm">&copy; {new Date().getFullYear()} Vicinato Finanças. Todos os direitos reservados.</p>
            <div className="flex space-x-4">
              <button onClick={() => fetchDocument('privacy')} className="text-sm hover:underline">
                Política de Privacidade
              </button>
              <button onClick={() => fetchDocument('terms')} className="text-sm hover:underline">
                Termos de Uso
              </button>
            </div>
          </div>
        </div>
      </footer>

      <Modal title={modalTitle} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="prose dark:prose-invert max-h-96 overflow-y-auto">
          <pre className="whitespace-pre-wrap font-sans">{modalContent}</pre>
        </div>
      </Modal>
    </>
  );
};

export default Footer;