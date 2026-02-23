import { useState, useMemo, useEffect } from 'react';
import type { SCPageStats } from '../types';
import LoadingSpinner from './LoadingSpinner';
import InfoTooltip from './InfoTooltip';

type Filter = 'indexed' | 'not-indexed';
type IndexedSortKey = 'clicks' | 'impressions' | 'avgTimeOnPage';
type NotIndexedSortKey = 'pageViews' | 'avgTimeOnPage';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 25;

function formatTime(seconds: number | undefined): string {
  if (!seconds || seconds < 0.5) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function positionBadgeClass(pos: number): string {
  if (pos <= 3) return 'badge badge-green';
  if (pos <= 10) return 'badge badge-blue';
  return 'badge badge-gray';
}

// Builds the SC deep-link for URL Inspection (pre-loads the specific page)
function scInspectLink(siteUrl: string, pageUrl: string): string {
  return `https://search.google.com/search-console/inspect?resource_id=${encodeURIComponent(siteUrl)}&id=${encodeURIComponent(pageUrl)}`;
}

// Builds the SC deep-link for the Removals tool
function scRemovalsLink(siteUrl: string): string {
  return `https://search.google.com/search-console/removals?resource_id=${encodeURIComponent(siteUrl)}`;
}

function SortTh({
  label,
  icon,
  sortKey,
  activeSortKey,
  sortDir,
  onSort,
  tooltip,
}: {
  label: string;
  icon: string;
  sortKey: string;
  activeSortKey: string;
  sortDir: SortDir;
  onSort: (key: string) => void;
  tooltip?: string;
}) {
  const isActive = activeSortKey === sortKey;
  return (
    <th
      className="text-right sortable-th"
      onClick={() => onSort(sortKey)}
      aria-sort={isActive ? (sortDir === 'desc' ? 'descending' : 'ascending') : 'none'}
    >
      <span className="th-inner">
        <span className="th-icon">{icon}</span>
        {label}
        {tooltip && <InfoTooltip text={tooltip} />}
        <span className={`th-sort-arrow ${isActive ? 'th-sort-arrow--active' : ''}`}>
          {isActive ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}
        </span>
      </span>
    </th>
  );
}

interface PageDataTabProps {
  indexedPages: SCPageStats[];
  notIndexedPages: SCPageStats[];
  loading: boolean;
  inspecting: boolean;
  error: string | null;
  siteUrl: string;
}

export default function PageDataTab({
  indexedPages,
  notIndexedPages,
  loading,
  inspecting,
  error,
  siteUrl,
}: PageDataTabProps) {
  const [filter, setFilter] = useState<Filter>('indexed');
  const [page, setPage] = useState(0);
  const [indexedSortKey, setIndexedSortKey] = useState<IndexedSortKey>('clicks');
  const [indexedSortDir, setIndexedSortDir] = useState<SortDir>('desc');
  const [notIndexedSortKey, setNotIndexedSortKey] = useState<NotIndexedSortKey>('pageViews');
  const [notIndexedSortDir, setNotIndexedSortDir] = useState<SortDir>('desc');

  useEffect(() => { setPage(0); }, [filter]);

  function handleIndexedSort(key: string) {
    const k = key as IndexedSortKey;
    if (indexedSortKey === k) {
      setIndexedSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setIndexedSortKey(k);
      setIndexedSortDir('desc');
    }
    setPage(0);
  }

  function handleNotIndexedSort(key: string) {
    const k = key as NotIndexedSortKey;
    if (notIndexedSortKey === k) {
      setNotIndexedSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setNotIndexedSortKey(k);
      setNotIndexedSortDir('desc');
    }
    setPage(0);
  }

  function handleFilter(f: Filter) {
    setFilter(f);
    setPage(0);
  }

  const sortedIndexed = useMemo(() => {
    return [...indexedPages].sort((a, b) => {
      const aVal = (a[indexedSortKey] ?? 0) as number;
      const bVal = (b[indexedSortKey] ?? 0) as number;
      return indexedSortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [indexedPages, indexedSortKey, indexedSortDir]);

  const sortedNotIndexed = useMemo(() => {
    return [...notIndexedPages].sort((a, b) => {
      const aVal = (a[notIndexedSortKey] ?? 0) as number;
      const bVal = (b[notIndexedSortKey] ?? 0) as number;
      return notIndexedSortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [notIndexedPages, notIndexedSortKey, notIndexedSortDir]);

  if (loading) return <LoadingSpinner message="Fetching page data…" />;
  if (error) return <div className="error-banner"><strong>Error:</strong> {error}</div>;

  const rows = filter === 'indexed' ? sortedIndexed : sortedNotIndexed;
  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const start = page * PAGE_SIZE;
  const pageRows = rows.slice(start, start + PAGE_SIZE);

  return (
    <div>
      {/* Inspection progress banner */}
      {inspecting && (
        <div className="inspection-banner">
          <span className="inspection-spinner" aria-hidden="true" />
          Verifying index status via Google URL Inspection API…
        </div>
      )}

      {/* Summary cards */}
      <div className="metrics-grid">
        <div
          className={[
            'metric-card metric-card--green',
            filter === 'indexed' ? 'metric-card--active' : 'metric-card--clickable',
          ].join(' ')}
          onClick={() => handleFilter('indexed')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleFilter('indexed'); }
          }}
        >
          <div className="metric-card__icon">✅</div>
          <div className="metric-card__body">
            <div className="metric-card__value-row">
              <div className="metric-card__value">{indexedPages.length.toLocaleString()}</div>
            </div>
            <div className="metric-card__label-row">
              <span className="metric-card__label">Indexed Pages</span>
              <InfoTooltip text="Pages confirmed as indexed by Google's URL Inspection API or with Search Console impressions." />
            </div>
            <div className="metric-card__subtext">verified in Google Search</div>
          </div>
        </div>

        <div
          className={[
            'metric-card metric-card--orange',
            filter === 'not-indexed' ? 'metric-card--active' : 'metric-card--clickable',
          ].join(' ')}
          onClick={() => handleFilter('not-indexed')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleFilter('not-indexed'); }
          }}
        >
          <div className="metric-card__icon">⚠️</div>
          <div className="metric-card__body">
            <div className="metric-card__value-row">
              <div className="metric-card__value">{notIndexedPages.length.toLocaleString()}</div>
            </div>
            <div className="metric-card__label-row">
              <span className="metric-card__label">Not Indexed</span>
              <InfoTooltip text="Pages confirmed not indexed by Google's URL Inspection API. These pages will not appear in Google Search." />
            </div>
            <div className="metric-card__subtext">not found in Google Search</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-card">
        <div className="table-header-row">
          <h3 className="table-title" style={{ border: 'none', background: 'transparent', padding: 0 }}>
            {filter === 'indexed' ? 'Indexed Pages' : 'Not Indexed Pages'}
          </h3>
          {rows.length > 0 && (
            <span className="table-count">
              {start + 1}–{Math.min(start + PAGE_SIZE, rows.length)} of {rows.length.toLocaleString()}
            </span>
          )}
        </div>

        {rows.length === 0 ? (
          <div className="empty-state">
            {inspecting
              ? 'Verifying pages…'
              : filter === 'indexed'
              ? 'No indexed pages found.'
              : 'All checked pages appear to be indexed.'}
          </div>
        ) : (
          <>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 32 }}>#</th>
                    <th>
                      <span className="th-inner" style={{ justifyContent: 'flex-start' }}>
                        🔗 Page URL
                      </span>
                    </th>
                    {filter === 'indexed' ? (
                      <>
                        <SortTh
                          label="Clicks"
                          icon="👆"
                          sortKey="clicks"
                          activeSortKey={indexedSortKey}
                          sortDir={indexedSortDir}
                          onSort={handleIndexedSort}
                          tooltip="Clicks from Google Search results for this page."
                        />
                        <SortTh
                          label="Impressions"
                          icon="👁️"
                          sortKey="impressions"
                          activeSortKey={indexedSortKey}
                          sortDir={indexedSortDir}
                          onSort={handleIndexedSort}
                          tooltip="How many times this page appeared in Google Search results."
                        />
                        <th className="text-right">
                          <span className="th-inner">
                            <span className="th-icon">📍</span>
                            Avg. Position
                          </span>
                        </th>
                        <SortTh
                          label="Time on Page"
                          icon="⏱️"
                          sortKey="avgTimeOnPage"
                          activeSortKey={indexedSortKey}
                          sortDir={indexedSortDir}
                          onSort={handleIndexedSort}
                          tooltip="Average session duration for visitors who landed on this page (Google Analytics)."
                        />
                        <th className="text-right">
                          <span className="th-inner">
                            <span className="th-icon">🗑️</span>
                            Remove
                            <InfoTooltip text="Opens Google Search Console's Removals tool to temporarily remove this URL from Google Search." />
                          </span>
                        </th>
                      </>
                    ) : (
                      <>
                        <SortTh
                          label="Page Views"
                          icon="📄"
                          sortKey="pageViews"
                          activeSortKey={notIndexedSortKey}
                          sortDir={notIndexedSortDir}
                          onSort={handleNotIndexedSort}
                          tooltip="Total page views from Google Analytics."
                        />
                        <SortTh
                          label="Time on Page"
                          icon="⏱️"
                          sortKey="avgTimeOnPage"
                          activeSortKey={notIndexedSortKey}
                          sortDir={notIndexedSortDir}
                          onSort={handleNotIndexedSort}
                          tooltip="Average session duration for visitors who visited this page (Google Analytics)."
                        />
                        <th className="text-right">
                          <span className="th-inner">
                            <span className="th-icon">🔍</span>
                            Request Index
                            <InfoTooltip text="Opens Google Search Console's URL Inspection tool so you can request Google to index this page." />
                          </span>
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row, i) => (
                    <tr key={start + i}>
                      <td className="mono" style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
                        {start + i + 1}
                      </td>
                      <td className="query-cell">
                        <span className="query-text page-url" title={row.page}>
                          {row.page}
                        </span>
                      </td>
                      {filter === 'indexed' ? (
                        <>
                          <td className="text-right mono">{row.clicks.toLocaleString()}</td>
                          <td className="text-right mono">{row.impressions.toLocaleString()}</td>
                          <td className="text-right">
                            {row.position > 0 ? (
                              <span className={positionBadgeClass(row.position)}>
                                {row.position.toFixed(1)}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                            )}
                          </td>
                          <td className="text-right mono">{formatTime(row.avgTimeOnPage)}</td>
                          <td className="text-right">
                            <a
                              href={scRemovalsLink(siteUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-action btn-action--danger"
                              title={`Open SC Removals tool for ${row.page}`}
                            >
                              🗑️ Remove
                            </a>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="text-right mono">
                            {(row.pageViews ?? 0).toLocaleString()}
                          </td>
                          <td className="text-right mono">{formatTime(row.avgTimeOnPage)}</td>
                          <td className="text-right">
                            <a
                              href={scInspectLink(siteUrl, row.page)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-action btn-action--primary"
                              title={`Request indexing for ${row.page}`}
                            >
                              🔍 Request Index
                            </a>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  ← Prev
                </button>
                <span className="pagination-info">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  className="pagination-btn"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
