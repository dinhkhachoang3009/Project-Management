import { describe, expect, test } from 'vitest';
import { CHART_COLOR } from '@/lib/chart-tokens';

describe('CHART_COLOR mapping (F7)', () => {
  // Every key here MUST resolve to a --chart token — Review Focus 3: after
  // Part D2 the status pie includes "On Hold" and "Cancelled"; any charted
  // name without a mapping renders unstyled/greyscale in dark mode.
  test('pins the exact mapping for every charted name', () => {
    expect(CHART_COLOR).toEqual({
      // task trends (dataKeys)
      completed: 'var(--chart-1)',
      inProgress: 'var(--chart-2)',
      todo: 'var(--chart-3)',
      // project statuses (after D2: five statuses)
      Completed: 'var(--chart-1)',
      'In Progress': 'var(--chart-2)',
      Planning: 'var(--chart-3)',
      'On Hold': 'var(--chart-5)',
      Cancelled: 'var(--chart-4)',
      // priorities
      High: 'var(--chart-4)',
      Medium: 'var(--chart-2)',
      Low: 'var(--chart-3)',
      // productivity bars
      total: 'var(--chart-5)',
    });
  });
});
