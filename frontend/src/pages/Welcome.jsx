import { ArrowRight, FileText, MessageCircle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

import BrandMark from '../components/BrandMark.jsx';

function Welcome() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4f8f8] text-slate-950">
      <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-amber-200/40 blur-3xl" />

      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-white shadow-lg shadow-slate-900/15">
            <BrandMark size="compact" />
          </span>
          <span className="text-lg font-bold tracking-tight">QueryNest</span>
        </Link>

        <div className="flex items-center gap-2 text-sm font-semibold">
          <Link
            to="/login"
            className="rounded-full px-4 py-2.5 text-slate-600 transition hover:bg-white hover:text-slate-950"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="rounded-full bg-slate-950 px-4 py-2.5 text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            Sign up
          </Link>
        </div>
      </nav>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-88px)] max-w-7xl items-center gap-14 px-6 pb-16 pt-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:pb-24 lg:pt-4">
        <div className="max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/75 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-cyan-700 shadow-sm backdrop-blur">
            <Sparkles size={14} />
            Your documents, understood
          </div>

          <h1 className="max-w-xl text-5xl font-black leading-[0.98] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
            Ask less.
            <br />
            <span className="text-cyan-600">Understand more.</span>
          </h1>

          <p className="mt-7 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            QueryNest turns your PDFs into a focused conversation. Find answers,
            uncover key ideas, and move through dense documents with confidence.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              to="/login"
              className="group inline-flex items-center gap-3 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-slate-900/20 transition hover:-translate-y-1 hover:bg-slate-800"
            >
              Get started
              <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/register"
              className="rounded-full border border-slate-300 bg-white/70 px-6 py-3.5 text-sm font-bold text-slate-700 transition hover:border-slate-500 hover:bg-white"
            >
              Create an account
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-2"><FileText size={15} className="text-cyan-600" /> PDF-ready</span>
            <span className="flex items-center gap-2"><MessageCircle size={15} className="text-cyan-600" /> Ask naturally</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-lg lg:justify-self-end">
          <div className="absolute -inset-5 rounded-[2.5rem] bg-cyan-300/20 blur-2xl" />
          <div className="relative overflow-hidden rounded-4xl border border-white/80 bg-slate-950 p-5 shadow-2xl shadow-cyan-950/20 sm:p-7">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-300 text-slate-950">
                  <Sparkles size={17} />
                </span>
                <div>
                  <p className="text-sm font-bold text-white">Document Chat</p>
                  <p className="text-xs text-slate-400">Ready to explore</p>
                </div>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
            </div>

            <div className="space-y-4 py-7">
              <div className="ml-auto max-w-[78%] rounded-2xl rounded-br-md bg-cyan-300 px-4 py-3 text-sm font-semibold leading-6 text-slate-950">
                What are the key ideas in this document?
              </div>
              <div className="max-w-[88%] rounded-2xl rounded-bl-md border border-white/10 bg-white/10 px-4 py-4 text-sm leading-6 text-slate-200">
                I found the main themes and supporting details. Here is a concise summary with the relevant sources.
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/6 px-4 py-3 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-cyan-300" />
              Ask about your uploaded document...
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Welcome;
