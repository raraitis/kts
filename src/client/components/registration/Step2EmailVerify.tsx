import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Mail, Building2, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { useRegistrationStore } from '../../stores/StoreContext';

/**
 * Step 2 — Email verification.
 * Company data is already in the store — no re-fetch needed.
 * Simulates email verification with a code input.
 */
const Step2EmailVerify = observer(() => {
  const store = useRegistrationStore();
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function sendCode() {
    if (store.email.length < 4) {
      setError('Enter a valid email first.');
      return;
    }
    setError(null);
    setCodeSent(true);
    // In a real app: POST /api/send-verification-code
  }

  function verify() {
    // Demo: any 6-digit code is accepted. Replace with real API call.
    if (/^\d{6}$/.test(code)) {
      store.setEmailVerified(true);
      setError(null);
    } else {
      setError('Enter the 6-digit code sent to your email.');
    }
  }

  return (
    <div className="space-y-5">
      {/* Company summary — data comes straight from the store, no re-fetch */}
      {store.company && (
        <div className="flex items-start gap-2 p-3 rounded-lg border border-[#30363d] bg-[#0d1117]">
          <Building2 size={13} className="text-[#58a6ff] mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#e6edf3] truncate">{store.company.name}</p>
            <p className="text-[11px] text-[#8b949e]">Reg. {store.company.regcode}</p>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-[#e6edf3] mb-1 flex items-center gap-2">
          <Mail size={15} className="text-[#58a6ff]" />
          Verify your email
        </h3>
        <p className="text-xs text-[#8b949e]">We'll send a one-time code to confirm your address.</p>
      </div>

      {/* Email input */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="email"
            value={store.email}
            onChange={(e) => {
              store.setEmail(e.target.value);
              store.setEmailVerified(false);
              setCodeSent(false);
            }}
            placeholder="your@email.com"
            disabled={store.emailVerified}
            className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-sm text-[#e6edf3] placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff] disabled:opacity-50"
          />
          {!store.emailVerified && (
            <button
              onClick={sendCode}
              className="px-3 py-2 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-md text-xs text-[#e6edf3] transition-colors"
            >
              Send code
            </button>
          )}
        </div>

        {store.emailVerified && (
          <p className="flex items-center gap-1.5 text-xs text-[#3fb950]">
            <CheckCircle2 size={13} /> Email verified
          </p>
        )}
      </div>

      {/* Code input */}
      {codeSent && !store.emailVerified && (
        <div className="space-y-2">
          <p className="text-xs text-[#8b949e]">
            Code sent to <strong className="text-[#e6edf3]">{store.email}</strong>
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="6-digit code"
              className="w-36 bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-sm text-[#e6edf3] placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff] font-mono tracking-widest"
            />
            <button
              onClick={verify}
              className="px-3 py-2 bg-[#238636] hover:bg-[#2ea043] rounded-md text-xs font-semibold text-white transition-colors"
            >
              Verify
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-[#f85149]">{error}</p>}

      {/* Navigation */}
      <div className="flex gap-2">
        <button
          onClick={() => store.prevStep()}
          className="flex items-center gap-1 px-3 py-2 border border-[#30363d] hover:border-[#8b949e] rounded-md text-xs text-[#8b949e] transition-colors"
        >
          <ChevronLeft size={13} /> Back
        </button>
        <button
          onClick={() => store.nextStep()}
          disabled={!store.canProceedFromStep2}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#58a6ff] hover:bg-[#79c0ff] disabled:opacity-40 disabled:cursor-not-allowed rounded-md text-xs font-semibold text-[#0d1117] transition-colors"
        >
          Continue <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
});

export default Step2EmailVerify;
