interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  tone?: 'purple' | 'mint' | 'yellow';
}

export function ProgressBar({ value, max, label, tone = 'purple' }: ProgressBarProps) {
  const safeMax = max > 0 ? max : 1;
  const percentage = Math.min(100, Math.max(0, Math.round((value / safeMax) * 100)));

  return (
    <div className="progress">
      {label ? (
        <div className="progress__label">
          <span>{label}</span>
          <strong>
            {value}/{max}
          </strong>
        </div>
      ) : null}
      <div
        className={`progress__track progress__track--${tone}`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label ?? 'Progresso'}
      >
        <span className="progress__fill" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
