import { observer } from 'mobx-react-lite';
import { StoreContext, useRegistrationStore } from '../../stores/StoreContext';
import { RegistrationStore } from '../../stores/RegistrationStore';
import { useMemo } from 'react';
import Step1CompanySearch from './Step1CompanySearch';
import Step2EmailVerify from './Step2EmailVerify';
import Step3Billing from './Step3Billing';

const STEPS = [
  { n: 1, label: 'Company'  },
  { n: 2, label: 'Email'    },
  { n: 3, label: 'Billing'  },
] as const;

/**
 * Drop this anywhere in your app to render the full multi-step registration.
 * Each call creates its own isolated store instance so multiple forms on the
 * same page don't share state.  If you want a single shared instance instead,
 * import `defaultStore` from StoreContext and pass it as `storeOverride`.
 */
const RegistrationForm = observer(({ storeOverride }: { storeOverride?: RegistrationStore }) => {
  const ownStore = useMemo(() => new RegistrationStore(), []);
  const store = storeOverride ?? ownStore;

  return (
    <StoreContext.Provider value={store}>
      <RegistrationFormInner />
    </StoreContext.Provider>
  );
});

/** Inner — uses the context set by RegistrationForm above */
const RegistrationFormInner = observer(() => {
  const store = useRegistrationStore();

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Step indicator */}
      <div className="flex items-center mb-6">
        {STEPS.map(({ n, label }, i) => {
          const done    = store.currentStep > n;
          const active  = store.currentStep === n;
          return (
            <div key={n} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <button
                  onClick={() => done && store.goToStep(n as 1 | 2 | 3)}
                  className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${
                    done
                      ? 'bg-[#238636] text-white cursor-pointer'
                      : active
                      ? 'bg-[#58a6ff] text-[#0d1117]'
                      : 'bg-[#21262d] text-[#484f58] cursor-default'
                  }`}
                >
                  {done ? '✓' : n}
                </button>
                <span className={`text-[10px] mt-1 ${active ? 'text-[#e6edf3]' : 'text-[#484f58]'}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-2 mb-4 ${done ? 'bg-[#238636]' : 'bg-[#21262d]'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step panels */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5">
        {store.currentStep === 1 && <Step1CompanySearch />}
        {store.currentStep === 2 && <Step2EmailVerify />}
        {store.currentStep === 3 && <Step3Billing />}
      </div>
    </div>
  );
});

export default RegistrationForm;
