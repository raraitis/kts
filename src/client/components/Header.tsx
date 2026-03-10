import { Zap, Wrench, BookOpen, Github, UserPlus } from 'lucide-react';
import type { Page } from '../types';

interface Props {
  page: Page;
  onPageChange: (p: Page) => void;
}

export default function Header({ page, onPageChange }: Props) {
  const navBtnClass = (active: boolean) =>
    `nav-btn flex items-center gap-1.5 ${active ? 'nav-btn--active' : ''}`;

  return (
    <header className="bg-[#161b22] border-b border-[#30363d] shrink-0">
      {/* Single row (all screens) */}
      <div className="flex items-center gap-2.5 px-4 sm:px-6 h-12 sm:h-14">
        <Zap size={18} className="text-[#e3b341] shrink-0" />

        <div className="flex flex-col gap-px">
          <span className="text-sm font-bold text-[#e6edf3]">LV Uzņēmumu Reģistrs</span>
          <span className="hidden sm:block text-[11px] text-[#8b949e]">data.gov.lv API izpētes rīks</span>
        </div>

        {/* Desktop nav — hidden on mobile */}
        <nav className="hidden sm:flex gap-1 ml-4">
          <button className={navBtnClass(page === 'tool')} onClick={() => onPageChange('tool')}>
            <Wrench size={12} /> Rīks
          </button>
          <button className={navBtnClass(page === 'docs')} onClick={() => onPageChange('docs')}>
            <BookOpen size={12} /> Dokumentācija
          </button>
          <button className={navBtnClass(page === 'register')} onClick={() => onPageChange('register')}>
            <UserPlus size={12} /> Reģistrācija
          </button>
        </nav>

        <a
          className="ml-auto flex items-center gap-1 text-[11.5px] px-2.5 py-1 border border-[#30363d] rounded-full
                     text-[#58a6ff] no-underline hover:bg-[#58a6ff]/10 hover:border-[#58a6ff] transition-colors whitespace-nowrap"
          href="https://github.com/raraitis/kts"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Github size={13} />
          <span className="hidden sm:inline">GitHub</span>
        </a>
      </div>

      {/* Mobile nav row — hidden on sm+ */}
      <nav className="flex sm:hidden gap-1 px-4 pb-2.5">
        <button className={navBtnClass(page === 'tool')} onClick={() => onPageChange('tool')}>
          <Wrench size={12} /> Rīks
        </button>
        <button className={navBtnClass(page === 'docs')} onClick={() => onPageChange('docs')}>
          <BookOpen size={12} /> Dokumentācija
        </button>
        <button className={navBtnClass(page === 'register')} onClick={() => onPageChange('register')}>
          <UserPlus size={12} /> Reģistrācija
        </button>
      </nav>
    </header>
  );
}
