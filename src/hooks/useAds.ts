import { useState, useEffect } from 'react';
import { fetchAdsOverview, fetchAdsKeywords } from '../services/adsApi';
import type { AdsOverview, AdsKeyword } from '../types';

export function useAds(
  accessToken: string,
  customerId: string | null,
  currencyCode: string,
  startDate: string,
  endDate: string
) {
  const [overview, setOverview] = useState<AdsOverview | null>(null);
  const [keywords, setKeywords] = useState<AdsKeyword[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [overviewRes, keywordsRes] = await Promise.all([
          fetchAdsOverview(accessToken, customerId!, startDate, endDate),
          fetchAdsKeywords(accessToken, customerId!, startDate, endDate),
        ]);
        if (cancelled) return;

        // Aggregate metrics across all non-removed campaigns
        let totalClicks = 0;
        let totalImpressions = 0;
        let totalCost = 0;
        for (const row of overviewRes.results ?? []) {
          totalClicks += Number(row.metrics?.clicks ?? 0);
          totalImpressions += Number(row.metrics?.impressions ?? 0);
          totalCost += Number(row.metrics?.costMicros ?? 0);
        }

        setOverview({
          clicks: totalClicks,
          impressions: totalImpressions,
          costMicros: totalCost,
          ctr: totalImpressions > 0 ? totalClicks / totalImpressions : 0,
          currencyCode,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setKeywords(
          (keywordsRes.results ?? []).map((row: any) => ({
            text: row.adGroupCriterion?.keyword?.text ?? '(unknown)',
            clicks: Number(row.metrics?.clicks ?? 0),
            impressions: Number(row.metrics?.impressions ?? 0),
            costMicros: Number(row.metrics?.costMicros ?? 0),
            ctr: Number(row.metrics?.ctr ?? 0),
          }))
        );
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Failed to load Ads data';
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [accessToken, customerId, currencyCode, startDate, endDate]);

  return { overview, keywords, loading, error };
}
