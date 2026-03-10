import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fetch from 'node-fetch';
import path from 'path';

const app = express();
const PORT = parseInt(process.env['PORT'] ?? '3000', 10);

const RESOURCE_ID = '25e80bf3-f107-4ab4-89ef-251b5b9374e9';
const CKAN_BASE = 'https://data.gov.lv/dati/api/action';

// Enrichment dataset resource IDs
const RES_OFFICERS   = 'e665114a-73c2-4375-9470-55874b4cfa6b'; // officers.csv
const RES_UBO        = '20a9b26d-d056-4dbb-ae18-9ff23c87bdee'; // beneficial_owners.csv
const RES_ACTIVITY   = '49bbd751-3fa2-4d78-8c35-ae0e1c5250d6'; // area_of_activity.csv

// Secure HTTP headers (prevents XSS, clickjacking, sniffing attacks)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc:  ["'self'"],
        styleSrc:   ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'", 'https://data.gov.lv'],
        imgSrc:     ["'self'", 'data:'],
      },
    },
  })
);

app.use(cors());
app.use(express.json());

// Global: 120 requests / minute per IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please wait a moment and try again.' },
});

// Stricter limiter for SQL endpoint: 20 queries / minute per IP
const sqlLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'SQL rate limit reached — max 20 queries per minute.' },
});

app.use('/api/', globalLimiter);

app.use(express.static(path.join(__dirname, 'client')));

// ─── Types ────────────────────────────────────────────────────────────────────

interface CKANRecord {
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

interface CKANResponse {
  success: boolean;
  result: {
    resource_id: string;
    fields: Array<{ id: string; type: string }>;
    records: CKANRecord[];
    total: number;
    _links: {
      start: string;
      next: string;
    };
  };
  error?: { message: string };
}

interface SearchQuery {
  q?: string;
  regcode?: string;
  limit?: string;
  offset?: string;
}

// ─── Enrichment types ────────────────────────────────────────────────────────

interface OfficerRecord {
  legal_entity_registration_number: string;
  name: string;
  position: string;
  entity_type?: string;
}

interface UBORecord {
  legal_entity_registration_number: string;
  forename: string;
  surname: string;
}

interface ActivityRecord {
  legal_entity_registration_number: string;
  area_of_activity: string;
}

interface CKANEnrichResponse<T> {
  success: boolean;
  result: { records: T[] };
  error?: { message: string };
}

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    resource_id: RESOURCE_ID,
    uptime_seconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// ─── Proxy: datastore_search ──────────────────────────────────────────────────
/**
 * GET /api/search
 *   ?q=<free text>          – search by company name (full-text)
 *   ?regcode=<number>       – exact match on registration code
 *   ?limit=<n>              – max results (default 10, max 50)
 *   ?offset=<n>             – pagination offset (default 0)
 *
 * You can combine q + limit/offset; regcode takes priority over q.
 */
app.get('/api/search', async (req: Request<{}, {}, {}, SearchQuery>, res: Response) => {
  const { q, regcode, limit = '10', offset = '0' } = req.query;

  const clampedLimit = Math.min(parseInt(limit, 10) || 10, 50);
  const parsedOffset = Math.max(parseInt(offset, 10) || 0, 0);

  if (!q && !regcode) {
    res.status(400).json({ error: 'Missing parameter. Provide either "q" (company name) or "regcode" (registration number).' });
    return;
  }

  // Sanitise inputs
  const safeQ       = (q       ?? '').replace(/[<>"'`;]/g, '').slice(0, 200);
  const safeRegcode = (regcode ?? '').replace(/\D/g, '').slice(0, 20);

  try {
    let url: string;
    if (safeRegcode) {
      const filters = encodeURIComponent(JSON.stringify({ regcode: safeRegcode }));
      url = `${CKAN_BASE}/datastore_search?resource_id=${RESOURCE_ID}&filters=${filters}&limit=${clampedLimit}&offset=${parsedOffset}`;
    } else {
      url = `${CKAN_BASE}/datastore_search?resource_id=${RESOURCE_ID}&q=${encodeURIComponent(safeQ)}&limit=${clampedLimit}&offset=${parsedOffset}`;
    }

    const upstream = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
    });

    const data = (await upstream.json()) as CKANResponse;

    if (!data.success) {
      res.status(502).json({ error: data.error?.message ?? 'Upstream CKAN API returned an error.' });
      return;
    }

    res.json({
      total:   data.result.total,
      records: data.result.records,
      meta: {
        resource_id:  RESOURCE_ID,
        limit:        clampedLimit,
        offset:       parsedOffset,
        upstream_url: url,
      },
    });
  } catch (err) {
    console.error('[/api/search]', err);
    res.status(500).json({ error: 'Could not reach the upstream data source. Please try again.' });
  }
});

// ─── Proxy: datastore_search_sql ─────────────────────────────────────────────
/**
 * POST /api/sql
 * Body: { sql: "SELECT ..." }
 * Lets the learner experiment with raw SQL against the CKAN datastore.
 */
app.post('/api/sql', sqlLimiter, async (req: Request, res: Response) => {
  const { sql } = req.body as { sql?: string };

  if (!sql || typeof sql !== 'string') {
    res.status(400).json({ error: 'Request body must be JSON with a "sql" string field.' });
    return;
  }
  if (sql.length > 2000) {
    res.status(400).json({ error: 'SQL query is too long (max 2000 characters).' });
    return;
  }
  // Block destructive statements
  if (/^\s*(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE)/i.test(sql)) {
    res.status(400).json({ error: 'Only SELECT queries are allowed.' });
    return;
  }

  try {
    const upstream = await fetch(`${CKAN_BASE}/datastore_search_sql`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ sql }),
    });

