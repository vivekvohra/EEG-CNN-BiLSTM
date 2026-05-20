import type { StatusState } from "../hooks/useEngineWarmup";

function toneColor(tone: StatusState["tone"]) {
  switch (tone) {
    case "success": return "var(--success)";
    case "error": return "var(--error)";
    case "accent": return "var(--accent)";
    default: return "var(--muted)";
  }
}

export function StatusLine({ status }: { status: StatusState }) {
  return (
    <div
      style={{
        marginTop: "1.5rem",
        textAlign: "center",
        color: toneColor(status.tone),
        fontSize: "0.85rem",
      }}
    >
      {status.iconClass ? <i className={status.iconClass} style={{ marginRight: 8 }} /> : null}
      <span>{status.text}</span>
    </div>
  );
}
