import InfoTooltip from './InfoTooltip';

interface MetricCardProps {
  label: string;
  value: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  icon: string;
  subtext?: string;
  tooltip?: string;
  onClick?: () => void;
  active?: boolean;
  sortDir?: 'asc' | 'desc';
}

export default function MetricCard({
  label,
  value,
  color,
  icon,
  subtext,
  tooltip,
  onClick,
  active,
  sortDir,
}: MetricCardProps) {
  return (
    <div
      className={[
        `metric-card metric-card--${color}`,
        onClick ? 'metric-card--clickable' : '',
        active ? 'metric-card--active' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div className="metric-card__icon">{icon}</div>
      <div className="metric-card__body">
        <div className="metric-card__value-row">
          <div className="metric-card__value">{value}</div>
          {active && sortDir && (
            <span className="metric-card__sort-arrow" aria-hidden="true">
              {sortDir === 'asc' ? '↑' : '↓'}
            </span>
          )}
        </div>
        <div className="metric-card__label-row">
          <span className="metric-card__label">{label}</span>
          {tooltip && <InfoTooltip text={tooltip} />}
        </div>
        {subtext && <div className="metric-card__subtext">{subtext}</div>}
      </div>
    </div>
  );
}
