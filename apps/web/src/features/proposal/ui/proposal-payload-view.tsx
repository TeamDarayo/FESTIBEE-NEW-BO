"use client";

interface ProposalPayloadViewProps {
  payload: Record<string, unknown> | null | undefined;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return JSON.stringify(value);
}

const HIDE_KEYS = new Set(["candidates", "matchingCandidates"]);

export function ProposalPayloadView({ payload }: ProposalPayloadViewProps) {
  if (!payload || Object.keys(payload).length === 0) {
    return (
      <p className="text-xs text-muted-foreground">payload 없음</p>
    );
  }
  const entries = Object.entries(payload).filter(
    ([k]) => !HIDE_KEYS.has(k)
  );
  if (entries.length === 0) {
    return null;
  }
  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-xs">
      {entries.map(([key, value]) => (
        <div key={key} className="contents">
          <dt className="font-mono text-muted-foreground">{key}</dt>
          <dd className="break-all text-foreground">{formatValue(value)}</dd>
        </div>
      ))}
    </dl>
  );
}
