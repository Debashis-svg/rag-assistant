import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Menu } from 'lucide-react';

import api from '../api/api.js';
import Sidebar from '../components/Sidebar.jsx';
import ChatBox from '../components/ChatBox.jsx';
import LogoutConfirmation from '../components/LogoutConfirmation.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';

function Home() {
  const navigate = useNavigate();

  const normalizeDocument = (document) => ({
    ...document,
    id: document._id,
    size:
      document.size < 1024 * 1024
        ? `${(document.size / 1024).toFixed(1)} KB`
        : `${(document.size / (1024 * 1024)).toFixed(1)} MB`
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const [activeChatId, setActiveChatId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentChatTitle =
    chats.find((chat) => chat.id === activeChatId)?.title ||
    'New Chat';

  useEffect(() => {
    const loadData = async () => {
      if (!localStorage.getItem('token')) {
        navigate('/login');
        return;
      }

      try {
        const chatsResponse = await api.get('/chat');

        setDocuments([]);
        setSelectedDocumentId(null);
        setChats(
          chatsResponse.data.map((chat) => ({
            ...chat,
            id: chat._id
          }))
        );
      } catch (error) {
        if (error.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const handleNewChat = () => {
    setActiveChatId(null);
    setSelectedDocumentId(null);
    setDocuments([]);
    setMessages([]);

    setIsSidebarOpen(false);
  };

  const handleDocumentUploaded = (documentId, chatId, chat) => {
    setSelectedDocumentId(documentId);

    if (chatId) {
      setActiveChatId(chatId);
    }

    if (chat) {
      setChats((prev) =>
        prev.some((item) => item.id === chat.id)
          ? prev
          : [{ ...chat }, ...prev]
      );
    }
  };

  const handleChatDeleted = (chatId) => {
    if (activeChatId === chatId) {
      setActiveChatId(null);
      setSelectedDocumentId(null);
      setDocuments([]);
      setMessages([]);
    }
  };

  const handleSelectChat = async (chatId) => {
    setIsLoading(true);
    setActiveChatId(chatId);
    setSelectedDocumentId(null);
    setDocuments([]);
    setMessages([]);
    setIsSidebarOpen(false);

    try {
      const response = await api.get(`/chat/${chatId}`);
      setMessages(
        response.data.messages.map((message, index) => ({
          ...message,
          id: message._id || `${chatId}-${index}`
        }))
      );

      try {
        const documentsResponse = await api.get(
          `/documents?chatId=${chatId}`
        );
        setDocuments(
          documentsResponse.data.map(normalizeDocument)
        );
        setSelectedDocumentId(documentsResponse.data[0]?._id || null);
      } catch (documentError) {
        setDocuments([]);
        setSelectedDocumentId(response.data.documentId || null);
      }
    } catch (error) {
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
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
        isCollapsed={isSidebarCollapsed}
        onClose={() => setIsSidebarOpen(false)}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        chats={chats}
        setChats={setChats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onLogout={handleLogoutClick}
        onChatDeleted={handleChatDeleted}
      />

      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-[1px] lg:hidden"
        />
      )}

      <main className="relative flex min-w-0 flex-1 flex-col">

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
                QueryNest
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
          selectedDocumentId={selectedDocumentId}
          documents={documents}
          chatTitle={currentChatTitle}
          activeChatId={activeChatId}
          setActiveChatId={setActiveChatId}
          setChats={setChats}
          setDocuments={setDocuments}
          onDocumentUploaded={handleDocumentUploaded}
        />

        {isLoading && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 top-16 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[1px] dark:bg-black/70">
            <Loader2
              size={28}
              strokeWidth={1.8}
              className="animate-spin text-slate-500 dark:text-slate-300"
              aria-label="Loading"
            />
          </div>
        )}

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