import { useRef, useState } from 'react';
import { FileUp, Loader2, Upload } from 'lucide-react';

function UploadDocument({ documents, setDocuments }) {
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
    const selectedFiles = Array.from(files);

    if (selectedFiles.length === 0) {
      return;
    }

    const invalidFile = selectedFiles.find(
      (file) => file.type !== 'application/pdf'
    );

    if (invalidFile) {
      setError('Currently only PDF files are supported.');
      return;
    }

    setError('');
    setIsUploading(true);

    try {
      /*
      Backend integration later:

      const formData = new FormData();

      selectedFiles.forEach((file) => {
        formData.append('documents', file);
      });

      const response = await api.post(
        '/documents/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setDocuments((prev) => [
        ...response.data.documents,
        ...prev
      ]);
      */

      const newDocuments = selectedFiles.map((file) => ({
        id: `${Date.now()}-${Math.random()}`,
        name: file.name,
        size: formatFileSize(file.size),
        pages: '-',
        status: 'processing'
      }));

      setDocuments((prev) => [
        ...newDocuments,
        ...prev
      ]);

      setTimeout(() => {
        setDocuments((prev) =>
          prev.map((document) =>
            newDocuments.some(
              (newDocument) => newDocument.id === document.id
            )
              ? {
                  ...document,
                  status: 'ready'
                }
              : document
          )
        );
      }, 1200);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to upload documents.'
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

  return (
    <div className="mb-4">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        multiple
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
              : 'Upload documents'}
          </p>

          <p className="mt-0.5 text-xs text-slate-400">
            Select one or multiple PDFs
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

      {documents.length > 0 && (
        <p className="mt-2 text-[11px] text-slate-400">
          {documents.length}{' '}
          {documents.length === 1
            ? 'document'
            : 'documents'}{' '}
          available
        </p>
      )}
    </div>
  );
}

export default UploadDocument;