import type { AdsKeyword } from '../types';
import { formatPct } from '../utils/dates';

interface AdsKeywordsTableProps {
  keywords: AdsKeyword[];
  currencyCode: string;
}

function formatCost(micros: number, currencyCode: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(micros / 1_000_000);
}

export default function AdsKeywordsTable({ keywords, currencyCode }: AdsKeywordsTableProps) {
  if (keywords.length === 0) {
    return (
      <div className="empty-state">No keyword click data available for this period.</div>
    );
  }

  const maxClicks = keywords[0]?.clicks ?? 1;

  return (
    <div className="table-card">
      <h3 className="table-title">Top Keywords by Clicks</h3>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Keyword</th>
              <th className="text-right">Clicks</th>
              <th className="text-right">Impressions</th>
              <th className="text-right">CTR</th>
              <th className="text-right">Spend</th>
            </tr>
          </thead>
          <tbody>
            {keywords.map((kw, i) => (
              <tr key={i}>
                <td className="query-cell">
                  <span className="query-text">{kw.text}</span>
                  <div className="bar-track">
                    <div
                      className="bar-fill bar-orange"
                      style={{ width: `${(kw.clicks / maxClicks) * 100}%` }}
                    />
                  </div>
                </td>
                <td className="text-right mono">{kw.clicks.toLocaleString()}</td>
                <td className="text-right mono">{kw.impressions.toLocaleString()}</td>
                <td className="text-right mono">{formatPct(kw.ctr)}</td>
                <td className="text-right mono">{formatCost(kw.costMicros, currencyCode)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
