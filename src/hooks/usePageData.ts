import { useState, useEffect } from 'react';
import { fetchSCPages, inspectUrl } from '../services/searchConsoleApi';
import { fetchPageEngagement } from '../services/analyticsApi';
import type { SCPageStats } from '../types';

interface UsePageDataResult {
  indexedPages: SCPageStats[];
  notIndexedPages: SCPageStats[];
  loading: boolean;
  inspecting: boolean; // true while URL Inspection API calls are running
  error: string | null;
}

// Build the base URL for full-page URL construction from a SC siteUrl.
// sc-domain:example.com  →  https://example.com
// https://example.com/   →  https://example.com
function buildBaseUrl(siteUrl: string): string {
  if (siteUrl.startsWith('sc-domain:')) {
    return `https://${siteUrl.slice('sc-domain:'.length).replace(/\/$/, '')}`;
  }
  return siteUrl.replace(/\/$/, '');
}

// Run `fn` over `items` with at most `limit` in-flight at once.
async function withConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = [];
  for (let i = 0; i < items.length; i += limit) {
    const batch = await Promise.allSettled(items.slice(i, i + limit).map(fn));
    results.push(...batch);
  }
  return results;
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
  const [inspecting, setInspecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!siteUrl) return;
    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      setInspecting(false);
      setError(null);

      try {
        // ── Phase 1: fetch SC analytics + GA page data in parallel ──────────
        const [scRes, gaRes] = await Promise.all([
          fetchSCPages(accessToken, siteUrl!, startDate, endDate),
          fetchPageEngagement(accessToken, propertyId, startDate, endDate),
        ]);
        if (cancelled) return;

        // Build SC map: full-URL → { clicks, impressions, position }
        const scMap = new Map<string, { clicks: number; impressions: number; position: number }>();
        for (const r of scRes.rows ?? []) {
          scMap.set(r.keys[0] as string, {
            clicks: r.clicks,
            impressions: r.impressions,
            position: r.position,
          });
        }

        // Build GA map: pagePath → { pageViews, avgTimeOnPage }
        const gaMap = new Map<string, { pageViews: number; avgTimeOnPage: number }>();
        const gaPages: string[] = [];
        for (const row of gaRes.rows ?? []) {
          const path = row.dimensionValues[0].value as string;
          gaMap.set(path, {
            pageViews: parseInt(row.metricValues[0].value, 10),
            avgTimeOnPage: parseFloat(row.metricValues[1].value),
          });
          gaPages.push(path);
        }

        const baseUrl = buildBaseUrl(siteUrl!);

        // ── Phase 2: URL Inspection for accurate indexed status ──────────────
        // Build list of full URLs to inspect (top 100 GA pages by position in GA result)
        const toInspect = gaPages.slice(0, 100).map((path) => `${baseUrl}${path}`);

        setLoading(false);
        setInspecting(true);

        // Inspect concurrently, 8 at a time, silently ignore failures per URL
        const inspectionResults = await withConcurrency(toInspect, 8, (url) =>
          inspectUrl(accessToken, url, siteUrl!)
        );
        if (cancelled) return;

        // Build verdict map: fullUrl → 'PASS' | 'FAIL' | 'NEUTRAL'
        const verdictMap = new Map<string, string>();
        for (let i = 0; i < toInspect.length; i++) {
          const settled = inspectionResults[i];
          if (settled.status === 'fulfilled') {
            const verdict: string =
              settled.value?.inspectionResult?.indexStatusResult?.verdict ?? 'NEUTRAL';
            verdictMap.set(toInspect[i], verdict);
          } else {
            verdictMap.set(toInspect[i], 'NEUTRAL');
          }
        }

        if (cancelled) return;

        // ── Phase 3: classify pages ──────────────────────────────────────────
        const indexed: SCPageStats[] = [];
        const notIndexed: SCPageStats[] = [];

        for (const path of gaPages) {
          const fullUrl = `${baseUrl}${path}`;
          const ga = gaMap.get(path);
          const sc = scMap.get(fullUrl);
          const verdict = verdictMap.get(fullUrl);

          if (verdict === 'PASS' || sc) {
            // Confirmed indexed: URL inspection PASS OR appeared in SC search results
            indexed.push({
              page: fullUrl,
              clicks: sc?.clicks ?? 0,
              impressions: sc?.impressions ?? 0,
              position: sc?.position ?? 0,
              pageViews: ga?.pageViews,
              avgTimeOnPage: ga?.avgTimeOnPage,
            });
          } else if (verdict === 'FAIL' || verdict === 'NEUTRAL') {
            notIndexed.push({
              page: fullUrl,
              clicks: 0,
              impressions: 0,
              position: 0,
              pageViews: ga?.pageViews,
              avgTimeOnPage: ga?.avgTimeOnPage,
            });
          }
          // Pages beyond top 100 that aren't in SC analytics → skip (no verdict available)
        }

        // Also add SC pages that didn't appear in GA (indexed, just no GA traffic)
        for (const [fullUrl, sc] of scMap) {
          const path = (() => { try { return new URL(fullUrl).pathname; } catch { return fullUrl; } })();
          if (!gaMap.has(path)) {
            indexed.push({
              page: fullUrl,
              clicks: sc.clicks,
              impressions: sc.impressions,
              position: sc.position,
              pageViews: undefined,
              avgTimeOnPage: undefined,
            });
          }
        }

        // Sort indexed by clicks desc
        indexed.sort((a, b) => b.clicks - a.clicks);
        // Sort not-indexed by pageViews desc
        notIndexed.sort((a, b) => (b.pageViews ?? 0) - (a.pageViews ?? 0));

        setIndexedPages(indexed);
        setNotIndexedPages(notIndexed);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch page data');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setInspecting(false);
        }
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, [accessToken, siteUrl, propertyId, startDate, endDate]);

  return { indexedPages, notIndexedPages, loading, inspecting, error };
}