    const data = (await upstream.json()) as CKANResponse;

    if (!data.success) {
      res.status(502).json({ error: data.error?.message ?? 'Upstream CKAN SQL query failed.' });
      return;
    }

    res.json({
      total:   data.result.records.length,
      records: data.result.records,
      fields:  data.result.fields,
    });
  } catch (err) {
    console.error('[/api/sql]', err);
    res.status(500).json({ error: 'Could not reach the upstream data source. Please try again.' });
  }
});

// ─── Enrichment: officers + UBOs + business activity ─────────────────────────
/**
 * GET /api/enriched/:regNo
 * Runs 3 parallel CKAN queries and returns a RegistrySnapshot.
 * Non-blocking from the client's perspective — the client fires this after
 * company selection and updates the store when it resolves.
 *
 * Status logic:
 *   all 3 succeed with ≥1 result → "ready"
 *   mix of success/empty        → "partial"
 *   all fail / empty            → "failed"
 */
app.get('/api/enriched/:regNo', async (req: Request, res: Response) => {
  const regNo = (req.params['regNo'] ?? '').replace(/\D/g, '').slice(0, 20);
  if (!regNo) {
    res.status(400).json({ error: 'Registration number is required.' });
    return;
  }

  const headers = { 'User-Agent': 'kts-explorer/1.0', 'Content-Type': 'application/json' };
  const mkUrl = (resourceId: string) => {
    const filters = encodeURIComponent(JSON.stringify({ legal_entity_registration_number: regNo }));
    return `${CKAN_BASE}/datastore_search?resource_id=${resourceId}&filters=${filters}&limit=20`;
  };

  // Run all 3 in parallel; individual failures don't blow up the whole response
  const [officersResult, uboResult, activityResult] = await Promise.allSettled([
    fetch(mkUrl(RES_OFFICERS), { headers }).then(r => r.json() as Promise<CKANEnrichResponse<OfficerRecord>>),
    fetch(mkUrl(RES_UBO),      { headers }).then(r => r.json() as Promise<CKANEnrichResponse<UBORecord>>),
    fetch(mkUrl(RES_ACTIVITY), { headers }).then(r => r.json() as Promise<CKANEnrichResponse<ActivityRecord>>),
  ]);

  // ── Map officers ────────────────────────────────────────────────────────────
  const officersOk = officersResult.status === 'fulfilled' && officersResult.value.success;
  const rawOfficers: OfficerRecord[] = officersOk ? officersResult.value.result.records : [];

  const officers = rawOfficers
    .filter(o => {
      // Skip rows that are clearly legal-entity entries, not persons
      const et = (o.entity_type ?? '').toLowerCase();
      return !et.includes('legal') && !et.includes('jur') && !et.includes('uzn');
    })
    .map(o => {
      const parts = (o.name ?? '').trim().split(/\s+/);
      if (parts.length < 2) return null;
      const lastName  = parts.pop()!;
      const firstName = parts.join(' ');
      return { firstName, lastName, role: o.position ?? '' };
    })
    .filter(Boolean) as Array<{ firstName: string; lastName: string; role: string }>;

  // ── Map UBOs ────────────────────────────────────────────────────────────────
  const uboOk = uboResult.status === 'fulfilled' && uboResult.value.success;
  const rawUBOs: UBORecord[] = uboOk ? uboResult.value.result.records : [];
  const beneficialOwners = rawUBOs
    .filter(u => u.forename && u.surname)
    .map(u => ({ firstName: u.forename, lastName: u.surname }));

  // ── Map business activity ────────────────────────────────────────────────────
  const actOk = activityResult.status === 'fulfilled' && activityResult.value.success;
  const rawAct: ActivityRecord[] = actOk ? activityResult.value.result.records : [];
  const businessActivity = rawAct[0]?.area_of_activity ?? '';

  // ── Determine status ────────────────────────────────────────────────────────
  const successCount = [officersOk, uboOk, actOk].filter(Boolean).length;
  const hasAnyData   = officers.length > 0 || beneficialOwners.length > 0 || businessActivity;
  const status =
    successCount === 3 && hasAnyData ? 'ready'
    : successCount === 0 || !hasAnyData ? 'failed'
    : 'partial';

  res.json({
    status,
    snapshot: {
      registrationNumber: regNo,
      companyName:        '',           // caller already has this from Step 1
      legalAddress:       '',           // caller already has this from Step 1
      officers,
      beneficialOwners,
      businessActivity,
      fetchedAt: new Date().toISOString(),
    },
  });
});

// ─── 404 for unknown API routes ───────────────────────────────────────────────
app.use('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'API route not found.' });
});

// ─── Global error handler ─────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[unhandled]', err);
  res.status(500).json({ error: 'Unexpected server error.' });
});

// ─── Catch-all → SPA ─────────────────────────────────────────────────────────
app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'client/index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀  Server running at http://localhost:${PORT}\n`);
  console.log(`   GET  /api/search?q=<name>&limit=10`);
  console.log(`   GET  /api/search?regcode=<code>`);
  console.log(`   GET  /api/enriched/:regNo`);
  console.log(`   POST /api/sql  { sql: "SELECT ..." }`);
  console.log(`   GET  /api/health\n`);
});
