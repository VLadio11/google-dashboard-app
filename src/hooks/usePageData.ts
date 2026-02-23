import { useState, useEffect } from 'react';
import { fetchSCPages } from '../services/searchConsoleApi';
import { fetchPageEngagement } from '../services/analyticsApi';
import type { SCPageStats } from '../types';

interface UsePageDataResult {
  indexedPages: SCPageStats[];
  notIndexedPages: SCPageStats[];
  loading: boolean;
  error: string | null;
}

function extractPath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

export function usePageData(
  accessToken: string,
  siteUrl: string | null,
  propertyId: string,
  startDate: string,
  endDate: string
): UsePageDataResult {
  const [indexedPages, setIndexedPages] = useState<SCPageStats[]>([]);
  const [notIndexedPages, setNotIndexedPages] = useState<SCPageStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!siteUrl) return;
    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      setError(null);
      try {
        const [scRes, gaRes] = await Promise.all([
          fetchSCPages(accessToken, siteUrl!, startDate, endDate),
          fetchPageEngagement(accessToken, propertyId, startDate, endDate),
        ]);
        if (cancelled) return;

        // Build GA map: pagePath -> { pageViews, avgTimeOnPage }
        const gaMap = new Map<string, { pageViews: number; avgTimeOnPage: number }>();
        for (const row of gaRes.rows ?? []) {
          const path = row.dimensionValues[0].value as string;
          gaMap.set(path, {
            pageViews: parseInt(row.metricValues[0].value, 10),
            avgTimeOnPage: parseFloat(row.metricValues[1].value),
          });
        }

        // Indexed pages: from SC, enriched with GA data
        const scPathSet = new Set<string>();
        const indexed: SCPageStats[] = (scRes.rows ?? []).map((r: any) => {
          const page = r.keys[0] as string;
          const path = extractPath(page);
          scPathSet.add(path);
          const ga = gaMap.get(path);
          return {
            page,
            clicks: r.clicks,
            impressions: r.impressions,
            position: r.position,
            pageViews: ga?.pageViews,
            avgTimeOnPage: ga?.avgTimeOnPage,
          };
        });
        setIndexedPages(indexed);

        // Not indexed: GA pages with no SC impressions
        const notIndexed: SCPageStats[] = [];
        for (const row of gaRes.rows ?? []) {
          const path = row.dimensionValues[0].value as string;
          if (!scPathSet.has(path)) {
            notIndexed.push({
              page: path,
              clicks: 0,
              impressions: 0,
              position: 0,
              pageViews: parseInt(row.metricValues[0].value, 10),
              avgTimeOnPage: parseFloat(row.metricValues[1].value),
            });
          }
        }
        setNotIndexedPages(notIndexed);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch page data');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [accessToken, siteUrl, propertyId, startDate, endDate]);

  return { indexedPages, notIndexedPages, loading, error };
}
