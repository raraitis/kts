import { useState } from 'react';

interface Snippet {
  id: string;
  lang: string;
  code: string;
}

const RESOURCE_ID = '25e80bf3-f107-4ab4-89ef-251b5b9374e9';
const BASE = 'https://data.gov.lv/dati/api/action';

const snippets: Record<string, Snippet> = {
  searchQ: {
    id: 'search-q',
    lang: 'bash',
    code: `curl "https://yourapp.example.com/api/search?q=Latvijas&limit=5"`,
  },
  searchReg: {
    id: 'search-reg',
    lang: 'bash',
    code: `curl "https://yourapp.example.com/api/search?regcode=40003009497"`,
  },
  sql: {
    id: 'sql',
    lang: 'bash',
    code: `curl -X POST https://yourapp.example.com/api/sql \\
  -H "Content-Type: application/json" \\
  -d '{"sql":"SELECT regcode, name, address FROM \\"${RESOURCE_ID}\\" WHERE name ILIKE \\'%latvijas%\\' LIMIT 10"}'`,
  },
  health: {
    id: 'health',
    lang: 'bash',
    code: `curl https://yourapp.example.com/api/health`,
  },
  ckanDirect: {
    id: 'ckan-direct',
    lang: 'bash',
    code: `# Tiešs GET uz data.gov.lv (darbojas no pārlūka un server-side)
curl "${BASE}/datastore_search?resource_id=${RESOURCE_ID}&q=latvijas&limit=5"`,
  },
  jsBasic: {
    id: 'js-basic',
    lang: 'typescript',
    code: `const res  = await fetch('/api/search?q=SIA+Latvijas&limit=5');
const data = await res.json();
// data.total    — kopējais skaits
// data.records  — masīvs ar uzņēmumiem
// data.meta     — lapošanas metadati
console.log(data.records[0].name, data.records[0].regcode);`,
  },
  jsRegcode: {
    id: 'js-regcode',
    lang: 'typescript',
    code: `const res  = await fetch('/api/search?regcode=40003009497');
const data = await res.json();
if (data.records.length > 0) {
  const company = data.records[0];
  console.log(company.name);      // "LATTELECOM SIA"
  console.log(company.address);   // adrese
  console.log(company.registered); // reģistrācijas datums
}`,
  },
  jsSql: {
    id: 'js-sql',
    lang: 'typescript',
    code: `const res = await fetch('/api/sql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sql: \`SELECT regcode, name, type_text, registered
          FROM "${RESOURCE_ID}"
          WHERE type = 'SIA'
          ORDER BY registered DESC
          LIMIT 20\`
  }),
});
const data = await res.json();
// data.records — masīvs ar uzņēmumiem
// data.fields  — lauku apraksts`,
  },
  responseShape: {
    id: 'response-shape',
    lang: 'typescript',
    code: `interface SearchResponse {
  total: number;        // kopējais atbilstošo ierakstu skaits
  records: Company[];  // lapas ieraksti
  meta: {
    resource_id:  string;  // CKAN resursa ID
    limit:        number;
    offset:       number;
    upstream_url: string;  // upstream pieprasījuma URL
  };
}

interface Company {
  _id:          number;
  regcode:      string | number;  // 11-ciparu reģ. numurs
  name:         string;
  type:         string;           // piem. "SIA"
  type_text:    string;           // piem. "Sabiedrība ar ierobežotu atbildību"
  regtype:      string;
  regtype_text: string;
  address:      string;
  registered:   string;           // ISO datums piem. "1994-09-01"
  terminated:   string | null;
  closed:       string;
}`,
  },
};

