import type { Toast, ToastKind } from '../types';

const TOAST_ICONS: Record<ToastKind, string> = {
  success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️',
};
const TOAST_TITLES: Record<ToastKind, string> = {
  success: 'Veiksmīgi', error: 'Kļūda', warning: 'Brīdinājums', info: 'Info',
};

interface Props {
  toasts: Toast[];
  onRemove: (id: number) => void;
}

export default function ToastContainer({ toasts, onRemove }: Props) {
  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
    >
      {toasts.map(t => (
        <div
          key={t.id}
          className={`toast toast--${t.kind}`}
          onClick={() => onRemove(t.id)}
          role="alert"
        >
          <span className="toast-icon">{TOAST_ICONS[t.kind]}</span>
          <div className="toast-body">
            <div className="toast-title">{TOAST_TITLES[t.kind]}</div>
            <div className="toast-msg">{t.message}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
