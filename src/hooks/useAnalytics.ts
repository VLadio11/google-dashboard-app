import { useState, useEffect } from 'react';
import {
  fetchGAMetrics,
  fetchTopPages,
  fetchSessionsOverTime,
} from '../services/analyticsApi';
import type { GAMetrics, PageData, TimeSeriesPoint } from '../types';

interface UseAnalyticsResult {
  metrics: GAMetrics | null;
  topPages: PageData[];
  timeSeries: TimeSeriesPoint[];
  loading: boolean;
  error: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseMetricValue(row: any, index: number): number {
  return parseInt(row?.metricValues?.[index]?.value ?? '0', 10);
}

export function useAnalytics(
  accessToken: string,
  propertyId: string,
  startDate: string,
  endDate: string
): UseAnalyticsResult {
  const [metrics, setMetrics] = useState<GAMetrics | null>(null);
  const [topPages, setTopPages] = useState<PageData[]>([]);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      setError(null);
      try {
        const [metricsRes, pagesRes, timeRes] = await Promise.all([
          fetchGAMetrics(accessToken, propertyId, startDate, endDate),
          fetchTopPages(accessToken, propertyId, startDate, endDate),
          fetchSessionsOverTime(accessToken, propertyId, startDate, endDate),
        ]);
        if (cancelled) return;

        // Parse overview metrics (aggregate row)
        const row = metricsRes.rows?.[0];
        setMetrics({
          sessions: parseMetricValue(row, 0),
          activeUsers: parseMetricValue(row, 1),
          newUsers: parseMetricValue(row, 2),
          eventCount: parseMetricValue(row, 3),
          conversions: parseMetricValue(row, 4),
        });

        // Parse top pages
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pages: PageData[] = (pagesRes.rows ?? []).map((r: any) => ({
          pagePath: r.dimensionValues[0].value,
          pageTitle: r.dimensionValues[1].value,
          pageViews: parseInt(r.metricValues[0].value, 10),
          activeUsers: parseInt(r.metricValues[1].value, 10),
          avgSessionDuration: parseFloat(r.metricValues[2].value),
        }));
        setTopPages(pages);

        // Parse time series — GA date format is "YYYYMMDD"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const series: TimeSeriesPoint[] = (timeRes.rows ?? []).map((r: any) => {
          const d: string = r.dimensionValues[0].value;
          return {
            date: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`,
            sessions: parseInt(r.metricValues[0].value, 10),
            activeUsers: parseInt(r.metricValues[1].value, 10),
          };
        });
        setTimeSeries(series);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch Analytics data');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [accessToken, propertyId, startDate, endDate]);

  return { metrics, topPages, timeSeries, loading, error };
}
