const ADS_API_BASE = 'https://googleads.googleapis.com/v18';

function devToken(): string {
  return (import.meta.env.VITE_GOOGLE_ADS_DEVELOPER_TOKEN as string) ?? '';
}

async function adsGet(url: string, accessToken: string) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'developer-token': devToken(),
    },
  });
  if (res.status === 401) throw new Error('SESSION_EXPIRED');
  if (!res.ok) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err: any = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Ads API error ${res.status}`);
  }
  return res.json();
}

async function adsSearch(customerId: string, query: string, accessToken: string) {
  const res = await fetch(
    `${ADS_API_BASE}/customers/${customerId}/googleAds:search`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'developer-token': devToken(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    }
  );
  if (res.status === 401) throw new Error('SESSION_EXPIRED');
  if (!res.ok) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err: any = await res.json().catch(() => ({}));
    const msg =
      err?.error?.details?.[0]?.errors?.[0]?.message ??
      err?.error?.message ??
      `Ads API error ${res.status}`;
    throw new Error(msg);
  }
  return res.json();
}

/** Returns an array of numeric customer IDs the user can access. */
export async function fetchAdsAccessibleCustomers(accessToken: string): Promise<string[]> {
  const data = await adsGet(
    `${ADS_API_BASE}/customers:listAccessibleCustomers`,
    accessToken
  );
  return (data.resourceNames ?? []).map((r: string) => r.replace('customers/', ''));
}

/** Returns name and currency for a single customer ID. */
export async function fetchAdsCustomerInfo(
  accessToken: string,
  customerId: string
): Promise<{ id: string; descriptiveName: string; currencyCode: string }> {
  const data = await adsSearch(
    customerId,
    'SELECT customer.id, customer.descriptive_name, customer.currency_code FROM customer LIMIT 1',
    accessToken
  );
  const row = data.results?.[0]?.customer ?? {};
  return {
    id: String(row.id ?? customerId),
    descriptiveName: row.descriptiveName ?? `Account ${customerId}`,
    currencyCode: row.currencyCode ?? 'USD',
  };
}

/** Aggregate campaign metrics (clicks, impressions, cost) for the date range. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchAdsOverview(
  accessToken: string,
  customerId: string,
  startDate: string,
  endDate: string
): Promise<{ results: any[] }> {
  return adsSearch(
    customerId,
    `SELECT metrics.clicks, metrics.impressions, metrics.cost_micros, metrics.ctr
     FROM campaign
     WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
       AND campaign.status != 'REMOVED'`,
    accessToken
  );
}

/** Top 20 keywords by clicks for the date range. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchAdsKeywords(
  accessToken: string,
  customerId: string,
  startDate: string,
  endDate: string
): Promise<{ results: any[] }> {
  return adsSearch(
    customerId,
    `SELECT ad_group_criterion.keyword.text,
            metrics.clicks, metrics.impressions, metrics.cost_micros, metrics.ctr
     FROM keyword_view
     WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
       AND ad_group_criterion.status != 'REMOVED'
       AND campaign.status != 'REMOVED'
       AND ad_group.status != 'REMOVED'
       AND metrics.clicks > 0
     ORDER BY metrics.clicks DESC
     LIMIT 20`,
    accessToken
  );
}
