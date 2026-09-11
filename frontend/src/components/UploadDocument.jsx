import { useRef, useState } from 'react';
import { FileUp, Loader2, Upload } from 'lucide-react';
import api from '../api/api.js';

function UploadDocument({
  chatId,
  hasDocument = false,
  setDocuments,
  onUploaded,
  compact = false
}) {
  const inputRef = useRef(null);

  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const formatFileSize = (bytes) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFiles = async (files) => {
    const file = files[0];

    if (!file) {
      return;
    }

    if (file.type !== 'application/pdf') {
      setError('Currently only PDF files are supported.');
      return;
    }

    setError('');
    setIsUploading(true);

    try {
      const formData = new FormData();

      formData.append('document', file);

      if (chatId) {
        formData.append('chatId', chatId);
      }

      const response = await api.post('/documents/upload', formData, {
        timeout: 120000,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const document = response.data.document;

      setDocuments([
        {
          ...document,
          id: document._id,
          size: formatFileSize(document.size)
        }
      ]);
      onUploaded(
        [document._id],
        response.data.chatId,
        response.data.chat
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to upload document.'
      );
    } finally {
      setIsUploading(false);

      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleChange = (e) => {
    handleFiles(e.target.files);
  };

  if (compact) {
    return (
      <div className="group relative flex items-center">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading || hasDocument}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-white hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="Upload document"
          title="Attach a PDF document"
          aria-disabled={hasDocument}
        >
          {isUploading ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <FileUp size={17} />
          )}
        </button>

        {hasDocument && (
          <span className="pointer-events-none absolute bottom-11 left-0 z-20 w-64 rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-left text-xs font-medium leading-5 text-white opacity-0 shadow-xl transition-opacity duration-100 group-hover:opacity-100">
            You already uploaded a file. Start a new chat to upload a new file.
          </span>
        )}

        {error && (
          <p className="absolute left-0 top-10 z-10 whitespace-nowrap text-xs text-red-500">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mb-4">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleChange}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="group flex w-full items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-left transition hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-200">
          {isUploading ? (
            <Loader2
              size={18}
              className="animate-spin"
            />
          ) : (
            <FileUp size={18} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-700">
            {isUploading
              ? 'Uploading...'
              : 'Upload document'}
          </p>

          <p className="mt-0.5 text-xs text-slate-400">
            Select one PDF
          </p>
        </div>

        {!isUploading && (
          <Upload
            size={17}
            className="shrink-0 text-slate-400 transition group-hover:text-slate-700"
          />
        )}
      </button>

      {error && (
        <p className="mt-2 text-xs leading-5 text-red-500">
          {error}
        </p>
      )}

    </div>
  );
}

export default UploadDocument;