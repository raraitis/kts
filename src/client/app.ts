// =============================================================================
// LV Company Register — Frontend TypeScript
// =============================================================================

// ─── Toast system ─────────────────────────────────────────────────────────────

type ToastKind = 'success' | 'error' | 'warning' | 'info';

const TOAST_ICONS: Record<ToastKind, string> = {
  success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️',
};
const TOAST_TITLES: Record<ToastKind, string> = {
  success: 'Veiksmīgi', error: 'Kļūda', warning: 'Brīdinājums', info: 'Info',
};

function showToast(kind: ToastKind, message: string, durationMs = 4000): void {
  const container = document.getElementById('toast-container')!;
  const toast = document.createElement('div');
  toast.className = `toast toast--${kind}`;
  toast.innerHTML = `
    <span class="toast-icon">${TOAST_ICONS[kind]}</span>
    <div class="toast-body">
      <div class="toast-title">${TOAST_TITLES[kind]}</div>
      <div class="toast-msg">${message}</div>
    </div>`;
  container.appendChild(toast);
  const remove = () => {
    toast.classList.add('toast--exit');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  };
  setTimeout(remove, durationMs);
  toast.addEventListener('click', remove);
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface CompanyRecord {
  _id: number;
  regcode: string | number;
  sepa: string;
  name: string;
  name_before_quotes: string;
  name_in_quotes: string;
  name_after_quotes: string;
  without_quotes: number;
  regtype: string;
  regtype_text: string;
  type: string;
  type_text: string;
  registered: string;
  terminated: string | null;
  closed: string;
  address: string;
  index: number;
  addressid: number;
  region: number;
  city: number;
  atvk: number;
  reregistration_term: string;
}

interface SearchResponse {
  total: number;
  records: CompanyRecord[];
  meta: {
    resource_id: string;
    limit: number;
    offset: number;
    upstream_url: string;
  };
}

type EndpointKey = 'search-q' | 'search-reg' | 'sql';
type SearchMode  = 'name' | 'regcode';
type ViewMode    = 'pretty' | 'raw';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function qs<T extends HTMLElement>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`Element not found: ${selector}`);
  return el;
}

function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function formatDate(raw: string | null | undefined): string {
  if (!raw) return '—';
  const d = new Date(raw);
  return isNaN(d.getTime()) ? raw : d.toLocaleDateString('lv-LV');
}

