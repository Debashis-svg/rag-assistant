import { useMemo, useState } from 'react';
import {
  ArrowUp,
  Bot,
  FileText,
  Loader2,
  Sparkles
} from 'lucide-react';

import Message from './Message.jsx';
import api from '../api/api.js';
import UploadDocument from './UploadDocument.jsx';

function ChatBox({
  messages,
  setMessages,
  selectedDocumentId,
  documents,
  chatTitle,
  activeChatId,
  setActiveChatId,
  setChats,
  setDocuments,
  onDocumentUploaded
}) {
  const [question, setQuestion] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasReceivedAnswer, setHasReceivedAnswer] = useState(false);

  const selectedDocument = useMemo(
    () => documents.find((document) => document.id === selectedDocumentId),
    [documents, selectedDocumentId]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || isGenerating) {
      return;
    }

    const userMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: trimmedQuestion,
      sources: []
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');
    setIsGenerating(true);
    setHasReceivedAnswer(false);
    const assistantId = `${Date.now()}-assistant`;
    const pendingChatId = `pending-${assistantId}`;
    let persistedChatId = null;

    setChats((prev) => {
      if (activeChatId) {
        return messages.length === 0
          ? prev.map((chat) =>
              chat.id === activeChatId
                ? { ...chat, title: trimmedQuestion.slice(0, 50) }
                : chat
            )
          : prev;
      }

      return [
        {
          id: pendingChatId,
          title: trimmedQuestion.slice(0, 50),
          pending: true
        },
        ...prev
      ];
    });

    try {
      const response = await fetch(`${api.defaults.baseURL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          question: trimmedQuestion,
          documentId: selectedDocumentId,
          chatId: activeChatId
        })
      });

      if (!response.ok || !response.body) {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          if (errorData.chatId) {
            persistedChatId = errorData.chatId;
            setActiveChatId(errorData.chatId);
            setChats((prev) => {
              const chat = {
                id: errorData.chatId,
                title:
                  errorData.title || trimmedQuestion.slice(0, 50)
              };
              const withoutPending = prev.filter(
                (item) => item.id !== pendingChatId
              );

              return withoutPending.some(
                (item) => item.id === chat.id
              )
                ? withoutPending.map((item) =>
                    item.id === chat.id ? { ...item, ...chat } : item
                  )
                : [chat, ...withoutPending];
            });
          }
        }

        throw new Error('Unable to generate response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let streamedContent = '';
      let animationFrameId = null;

      const updateAssistant = (changes) => {
        setMessages((prev) =>
          prev.some((message) => message.id === assistantId)
            ? prev.map((message) =>
                message.id === assistantId
                  ? { ...message, ...changes }
                  : message
              )
            : [
                ...prev,
                {
                  id: assistantId,
                  role: 'assistant',
                  content: '',
                  sources: [],
                  suggestions: [],
                  ...changes
                }
              ]
        );
      };

      const flushStreamedContent = () => {
        animationFrameId = null;
        updateAssistant({ content: streamedContent });
      };

      const scheduleStreamedContent = () => {
        if (animationFrameId === null) {
          animationFrameId = requestAnimationFrame(
            flushStreamedContent
          );
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value || new Uint8Array(), {
          stream: !done
        });

        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        events.forEach((event) => {
          const line = event
            .split('\n')
            .find((item) => item.startsWith('data: '));

          if (!line) {
            return;
          }

          const data = JSON.parse(line.slice(6));

          if (data.type === 'start') {
            persistedChatId = data.chatId;
            setActiveChatId(data.chatId);
            setChats((prev) => {
              const chat = {
                id: data.chatId,
                title: data.title || trimmedQuestion.slice(0, 50)
              };

              const withoutPending = prev.filter(
                (item) => item.id !== pendingChatId
              );

              return withoutPending.some(
                (item) => item.id === data.chatId
              )
                ? withoutPending.map((item) =>
                    item.id === data.chatId
                      ? { ...item, title: chat.title }
                      : item
                  )
                : [chat, ...withoutPending];
            }
            );
          }

          if (data.type === 'token') {
            streamedContent += data.content;
            setHasReceivedAnswer(true);
            scheduleStreamedContent();
          }

          if (data.type === 'done') {
            setHasReceivedAnswer(true);
            updateAssistant({
              content:
                streamedContent ||
                'I could not generate a response. Please try again.',
              sources: data.sources || [],
              suggestions: data.suggestions || []
            });
          }

          if (data.type === 'error') {
            throw new Error(data.message);
          }
        });

        if (done) {
          break;
        }
      }

      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        flushStreamedContent();
      }

      setIsGenerating(false);
      setHasReceivedAnswer(false);
    } catch (err) {
      if (!persistedChatId) {
        setChats((prev) =>
          prev.filter((chat) => chat.id !== pendingChatId)
        );
      }

      setMessages((prev) => {
        const hasAssistantMessage = prev.some(
          (message) => message.id === assistantId
        );

        if (hasAssistantMessage) {
          return prev.map((message) =>
            message.id === assistantId
              ? {
                  ...message,
                  content:
                    'Something went wrong while generating the response.',
                  sources: [],
                  suggestions: []
                }
              : message
          );
        }

        return [
          ...prev,
          {
            id: assistantId,
            role: 'assistant',
            content:
              'Something went wrong while generating the response.',
            sources: []
          }
        ];
      });

      setIsGenerating(false);
      setHasReceivedAnswer(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuestion(suggestion);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-slate-900 sm:text-base">
              {chatTitle}
            </h2>

            <p className="mt-0.5 truncate text-xs text-slate-500">
              {selectedDocument
                ? '1 document selected'
                : 'Upload a document to begin'}
            </p>
          </div>

          <div className="hidden items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500 sm:flex">
            <Sparkles size={14} />
            RAG powered
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col px-4 py-6 sm:px-6">
          {messages.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="max-w-lg text-center">
                <div className="chat-bot-avatar mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-slate-900 shadow-sm dark:border-slate-200">
                  <Bot size={26} />
                </div>

                <h2 className="mt-5 text-xl font-bold text-slate-900 sm:text-2xl">
                  Ask your documents anything
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Upload a document, then ask questions, generate
                  summaries, or extract key points.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <Message
                  key={message.id}
                  message={message}
                  onSuggestionClick={handleSuggestionClick}
                />
              ))}

              {isGenerating && !hasReceivedAnswer && (
                <div className="flex items-start gap-3">
                  <div className="chat-bot-avatar flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-900 dark:border-slate-200">
                    <Bot size={18} />
                  </div>

                  <div className="rounded-2xl rounded-tl-md border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                      Thinking...
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          {selectedDocuments.length > 0 && (
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600">
                <FileText size={13} className="text-red-500" />
                <span className="max-w-40 truncate">
                  {selectedDocuments.length === 1
                    ? selectedDocuments[0].name
                    : `${selectedDocuments.length} documents attached`}
                </span>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-300 bg-white p-2 shadow-lg shadow-slate-200/50 transition focus-within:border-slate-400"
          >
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === 'Enter' &&
                  !e.shiftKey
                ) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              rows={1}
              placeholder={
                selectedDocuments.length > 0
                  ? 'Ask anything about your documents...'
                  : 'Upload a document and ask a question...'
              }
              className="max-h-40 min-h-12 w-full resize-none bg-transparent px-3 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />

            <div className="flex items-center justify-between gap-3 px-2 pb-1">
              <UploadDocument
                chatId={activeChatId}
                hasDocument={selectedDocuments.length > 0}
                setDocuments={setDocuments}
                onUploaded={onDocumentUploaded}
                compact
              />

              <div className="ml-auto flex items-center gap-2">
                <span className="text-[11px] text-slate-400">
                  {question.length}/2000
                </span>

                <button
                  type="submit"
                  disabled={
                    !question.trim() ||
                    isGenerating
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  aria-label="Send message"
                >
                  {isGenerating ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <ArrowUp size={17} />
                  )}
                </button>
              </div>
            </div>
          </form>

          <p className="mt-2 text-center text-[11px] text-slate-400">
            Answers are generated from your document.
            Always verify important information from the cited sources.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ChatBox;