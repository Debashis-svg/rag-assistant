import { useMemo, useState } from 'react';
import {
  ArrowUp,
  Bot,
  FileText,
  Loader2,
  Sparkles
} from 'lucide-react';

import Message from './Message.jsx';

function ChatBox({
  messages,
  setMessages,
  selectedDocumentIds,
  documents,
  activeChatId
}) {
  const [question, setQuestion] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedDocuments = useMemo(
    () =>
      documents.filter((document) =>
        selectedDocumentIds.includes(document.id)
      ),
    [documents, selectedDocumentIds]
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

    try {
      /*
      Later backend integration:

      const response = await fetch(
        'http://localhost:5000/api/chat',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            question: trimmedQuestion,
            documentIds: selectedDocumentIds,
            chatId: activeChatId
          })
        }
      );

      Streaming response logic will be added later.
      */

      const assistantMessage = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content:
          selectedDocumentIds.length === 0
            ? 'Please select at least one document so I can answer using your uploaded knowledge base.'
            : `This is a temporary frontend response for: "${trimmedQuestion}". The real answer will come from the RAG backend once we connect Gemini and Pinecone.`,
        sources:
          selectedDocuments.length > 0
            ? [
                {
                  id: 'source-1',
                  fileName: selectedDocuments[0].name,
                  pageNumber: 12,
                  text:
                    'This is sample source text. Later this will contain the actual retrieved chunk from Pinecone.'
                }
              ]
            : [],
        suggestions:
          selectedDocumentIds.length > 0
            ? [
                'Explain this in simpler words',
                'Give me the key points',
                'What should I study next?'
              ]
            : []
      };

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          assistantMessage
        ]);

        setIsGenerating(false);
      }, 700);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-error`,
          role: 'assistant',
          content:
            'Something went wrong while generating the response.',
          sources: []
        }
      ]);

      setIsGenerating(false);
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
              Document Chat
            </h2>

            <p className="mt-0.5 truncate text-xs text-slate-500">
              {selectedDocuments.length === 0
                ? 'Select documents to begin'
                : `${selectedDocuments.length} ${
                    selectedDocuments.length === 1
                      ? 'document'
                      : 'documents'
                  } selected`}
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
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-black bg-slate-900 text-white shadow-sm dark:border-white">
                  <Bot size={26} />
                </div>

                <h2 className="mt-5 text-xl font-bold text-slate-900 sm:text-2xl">
                  Ask your documents anything
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Select one or more documents, then ask questions,
                  generate summaries, extract key points, or compare
                  information across files.
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

              {isGenerating && (
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-black bg-slate-900 text-white dark:border-white">
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
              {selectedDocuments.map((document) => (
                <div
                  key={document.id}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600"
                >
                  <FileText
                    size={13}
                    className="text-red-500"
                  />

                  <span className="max-w-40 truncate">
                    {document.name}
                  </span>
                </div>
              ))}
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
                selectedDocumentIds.length === 0
                  ? 'Select a document and ask a question...'
                  : 'Ask anything about your selected documents...'
              }
              className="max-h-40 min-h-12 w-full resize-none bg-transparent px-3 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />

            <div className="flex items-center justify-between gap-3 px-2 pb-1">
              <p className="hidden text-[11px] text-slate-400 sm:block">
                Enter to send • Shift + Enter for new line
              </p>

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
            Answers are generated from your selected documents.
            Always verify important information from the cited sources.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ChatBox;