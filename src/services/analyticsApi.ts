const DATA_API = 'https://analyticsdata.googleapis.com/v1beta';
const ADMIN_API = 'https://analyticsadmin.googleapis.com/v1beta';

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

export async function fetchGA4AccountSummaries(token: string) {
  return get(`${ADMIN_API}/accountSummaries`, token);
}

export async function fetchGAMetrics(
  token: string,
  propertyId: string,
  startDate: string,
  endDate: string
) {
  return post(`${DATA_API}/properties/${propertyId}:runReport`, token, {
    dateRanges: [{ startDate, endDate }],
    metrics: [
      { name: 'sessions' },
      { name: 'activeUsers' },
      { name: 'newUsers' },
      { name: 'eventCount' },
      { name: 'conversions' },
    ],
  });
}

export async function fetchTopPages(
  token: string,
  propertyId: string,
  startDate: string,
  endDate: string
) {
  return post(`${DATA_API}/properties/${propertyId}:runReport`, token, {
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
    metrics: [
      { name: 'screenPageViews' },
      { name: 'activeUsers' },
      { name: 'averageSessionDuration' },
    ],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 10,
  });
}

export async function fetchPageEngagement(
  token: string,
  propertyId: string,
  startDate: string,
  endDate: string
) {
  return post(`${DATA_API}/properties/${propertyId}:runReport`, token, {
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [
      { name: 'screenPageViews' },
      { name: 'averageSessionDuration' },
    ],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 1000,
  });
}

export async function fetchSessionsOverTime(
  token: string,
  propertyId: string,
  startDate: string,
  endDate: string
) {
  return post(`${DATA_API}/properties/${propertyId}:runReport`, token, {
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'date' }],
    metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
    orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
  });
}
