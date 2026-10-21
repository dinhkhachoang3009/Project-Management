import { describe, expect, test } from 'vitest';
import { getTaskPriorityColor } from '@/lib';

describe('getTaskPriorityColor (F6)', () => {
  test('High priority chip classes are pinned', () => {
    expect(getTaskPriorityColor('High')).toBe(
      'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
    );
  });

  test('Medium priority chip classes are pinned', () => {
    expect(getTaskPriorityColor('Medium')).toBe(
      'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
    );
  });

  test('Low and unknown/missing priorities fall back to the muted chip', () => {
    expect(getTaskPriorityColor('Low')).toBe('bg-muted text-muted-foreground');
    expect(getTaskPriorityColor(undefined)).toBe(
      'bg-muted text-muted-foreground'
    );
  });
});
