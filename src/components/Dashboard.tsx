import { useAnalytics } from '../hooks/useAnalytics';
import { useSearchConsole } from '../hooks/useSearchConsole';
import { useAds } from '../hooks/useAds';
import MetricCard from './MetricCard';
import TopPagesTable from './TopPagesTable';
import TopQueriesTable from './TopQueriesTable';
import AdsKeywordsTable from './AdsKeywordsTable';
import TrendChart from './TrendChart';
import LoadingSpinner from './LoadingSpinner';
import type { DatePreset } from '../types';
import { formatPct } from '../utils/dates';

interface DashboardProps {
  accessToken: string;
  gaPropertyId: string;
  scSiteUrl: string | null;
  adsCustomerId: string | null;
  adsCurrencyCode: string;
  startDate: string;
  endDate: string;
  datePreset: DatePreset;
  onDatePresetChange: (preset: DatePreset) => void;
  onSignOut: () => void;
  onReset: () => void;
}

const DATE_LABELS: Record<DatePreset, string> = {
  '7': 'Last 7 days',
  '28': 'Last 28 days',
  '90': 'Last 90 days',
};

function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const isSessionExpired = message === 'SESSION_EXPIRED';
  return (
    <div className="error-banner">
      {isSessionExpired ? (
        <>
          <strong>Session expired.</strong> Your Google auth token has expired.{' '}
          {onRetry && (
            <button className="btn-link" onClick={onRetry}>
              Sign in again
            </button>
          )}
        </>
      ) : (
        <>
          <strong>Error:</strong> {message}
        </>
      )}
    </div>
  );
}

function formatCost(micros: number, currencyCode: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(micros / 1_000_000);
}

