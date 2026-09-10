import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';

import Sidebar from '../components/Sidebar.jsx';
import ChatBox from '../components/ChatBox.jsx';
import LogoutConfirmation from '../components/LogoutConfirmation.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';

function Home() {
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState([]);
  const [activeChatId, setActiveChatId] = useState('1');

  const [documents, setDocuments] = useState([
    {
      id: '1',
      name: 'Operating Systems.pdf',
      pages: 124,
      size: '4.2 MB'
    },
    {
      id: '2',
      name: 'Database Management.pdf',
      pages: 98,
      size: '3.1 MB'
    }
  ]);

  const [chats, setChats] = useState([
    {
      id: '1',
      title: 'Understanding Deadlocks'
    },
    {
      id: '2',
      title: 'Database Indexing'
    }
  ]);

  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant',
      content:
        'Hi! Select or upload your documents and ask me anything about them.',
      sources: []
    }
  ]);

  const handleNewChat = () => {
    const newChat = {
      id: Date.now().toString(),
      title: 'New Chat'
    };

    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);

    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content:
          'New conversation started. Select your documents and ask a question.',
        sources: []
      }
    ]);

    setIsSidebarOpen(false);
  };

  const handleSelectDocument = (documentId) => {
    setSelectedDocumentIds((prev) =>
      prev.includes(documentId)
        ? prev.filter((id) => id !== documentId)
        : [...prev, documentId]
    );
  };

  const handleSelectAllDocuments = () => {
    if (selectedDocumentIds.length === documents.length) {
      setSelectedDocumentIds([]);
      return;
    }

    setSelectedDocumentIds(
      documents.map((document) => document.id)
    );
  };

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
    setIsSidebarOpen(false);
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    setShowLogoutModal(false);

    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 transition-colors duration-300 dark:bg-black">

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        documents={documents}
        setDocuments={setDocuments}
        selectedDocumentIds={selectedDocumentIds}
        onSelectDocument={handleSelectDocument}
        onSelectAllDocuments={handleSelectAllDocuments}
        chats={chats}
        setChats={setChats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onLogout={handleLogoutClick}
      />

      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-[1px] lg:hidden"
        />
      )}

      <main className="flex min-w-0 flex-1 flex-col">

        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 transition-colors duration-300 dark:border-slate-800 dark:bg-black sm:px-6">

          <div className="flex min-w-0 items-center">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu size={22} />
            </button>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900 dark:text-white sm:text-base">
                DocuMind
              </p>

              <p className="hidden truncate text-xs text-slate-500 dark:text-slate-400 sm:block">
                Intelligent document assistant
              </p>
            </div>
          </div>

          <ThemeToggle />
        </header>

        <ChatBox
          messages={messages}
          setMessages={setMessages}
          selectedDocumentIds={selectedDocumentIds}
          documents={documents}
          activeChatId={activeChatId}
        />

      </main>

      <LogoutConfirmation
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />

    </div>
  );
}

export default Home;