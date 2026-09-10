import {
  Brain,
  FileText,
  LogOut,
  MessageSquare,
  Plus,
  X
} from 'lucide-react';

import DocumentList from './DocumentList.jsx';
import UploadDocument from './UploadDocument.jsx';

function Sidebar({
  isOpen,
  onClose,
  documents,
  setDocuments,
  selectedDocumentIds,
  onSelectDocument,
  onSelectAllDocuments,
  chats,
  setChats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onLogout
}) {
  const handleDeleteChat = (chatId) => {
    setChats((prev) => prev.filter((chat) => chat.id !== chatId));
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-80 flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:static lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <Brain size={21} />
          </div>

          <div>
            <h1 className="text-base font-bold text-slate-900">
              DocuMind
            </h1>

            <p className="text-xs text-slate-500">
              RAG Assistant
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="border-b border-slate-100 p-4">
          <button
            type="button"
            onClick={onNewChat}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-black bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-900 dark:border-white dark:bg-white dark:text-black dark:hover:bg-slate-200"
          >
            <Plus size={18} />
            New Chat
          </button>
        </div>

        <section className="border-b border-slate-100 p-4">
          <div className="mb-3 flex items-center gap-2">
            <FileText size={16} className="text-slate-500" />

            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Documents
            </h2>
          </div>

          <UploadDocument
            documents={documents}
            setDocuments={setDocuments}
          />

          <DocumentList
            documents={documents}
            setDocuments={setDocuments}
            selectedDocumentIds={selectedDocumentIds}
            onSelectDocument={onSelectDocument}
            onSelectAllDocuments={onSelectAllDocuments}
          />
        </section>

        <section className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <MessageSquare size={16} className="text-slate-500" />

            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Recent Chats
            </h2>
          </div>

          <div className="space-y-1.5">
            {chats.length === 0 ? (
              <p className="rounded-xl bg-slate-50 px-3 py-4 text-center text-xs text-slate-400">
                No chats yet
              </p>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`group flex items-center rounded-xl transition ${
                    activeChatId === chat.id
                      ? 'bg-slate-100'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectChat(chat.id)}
                    className="min-w-0 flex-1 px-3 py-2.5 text-left"
                  >
                    <p
                      className={`truncate text-sm ${
                        activeChatId === chat.id
                          ? 'font-semibold text-slate-900'
                          : 'font-medium text-slate-600'
                      }`}
                    >
                      {chat.title}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteChat(chat.id)}
                    className="mr-2 hidden h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-red-500 group-hover:flex"
                    aria-label={`Delete ${chat.title}`}
                  >
                    <X size={15} />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="shrink-0 border-t border-slate-200 p-4">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;