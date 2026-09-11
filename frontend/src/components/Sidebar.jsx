import {
  LogOut,
  MessageSquare,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  X
} from 'lucide-react';
import { useState } from 'react';

import api from '../api/api.js';
import BrandMark from './BrandMark.jsx';

function Sidebar({
  isOpen,
  onClose,
  chats,
  setChats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onLogout,
  onChatDeleted
}) {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deleteChatId, setDeleteChatId] = useState(null);
  const [renameChat, setRenameChat] = useState(null);
  const [renameTitle, setRenameTitle] = useState('');

  const handleRenameChat = async () => {
    if (!renameTitle.trim() || !renameChat) {
      return;
    }

    try {
      const response = await api.put(`/chat/${renameChat.id}`, {
        title: renameTitle.trim()
      });
      setChats((prev) =>
        prev.map((item) =>
          item.id === renameChat.id
            ? { ...item, title: response.data.chat.title }
            : item
        )
      );
      setRenameChat(null);
      setRenameTitle('');
      setOpenMenuId(null);
    } catch (error) {
      console.error('Unable to rename chat');
    }
  };

  const handleDeleteChat = async () => {
    try {
      await api.delete(`/chat/${deleteChatId}`);
      setChats((prev) =>
        prev.filter((chat) => chat.id !== deleteChatId)
      );
      onChatDeleted(deleteChatId);
      setDeleteChatId(null);
    } catch (error) {
      console.error('Unable to delete chat');
    }
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-80 flex-col border-r border-slate-200 bg-white transition-transform duration-300 dark:border-neutral-800 dark:bg-black lg:static lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
            <BrandMark size="compact" />
          </div>

          <div>
            <h1 className="text-base font-bold text-slate-900">
              QueryNest
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
        <div className="border-b border-slate-100 p-4 dark:border-neutral-800">
          <button
            type="button"
            onClick={onNewChat}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-black bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-900 dark:border-white dark:bg-white dark:text-black dark:hover:bg-slate-200"
          >
            <Plus size={18} />
            New Chat
          </button>
        </div>

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
                  className={`group relative flex items-center rounded-xl transition duration-200 hover:ring-1 hover:ring-cyan-400/40 hover:shadow-[0_0_16px_rgba(34,211,238,0.12)] dark:hover:ring-cyan-300/40 dark:hover:shadow-[0_0_16px_rgba(103,232,249,0.12)] ${
                    activeChatId === chat.id
                    ? 'bg-cyan-50 ring-1 ring-cyan-300/70 shadow-[0_0_14px_rgba(34,211,238,0.12)] dark:bg-cyan-950/40 dark:ring-cyan-700/70 dark:shadow-[0_0_14px_rgba(34,211,238,0.12)]'
                      : 'hover:bg-slate-50 dark:hover:bg-neutral-950'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (!chat.pending) {
                        onSelectChat(chat.id);
                      }
                    }}
                    className="min-w-0 flex-1 px-3 py-2.5 text-left disabled:cursor-wait"
                  >
                    <p
                      className={`truncate text-sm ${
                        activeChatId === chat.id
                          ? 'font-semibold text-slate-900 dark:text-white'
                          : 'font-medium text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {chat.title}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setOpenMenuId((prev) =>
                        prev === chat.id ? null : chat.id
                      )
                    }
                    className="mr-2 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-slate-700 dark:hover:bg-neutral-800 dark:hover:text-white"
                    aria-label={`Options for ${chat.title}`}
                  >
                    <MoreVertical size={16} />
                  </button>

                  {openMenuId === chat.id && (
                    <div className="absolute right-2 top-10 z-20 w-36 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
                      <button
                        type="button"
                        onClick={() => {
                          setRenameChat(chat);
                          setRenameTitle(chat.title);
                          setOpenMenuId(null);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-neutral-800 dark:hover:text-white"
                      >
                        <Pencil size={14} />
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteChatId(chat.id);
                          setOpenMenuId(null);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {deleteChatId && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900">
              Delete chat?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              This will permanently delete the chat history.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteChatId(null)}
                className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteChat}
                className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {renameChat && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleRenameChat();
            }}
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Rename chat
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Choose a name for this conversation.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRenameChat(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close rename dialog"
              >
                <X size={18} />
              </button>
            </div>

            <input
              autoFocus
              value={renameTitle}
              onChange={(event) => setRenameTitle(event.target.value)}
              maxLength={50}
              className="mt-5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5"
              aria-label="Chat name"
            />

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setRenameChat(null)}
                className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!renameTitle.trim()}
                className="flex-1 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

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