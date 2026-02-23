const BASE = 'https://www.googleapis.com/webmasters/v3';

async function get(url: string, token: string) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error('SESSION_EXPIRED');
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: { message?: string } }).error?.message ?? `API error ${res.status}`
    );
  }
  return res.json();
}

async function post(url: string, token: string, body: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (res.status === 401) throw new Error('SESSION_EXPIRED');
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: { message?: string } }).error?.message ?? `API error ${res.status}`
    );
  }
  return res.json();
}

export async function fetchSCSites(token: string) {
  return get(`${BASE}/sites`, token);
}

export async function fetchSCOverview(
  token: string,
  siteUrl: string,
  startDate: string,
  endDate: string
) {
  const encoded = encodeURIComponent(siteUrl);
  return post(`${BASE}/sites/${encoded}/searchAnalytics/query`, token, {
    startDate,
    endDate,
    dimensions: [],
    rowLimit: 1,
  });
}

export async function fetchTopQueries(
  token: string,
  siteUrl: string,
  startDate: string,
  endDate: string,
  rowLimit = 1000
) {
  const encoded = encodeURIComponent(siteUrl);
  return post(`${BASE}/sites/${encoded}/searchAnalytics/query`, token, {
    startDate,
    endDate,
    dimensions: ['query'],
    rowLimit,
    orderBy: [{ fieldName: 'clicks', sortOrder: 'DESCENDING' }],
  });
}

export async function fetchSCPages(
  token: string,
  siteUrl: string,
  startDate: string,
  endDate: string,
  rowLimit = 1000
) {
  const encoded = encodeURIComponent(siteUrl);
  return post(`${BASE}/sites/${encoded}/searchAnalytics/query`, token, {
    startDate,
    endDate,
    dimensions: ['page'],
    rowLimit,
    orderBy: [{ fieldName: 'clicks', sortOrder: 'DESCENDING' }],
  });
}
