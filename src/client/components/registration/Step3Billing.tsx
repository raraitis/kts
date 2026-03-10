import { observer } from 'mobx-react-lite';
import { CreditCard, ChevronLeft, Check, Users, Briefcase, UserCheck } from 'lucide-react';
import { useRegistrationStore } from '../../stores/StoreContext';
import type { BillingAddress } from '../../types';

const fields: { key: keyof BillingAddress; label: string; placeholder: string }[] = [
  { key: 'street',     label: 'Street / address line', placeholder: 'e.g. Brīvības iela 1' },
  { key: 'city',       label: 'City',                   placeholder: 'e.g. Rīga'             },
  { key: 'postalCode', label: 'Postal code',            placeholder: 'e.g. LV-1001'          },
  { key: 'country',    label: 'Country',                placeholder: 'Latvia'                 },
];

/**
 * Step 3 — Billing address.
 * Checkbox "same as company address" reads the address already in the store
 * and copies it into billingAddress — no API call needed.
 */
const Step3Billing = observer(() => {
  const store = useRegistrationStore();
  const locked = store.billingSameAsCompany;

  function submit() {
    // Replace with your actual form submission / API call
    alert('Registration complete! ✓');
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-[#e6edf3] mb-1 flex items-center gap-2">
          <CreditCard size={15} className="text-[#58a6ff]" />
          Billing address
        </h3>
        <p className="text-xs text-[#8b949e]">Where should invoices be addressed?</p>
      </div>

      {/* ── Registry snapshot panel (officers, UBOs, business activity) ───────── */}
      {store.registrySnapshot && (store.registrySnapshot.officers.length > 0 || store.registrySnapshot.beneficialOwners.length > 0 || store.registrySnapshot.businessActivity) && (
        <div className="rounded-lg border border-[#30363d] bg-[#0d1117] overflow-hidden">
          <div className="px-3 py-2 border-b border-[#30363d] flex items-center gap-2">
            <Briefcase size={11} className="text-[#8b949e]" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8b949e]">Company registry data</span>
            {store.registrySnapshotStatus === 'partial' && (
              <span className="ml-auto text-[10px] text-[#d29922]">Partial results</span>
            )}
          </div>

          {/* Business activity */}
          {store.registrySnapshot.businessActivity && (
            <div className="px-3 py-2 border-b border-[#21262d]">
              <p className="text-[10px] text-[#8b949e] mb-0.5">Business activity</p>
              <p className="text-xs text-[#e6edf3]">{store.registrySnapshot.businessActivity}</p>
            </div>
          )}

          {/* Officers */}
          {store.registrySnapshot.officers.length > 0 && (
            <div className="px-3 py-2 border-b border-[#21262d]">
              <p className="text-[10px] text-[#8b949e] mb-1.5 flex items-center gap-1">
                <UserCheck size={10} /> Board members / officers
              </p>
              <ul className="space-y-1">
                {store.registrySnapshot.officers.map((o, i) => (
                  <li key={i} className="flex items-baseline gap-2 text-xs">
                    <span className="text-[#e6edf3] font-medium">{o.firstName} {o.lastName}</span>
                    <span className="text-[10px] text-[#8b949e]">{o.role}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* UBOs */}
          {store.registrySnapshot.beneficialOwners.length > 0 && (
            <div className="px-3 py-2">
              <p className="text-[10px] text-[#8b949e] mb-1.5 flex items-center gap-1">
                <Users size={10} /> Beneficial owners
              </p>
              <ul className="space-y-1">
                {store.registrySnapshot.beneficialOwners.map((u, i) => (
                  <li key={i} className="text-xs text-[#e6edf3]">{u.firstName} {u.lastName}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* "Same as company" checkbox ──────────────────────────────────────── */}
      {store.company && (
        <label className="flex items-start gap-2.5 cursor-pointer group">
          <span
            onClick={() => store.setBillingSameAsCompany(!locked)}
            className={`mt-0.5 w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-colors ${
              locked
                ? 'bg-[#238636] border-[#238636]'
                : 'bg-[#0d1117] border-[#30363d] group-hover:border-[#8b949e]'
            }`}
          >
            {locked && <Check size={11} strokeWidth={3} className="text-white" />}
          </span>
          <span className="text-xs text-[#c9d1d9] select-none" onClick={() => store.setBillingSameAsCompany(!locked)}>
            Billing address same as company address
            {store.company && (
              <span className="block text-[11px] text-[#8b949e] mt-0.5">
                {store.company.address}
              </span>
            )}
          </span>
        </label>
      )}

      {/* Address fields ─────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {fields.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="block text-[11px] text-[#8b949e] mb-1">{label}</label>
            <input
              type="text"
              value={store.billingAddress[key]}
              onChange={(e) => store.setBillingField(key, e.target.value)}
              disabled={locked}
              placeholder={placeholder}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-sm text-[#e6edf3] placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff] disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            />
          </div>
        ))}
      </div>

      {/* Navigation ─────────────────────────────────────────────────────── */}
      <div className="flex gap-2">
        <button
          onClick={() => store.prevStep()}
          className="flex items-center gap-1 px-3 py-2 border border-[#30363d] hover:border-[#8b949e] rounded-md text-xs text-[#8b949e] transition-colors"
        >
          <ChevronLeft size={13} /> Back
        </button>
        <button
          onClick={submit}
          disabled={!store.billingIsComplete}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#238636] hover:bg-[#2ea043] disabled:opacity-40 disabled:cursor-not-allowed rounded-md text-xs font-semibold text-white transition-colors"
        >
          <Check size={13} /> Submit registration
        </button>
      </div>
    </div>
  );
});

export default Step3Billing;
