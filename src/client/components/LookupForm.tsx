import { useState, useRef, useCallback, useEffect } from 'react';
import type { Company, SearchResponse, ToastKind } from '../types';
import CompanyCard from './CompanyCard';

type SearchMode = 'name' | 'regcode';

interface Props {
  addToast: (kind: ToastKind, message: string, durationMs?: number) => void;
}

function highlight(text: string, query: string): string {
  if (!query) return text;
  const safe = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`(${safe})`, 'gi'), '<mark>$1</mark>');
}

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export default function LookupForm({ addToast }: Props) {
  const [mode, setMode]           = useState<SearchMode>('name');
  const [inputValue, setInputValue] = useState('');
  const [hint, setHint]           = useState('Ievadi vismaz 2 simbolus, lai sāktu meklēšanu.');
  const [loading, setLoading]     = useState(false);
  const [results, setResults]     = useState<Company[]>([]);
  const [showList, setShowList]   = useState(false);
  const [hlIndex, setHlIndex]     = useState(-1);
  const [selected, setSelected]   = useState<Company | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  async function performSearch(value: string) {
    setLoading(true);
    const param =
      mode === 'name'
        ? `q=${encodeURIComponent(value)}&limit=12`
        : `regcode=${encodeURIComponent(value)}&limit=12`;

    try {
      const res = await fetch(`/api/search?${param}`);
      if (res.status === 429) {
        addToast('warning', 'Pārāk daudz pieprasījumu. Lūdzu uzgaidi minūti.');
        setHint('Pieprasījumu limits sasniegts. Mēģini vēlāk.');
        return;
      }
      const data = (await res.json()) as SearchResponse;
      const records = data.records ?? [];
      setResults(records);
      setShowList(true);
      setHlIndex(-1);
      if (records.length === 0) {
        setHint('Nekas netika atrasts.');
      } else {
        setHint(`Atrasti ${data.total.toLocaleString('lv-LV')} ieraksti — rāda ${records.length}`);
      }
    } catch {
      setHint('Kļūda ielādējot rezultātus.');
      addToast('error', 'Neizdevās ielādēt meklēšanas rezultātus.');
      setShowList(false);
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(debounce(performSearch, 280), [mode]);

  function handleInput(value: string) {
    setInputValue(value);
    if (value.trim().length < 2) {
      setShowList(false);
      setHint('Ievadi vismaz 2 simbolus, lai sāktu meklēšanu.');
      return;
    }
    setHint('Meklē…');
    debouncedSearch(value.trim());
  }

  function selectRecord(rec: Company) {
    setInputValue(rec.name);
    setShowList(false);
    setSelected(rec);
    addToast('info', `Izvēlēts: ${rec.name}`);
  }

  function handleKeydown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showList || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHlIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHlIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (hlIndex >= 0 && results[hlIndex]) selectRecord(results[hlIndex]!);
    } else if (e.key === 'Escape') {
      setShowList(false);
    }
  }

  useEffect(() => {
    if (hlIndex >= 0 && listRef.current) {
      const item = listRef.current.children[hlIndex] as HTMLElement | undefined;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [hlIndex]);

  function changeMode(m: SearchMode) {
    setMode(m);
    setInputValue('');
    setShowList(false);
    setHint('Ievadi vismaz 2 simbolus, lai sāktu meklēšanu.');
  }

  return (
    <section className="flex flex-col flex-1 overflow-hidden bg-white">
      {/* Section header */}
      <div className="px-4 pt-5 pb-4 sm:px-6 sm:pt-6 border-b border-gray-200 shrink-0">
        <h2 className="text-[17px] font-bold text-[#24292f] mb-1">Uzņēmumu Meklētājs</h2>
        <p className="text-sm text-[#656d76] leading-relaxed">
          Meklē Latvijas uzņēmumus pēc nosaukuma vai reģistrācijas numura.
          Dati no <strong>data.gov.lv</strong> caur mūsu <code className="font-mono text-xs bg-gray-100 px-1 rounded">/api/search</code> proxy.
        </p>
      </div>

      <div className="px-4 pt-4 sm:px-6 sm:pt-5 flex flex-col flex-1 overflow-hidden">
        {/* Mode toggle */}
        <div className="mode-toggle">
          <button
            className={`mode-btn ${mode === 'name' ? 'mode-btn--active' : ''}`}
            onClick={() => changeMode('name')}
          >
            🔤 Pēc nosaukuma
          </button>
          <button
            className={`mode-btn ${mode === 'regcode' ? 'mode-btn--active' : ''}`}
            onClick={() => changeMode('regcode')}
          >
            🔢 Pēc reģ. numura
          </button>
        </div>

        {/* Search input */}
        <div className="relative mb-2">
          <input
            type={mode === 'regcode' ? 'tel' : 'text'}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-[#24292f]
                       focus:outline-none focus:border-[#0969da] focus:ring-2 focus:ring-[#0969da]/20
                       transition-colors placeholder:text-[#8c959f]"
            placeholder={mode === 'name' ? 'Sāc rakstīt uzņēmuma nosaukumu…' : 'Ievadi reģistrācijas numuru…'}
            value={inputValue}
            onChange={e => handleInput(e.target.value)}
            onKeyDown={handleKeydown}
            onBlur={() => setTimeout(() => setShowList(false), 150)}
          />
          {loading && (
            <span className="lookup-spinner absolute right-3 top-1/2 -translate-y-1/2" />
          )}
        </div>

        {/* Hint */}
        <p className="text-xs text-[#656d76] mb-2">{hint}</p>

        {/* Suggestions dropdown */}
        {showList && (
          <ul
            ref={listRef}
            className="border border-gray-200 rounded-lg bg-white shadow-md max-h-72 overflow-y-auto mb-4 panel-scroll"
          >
            {results.length === 0 ? (
              <li className="suggestions-empty">Neviens uzņēmums neatbilst meklēšanai.</li>
            ) : (
              results.map((rec, idx) => (
                <li
                  key={rec._id}
                  className={`suggestion-item ${idx === hlIndex ? 'highlighted' : ''}`}
                  onMouseDown={() => selectRecord(rec)}
                >
                  <div
                    className="sug-name"
                    dangerouslySetInnerHTML={{ __html: highlight(rec.name, inputValue) }}
                  />
                  <div className="sug-meta">
                    <span className="sug-regcode">{rec.regcode}</span>
                    <span className="sug-type">{rec.type_text || rec.type || '—'}</span>
                  </div>
                  {rec.address && <div className="sug-address">{rec.address}</div>}
                </li>
              ))
            )}
          </ul>
        )}

        {/* Company card */}
        <div className="flex-1 overflow-y-auto panel-scroll">
          {selected ? (
            <CompanyCard record={selected} onClear={() => { setSelected(null); setInputValue(''); }} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <span className="text-4xl mb-3">🏢</span>
              <p className="text-sm text-[#656d76]">
                Izvēlies uzņēmumu no saraksta,<br />lai redzētu detalizētu informāciju.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
