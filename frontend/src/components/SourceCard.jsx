import { ExternalLink, FileText } from 'lucide-react';

function SourceCard({ source }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm transition hover:border-slate-300">
      <div className="flex items-start gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500">
          <FileText size={14} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p
                className="truncate text-sm font-semibold text-slate-700"
                title={source.fileName}
              >
                {source.fileName}
              </p>

              {source.pageNumber && (
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Page {source.pageNumber}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                console.log('View source:', source);
              }}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="View source"
            >
              <ExternalLink size={13} />
            </button>
          </div>

          {source.text && (
            <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-slate-500">
              {source.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default SourceCard;