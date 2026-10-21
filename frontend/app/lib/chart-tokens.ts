// F7: the single map from every charted name to a --chart token. Charts
// must never hardcode a hex: ChartContainer's ChartStyle emits
// --color-<key> from this map and SVG fills/strokes reference
// `var(--color-<name>)`, so light/dark palettes come from app.css.
export const CHART_COLOR: Record<string, string> = {
  // task trends (dataKeys)
  completed: "var(--chart-1)",
  inProgress: "var(--chart-2)",
  todo: "var(--chart-3)",
  // project statuses (post-D2 the pie carries all five)
  Completed: "var(--chart-1)",
  "In Progress": "var(--chart-2)",
  Planning: "var(--chart-3)",
  "On Hold": "var(--chart-5)",
  Cancelled: "var(--chart-4)",
  // priorities
  High: "var(--chart-4)",
  Medium: "var(--chart-2)",
  Low: "var(--chart-3)",
  // workspace productivity bars
  total: "var(--chart-5)",
};
