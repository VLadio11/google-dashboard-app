interface MetricCardProps {
  label: string;
  value: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  icon: string;
  subtext?: string;
}

export default function MetricCard({ label, value, color, icon, subtext }: MetricCardProps) {
  return (
    <div className={`metric-card metric-card--${color}`}>
      <div className="metric-card__icon">{icon}</div>
      <div className="metric-card__body">
        <div className="metric-card__value">{value}</div>
        <div className="metric-card__label">{label}</div>
        {subtext && <div className="metric-card__subtext">{subtext}</div>}
      </div>
    </div>
  );
}
