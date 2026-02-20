import { useState, useEffect } from 'react';
import { fetchSCOverview, fetchTopQueries } from '../services/searchConsoleApi';
import { getPrevPeriod } from '../utils/dates';
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
        const { prevStart, prevEnd } = getPrevPeriod(startDate, endDate);

        const [overviewRes, queriesRes, prevQueriesRes] = await Promise.all([
          fetchSCOverview(accessToken, siteUrl!, startDate, endDate),
          fetchTopQueries(accessToken, siteUrl!, startDate, endDate),
          fetchTopQueries(accessToken, siteUrl!, prevStart, prevEnd),
        ]);
        if (cancelled) return;

        // Overview
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

        // Build a lookup map for previous period: query → { clicks, position }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const prevMap = new Map<string, { clicks: number; position: number }>();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const r of prevQueriesRes.rows ?? [] as any[]) {
          prevMap.set(r.keys[0] as string, {
            clicks: r.clicks as number,
            position: r.position as number,
          });
        }

        // Current queries with deltas
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const queries: QueryData[] = (queriesRes.rows ?? []).map((r: any) => {
          const prev = prevMap.get(r.keys[0] as string) ?? null;
          return {
            query: r.keys[0],
            clicks: r.clicks,
            impressions: r.impressions,
            ctr: r.ctr,
            position: r.position,
            clicksDelta: prev !== null ? r.clicks - prev.clicks : null,
            positionDelta: prev !== null ? r.position - prev.position : null,
          };
        });
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
