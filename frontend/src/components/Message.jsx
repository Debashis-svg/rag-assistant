import { Bot, Check, Copy, User } from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import SourceCard from './SourceCard.jsx';

function Message({ message, onSuggestionClick }) {
  const [copied, setCopied] = useState(false);

  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (err) {
      console.error('Unable to copy message');
    }
  };

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="flex max-w-[85%] items-start gap-3 sm:max-w-[75%]">
          <div className="rounded-2xl rounded-tr-md bg-slate-900 px-4 py-3 text-sm leading-6 text-white">
            {message.content}
          </div>

          <div className="chat-user-avatar flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
            <User size={17} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="chat-bot-avatar flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-900 dark:border-slate-200">
        <Bot size={18} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="group relative rounded-2xl rounded-tl-md border border-slate-200 bg-slate-50 px-4 py-4 sm:px-5">
          <div className="prose prose-slate max-w-none text-sm leading-7">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-400 opacity-0 shadow-sm ring-1 ring-slate-200 transition hover:text-slate-700 group-hover:opacity-100"
            aria-label="Copy response"
          >
            {copied ? (
              <Check
                size={15}
                className="text-emerald-500"
              />
            ) : (
              <Copy size={15} />
            )}
          </button>
        </div>

        {message.sources?.length > 0 && (
          <div className="mt-3">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Sources
            </p>

            <div className="grid gap-1.5 sm:grid-cols-2">
              {message.sources.map((source, index) => (
                <SourceCard
                  key={`${source.documentId || source.fileName || 'source'}-${source.pageNumber || 'page'}-${index}`}
                  source={source}
                />
              ))}
            </div>
          </div>
        )}

        {message.suggestions?.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold text-slate-500">
              You may also ask
            </p>

            <div className="flex flex-wrap gap-2">
              {message.suggestions.map((suggestion, index) => (
                <button
                  key={`${message.id}-${index}`}
                  type="button"
                  onClick={() =>
                    onSuggestionClick(suggestion)
                  }
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-left text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Message;