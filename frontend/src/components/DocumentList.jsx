import { useState } from 'react';
import {
  Check,
  ChevronDown,
  FileText,
  MoreVertical,
  RefreshCw,
  Sparkles,
  Trash2
} from 'lucide-react';

function DocumentList({
  documents,
  setDocuments,
  selectedDocumentIds,
  onSelectDocument,
  onSelectAllDocuments
}) {
  const [openMenuId, setOpenMenuId] = useState(null);

  const allSelected =
    documents.length > 0 &&
    selectedDocumentIds.length === documents.length;

  const handleDelete = (documentId) => {
    setDocuments((prev) =>
      prev.filter((document) => document.id !== documentId)
    );

    setOpenMenuId(null);
  };

  const handleRename = (documentId) => {
    const document = documents.find(
      (item) => item.id === documentId
    );

    if (!document) {
      return;
    }

    const newName = window.prompt(
      'Enter new document name',
      document.name
    );

    if (!newName || !newName.trim()) {
      return;
    }

    setDocuments((prev) =>
      prev.map((item) =>
        item.id === documentId
          ? {
              ...item,
              name: newName.trim()
            }
          : item
      )
    );

    setOpenMenuId(null);
  };

  const handleSummarize = (document) => {
    console.log('Summarize document:', document.id);
    setOpenMenuId(null);
  };

  const handleReindex = (document) => {
    console.log('Re-index document:', document.id);
    setOpenMenuId(null);
  };

  if (documents.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center">
        <FileText
          size={24}
          className="mx-auto mb-2 text-slate-300"
        />

        <p className="text-sm font-medium text-slate-500">
          No documents uploaded
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Upload a PDF to start asking questions.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={onSelectAllDocuments}
          className="flex items-center gap-2 rounded-lg px-1 py-1 text-xs font-medium text-slate-500 transition hover:text-slate-900"
        >
          <div
            className={`flex h-4 w-4 items-center justify-center rounded border transition ${
              allSelected
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-300 bg-white'
            }`}
          >
            {allSelected && <Check size={11} />}
          </div>

          {allSelected ? 'Deselect all' : 'Select all'}
        </button>

        <span className="text-[11px] text-slate-400">
          {selectedDocumentIds.length} selected
        </span>
      </div>

      <div className="space-y-2">
        {documents.map((document) => {
          const isSelected = selectedDocumentIds.includes(
            document.id
          );

          const isProcessing =
            document.status === 'processing';

          return (
            <div
              key={document.id}
              className={`relative rounded-xl border p-3 transition ${
                isSelected
                  ? 'border-slate-400 bg-slate-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() =>
                    onSelectDocument(document.id)
                  }
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                    isSelected
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-300 bg-white hover:border-slate-500'
                  }`}
                  aria-label={`Select ${document.name}`}
                >
                  {isSelected && <Check size={12} />}
                </button>

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500">
                  <FileText size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-sm font-semibold text-slate-700"
                    title={document.name}
                  >
                    {document.name}
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400">
                    {document.pages && (
                      <span>
                        {document.pages === '-'
                          ? 'Processing pages'
                          : `${document.pages} pages`}
                      </span>
                    )}

                    {document.size && (
                      <>
                        <span>•</span>
                        <span>{document.size}</span>
                      </>
                    )}
                  </div>

                  {isProcessing ? (
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-amber-600">
                      <RefreshCw
                        size={11}
                        className="animate-spin"
                      />
                      Processing
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Ready
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenMenuId((prev) =>
                        prev === document.id
                          ? null
                          : document.id
                      )
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label={`Options for ${document.name}`}
                  >
                    <MoreVertical size={17} />
                  </button>

                  {openMenuId === document.id && (
                    <div className="absolute right-0 top-9 z-20 w-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-200/60">
                      <button
                        type="button"
                        onClick={() =>
                          handleSummarize(document)
                        }
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                      >
                        <Sparkles size={14} />
                        Summarize
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleRename(document.id)
                        }
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                      >
                        <ChevronDown size={14} />
                        Rename
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleReindex(document)
                        }
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                      >
                        <RefreshCw size={14} />
                        Re-index
                      </button>

                      <div className="my-1 border-t border-slate-100" />

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(document.id)
                        }
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-red-500 transition hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DocumentList;