export default function Dashboard({
  accessToken,
  gaPropertyId,
  scSiteUrl,
  adsCustomerId,
  adsCurrencyCode,
  startDate,
  endDate,
  datePreset,
  onDatePresetChange,
  onSignOut,
  onReset,
}: DashboardProps) {
  const ga = useAnalytics(accessToken, gaPropertyId, startDate, endDate);
  const sc = useSearchConsole(accessToken, scSiteUrl, startDate, endDate);
  const ads = useAds(accessToken, adsCustomerId, adsCurrencyCode, startDate, endDate);

  return (
    <div className="dashboard">
      {/* ── Header ── */}
      <header className="dashboard-header">
        <div className="header-brand">
          <svg width="28" height="28" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <rect width="48" height="48" rx="10" fill="#1a73e8" opacity="0.1"/>
            <rect x="10" y="28" width="8" height="12" rx="2" fill="#34a853"/>
            <rect x="20" y="20" width="8" height="20" rx="2" fill="#1a73e8"/>
            <rect x="30" y="24" width="8" height="16" rx="2" fill="#fbbc04"/>
          </svg>
          <span className="header-title">Analytics Dashboard</span>
        </div>

        <div className="date-pills">
          {(['7', '28', '90'] as DatePreset[]).map((d) => (
            <button
              key={d}
              className={`date-pill ${datePreset === d ? 'date-pill--active' : ''}`}
              onClick={() => onDatePresetChange(d)}
            >
              {DATE_LABELS[d]}
            </button>
          ))}
        </div>

        <div className="header-actions">
          <button className="btn-text" onClick={onReset}>
            Change properties
          </button>
          <button className="btn-outline" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="dashboard-main">
        {/* ── GA Section ── */}
        <section className="section">
          <div className="section-heading">
            <div className="section-label section-label--blue">GA4</div>
            <div>
              <h2 className="section-title">Google Analytics</h2>
              <p className="section-meta">Property ID: {gaPropertyId}</p>
            </div>
          </div>

          {ga.loading ? (
            <LoadingSpinner message="Fetching Analytics data..." />
          ) : ga.error ? (
            <ErrorBanner message={ga.error} onRetry={onSignOut} />
          ) : (
            <>
              <div className="metrics-grid">
                <MetricCard
                  label="Sessions"
                  value={(ga.metrics?.sessions ?? 0).toLocaleString()}
                  color="blue"
                  icon="📈"
                />
                <MetricCard
                  label="Active Users"
                  value={(ga.metrics?.activeUsers ?? 0).toLocaleString()}
                  color="green"
                  icon="👥"
                />
                <MetricCard
                  label="New Users"
                  value={(ga.metrics?.newUsers ?? 0).toLocaleString()}
                  color="purple"
                  icon="✨"
                />
                <MetricCard
                  label="Key Events"
                  value={(ga.metrics?.eventCount ?? 0).toLocaleString()}
                  color="orange"
                  icon="🎯"
                  subtext={
                    ga.metrics && ga.metrics.conversions > 0
                      ? `${ga.metrics.conversions.toLocaleString()} conversions`
                      : undefined
                  }
                />
              </div>

              {ga.timeSeries.length > 0 && <TrendChart data={ga.timeSeries} />}
              <TopPagesTable pages={ga.topPages} />
            </>
          )}
        </section>

        {/* ── Search Console Section ── */}
        {scSiteUrl ? (
          <section className="section">
            <div className="section-heading">
              <div className="section-label section-label--green">SC</div>
              <div>
                <h2 className="section-title">Search Console</h2>
                <p className="section-meta">{scSiteUrl}</p>
              </div>
            </div>

            {sc.loading ? (
              <LoadingSpinner message="Fetching Search Console data..." />
            ) : sc.error ? (
              <ErrorBanner message={sc.error} onRetry={onSignOut} />
            ) : (
              <>
                <div className="metrics-grid">
                  <MetricCard
                    label="Total Clicks"
                    value={(sc.overview?.clicks ?? 0).toLocaleString()}
                    color="blue"
                    icon="👆"
                  />
                  <MetricCard
                    label="Impressions"
                    value={(sc.overview?.impressions ?? 0).toLocaleString()}
                    color="green"
                    icon="👁️"
                  />
                  <MetricCard
                    label="Click-through Rate"
                    value={formatPct(sc.overview?.ctr ?? 0)}
                    color="purple"
                    icon="📊"
                  />
                  <MetricCard
                    label="Avg. Position"
                    value={(sc.overview?.position ?? 0).toFixed(1)}
                    color="orange"
                    icon="📍"
                    subtext="lower is better"
                  />
                </div>
                <TopQueriesTable queries={sc.topQueries} />
              </>
            )}
          </section>
        ) : (
          <div className="no-sc-banner">
            No Search Console site selected.{' '}
            <button className="btn-link" onClick={onReset}>
              Add one
            </button>
          </div>
        )}

        {/* ── Google Ads Section ── */}
        {adsCustomerId ? (
          <section className="section">
            <div className="section-heading">
              <div className="section-label section-label--orange">ADS</div>
              <div>
                <h2 className="section-title">Google Ads</h2>
                <p className="section-meta">Customer ID: {adsCustomerId}</p>
              </div>
            </div>

            {ads.loading ? (
              <LoadingSpinner message="Fetching Google Ads data..." />
            ) : ads.error ? (
              <ErrorBanner message={ads.error} onRetry={onSignOut} />
            ) : (
              <>
                <div className="metrics-grid">
                  <MetricCard
                    label="Paid Clicks"
                    value={(ads.overview?.clicks ?? 0).toLocaleString()}
                    color="blue"
                    icon="🖱️"
                  />
                  <MetricCard
                    label="Impressions"
                    value={(ads.overview?.impressions ?? 0).toLocaleString()}
                    color="green"
                    icon="👁️"
                  />
                  <MetricCard
                    label="Click-through Rate"
                    value={formatPct(ads.overview?.ctr ?? 0)}
                    color="purple"
                    icon="📊"
                  />
                  <MetricCard
                    label="Budget Spent"
                    value={formatCost(ads.overview?.costMicros ?? 0, adsCurrencyCode)}
                    color="orange"
                    icon="💰"
                    subtext={`in ${adsCurrencyCode}`}
                  />
                </div>
                <AdsKeywordsTable keywords={ads.keywords} currencyCode={adsCurrencyCode} />
              </>
            )}
          </section>
        ) : (
          <div className="no-sc-banner">
            No Google Ads account selected.{' '}
            <button className="btn-link" onClick={onReset}>
              Add one
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
