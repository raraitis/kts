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

  return (
    <div className="bg-[#0f1117] text-[#e6edf3] flex flex-col min-h-screen font-sans">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <Header page={page} onPageChange={setPage} />

      {page === 'tool' ? (
        <main className="flex-1 overflow-hidden grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <ApiTester addToast={addToast} />
          <LookupForm addToast={addToast} />
        </main>
      ) : (
        <DocsPage />
      )}
    </div>
  );
}
