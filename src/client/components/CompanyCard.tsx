import { useState } from 'react';
import type { Company } from '../types';

function highlightJson(json: string): string {
  return json
    .replace(/(".*?")\s*:/g, '<span class="json-key">$1</span>:')
    .replace(/:\s*(".*?")/g, ': <span class="json-string">$1</span>')
    .replace(/:\s*(\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
    .replace(/:\s*(true|false)/g, ': <span class="json-bool">$1</span>')
    .replace(/:\s*(null)/g, ': <span class="json-null">$1</span>');
}

function formatDate(raw: string | null | undefined): string {
  if (!raw) return '—';
  const d = new Date(raw);
  return isNaN(d.getTime()) ? raw : d.toLocaleDateString('lv-LV');
}

interface Props {
  record: Company;
  onClear: () => void;
}

export default function CompanyCard({ record, onClear }: Props) {
  const [rawVisible, setRawVisible] = useState(false);

  const closed = record.closed && record.closed.trim() !== ' ' && record.closed.trim() !== '';
  const isActive = !closed && !record.terminated;

  const rowClass = 'flex gap-2 py-1.5 border-b border-gray-100 last:border-0';
  const labelClass = 'text-xs text-[#656d76] w-28 shrink-0 pt-px';
  const valueClass = 'text-sm text-[#24292f] break-words min-w-0';

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="flex items-start justify-between gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-[#24292f] leading-snug mb-1">{record.name}</h3>
          <span className={`card-status ${isActive ? 'active' : 'inactive'}`}>
            {isActive ? 'Aktīvs' : 'Slēgts'}
          </span>
        </div>
        <button
          onClick={onClear}
          className="text-[#656d76] hover:text-[#24292f] text-lg leading-none p-1 -mr-1 transition-colors shrink-0"
          title="Aizvērt"
        >
          ✕
        </button>
      </div>

      {/* Card body */}
      <div className="px-4 py-2">
        {([
          ['Reģ. nr.',     String(record.regcode ?? '—')],
          ['SEPA kods',    record.sepa            || '—'],
          ['Veids',        record.type_text || record.type || '—'],
          ['Reģ. veids',   record.regtype_text || record.regtype || '—'],
          ['Adrese',       record.address         || '—'],
          ['Reģistrēts',   formatDate(record.registered)],
          ['Izbeigts',     formatDate(record.terminated ?? undefined)],
        ] as [string, string][]).map(([label, value]) => (
          <div key={label} className={rowClass}>
            <span className={labelClass}>{label}</span>
            <span className={valueClass}>{value}</span>
          </div>
        ))}
      </div>

      {/* Raw JSON toggle */}
      <div className="px-4 pb-3">
        <button
          className="text-xs text-[#0969da] hover:underline cursor-pointer"
          onClick={() => setRawVisible(v => !v)}
        >
          {rawVisible ? 'Paslēpt JSON atbildi' : 'Rādīt neapstrādātu JSON atbildi'}
        </button>
        {rawVisible && (
          <pre className="mt-2 rounded bg-[#0d1117] border border-[#30363d] code-pre panel-scroll overflow-auto max-h-64">
            <span dangerouslySetInnerHTML={{ __html: highlightJson(JSON.stringify(record, null, 2)) }} />
          </pre>
        )}
      </div>
    </div>
  );
}
