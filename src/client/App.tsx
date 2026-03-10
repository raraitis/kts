import { useState } from 'react';
import { useToast } from './hooks/useToast';
import type { Page, MirrorState } from './types';
import { Terminal, Search } from 'lucide-react';
import ToastContainer from './components/ToastContainer';
import Header from './components/Header';
import ApiTester from './components/ApiTester';
import LookupForm from './components/LookupForm';
import DocsPage from './components/DocsPage';
import RegistrationForm from './components/registration/RegistrationForm';

export default function App() {
  const { toasts, addToast, removeToast } = useToast();
  const [page, setPage] = useState<Page>('tool');
  const [mobileTab, setMobileTab] = useState<'api' | 'lookup'>('lookup');
  const [mirror, setMirror] = useState<MirrorState | null>(null);

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
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                mobileTab === 'api'
                  ? 'text-[#e6edf3] border-[#58a6ff]'
                  : 'text-[#8b949e] border-transparent'
              }`}
            >
              <Terminal size={14} /> API Testeris
              {mirror && <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] ml-1 live-dot" />}
            </button>
            <button
              onClick={() => setMobileTab('lookup')}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                mobileTab === 'lookup'
                  ? 'text-[#e6edf3] border-[#58a6ff]'
                  : 'text-[#8b949e] border-transparent'
              }`}
            >
              <Search size={14} /> Meklētājs
            </button>
          </div>

          <main className="flex flex-col flex-1 min-h-0 md:grid md:grid-cols-2">
            <div className={`${
              mobileTab !== 'api' ? 'hidden' : 'flex flex-col flex-1 min-h-0'
            } md:flex md:flex-col md:min-h-0`}>
              <ApiTester addToast={addToast} mirror={mirror} />
            </div>
            <div className={`${
              mobileTab !== 'lookup' ? 'hidden' : 'flex flex-col flex-1 min-h-0'
            } md:flex md:flex-col md:min-h-0`}>
              <LookupForm addToast={addToast} setMirror={setMirror} />
            </div>
          </main>
        </>
      ) : page === 'register' ? (
        <div className="flex flex-1 overflow-y-auto bg-[#0f1117] px-4 py-8 panel-scroll">
          <RegistrationForm />
        </div>
      ) : (
        <DocsPage />
      )}
    </div>
  );
}
