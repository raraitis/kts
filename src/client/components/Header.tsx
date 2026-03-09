import type { Page } from '../types';

interface Props {
  page: Page;
  onPageChange: (p: Page) => void;
}

export default function Header({ page, onPageChange }: Props) {
  return (
    <header className="h-14 flex items-center gap-2.5 px-6 bg-[#161b22] border-b border-[#30363d] shrink-0">
      <span className="text-xl">⚡</span>

      <div className="flex flex-col gap-px">
        <span className="text-sm font-bold text-[#e6edf3]">LV Uzņēmumu Reģistrs</span>
        <span className="text-[11px] text-[#8b949e]">data.gov.lv API izpētes rīks</span>
      </div>

      <nav className="flex gap-1 ml-4">
        <button
          className={`nav-btn ${page === 'tool' ? 'nav-btn--active' : ''}`}
          onClick={() => onPageChange('tool')}
        >
          🛠 Rīks
        </button>
        <button
          className={`nav-btn ${page === 'docs' ? 'nav-btn--active' : ''}`}
          onClick={() => onPageChange('docs')}
        >
          📄 Dokumentācija
        </button>
      </nav>

      <a
        className="ml-auto text-[11.5px] px-2.5 py-1 border border-[#30363d] rounded-full
                   text-[#58a6ff] no-underline hover:bg-[#58a6ff]/10 hover:border-[#58a6ff] transition-colors"
        href="https://github.com/raraitis/kts"
        target="_blank"
        rel="noopener noreferrer"
      >
        GitHub ↗
      </a>
    </header>
  );
}
