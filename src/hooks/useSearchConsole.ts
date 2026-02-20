import { useState, useEffect } from 'react';
import { fetchSCOverview, fetchTopQueries } from '../services/searchConsoleApi';
import type { SCOverview, QueryData } from '../types';

interface UseSearchConsoleResult {
  overview: SCOverview | null;
  topQueries: QueryData[];
  loading: boolean;
  error: string | null;
}

export function useSearchConsole(
  accessToken: string,
  siteUrl: string | null,
  startDate: string,
  endDate: string
): UseSearchConsoleResult {
  const [overview, setOverview] = useState<SCOverview | null>(null);
  const [topQueries, setTopQueries] = useState<QueryData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!siteUrl) return;
    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      setError(null);
      try {
        const [overviewRes, queriesRes] = await Promise.all([
          fetchSCOverview(accessToken, siteUrl!, startDate, endDate),
          fetchTopQueries(accessToken, siteUrl!, startDate, endDate),
        ]);
        if (cancelled) return;

        // Overview — SC returns aggregate in rows[0] when no dimensions
        const overviewRow = overviewRes.rows?.[0];
        setOverview(
          overviewRow
            ? {
                clicks: overviewRow.clicks ?? 0,
                impressions: overviewRow.impressions ?? 0,
                ctr: overviewRow.ctr ?? 0,
                position: overviewRow.position ?? 0,
              }
            : { clicks: 0, impressions: 0, ctr: 0, position: 0 }
        );

        // Top queries
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const queries: QueryData[] = (queriesRes.rows ?? []).map((r: any) => ({
          query: r.keys[0],
          clicks: r.clicks,
          impressions: r.impressions,
          ctr: r.ctr,
          position: r.position,
        }));
        setTopQueries(queries);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch Search Console data');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [accessToken, siteUrl, startDate, endDate]);

  return { overview, topQueries, loading, error };
}
