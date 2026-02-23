import { useState, useMemo, useEffect } from 'react';
import type { QueryData } from '../types';
import { formatPct } from '../utils/dates';

interface TopQueriesTableProps {
  queries: QueryData[];
  sortKey?: 'clicks' | 'position' | null;
  sortDir?: 'asc' | 'desc';
}

const PAGE_SIZE = 25;

function positionBadgeClass(pos: number): string {
  if (pos <= 3) return 'badge badge-green';
  if (pos <= 10) return 'badge badge-blue';
  return 'badge badge-gray';
}

function ClicksDelta({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined) {
    return <span className="delta-new">New</span>;
  }
  if (value === 0) return <span className="delta-neutral">—</span>;
  const up = value > 0;
  return (
    <span className={up ? 'delta-positive' : 'delta-negative'}>
      {up ? '▲' : '▼'} {Math.abs(value).toLocaleString()}
    </span>
  );
}

function PositionDelta({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined) return null;
  if (Math.abs(value) < 0.05) return null;
  // Negative delta = position number went down = ranking improved = good
  const improved = value < 0;
  return (
    <div className={`delta-position ${improved ? 'delta-positive' : 'delta-negative'}`}>
      {improved ? '▲' : '▼'} {Math.abs(value).toFixed(1)} pos
    </div>
  );
}

export default function TopQueriesTable({ queries, sortKey, sortDir = 'asc' }: TopQueriesTableProps) {
  const [page, setPage] = useState(0);

  // Reset to first page whenever sort changes
  useEffect(() => {
    setPage(0);
  }, [sortKey, sortDir]);

  const sortedQueries = useMemo(() => {
    if (!sortKey) return queries;
    return [...queries].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [queries, sortKey, sortDir]);

  if (sortedQueries.length === 0) {
    return <div className="empty-state">No query data available for this period.</div>;
  }

  const totalPages = Math.ceil(sortedQueries.length / PAGE_SIZE);
  const start = page * PAGE_SIZE;
  const pageRows = sortedQueries.slice(start, start + PAGE_SIZE);
  const maxClicks = queries.reduce((max, q) => Math.max(max, q.clicks), 1);

  const hasPrev = queries.some((q) => q.clicksDelta !== undefined);

  function SortIndicator({ col }: { col: 'clicks' | 'position' }) {
    if (sortKey !== col) return null;
    return (
      <span className="th-sort-arrow" aria-hidden="true">
        {sortDir === 'asc' ? ' ↑' : ' ↓'}
      </span>
    );
  }

  return (
    <div className="table-card">
      <div className="table-header-row">
        <h3 className="table-title" style={{ border: 'none', background: 'transparent', padding: 0 }}>
          Search Queries
        </h3>
        <span className="table-count">
          {start + 1}–{Math.min(start + PAGE_SIZE, sortedQueries.length)} of{' '}
          {sortedQueries.length.toLocaleString()}
        </span>
      </div>

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 32 }}>#</th>
              <th>Query</th>
              <th className="text-right">
                Clicks <SortIndicator col="clicks" />
              </th>
              <th className="text-right">Impressions</th>
              <th className="text-right">CTR</th>
              <th className="text-right">
                Avg. Position <SortIndicator col="position" />
              </th>
              {hasPrev && <th className="text-right">vs. Prev. Period</th>}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((q, i) => (
              <tr key={start + i}>
                <td className="mono" style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
                  {start + i + 1}
                </td>
                <td className="query-cell">
                  <span className="query-text">{q.query}</span>
                  <div className="bar-track">
                    <div
                      className="bar-fill bar-green"
                      style={{ width: `${(q.clicks / maxClicks) * 100}%` }}
                    />
                  </div>
                </td>
                <td className="text-right mono">{q.clicks.toLocaleString()}</td>
                <td className="text-right mono">{q.impressions.toLocaleString()}</td>
                <td className="text-right mono">{formatPct(q.ctr)}</td>
                <td className="text-right">
                  <span className={positionBadgeClass(q.position)}>
                    {q.position.toFixed(1)}
                  </span>
                </td>
                {hasPrev && (
                  <td className="text-right">
                    <ClicksDelta value={q.clicksDelta} />
                    <PositionDelta value={q.positionDelta} />
                  </td>
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
    </div>
  );
}
