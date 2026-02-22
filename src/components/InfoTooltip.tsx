import { useState } from 'react';

interface InfoTooltipProps {
  text: string;
}

export default function InfoTooltip({ text }: InfoTooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className="info-tooltip-trigger"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onClick={(e) => e.stopPropagation()}
      aria-label="More information"
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
      </svg>
      {visible && (
        <span className="info-tooltip-popup" role="tooltip">
          {text}
        </span>
      )}
    </span>
  );
}