/** Minimal JSON syntax highlighter */
function highlightJson(json: string): string {
  return json
    .replace(/(".*?")\s*:/g, '<span class="json-key">$1</span>:')
    .replace(/:\s*(".*?")/g, ': <span class="json-string">$1</span>')
    .replace(/:\s*(\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
    .replace(/:\s*(true|false)/g, ': <span class="json-bool">$1</span>')
    .replace(/:\s*(null)/g, ': <span class="json-null">$1</span>');
}

// ─── API Tester ───────────────────────────────────────────────────────────────

class ApiTester {
  private currentEndpoint: EndpointKey = 'search-q';

  private tabBtns      = document.querySelectorAll<HTMLButtonElement>('.tab-btn');
  private sendBtn       = qs<HTMLButtonElement>('#send-btn');
  private sendBtnText   = qs<HTMLSpanElement>('#send-btn-text');
  private sendBtnSpinner= qs<HTMLSpanElement>('#send-btn-spinner');
  private urlDisplay    = qs<HTMLElement>('#request-url-display');
  private responseEl    = qs<HTMLPreElement>('#response-output');
  private responseMeta  = qs<HTMLDivElement>('#response-meta');
  private responseTotalEl = qs<HTMLSpanElement>('#response-total');
  private responseUrlChip = qs<HTMLSpanElement>('#response-url-chip');
  private statusEl      = qs<HTMLSpanElement>('#response-status');
  private timeEl        = qs<HTMLSpanElement>('#response-time');
  private copyBtn       = qs<HTMLButtonElement>('#copy-response-btn');
  private copyUrlBtn    = qs<HTMLButtonElement>('#copy-url-btn');
  private viewToggleBtns = document.querySelectorAll<HTMLButtonElement>('#api-view-toggle .view-btn');

  private currentView: ViewMode = 'pretty';
  private lastRawJson = '';
  private lastPrettyHtml = '';

  // Search-q params
  private qInput      = qs<HTMLInputElement>('#param-q');
  private limitInput  = qs<HTMLInputElement>('#param-limit');
  private offsetInput = qs<HTMLInputElement>('#param-offset');

  // Search-reg params
  private regInput     = qs<HTMLInputElement>('#param-regcode');
  private regLimInput  = qs<HTMLInputElement>('#param-reg-limit');

  // SQL params
  private sqlInput = qs<HTMLTextAreaElement>('#param-sql');

  constructor() {
    this.tabBtns.forEach(btn => btn.addEventListener('click', () => {
      this.switchEndpoint(btn.dataset['endpoint'] as EndpointKey);
    }));
    this.sendBtn.addEventListener('click', () => void this.send());
    this.copyBtn.addEventListener('click', () => this.copyResponse());
    this.copyUrlBtn.addEventListener('click', () => this.copyUrl());

    this.viewToggleBtns.forEach(btn => btn.addEventListener('click', () => {
      this.currentView = btn.dataset['view'] as ViewMode;
      this.viewToggleBtns.forEach(b => b.classList.toggle('view-btn--active', b === btn));
      if (this.lastRawJson) this.applyView();
    }));

    // Live URL preview
    [this.qInput, this.limitInput, this.offsetInput, this.regInput,
     this.regLimInput, this.sqlInput].forEach(
      el => el.addEventListener('input', () => this.updateUrlPreview())
    );

    this.updateUrlPreview();
  }

  private switchEndpoint(key: EndpointKey): void {
    this.currentEndpoint = key;

    // Update active tab
    this.tabBtns.forEach(btn => {
      btn.classList.toggle('tab-btn--active', btn.dataset['endpoint'] === key);
    });

    // Show correct params panel
    document.querySelectorAll('.params-panel').forEach(el => {
      (el as HTMLElement).classList.add('params-panel--hidden');
    });
    qs(`#params-${key}`).classList.remove('params-panel--hidden');

    this.updateUrlPreview();
  }

  private buildUrl(): { url: string; method: 'GET' | 'POST'; body?: string } {
    const base = window.location.origin;

    if (this.currentEndpoint === 'search-q') {
      const q      = encodeURIComponent(this.qInput.value.trim() || 'SIA');
      const limit  = this.limitInput.value || '10';
      const offset = this.offsetInput.value || '0';
      return {
        url: `${base}/api/search?q=${q}&limit=${limit}&offset=${offset}`,
        method: 'GET',
      };
    }

    if (this.currentEndpoint === 'search-reg') {
      const reg   = encodeURIComponent(this.regInput.value.trim() || '40003009497');
      const limit = this.regLimInput.value || '10';
      return {
        url: `${base}/api/search?regcode=${reg}&limit=${limit}`,
        method: 'GET',
      };
    }

    // SQL
    return {
      url: `${base}/api/sql`,
      method: 'POST',
      body: JSON.stringify({ sql: this.sqlInput.value }),
    };
  }

  updateUrlPreview(): void {
    const { url, method, body } = this.buildUrl();
    if (method === 'POST') {
      this.urlDisplay.textContent = `POST ${url}\n${body ?? ''}`;
    } else {
      this.urlDisplay.textContent = url;
    }
  }

  private copyUrl(): void {
    const { url } = this.buildUrl();
    void navigator.clipboard.writeText(url).then(() => {
      this.copyUrlBtn.textContent = 'Nokopēts!';
      setTimeout(() => (this.copyUrlBtn.textContent = 'Kopēt'), 1500);
      showToast('success', 'URL nokopēts starpliktuvē.');
    });
  }

  private applyView(): void {
    if (this.currentView === 'raw') {
      this.responseEl.textContent = this.lastRawJson;
    } else {
      this.responseEl.innerHTML = this.lastPrettyHtml;
    }
  }

  private async send(): Promise<void> {
    const { url, method, body } = this.buildUrl();
    this.sendBtn.disabled = true;
    this.sendBtnText.textContent = 'Nosūta…';
    this.sendBtnSpinner.classList.remove('hidden');
    this.responseEl.innerHTML = '<span class="placeholder-text">Gaida atbildi…</span>';
    this.statusEl.textContent = '';
    this.timeEl.textContent = '';
    this.responseMeta.style.display = 'none';

    const t0 = performance.now();

    try {
      const res = await fetch(url, {
        method,
        headers: method === 'POST' ? { 'Content-Type': 'application/json' } : {},
        body: method === 'POST' ? body : undefined,
      });

      const elapsed = Math.round(performance.now() - t0);
      const json = await res.json() as Record<string, unknown>;
      const pretty = JSON.stringify(json, null, 2);

      this.lastRawJson    = pretty;
      this.lastPrettyHtml = highlightJson(pretty);

      this.statusEl.textContent = `${res.status} ${res.statusText}`;
      this.statusEl.className   = `response-status ${res.ok ? 'ok' : 'err'}`;
      this.timeEl.textContent   = `${elapsed} ms`;
      this.applyView();

      // Show meta bar
      if (res.ok && typeof json['total'] === 'number') {
        const total = json['total'] as number;
        const meta  = json['meta'] as { upstream_url?: string } | undefined;
        this.responseTotalEl.textContent = `${total.toLocaleString()} ieraksti`;
        this.responseUrlChip.textContent  = meta?.upstream_url ? `↑ ${meta.upstream_url}` : '';
        this.responseMeta.style.display   = 'flex';
      }

      if (res.ok) {
        showToast('success', `Atbilde saņemta ${elapsed} ms laikā.`);
      } else {
        const msg = (json['error'] as string | undefined) ?? `HTTP ${res.status}`;
        showToast('error', msg);
      }
    } catch (err) {
      this.statusEl.textContent = 'Tīkla kļūda';
      this.statusEl.className   = 'response-status err';
      this.responseEl.textContent = String(err);
      showToast('error', 'Neizdevās sasniegt serveri. Pārbaudi savienojumu.');
    } finally {
      this.sendBtn.disabled = false;
      this.sendBtnText.textContent = 'Nosūtīt pieprasījumu';
      this.sendBtnSpinner.classList.add('hidden');
    }
  }

  private copyResponse(): void {
    const text = this.lastRawJson || this.responseEl.textContent || '';
    void navigator.clipboard.writeText(text).then(() => {
      this.copyBtn.textContent = 'Nokopēts!';
      setTimeout(() => (this.copyBtn.textContent = 'Kopēt'), 1500);
      showToast('success', 'JSON nokopēts starpliktuvē.');
    });
  }
}

// ─── Lookup Form ──────────────────────────────────────────────────────────────

class LookupForm {
  private mode: SearchMode = 'name';

  private modeBtns     = document.querySelectorAll<HTMLButtonElement>('.mode-btn');
  private lookupInput  = qs<HTMLInputElement>('#lookup-input');
  private spinner      = qs<HTMLDivElement>('#lookup-spinner');
  private hint         = qs<HTMLParagraphElement>('#lookup-hint');
  private sugList      = qs<HTMLUListElement>('#suggestions-list');
  private companyCard  = qs<HTMLDivElement>('#company-card');

  // Card fields
  private cardName       = qs<HTMLElement>('#card-name');
  private cardStatus     = qs<HTMLElement>('#card-status');
  private cardRegcode    = qs<HTMLElement>('#card-regcode');
  private cardSepa       = qs<HTMLElement>('#card-sepa');
  private cardType       = qs<HTMLElement>('#card-type');
  private cardRegtype    = qs<HTMLElement>('#card-regtype');
  private cardAddress    = qs<HTMLElement>('#card-address');
  private cardRegistered = qs<HTMLElement>('#card-registered');
  private cardTerminated = qs<HTMLElement>('#card-terminated');
  private cardClearBtn   = qs<HTMLButtonElement>('#card-clear-btn');
  private cardRawBtn     = qs<HTMLButtonElement>('#card-raw-btn');
  private cardRawOutput  = qs<HTMLPreElement>('#card-raw-output');
  private rawVisible     = false;
  private lastRecord: CompanyRecord | null = null;

  private highlightedIndex = -1;
  private lastResults: CompanyRecord[] = [];

  private debouncedSearch = debounce((value: string) => {
    void this.performSearch(value);
  }, 280);

  constructor() {
    this.modeBtns.forEach(btn => btn.addEventListener('click', () => {
      this.setMode(btn.dataset['mode'] as SearchMode);
    }));

    this.lookupInput.addEventListener('input', () => {
      const v = this.lookupInput.value.trim();
      if (v.length < 2) {
        this.closeSuggestions();
        this.hint.textContent = 'Ievadi vismaz 2 simbolus, lai sāktu meklēšanu.';
        return;
      }
      this.hint.textContent = 'Meklē…';
      this.debouncedSearch(v);
    });

    this.lookupInput.addEventListener('keydown', e => this.handleKeydown(e));
    this.lookupInput.addEventListener('blur', () => {
      // Small delay so click on list item fires first
      setTimeout(() => this.closeSuggestions(), 150);
    });

    this.cardClearBtn.addEventListener('click', () => this.clearCard());
    this.cardRawBtn.addEventListener('click', () => this.toggleRaw());
  }

  private toggleRaw(): void {
    this.rawVisible = !this.rawVisible;
    this.cardRawOutput.classList.toggle('hidden', !this.rawVisible);
    this.cardRawBtn.textContent = this.rawVisible
      ? 'Paslēpt JSON atbildi'
      : 'Rādīt neapstrādātu JSON atbildi';
    if (this.rawVisible && this.lastRecord) {
      this.cardRawOutput.innerHTML = highlightJson(JSON.stringify(this.lastRecord, null, 2));
    }
  }

  private setMode(mode: SearchMode): void {
    this.mode = mode;
    this.modeBtns.forEach(btn => {
      btn.classList.toggle('mode-btn--active', btn.dataset['mode'] === mode);
    });
    this.lookupInput.placeholder =
      mode === 'name'
        ? 'Sāc rakstīt uzņēmuma nosaukumu…'
        : 'Ievadi reģistrācijas numuru…';
    this.lookupInput.value = '';
    this.closeSuggestions();
    this.hint.textContent = 'Ievadi vismaz 2 simbolus, lai sāktu meklēšanu.';
  }

  private async performSearch(value: string): Promise<void> {
    this.spinner.classList.remove('hidden');
    const param =
      this.mode === 'name'
        ? `q=${encodeURIComponent(value)}&limit=12`
        : `regcode=${encodeURIComponent(value)}&limit=12`;

    try {
      const res = await fetch(`/api/search?${param}`);
      if (res.status === 429) {
        showToast('warning', 'Pārāk daudz pieprasījumu. Lūdzu uzgaidi minūti.');
        this.hint.textContent = 'Pieprasījumu limits sasniegts. Mēģini vēlāk.';
        return;
      }
      const data = (await res.json()) as SearchResponse;
      this.lastResults = data.records ?? [];
      this.renderSuggestions(this.lastResults, value);

      if (this.lastResults.length === 0) {
        this.hint.textContent = 'Nekas netika atrasts.';
      } else {
        this.hint.textContent =
          `Atrasti ${data.total.toLocaleString('lv-LV')} ieraksti — rāda ${this.lastResults.length}`;
      }
    } catch {
      this.hint.textContent = 'Kļūda ielādējot rezultātus.';
      showToast('error', 'Neizdevās ielādēt meklēšanas rezultātus.');
      this.closeSuggestions();
    } finally {
      this.spinner.classList.add('hidden');
    }
  }

  private renderSuggestions(records: CompanyRecord[], query: string): void {
    this.sugList.innerHTML = '';
    this.highlightedIndex = -1;

    if (records.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'suggestions-empty';
      empty.textContent = 'Neviens uzņēmums neatbilst meklēšanai.';
      this.sugList.appendChild(empty);
      this.sugList.classList.remove('hidden');
      return;
    }

    records.forEach((rec, idx) => {
      const li = document.createElement('li');
      li.className = 'suggestion-item';
      li.innerHTML = `
        <div class="sug-name">${this.highlight(rec.name, query)}</div>
        <div class="sug-meta">
          <span class="sug-regcode">${rec.regcode}</span>
          <span class="sug-type">${rec.type_text || rec.type || '—'}</span>
        </div>
        ${rec.address ? `<div class="sug-address">${rec.address}</div>` : ''}
      `;
      li.addEventListener('mousedown', () => this.selectRecord(records[idx]!));
      this.sugList.appendChild(li);
    });

    this.sugList.classList.remove('hidden');
  }

  /** Wraps the matched substring in a <mark> */
  private highlight(text: string, query: string): string {
    if (!query) return text;
    const safe = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(`(${safe})`, 'gi'), '<mark>$1</mark>');
  }

  private handleKeydown(e: KeyboardEvent): void {
    const items = this.sugList.querySelectorAll<HTMLLIElement>('.suggestion-item');
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.highlightedIndex = Math.min(this.highlightedIndex + 1, items.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.highlightedIndex = Math.max(this.highlightedIndex - 1, 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (this.highlightedIndex >= 0 && this.lastResults[this.highlightedIndex]) {
        this.selectRecord(this.lastResults[this.highlightedIndex]!);
      }
      return;
    } else if (e.key === 'Escape') {
      this.closeSuggestions();
      return;
    }

    items.forEach((item, i) => {
      item.classList.toggle('highlighted', i === this.highlightedIndex);
    });
    items[this.highlightedIndex]?.scrollIntoView({ block: 'nearest' });
  }

  private selectRecord(rec: CompanyRecord): void {
    this.lookupInput.value = rec.name;
    this.closeSuggestions();
    this.showCard(rec);
  }

  private closeSuggestions(): void {
    this.sugList.innerHTML = '';
    this.sugList.classList.add('hidden');
    this.highlightedIndex = -1;
  }

  private showCard(rec: CompanyRecord): void {
    this.lastRecord = rec;
    const closed = rec.closed && rec.closed.trim() !== ' ' && rec.closed.trim() !== '';
    const isActive = !closed && !rec.terminated;

    this.cardName.textContent = rec.name;
    this.cardStatus.textContent = isActive ? 'Aktīvs' : 'Slēgts';
    this.cardStatus.className   = `card-status ${isActive ? 'active' : 'inactive'}`;

    this.cardRegcode.textContent = String(rec.regcode ?? '—');
    this.cardSepa.textContent       = rec.sepa         || '—';
    this.cardType.textContent       = rec.type_text     || rec.type    || '—';
    this.cardRegtype.textContent    = rec.regtype_text  || rec.regtype || '—';
    this.cardAddress.textContent    = rec.address       || '—';
    this.cardRegistered.textContent = formatDate(rec.registered);
    this.cardTerminated.textContent = formatDate(rec.terminated ?? undefined);

    // Reset raw panel
    this.rawVisible = false;
    this.cardRawOutput.classList.add('hidden');
    this.cardRawBtn.textContent = 'Rādīt neapstrādātu JSON atbildi';

    this.companyCard.classList.remove('hidden');
    showToast('info', `Izvēlēts: ${rec.name}`);
  }

  private clearCard(): void {
    this.companyCard.classList.add('hidden');
    this.lookupInput.value = '';
    this.lastRecord = null;
    this.hint.textContent = 'Ievadi vismaz 2 simbolus, lai sāktu meklēšanu.';
    this.lookupInput.focus();
  }
}

// ─── Page navigation ──────────────────────────────────────────────────────────

/**
 * Wires the header nav buttons to toggle between the tool page and the
 * documentation page.  Uses the `hidden` class (display:none) which is
 * overridden by the #page-* ID rules defined in input.css so the correct
 * display mode (grid / flex) is restored when `hidden` is removed.
 */
function initNavigation(): void {
  const navBtns  = document.querySelectorAll<HTMLButtonElement>('.nav-btn');
  const pageTool = document.getElementById('page-tool')!;
  const pageDocs = document.getElementById('page-docs')!;

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset['page'];

      // Toggle active state on nav buttons
      navBtns.forEach(b => b.classList.toggle('nav-btn--active', b === btn));

      // Show / hide pages
      pageTool.classList.toggle('hidden', target !== 'tool');
      pageDocs.classList.toggle('hidden', target !== 'docs');
    });
  });
}

// ─── Docs copy buttons ─────────────────────────────────────────────────────────

/**
 * Each code block in the docs page has a "Kopēt" button with
 * `data-copy="<id>"`.  The raw text is read from `#snippet-<id>`.
 */
function initDocsCopyButtons(): void {
  document.querySelectorAll<HTMLButtonElement>('button[data-copy]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id  = btn.dataset['copy']!;
      const pre = document.getElementById(`snippet-${id}`);
      if (!pre) return;

      const text = pre.textContent ?? '';
      void navigator.clipboard.writeText(text.trim()).then(() => {
        btn.textContent = '✓ Nokopēts';
        setTimeout(() => (btn.textContent = 'Kopēt'), 1800);
        showToast('success', 'Kods nokopēts starpliktuvē.');
      });
    });
  });
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  new ApiTester();
  new LookupForm();
  initNavigation();
  initDocsCopyButtons();
  showToast('info', 'Laipni lūgti! Sāc rakstīt labajā pusē vai izmēģini API testerī kreisajā pusē.', 5000);
});
