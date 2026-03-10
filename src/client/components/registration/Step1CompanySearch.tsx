import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Building2, Search, CheckCircle2, ChevronRight } from 'lucide-react';
import { useRegistrationStore } from '../../stores/StoreContext';
import type { Company } from '../../types';

/**
 * Step 1 — Company search.
 * Calls /api/search (the existing proxy) and lets the user pick a result.
 * On selection, stores the company in RegistrationStore and advances.
 */
const Step1CompanySearch = observer(() => {
  const store = useRegistrationStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search() {
    if (query.trim().length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}&limit=10`);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const json = await res.json();
      setResults(json.records ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  function pick(company: Company) {
    store.selectCompany(company);
    setResults([]);
    setQuery('');
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-[#e6edf3] mb-1 flex items-center gap-2">
          <Building2 size={15} className="text-[#58a6ff]" />
          Find your company
        </h3>
        <p className="text-xs text-[#8b949e]">
          Search the Latvian company register and select your organisation.
        </p>
      </div>

      {/* Search input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="Company name or reg. number…"
          className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-sm text-[#e6edf3] placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff]"
        />
        <button
          onClick={search}
          disabled={loading || query.trim().length < 2}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#238636] hover:bg-[#2ea043] disabled:opacity-40 disabled:cursor-not-allowed rounded-md text-xs font-semibold text-white transition-colors"
        >
          <Search size={13} />
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>

      {error && <p className="text-xs text-[#f85149]">{error}</p>}

      {/* Selected company summary */}
      {store.company && (
        <div className="flex items-start gap-3 p-3 rounded-lg border border-[#238636] bg-[#0d2114]">
          <CheckCircle2 size={15} className="text-[#3fb950] mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#e6edf3] truncate">{store.company.name}</p>
            <p className="text-xs text-[#8b949e]">
              Reg. {store.company.regcode} · {store.company.address}
            </p>
          </div>
          <button
            onClick={() => store.clearCompany()}
            className="ml-auto shrink-0 text-[10px] text-[#8b949e] hover:text-[#f85149] transition-colors"
          >
            Change
          </button>
        </div>
      )}

      {/* Results list */}
      {results.length > 0 && !store.company && (
        <ul className="divide-y divide-[#21262d] border border-[#30363d] rounded-lg overflow-hidden">
          {results.map((c) => (
            <li key={c._id}>
              <button
                onClick={() => pick(c)}
                className="w-full text-left px-3 py-2.5 hover:bg-[#161b22] transition-colors"
              >
                <p className="text-sm text-[#e6edf3] font-medium truncate">{c.name}</p>
                <p className="text-xs text-[#8b949e]">
                  Reg. {c.regcode} · {c.address}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Next */}
      <button
        onClick={() => store.nextStep()}
        disabled={!store.canProceedFromStep1}
        className="mt-2 flex items-center gap-1.5 px-4 py-2 bg-[#58a6ff] hover:bg-[#79c0ff] disabled:opacity-40 disabled:cursor-not-allowed rounded-md text-xs font-semibold text-[#0d1117] transition-colors"
      >
        Continue <ChevronRight size={13} />
      </button>
    </div>
  );
});

export default Step1CompanySearch;
