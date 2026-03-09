import { useState, useEffect } from 'react';
import type { ToastKind, EndpointKey } from '../types';

const CKAN_BASE = 'https://data.gov.lv/dati/api/action';
const RESOURCE_ID = '25e80bf3-f107-4ab4-89ef-251b5b9374e9';

function highlightJson(json: string): string {
  return json
    .replace(/(".*?")\s*:/g, '<span class="json-key">$1</span>:')
    .replace(/:\s*(".*?")/g, ': <span class="json-string">$1</span>')
    .replace(/:\s*(\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
    .replace(/:\s*(true|false)/g, ': <span class="json-bool">$1</span>')
    .replace(/:\s*(null)/g, ': <span class="json-null">$1</span>');
}

interface Props {
  addToast: (kind: ToastKind, message: string, durationMs?: number) => void;
}

type ViewMode = 'pretty' | 'raw';

export default function ApiTester({ addToast }: Props) {
  const [endpoint, setEndpoint] = useState<EndpointKey>('search-q');
  const [q, setQ]               = useState('SIA');
  const [limit, setLimit]       = useState('10');
  const [offset, setOffset]     = useState('0');
  const [regcode, setRegcode]   = useState('40003009497');
  const [regLimit, setRegLimit] = useState('5');
  const [sql, setSql]           = useState(
    `SELECT regcode, name, address, registered\nFROM "${RESOURCE_ID}"\nWHERE name ILIKE '%latvijas%'\nLIMIT 10`
  );

  const [urlPreview, setUrlPreview] = useState('');
  const [loading, setLoading]       = useState(false);
  const [responseHtml, setResponseHtml] = useState('');
  const [rawJson, setRawJson]           = useState('');
  const [status, setStatus]         = useState('');
  const [statusOk, setStatusOk]     = useState(true);
  const [elapsed, setElapsed]       = useState('');
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [view, setView]             = useState<ViewMode>('pretty');
  const [copyLabel, setCopyLabel]   = useState('Kopēt');
  const [copyUrlLabel, setCopyUrlLabel] = useState('Kopēt');

  function buildRequest(): { url: string; method: 'GET' | 'POST'; body?: string } {
    if (endpoint === 'search-q') {
      const safeQ = encodeURIComponent(q.trim() || 'SIA');
      return {
        url: `${CKAN_BASE}/datastore_search?resource_id=${RESOURCE_ID}&q=${safeQ}&limit=${limit || '10'}&offset=${offset || '0'}`,
        method: 'GET',
      };
    }
    if (endpoint === 'search-reg') {
      const filters = encodeURIComponent(JSON.stringify({ regcode: regcode.trim() || '40003009497' }));
      return {
        url: `${CKAN_BASE}/datastore_search?resource_id=${RESOURCE_ID}&filters=${filters}&limit=${regLimit || '5'}`,
        method: 'GET',
      };
    }
    // sql
    return {
      url: `${CKAN_BASE}/datastore_search_sql`,
      method: 'POST',
      body: JSON.stringify({ sql }),
    };
  }

  useEffect(() => {
    const { url, method, body } = buildRequest();
    if (method === 'POST') {
      setUrlPreview(`POST ${url}\n${body ?? ''}`);
    } else {
      setUrlPreview(url);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, q, limit, offset, regcode, regLimit, sql]);

  async function send() {
    const { url, method, body } = buildRequest();
    setLoading(true);
    setStatus('');
    setElapsed('');
    setTotalCount(null);
    setRawJson('');
    setResponseHtml('<span class="placeholder-text">Gaida atbildi…</span>');

    const t0 = performance.now();

    try {
      const res = await fetch(url, {
        method,
        headers: method === 'POST' ? { 'Content-Type': 'application/json' } : {},
        body: method === 'POST' ? body : undefined,
      });

      const ms = Math.round(performance.now() - t0);
      setElapsed(`${ms} ms`);
      setStatus(`${res.status} ${res.statusText}`);
      setStatusOk(res.ok);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const json = await res.json() as Record<string, any>;
      const pretty = JSON.stringify(json, null, 2);
      setRawJson(pretty);
      setResponseHtml(highlightJson(pretty));

      // CKAN success wraps data in result
      if (json.success && json.result != null) {
        const total = json.result.total as number | undefined;
        if (typeof total === 'number') setTotalCount(total);
      }

      if (res.ok) {
        addToast('success', `Atbilde saņemta ${ms} ms laikā.`);
      } else {
        const errMsg = (json.error?.message as string | undefined) ?? `HTTP ${res.status}`;
        addToast('error', errMsg);
      }
    } catch (err) {
      const ms = Math.round(performance.now() - t0);
      setElapsed(`${ms} ms`);
      setStatus('Tīkla kļūda');
      setStatusOk(false);
      const msg = err instanceof TypeError && err.message.includes('CORS')
        ? 'CORS kļūda: pārlūks bloķē tiešu POST pieprasījumu uz data.gov.lv. GET pieprasījumi darbojas.'
        : String(err);
      setResponseHtml(`<span class="response-status err">${msg}</span>`);
      addToast('error', 'Neizdevās sasniegt serveri. Pārbaudi savienojumu vai CORS politiku.');
    } finally {
      setLoading(false);
    }
  }

  function copyResponse() {
    const text = rawJson || '';
    void navigator.clipboard.writeText(text).then(() => {
      setCopyLabel('Nokopēts!');
      setTimeout(() => setCopyLabel('Kopēt'), 1500);
      addToast('success', 'JSON nokopēts starpliktuvē.');
    });
  }

  function copyUrl() {
    const { url } = buildRequest();
    void navigator.clipboard.writeText(url).then(() => {
      setCopyUrlLabel('Nokopēts!');
      setTimeout(() => setCopyUrlLabel('Kopēt'), 1500);
      addToast('success', 'URL nokopēts starpliktuvē.');
    });
  }

  const inputClass =
    'bg-[#0d1117] border border-[#30363d] rounded px-3 py-2 text-sm text-[#e6edf3] font-mono focus:outline-none focus:border-[#58a6ff] transition-colors placeholder:text-[#484f58] w-full';

  return (
    <section className="flex flex-col overflow-y-auto px-6 py-8 bg-[#161b22] border-r border-[#30363d] panel-scroll">
      <div className="mb-5">
        <h2 className="text-[17px] font-bold mb-2">API Testeris</h2>
        <p className="text-sm text-[#8b949e] leading-relaxed">
          Tieši izsauc <code className="font-mono text-[#a5d6ff] bg-[#1f2a3f] px-1 rounded text-[11px]">data.gov.lv</code> CKAN API
          un redzi neapstrādātu atbildi. Izvēlies metodi, aizpildi parametrus un nospied{' '}
          <strong className="text-[#e6edf3] font-semibold">Nosūtīt pieprasījumu</strong>.
        </p>
      </div>

      <div className="callout callout--info">
        <span className="callout-icon">💡</span>
        <div>
          <strong>Tiešs savienojums:</strong> šie pieprasījumi iet tieši uz{' '}
          <code className="font-mono text-[#a5d6ff] bg-[#1f2a3f] px-1 rounded text-[11px]">data.gov.lv</code>,
          nevis caur mūsu serveri. GET pieprasījumi darbojas pārlūkā;
          POST (SQL) var tikt bloķēts ar CORS — izmanto mūsu <code className="font-mono text-[#a5d6ff] bg-[#1f2a3f] px-1 rounded text-[11px]">/api/sql</code> labajā panelī tam.
        </div>
      </div>

      {/* Endpoint tabs */}
      <div className="flex flex-col gap-2 mb-4">
        {([
          { key: 'search-q'  as EndpointKey, method: 'GET',  label: '/datastore_search', param: '?q=…',       hint: 'Meklēt pēc nosaukuma' },
          { key: 'search-reg'as EndpointKey, method: 'GET',  label: '/datastore_search', param: '?filters=…', hint: 'Meklēt pēc reģ. numura' },
          { key: 'sql'       as EndpointKey, method: 'POST', label: '/datastore_search_sql', param: '',        hint: 'Brīvs SQL vaicājums' },
        ]).map(tab => (
          <button
            key={tab.key}
            className={`tab-btn ${endpoint === tab.key ? 'tab-btn--active' : ''}`}
            onClick={() => setEndpoint(tab.key)}
          >
            <span className={`method-badge ${tab.method === 'GET' ? 'method-get' : 'method-post'}`}>
              {tab.method}
            </span>
            <span className="tab-label">
              {tab.label}<span className="tab-param">{tab.param}</span>
            </span>
            <span className="tab-hint">{tab.hint}</span>
          </button>
        ))}
      </div>

      {/* Params: search-q */}
      {endpoint === 'search-q' && (
        <div className="mb-4">
          <div className="callout callout--tip">
            <span className="callout-icon">📖</span>
            <div>
              <strong>GET</strong> — lasām datus. Parametri pievienoti URL aiz{' '}
              <code className="font-mono bg-[#1a3a22] px-1 rounded">?</code>.
              Pilna teksta meklēšana visos laukos.
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-1.5 text-xs text-[#8b949e]">
                q <span className="text-[#f85149]">*</span>
                <span className="text-[10px] border border-[#30363d] rounded px-1.5 py-px">meklēšanas frāze</span>
              </label>
              <input className={inputClass} value={q} onChange={e => setQ(e.target.value)} placeholder='piem. "SIA Latvijas"' />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#8b949e]">limit <span className="text-[10px] opacity-70">(max 100)</span></label>
                <input type="number" className={inputClass} value={limit} min={1} max={100} onChange={e => setLimit(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#8b949e]">offset <span className="text-[10px] opacity-70">(lapošanai)</span></label>
                <input type="number" className={inputClass} value={offset} min={0} onChange={e => setOffset(e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Params: search-reg */}
      {endpoint === 'search-reg' && (
        <div className="mb-4">
          <div className="callout callout--tip">
            <span className="callout-icon">📖</span>
            <div>
              <strong>Precīza meklēšana</strong> pēc{' '}
              <code className="font-mono bg-[#1a3a22] px-1 rounded">regcode</code>.
              Latvijas reģistrācijas numurs ir 11 cipari.
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-1.5 text-xs text-[#8b949e]">
                regcode <span className="text-[#f85149]">*</span>
                <span className="text-[10px] border border-[#30363d] rounded px-1.5 py-px">reģistrācijas numurs</span>
              </label>
              <input className={inputClass} value={regcode} onChange={e => setRegcode(e.target.value)} placeholder="piem. 40003009497" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#8b949e]">limit <span className="text-[10px] opacity-70">(max 100)</span></label>
              <input type="number" className={inputClass} value={regLimit} min={1} max={100} onChange={e => setRegLimit(e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* Params: sql */}
      {endpoint === 'sql' && (
        <div className="mb-4">
          <div className="callout callout--warning">
            <span className="callout-icon">⚠️</span>
            <div>
              <strong>SQL</strong> — sarežģītāki vaicājumi. Tabulas nosaukums ir resursa ID pēdiņās.
              Piezīme: POST uz data.gov.lv var tikt bloķēts ar CORS — pārlūks to var liegt.
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-1.5 text-xs text-[#8b949e]">
              sql <span className="text-[#f85149]">*</span>
              <span className="text-[10px] border border-[#30363d] rounded px-1.5 py-px">SELECT vaicājums</span>
            </label>
            <textarea
              rows={6}
              spellCheck={false}
              className={`${inputClass} resize-y`}
              value={sql}
              onChange={e => setSql(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* URL preview */}
      <div className="mb-3 rounded-lg border border-[#30363d] bg-[#0d1117] overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#30363d]">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8b949e]">
            Pieprasījuma URL
          </span>
          <button className="copy-btn" onClick={copyUrl}>{copyUrlLabel}</button>
        </div>
        <code className="block px-3 py-2.5 text-[11.5px] font-mono text-[#79c0ff] break-all leading-relaxed whitespace-pre-wrap">
          {urlPreview || '—'}
        </code>
      </div>

      {/* Send button */}
      <button className="send-btn mb-5" onClick={() => void send()} disabled={loading}>
        <span>{loading ? 'Nosūta…' : 'Nosūtīt pieprasījumu'}</span>
        {loading && <span className="btn-spinner" />}
      </button>

      {/* Response area */}
      <div className="rounded-lg border border-[#30363d] bg-[#0d1117] overflow-hidden flex flex-col flex-1 min-h-[240px]">
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#30363d] gap-2 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8b949e]">Atbilde</span>
            {status && (
              <span className={`response-status ${statusOk ? 'ok' : 'err'}`}>{status}</span>
            )}
            {elapsed && <span className="text-[11px] text-[#8b949e]">{elapsed}</span>}
          </div>
          <div className="flex items-center gap-2">
            <div className="view-toggle">
              <button className={`view-btn ${view === 'pretty' ? 'view-btn--active' : ''}`} onClick={() => setView('pretty')}>Pretty</button>
              <button className={`view-btn ${view === 'raw' ? 'view-btn--active' : ''}`} onClick={() => setView('raw')}>Raw</button>
            </div>
            <button className="copy-btn" onClick={copyResponse}>{copyLabel}</button>
          </div>
        </div>

        {totalCount !== null && (
          <div className="flex items-center gap-3 px-3 py-1.5 border-b border-[#30363d] bg-[#0d1117]">
            <span className="text-[11px] text-[#3fb950] font-mono">{totalCount.toLocaleString()} ieraksti</span>
          </div>
        )}

        <pre className="code-pre flex-1 overflow-auto panel-scroll">
          {view === 'raw'
            ? rawJson || <span className="placeholder-text">Atbilde parādīsies šeit…</span>
            : (
              responseHtml
                ? <span dangerouslySetInnerHTML={{ __html: responseHtml }} />
                : <span className="placeholder-text">Atbilde parādīsies šeit…</span>
            )
          }
        </pre>
      </div>
    </section>
  );
}