function CodeBlock({ snippet, title }: { snippet: Snippet; title?: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    void navigator.clipboard.writeText(snippet.code.trim()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div className="rounded-lg border border-[#30363d] bg-[#0d1117] overflow-hidden mb-4">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#30363d]">
        <div className="flex items-center gap-2">
          {title && <span className="text-xs text-[#8b949e]">{title}</span>}
          <span className="code-lang">{snippet.lang}</span>
        </div>
        <button className="copy-btn" onClick={copy}>
          {copied ? '✓ Nokopēts' : 'Kopēt'}
        </button>
      </div>
      <pre id={`snippet-${snippet.id}`} className="code-pre overflow-x-auto">
        {snippet.code}
      </pre>
    </div>
  );
}

export default function DocsPage() {
  return (
    <div className="flex flex-1 overflow-hidden bg-white">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-gray-200 py-6 px-3 overflow-y-auto panel-scroll">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#656d76] px-3 mb-2">
          Satura rādītājs
        </p>
        <nav className="flex flex-col gap-0.5">
          {[
            ['#intro',     '📖 Ievads'],
            ['#endpoints', '🔌 Galapunkti'],
            ['#search-q',  '  GET ?q=…'],
            ['#search-reg','  GET ?regcode=…'],
            ['#sql',       '  POST /sql'],
            ['#health',    '  GET /health'],
            ['#ckan',      '🌐 CKAN API tieši'],
            ['#response',  '📦 Atbildes formāts'],
            ['#js',        '💻 JS piemēri'],
            ['#errors',    '⚠️ Kļūdu kodi'],
            ['#limits',    '🚦 Ātruma limits'],
          ].map(([href, label]) => (
            <a key={href} href={href} className="docs-nav-link" style={{ paddingLeft: href.startsWith('#search') || href === '#sql' || href === '#health' ? '1.5rem' : undefined }}>
              {label}
            </a>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <article className="flex-1 overflow-y-auto px-10 py-8 max-w-3xl panel-scroll text-[#24292f]">

        <section id="intro" className="mb-10">
          <h1 className="text-2xl font-bold mb-3">API Dokumentācija</h1>
          <p className="text-sm text-[#656d76] leading-relaxed mb-4">
            Šī lietotne nodrošina vienkāršu HTTP API piekļuvei Latvijas uzņēmumu reģistram.
            Dati nāk no <a className="text-[#0969da] hover:underline" href="https://data.gov.lv" target="_blank" rel="noopener">data.gov.lv</a> CKAN datubāzes.
            Mūsu serveris darbojas kā starpnieks (proxy), pievienojot ātruma limitus un vienkāršotu atbildes formātu.
          </p>
          <div className="callout callout--light">
            <span className="callout-icon">💡</span>
            <div>
              Bāzes URL: <code className="font-mono text-xs bg-blue-50 px-1 rounded">https://yourapp.example.com</code>
              {' '}— aizstāj ar savu Railway / lokālo adresi.
              Lokāli: <code className="font-mono text-xs bg-blue-50 px-1 rounded">http://localhost:3000</code>
            </div>
          </div>
        </section>

        <section id="endpoints" className="mb-10">
          <h2 className="text-xl font-bold mb-4 pb-2 border-b border-gray-200">🔌 API Galapunkti</h2>

          <div id="search-q" className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="method-badge method-get">GET</span>
              <code className="font-mono text-sm">/api/search?q=…</code>
            </div>
            <p className="text-sm text-[#656d76] mb-3 leading-relaxed">
              Meklē uzņēmumus pēc nosaukuma. Izmanto pilna teksta meklēšanu — atrod sakritības jebkurā laukā.
            </p>
            <div className="overflow-x-auto mb-3">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-3 py-2 border border-gray-200 font-semibold">Parametrs</th>
                    <th className="text-left px-3 py-2 border border-gray-200 font-semibold">Tips</th>
                    <th className="text-left px-3 py-2 border border-gray-200 font-semibold">Obligāts</th>
                    <th className="text-left px-3 py-2 border border-gray-200 font-semibold">Apraksts</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['q',      'string',  'Jā*', 'Meklēšanas frāze (max 200 rakstzīmes)'],
                    ['limit',  'integer', 'Nē',  'Rezultātu skaits (noklusējums: 10, max: 50)'],
                    ['offset', 'integer', 'Nē',  'Izlaižamo ierakstu skaits (noklusējums: 0)'],
                  ].map(([p, t, r, d]) => (
                    <tr key={p}>
                      <td className="px-3 py-2 border border-gray-200 font-mono text-[#0969da]">{p}</td>
                      <td className="px-3 py-2 border border-gray-200 text-[#656d76]">{t}</td>
                      <td className="px-3 py-2 border border-gray-200">{r}</td>
                      <td className="px-3 py-2 border border-gray-200 text-[#656d76]">{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[11px] text-[#656d76] mt-1">* Jānodrošina vai nu <code className="font-mono">q</code>, vai <code className="font-mono">regcode</code>.</p>
            </div>
            <CodeBlock snippet={snippets.searchQ!} />
          </div>

          <div id="search-reg" className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="method-badge method-get">GET</span>
              <code className="font-mono text-sm">/api/search?regcode=…</code>
            </div>
            <p className="text-sm text-[#656d76] mb-3 leading-relaxed">
              Meklē uzņēmumu pēc precīza reģistrācijas numura (11 cipari).
            </p>
            <CodeBlock snippet={snippets.searchReg!} />
          </div>

          <div id="sql" className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="method-badge method-post">POST</span>
              <code className="font-mono text-sm">/api/sql</code>
            </div>
            <p className="text-sm text-[#656d76] mb-3 leading-relaxed">
              Izpilda brīvu SQL vaicājumu pret CKAN datubāzi. Atļauti tikai <code className="font-mono text-xs bg-gray-100 px-1 rounded">SELECT</code> vaicājumi.
              Pieprasījuma pamatteksts: <code className="font-mono text-xs">{'{ "sql": "..." }'}</code>.
            </p>
            <div className="callout callout--warning">
              <span className="callout-icon">⚠️</span>
              <div>Ātruma limits: <strong>20 vaicājumi / minūtē</strong> uz IP. SQL vaicājumi var būt lēnāki.</div>
            </div>
            <CodeBlock snippet={snippets.sql!} />
          </div>

          <div id="health" className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="method-badge method-get">GET</span>
              <code className="font-mono text-sm">/api/health</code>
            </div>
            <p className="text-sm text-[#656d76] mb-3 leading-relaxed">
              Servera veselības pārbaude. Atgriež darbspējas laiku un statusu.
            </p>
            <CodeBlock snippet={snippets.health!} />
          </div>
        </section>

        <section id="ckan" className="mb-10">
          <h2 className="text-xl font-bold mb-4 pb-2 border-b border-gray-200">🌐 CKAN API tieši</h2>
          <p className="text-sm text-[#656d76] mb-3 leading-relaxed">
            Vari arī izsaukt <strong>data.gov.lv</strong> CKAN API tieši no sava koda.
            GET pieprasījumi darbojas no pārlūka bez CORS problēmām.
            POST (<code className="font-mono text-xs bg-gray-100 px-1 rounded">datastore_search_sql</code>) var tikt bloķēts pārlūkā — izmanto mūsu proxy.
          </p>
          <CodeBlock snippet={snippets.ckanDirect!} title="Tiešs CKAN pieprasījums" />
        </section>

        <section id="response" className="mb-10">
          <h2 className="text-xl font-bold mb-4 pb-2 border-b border-gray-200">📦 Atbildes formāts</h2>
          <p className="text-sm text-[#656d76] mb-4 leading-relaxed">
            Veiksmīgas atbildes ir JSON objekti ar šādu struktūru:
          </p>
          <CodeBlock snippet={snippets.responseShape!} />
        </section>

        <section id="js" className="mb-10">
          <h2 className="text-xl font-bold mb-4 pb-2 border-b border-gray-200">💻 JavaScript / TypeScript piemēri</h2>
          <h3 className="text-base font-semibold mb-2">Meklēšana pēc nosaukuma</h3>
          <CodeBlock snippet={snippets.jsBasic!} />
          <h3 className="text-base font-semibold mb-2">Meklēšana pēc reģ. numura</h3>
          <CodeBlock snippet={snippets.jsRegcode!} />
          <h3 className="text-base font-semibold mb-2">SQL vaicājums</h3>
          <CodeBlock snippet={snippets.jsSql!} />
        </section>

        <section id="errors" className="mb-10">
          <h2 className="text-xl font-bold mb-4 pb-2 border-b border-gray-200">⚠️ Kļūdu kodi</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-3 py-2 border border-gray-200 font-semibold">HTTP statuss</th>
                  <th className="text-left px-3 py-2 border border-gray-200 font-semibold">Nozīme</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['400', 'Trūkst obligāto parametru vai nepareizs formāts'],
                  ['429', 'Sasniegts ātruma limits — uzgaidi minūti'],
                  ['502', 'Upstream CKAN kļūda — data.gov.lv atgrieza kļūdu'],
                  ['500', 'Iekšēja servera kļūda'],
                ].map(([code, desc]) => (
                  <tr key={code}>
                    <td className="px-3 py-2 border border-gray-200 font-mono text-[#cf222e]">{code}</td>
                    <td className="px-3 py-2 border border-gray-200 text-[#656d76]">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[#656d76] mt-3">
            Kļūdas atbildes formāts: <code className="font-mono bg-gray-100 px-1 rounded">{'{ "error": "apraksts" }'}</code>
          </p>
        </section>

        <section id="limits" className="mb-10">
          <h2 className="text-xl font-bold mb-4 pb-2 border-b border-gray-200">🚦 Ātruma limitēšana</h2>
          <div className="flex flex-col gap-3">
            <div className="callout callout--info">
              <span className="callout-icon">🌐</span>
              <div>
                <strong>Globālais limits:</strong> 120 pieprasījumi / minūtē uz IP adresu.
                Attiecas uz visiem <code className="font-mono text-xs">/api/*</code> ceļiem.
              </div>
            </div>
            <div className="callout callout--warning">
              <span className="callout-icon">⚡</span>
              <div>
                <strong>SQL limits:</strong> 20 vaicājumi / minūtē uz IP adresu.
                SQL vaicājumi ir resursietilpīgi, tāpēc tiem ir striktāks limits.
              </div>
            </div>
          </div>
          <p className="text-sm text-[#656d76] mt-3 leading-relaxed">
            Kad limits sasniegts, serveris atgriež <code className="font-mono text-xs bg-gray-100 px-1 rounded">HTTP 429</code>.
            Atbildes galvenēs <code className="font-mono text-xs bg-gray-100 px-1 rounded">RateLimit-*</code> sniedz informāciju par atlikušo kvotu.
          </p>
        </section>
      </article>
    </div>
  );
}
