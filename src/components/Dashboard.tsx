import { useState } from 'react';
import { useAnalytics } from '../hooks/useAnalytics';
import { useSearchConsole } from '../hooks/useSearchConsole';
import { useAds } from '../hooks/useAds';
import { usePageData } from '../hooks/usePageData';
import MetricCard from './MetricCard';
import TopPagesTable from './TopPagesTable';
import TopQueriesTable from './TopQueriesTable';
import PageDataTab from './PageDataTab';
import AdsKeywordsTable from './AdsKeywordsTable';
import TrendChart from './TrendChart';
import LoadingSpinner from './LoadingSpinner';
import InfoTooltip from './InfoTooltip';
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

type Tab = 'home' | 'analytics' | 'search-console' | 'ads';

// ── Tooltip definitions ──────────────────────────────────────────────────────

const TOOLTIPS = {
  sc: {
    clicks:
      'The number of times users clicked your site\'s link in Google Search results during this period.',
    impressions:
      'How many times your site appeared in Google Search results, regardless of whether it was clicked.',
    ctr:
      'Click-through rate: the percentage of impressions that resulted in a click. Calculated as Clicks ÷ Impressions.',
    position:
      'The average ranking position of your pages in Google Search. Position 1 is the top result. Lower numbers indicate better rankings.',
  },
  ga: {
    sessions:
      'A group of interactions that take place on your site within a given time frame. A new session starts after 30 minutes of inactivity.',
    activeUsers:
      'The number of distinct users who were active on your site during the selected period.',
    newUsers: 'Users who visited your site for the very first time in the selected period.',
    keyEvents:
      'Actions marked as valuable on your site, such as purchases or sign-ups. Formerly called conversions.',
  },
  ads: {
    clicks: 'The number of times users clicked on one of your Google Ads during this period.',
    impressions:
      'The number of times your ads were shown to users in Google\'s ad network during this period.',
    ctr: 'Click-through rate: the percentage of ad impressions that resulted in a click.',
    spend:
      'The total amount charged to your Google Ads account for the selected period.',
  },
};

// ── Helper components ────────────────────────────────────────────────────────

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

