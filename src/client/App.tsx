import { useState } from 'react';
import { useToast } from './hooks/useToast';
import type { Page } from './types';
import ToastContainer from './components/ToastContainer';
import Header from './components/Header';
import ApiTester from './components/ApiTester';
import LookupForm from './components/LookupForm';
import DocsPage from './components/DocsPage';

export default function App() {
  const { toasts, addToast, removeToast } = useToast();
  const [page, setPage] = useState<Page>('tool');
  const [mobileTab, setMobileTab] = useState<'api' | 'lookup'>('lookup');

  return (
    <div className="bg-[#0f1117] text-[#e6edf3] flex flex-col min-h-screen font-sans">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <Header page={page} onPageChange={setPage} />

      {page === 'tool' ? (
        <>
          {/* Mobile-only panel switcher */}
          <div className="flex md:hidden shrink-0 bg-[#161b22] border-b border-[#30363d]">
            <button
              onClick={() => setMobileTab('api')}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                mobileTab === 'api'
                  ? 'text-[#e6edf3] border-[#58a6ff]'
                  : 'text-[#8b949e] border-transparent'
              }`}
            >
              🛠 API Testeris
            </button>
            <button
              onClick={() => setMobileTab('lookup')}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                mobileTab === 'lookup'
                  ? 'text-[#e6edf3] border-[#58a6ff]'
                  : 'text-[#8b949e] border-transparent'
              }`}
            >
              🔍 Meklētājs
            </button>
          </div>

          <main className="flex flex-col flex-1 min-h-0 md:grid md:grid-cols-2">
            <div className={`${
              mobileTab !== 'api' ? 'hidden' : 'flex flex-col flex-1 min-h-0'
            } md:flex md:flex-col md:min-h-0`}>
              <ApiTester addToast={addToast} />
            </div>
            <div className={`${
              mobileTab !== 'lookup' ? 'hidden' : 'flex flex-col flex-1 min-h-0'
            } md:flex md:flex-col md:min-h-0`}>
              <LookupForm addToast={addToast} />
            </div>
          </main>
        </>
      ) : (
        <DocsPage />
      )}
    </div>
  );
}
