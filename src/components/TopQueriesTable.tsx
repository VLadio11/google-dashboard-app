import type { QueryData } from '../types';
import { formatPct } from '../utils/dates';

interface TopQueriesTableProps {
  queries: QueryData[];
}

function positionBadgeClass(pos: number): string {
  if (pos <= 3) return 'badge badge-green';
  if (pos <= 10) return 'badge badge-blue';
  return 'badge badge-gray';
}

export default function TopQueriesTable({ queries }: TopQueriesTableProps) {
  if (queries.length === 0) {
    return <div className="empty-state">No query data available for this period.</div>;
  }

  const maxClicks = queries[0]?.clicks ?? 1;

  return (
    <div className="table-card">
      <h3 className="table-title">Top Search Queries</h3>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Query</th>
              <th className="text-right">Clicks</th>
              <th className="text-right">Impressions</th>
              <th className="text-right">CTR</th>
              <th className="text-right">Avg. Position</th>
            </tr>
          </thead>
          <tbody>
            {queries.map((q, i) => (
              <tr key={i}>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
