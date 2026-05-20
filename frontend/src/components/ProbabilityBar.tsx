export function ProbabilityBar(props: { label: string; percent: number; active: boolean }) {
  const { label, percent, active } = props;
  return (
    <div className="prob-row">
      <div className="prob-label">
        <span>{label}</span>
        <span>{percent.toFixed(1)}%</span>
      </div>
      <div className="prob-bar-bg">
        <div
          className={`prob-bar-fill ${active ? "active" : ""}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
