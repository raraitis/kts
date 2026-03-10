export interface Company {
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

export interface SearchResponse {
  total: number;
  records: Company[];
  meta: {
    resource_id: string;
    limit: number;
    offset: number;
    upstream_url: string;
  };
}

export interface SqlResponse {
  total: number;
  records: Company[];
  fields: Array<{ id: string; type: string }>;
}

export type ToastKind = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

export type Page = 'tool' | 'docs' | 'register';

export type EndpointKey = 'search-q' | 'search-reg' | 'sql';

/** Alias used by the registration MobX store */
export type CompanyData = Company;

export interface BillingAddress {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

// ─── Registry enrichment snapshot ────────────────────────────────────────────

export interface RegistryOfficer {
  firstName: string;
  lastName: string;
  role: string;        // mapped from `position`
}

export interface RegistryUBO {
  firstName: string;   // from `forename`
  lastName: string;    // from `surname`
}

export interface RegistrySnapshot {
  registrationNumber: string;
  companyName: string;
  legalAddress: string;
  officers: RegistryOfficer[];
  beneficialOwners: RegistryUBO[];
  businessActivity: string;
  fetchedAt: string;   // ISO timestamp
}

export type RegistrySnapshotStatus = 'idle' | 'loading' | 'partial' | 'ready' | 'failed';

export interface MirrorState {
  mode: 'name' | 'regcode';
  query: string;
  url: string;
  loading: boolean;
  rawJson: string;
  responseHtml: string;
  statusText: string;
  statusOk: boolean;
  elapsed: string;
  total: number | null;
}
