import { makeAutoObservable, runInAction } from 'mobx';
import type { CompanyData, BillingAddress, RegistrySnapshot, RegistrySnapshotStatus } from '../types';

const emptyBilling = (): BillingAddress => ({
  street: '',
  city: '',
  postalCode: '',
  country: 'Latvia',
});

export class RegistrationStore {
  // ── Step 1 ───────────────────────────────────────────────────────────────
  company: CompanyData | null = null;

  // ── Registry enrichment (non-blocking, fetched after company selection) ──
  registrySnapshot: RegistrySnapshot | null = null;
  registrySnapshotStatus: RegistrySnapshotStatus = 'idle';

  // ── Step 2 ───────────────────────────────────────────────────────────────
  email: string = '';
  emailVerified: boolean = false;

  // ── Step 3 ───────────────────────────────────────────────────────────────
  billingAddress: BillingAddress = emptyBilling();
  billingSameAsCompany: boolean = false;

  // ── Multi-step navigation ─────────────────────────────────────────────────
  currentStep: 1 | 2 | 3 = 1;

  constructor() {
    makeAutoObservable(this);
  }

  // ── Step 1 actions ────────────────────────────────────────────────────────
  selectCompany(company: CompanyData) {
    this.company = company;
    this.registrySnapshot = null;
    this.registrySnapshotStatus = 'idle';
    // Fire enrichment in the background — non-blocking
    void this.fetchEnrichment(String(company.regcode));
  }

  clearCompany() {
    this.company = null;
    this.registrySnapshot = null;
    this.registrySnapshotStatus = 'idle';
    this.billingSameAsCompany = false;
    this.billingAddress = emptyBilling();
  }

  /**
   * Fetches officers, UBOs and business activity from our enrichment proxy.
   * Runs after selectCompany() and must NOT be awaited by the caller.
   * Uses runInAction for all state mutations after the async boundary.
   */
  async fetchEnrichment(regNo: string) {
    this.registrySnapshotStatus = 'loading';
    try {
      const res = await fetch(`/api/enriched/${encodeURIComponent(regNo)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as {
        status: 'ready' | 'partial' | 'failed';
        snapshot: RegistrySnapshot;
      };
      runInAction(() => {
        this.registrySnapshot = {
          ...data.snapshot,
          // merge in the already-known fields so the snapshot is complete
          registrationNumber: regNo,
          companyName:  this.company?.name ?? '',
          legalAddress: this.company?.address ?? '',
        };
        this.registrySnapshotStatus = data.status;
      });
    } catch {
      runInAction(() => {
        this.registrySnapshotStatus = 'failed';
      });
    }
  }

  // ── Step 2 actions ────────────────────────────────────────────────────────
  setEmail(email: string) {
    this.email = email;
  }

  setEmailVerified(verified: boolean) {
    this.emailVerified = verified;
  }

  // ── Step 3 actions ────────────────────────────────────────────────────────
  setBillingField<K extends keyof BillingAddress>(key: K, value: BillingAddress[K]) {
    this.billingAddress[key] = value;
  }

  /**
   * Toggle "billing same as company address".
   * When true, immediately copies the company address into billingAddress.
   */
  setBillingSameAsCompany(val: boolean) {
    this.billingSameAsCompany = val;
    if (val) {
      this.copyCompanyToBilling();
    }
  }

  /**
   * Maps the company address string and name into billingAddress fields.
   * The registry `address` field is a single string (e.g. "Brīvības iela 1, Rīga").
   * We put it in `street`; city/postalCode are parsed if present.
   */
  copyCompanyToBilling() {
    if (!this.company) return;

    const raw = this.company.address ?? '';
    // Attempt a simple parse: "Street, City, LV-XXXX"
    const parts = raw.split(',').map((p) => p.trim());
    this.billingAddress = {
      street: parts[0] ?? raw,
      city: parts[1] ?? '',
      postalCode: parts[2] ?? '',
      country: 'Latvia',
    };
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  goToStep(step: 1 | 2 | 3) {
    this.currentStep = step;
  }

  nextStep() {
    if (this.currentStep < 3) this.currentStep = (this.currentStep + 1) as 2 | 3;
  }

  prevStep() {
    if (this.currentStep > 1) this.currentStep = (this.currentStep - 1) as 1 | 2;
  }

  // ── Derived / computed ────────────────────────────────────────────────────
  get canProceedFromStep1() {
    return this.company !== null;
  }

  get canProceedFromStep2() {
    return this.email.length > 3 && this.emailVerified;
  }

  get billingIsComplete() {
    const b = this.billingAddress;
    return b.street.length > 0 && b.city.length > 0 && b.postalCode.length > 0;
  }
}
