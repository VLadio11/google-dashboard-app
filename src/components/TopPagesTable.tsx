import type { PageData } from '../types';
import { formatDuration } from '../utils/dates';

interface TopPagesTableProps {
  pages: PageData[];
}

export default function TopPagesTable({ pages }: TopPagesTableProps) {
  if (pages.length === 0) {
    return <div className="empty-state">No page data available for this period.</div>;
  }

  const maxViews = pages[0]?.pageViews ?? 1;

  return (
    <div className="table-card">
      <h3 className="table-title">Top Pages</h3>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Page</th>
              <th className="text-right">Views</th>
              <th className="text-right">Users</th>
              <th className="text-right">Avg. Duration</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page, i) => (
              <tr key={i}>
                <td className="page-cell">
                  <div className="page-title">{page.pageTitle || '(no title)'}</div>
                  <div className="page-path">{page.pagePath}</div>
                  <div className="bar-track">
                    <div
                      className="bar-fill bar-blue"
                      style={{ width: `${(page.pageViews / maxViews) * 100}%` }}
                    />
                  </div>
                </td>
                <td className="text-right mono">{page.pageViews.toLocaleString()}</td>
                <td className="text-right mono">{page.activeUsers.toLocaleString()}</td>
                <td className="text-right mono">{formatDuration(page.avgSessionDuration)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