// ── Main component ───────────────────────────────────────────────────────────

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
  const [activeTab, setActiveTab] = useState<Tab>('home');

  // Search Console sub-tab
  const [scTab, setScTab] = useState<'queries' | 'page-data'>('queries');

  // Search Console sort state
  const [scSortKey, setScSortKey] = useState<'clicks' | 'position' | null>(null);
  const [scSortDir, setScSortDir] = useState<'asc' | 'desc'>('asc');

  function handleScSort(key: 'clicks' | 'position') {
    if (scSortKey === key) {
      setScSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setScSortKey(key);
      setScSortDir('asc');
    }
  }

  const ga = useAnalytics(accessToken, gaPropertyId, startDate, endDate);
  const sc = useSearchConsole(accessToken, scSiteUrl, startDate, endDate);
  const ads = useAds(accessToken, adsCustomerId, adsCurrencyCode, startDate, endDate);
  const pageData = usePageData(accessToken, scSiteUrl, gaPropertyId, startDate, endDate);

  const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'home',
      label: 'Home',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
    {
      id: 'search-console',
      label: 'Search Console',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
    },
    {
      id: 'ads',
      label: 'Ads',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
  ];

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

      {/* ── Body: Sidebar + Content ── */}
      <div className="dashboard-body">
        <nav className="dashboard-sidebar">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`sidebar-nav-item ${activeTab === item.id ? 'sidebar-nav-item--active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <main className="dashboard-main">
          {/* ── Home Tab ── */}
          {activeTab === 'home' && (
            <>
              <div className="page-header">
                <h2 className="page-title-text">Overview</h2>
                <p className="page-subtitle">{DATE_LABELS[datePreset]}</p>
              </div>

              <div className="overview-grid">
                {/* GA4 summary */}
                <div className="overview-card">
                  <div className="overview-card__header">
                    <span className="section-label section-label--blue">GA4</span>
                    <span className="overview-card__title">Google Analytics</span>
                  </div>
                  {ga.loading ? (
                    <LoadingSpinner message="Loading…" />
                  ) : ga.error ? (
                    <ErrorBanner message={ga.error} onRetry={onSignOut} />
                  ) : (
                    <div className="overview-stats">
                      <div className="overview-stat">
                        <div className="overview-stat__value">
                          {(ga.metrics?.sessions ?? 0).toLocaleString()}
                        </div>
                        <div className="overview-stat__label">
                          Sessions <InfoTooltip text={TOOLTIPS.ga.sessions} />
                        </div>
                      </div>
                      <div className="overview-stat">
                        <div className="overview-stat__value">
                          {(ga.metrics?.activeUsers ?? 0).toLocaleString()}
                        </div>
                        <div className="overview-stat__label">
                          Active Users <InfoTooltip text={TOOLTIPS.ga.activeUsers} />
                        </div>
                      </div>
                      <div className="overview-stat">
                        <div className="overview-stat__value">
                          {(ga.metrics?.newUsers ?? 0).toLocaleString()}
                        </div>
                        <div className="overview-stat__label">
                          New Users <InfoTooltip text={TOOLTIPS.ga.newUsers} />
                        </div>
                      </div>
                      <div className="overview-stat">
                        <div className="overview-stat__value">
                          {(ga.metrics?.eventCount ?? 0).toLocaleString()}
                        </div>
                        <div className="overview-stat__label">
                          Key Events <InfoTooltip text={TOOLTIPS.ga.keyEvents} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Search Console summary */}
                <div className="overview-card">
                  <div className="overview-card__header">
                    <span className="section-label section-label--green">SC</span>
                    <span className="overview-card__title">Search Console</span>
                  </div>
                  {!scSiteUrl ? (
                    <div className="overview-unconfigured">
                      No site configured.{' '}
                      <button className="btn-link" onClick={onReset}>Set up</button>
                    </div>
                  ) : sc.loading ? (
                    <LoadingSpinner message="Loading…" />
                  ) : sc.error ? (
                    <ErrorBanner message={sc.error} onRetry={onSignOut} />
                  ) : (
                    <div className="overview-stats">
                      <div className="overview-stat">
                        <div className="overview-stat__value">
                          {(sc.overview?.clicks ?? 0).toLocaleString()}
                        </div>
                        <div className="overview-stat__label">
                          Clicks <InfoTooltip text={TOOLTIPS.sc.clicks} />
                        </div>
                      </div>
                      <div className="overview-stat">
                        <div className="overview-stat__value">
                          {(sc.overview?.impressions ?? 0).toLocaleString()}
                        </div>
                        <div className="overview-stat__label">
                          Impressions <InfoTooltip text={TOOLTIPS.sc.impressions} />
                        </div>
                      </div>
                      <div className="overview-stat">
                        <div className="overview-stat__value">
                          {formatPct(sc.overview?.ctr ?? 0)}
                        </div>
                        <div className="overview-stat__label">
                          CTR <InfoTooltip text={TOOLTIPS.sc.ctr} />
                        </div>
                      </div>
                      <div className="overview-stat">
                        <div className="overview-stat__value">
                          {(sc.overview?.position ?? 0).toFixed(1)}
                        </div>
                        <div className="overview-stat__label">
                          Avg. Position <InfoTooltip text={TOOLTIPS.sc.position} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Ads summary */}
                <div className="overview-card">
                  <div className="overview-card__header">
                    <span className="section-label section-label--orange">ADS</span>
                    <span className="overview-card__title">Google Ads</span>
                  </div>
                  {!adsCustomerId ? (
                    <div className="overview-unconfigured">
                      No account configured.{' '}
                      <button className="btn-link" onClick={onReset}>Set up</button>
                    </div>
                  ) : ads.loading ? (
                    <LoadingSpinner message="Loading…" />
                  ) : ads.error ? (
                    <ErrorBanner message={ads.error} onRetry={onSignOut} />
                  ) : (
                    <div className="overview-stats">
                      <div className="overview-stat">
                        <div className="overview-stat__value">
                          {(ads.overview?.clicks ?? 0).toLocaleString()}
                        </div>
                        <div className="overview-stat__label">
                          Paid Clicks <InfoTooltip text={TOOLTIPS.ads.clicks} />
                        </div>
                      </div>
                      <div className="overview-stat">
                        <div className="overview-stat__value">
                          {(ads.overview?.impressions ?? 0).toLocaleString()}
                        </div>
                        <div className="overview-stat__label">
                          Impressions <InfoTooltip text={TOOLTIPS.ads.impressions} />
                        </div>
                      </div>
                      <div className="overview-stat">
                        <div className="overview-stat__value">
                          {formatPct(ads.overview?.ctr ?? 0)}
                        </div>
                        <div className="overview-stat__label">
                          CTR <InfoTooltip text={TOOLTIPS.ads.ctr} />
                        </div>
                      </div>
                      <div className="overview-stat">
                        <div className="overview-stat__value">
                          {formatCost(ads.overview?.costMicros ?? 0, adsCurrencyCode)}
                        </div>
                        <div className="overview-stat__label">
                          Spend <InfoTooltip text={TOOLTIPS.ads.spend} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Trend chart */}
              {!ga.loading && !ga.error && ga.timeSeries.length > 0 && (
                <div className="section">
                  <TrendChart data={ga.timeSeries} />
                </div>
              )}
            </>
          )}

          {/* ── Analytics Tab ── */}
          {activeTab === 'analytics' && (
            <section className="section">
              <div className="section-heading">
                <div className="section-label section-label--blue">GA4</div>
                <div>
                  <h2 className="section-title">Google Analytics</h2>
                  <p className="section-meta">Property ID: {gaPropertyId}</p>
                </div>
              </div>

              {ga.loading ? (
                <LoadingSpinner message="Fetching Analytics data…" />
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
                      tooltip={TOOLTIPS.ga.sessions}
                    />
                    <MetricCard
                      label="Active Users"
                      value={(ga.metrics?.activeUsers ?? 0).toLocaleString()}
                      color="green"
                      icon="👥"
                      tooltip={TOOLTIPS.ga.activeUsers}
                    />
                    <MetricCard
                      label="New Users"
                      value={(ga.metrics?.newUsers ?? 0).toLocaleString()}
                      color="purple"
                      icon="✨"
                      tooltip={TOOLTIPS.ga.newUsers}
                    />
                    <MetricCard
                      label="Key Events"
                      value={(ga.metrics?.eventCount ?? 0).toLocaleString()}
                      color="orange"
                      icon="🎯"
                      tooltip={TOOLTIPS.ga.keyEvents}
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
          )}

          {/* ── Search Console Tab ── */}
          {activeTab === 'search-console' && (
            scSiteUrl ? (
              <section className="section">
                <div className="section-heading">
                  <div className="section-label section-label--green">SC</div>
                  <div>
                    <h2 className="section-title">Search Console</h2>
                    <p className="section-meta">{scSiteUrl}</p>
                  </div>
                </div>

                {/* SC sub-tabs */}
                <div className="sc-subtabs">
                  <button
                    className={`sc-subtab ${scTab === 'queries' ? 'sc-subtab--active' : ''}`}
                    onClick={() => setScTab('queries')}
                  >
                    Queries
                  </button>
                  <button
                    className={`sc-subtab ${scTab === 'page-data' ? 'sc-subtab--active' : ''}`}
                    onClick={() => setScTab('page-data')}
                  >
                    Page Data
                  </button>
                </div>

                {scTab === 'queries' && (
                  sc.loading ? (
                    <LoadingSpinner message="Fetching Search Console data…" />
                  ) : sc.error ? (
                    <ErrorBanner message={sc.error} onRetry={onSignOut} />
                  ) : (
                    <>
                      {scSortKey && (
                        <div className="sort-hint">
                          Sorted by{' '}
                          <strong>{scSortKey === 'clicks' ? 'Clicks' : 'Avg. Position'}</strong>{' '}
                          ({scSortDir === 'asc' ? 'lowest first' : 'highest first'}).{' '}
                          <button className="btn-link" onClick={() => setScSortKey(null)}>
                            Clear sort
                          </button>
                        </div>
                      )}
                      <div className="metrics-grid">
                        <MetricCard
                          label="Total Clicks"
                          value={(sc.overview?.clicks ?? 0).toLocaleString()}
                          color="blue"
                          icon="👆"
                          tooltip={TOOLTIPS.sc.clicks}
                          onClick={() => handleScSort('clicks')}
                          active={scSortKey === 'clicks'}
                          sortDir={scSortKey === 'clicks' ? scSortDir : undefined}
                        />
                        <MetricCard
                          label="Impressions"
                          value={(sc.overview?.impressions ?? 0).toLocaleString()}
                          color="green"
                          icon="👁️"
                          tooltip={TOOLTIPS.sc.impressions}
                        />
                        <MetricCard
                          label="Click-through Rate"
                          value={formatPct(sc.overview?.ctr ?? 0)}
                          color="purple"
                          icon="📊"
                          tooltip={TOOLTIPS.sc.ctr}
                        />
                        <MetricCard
                          label="Avg. Position"
                          value={(sc.overview?.position ?? 0).toFixed(1)}
                          color="orange"
                          icon="📍"
                          tooltip={TOOLTIPS.sc.position}
                          subtext="lower is better"
                          onClick={() => handleScSort('position')}
                          active={scSortKey === 'position'}
                          sortDir={scSortKey === 'position' ? scSortDir : undefined}
                        />
                      </div>
                      <TopQueriesTable
                        queries={sc.topQueries}
                        sortKey={scSortKey}
                        sortDir={scSortDir}
                      />
                    </>
                  )
                )}

                {scTab === 'page-data' && (
                  <PageDataTab
                    indexedPages={pageData.indexedPages}
                    notIndexedPages={pageData.notIndexedPages}
                    loading={pageData.loading}
                    inspecting={pageData.inspecting}
                    error={pageData.error}
                    siteUrl={scSiteUrl!}
                  />
                )}
              </section>
            ) : (
              <div className="not-configured-banner">
                <p>No Search Console site selected.</p>
                <button className="btn-primary" style={{ marginTop: 16 }} onClick={onReset}>
                  Configure Search Console
                </button>
              </div>
            )
          )}

          {/* ── Ads Tab ── */}
          {activeTab === 'ads' && (
            adsCustomerId ? (
              <section className="section">
                <div className="section-heading">
                  <div className="section-label section-label--orange">ADS</div>
                  <div>
                    <h2 className="section-title">Google Ads</h2>
                    <p className="section-meta">Customer ID: {adsCustomerId}</p>
                  </div>
                </div>

                {ads.loading ? (
                  <LoadingSpinner message="Fetching Google Ads data…" />
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
                        tooltip={TOOLTIPS.ads.clicks}
                      />
                      <MetricCard
                        label="Impressions"
                        value={(ads.overview?.impressions ?? 0).toLocaleString()}
                        color="green"
                        icon="👁️"
                        tooltip={TOOLTIPS.ads.impressions}
                      />
                      <MetricCard
                        label="Click-through Rate"
                        value={formatPct(ads.overview?.ctr ?? 0)}
                        color="purple"
                        icon="📊"
                        tooltip={TOOLTIPS.ads.ctr}
                      />
                      <MetricCard
                        label="Budget Spent"
                        value={formatCost(ads.overview?.costMicros ?? 0, adsCurrencyCode)}
                        color="orange"
                        icon="💰"
                        tooltip={TOOLTIPS.ads.spend}
                        subtext={`in ${adsCurrencyCode}`}
                      />
                    </div>
                    <AdsKeywordsTable keywords={ads.keywords} currencyCode={adsCurrencyCode} />
                  </>
                )}
              </section>
            ) : (
              <div className="not-configured-banner">
                <p>No Google Ads account selected.</p>
                <button className="btn-primary" style={{ marginTop: 16 }} onClick={onReset}>
                  Configure Google Ads
                </button>
              </div>
            )
          )}
        </main>
      </div>
    </div>
  );
}
