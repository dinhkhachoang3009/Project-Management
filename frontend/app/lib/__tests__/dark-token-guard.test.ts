import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Dark-mode token guard (final review fixes): these files must rely on
// theme tokens, not literal surfaces. DOM-level color tests are not
// practical for Tailwind class strings, so this pins the source rules
// that keep / readable under .dark.
const read = (rel: string) =>
  readFileSync(join(process.cwd(), 'app', rel), 'utf8');

describe('dark-mode token guard', () => {
  test('home page has no hardcoded white/gray surfaces except the CTA band', () => {
    const src = read('routes/root/home.tsx');

    expect(src).not.toMatch(/text-gray-\d|bg-gray-\d|border-gray-\d/);

    // bg-white is allowed ONLY on the blue CTA band (white chip + white
    // outline button inside a constant-color section)
    const offenders = src.split('\n').filter(
      (line) => /bg-white(?![\w-])|bg-white\//.test(line) &&
        !line.includes('text-blue-600') &&
        !line.includes('border-white')
    );
    expect(offenders).toEqual([]);
  });

  test('verify-email page has no hardcoded grays', () => {
    expect(read('routes/auth/verify-email.tsx')).not.toMatch(
      /text-gray-\d|bg-gray-\d|border-gray-\d/
    );
  });

  test('charts reference var(--color-*) only — no hex fills, no bare chart vars', () => {
    const src = read('components/dashboard/statistics-charts.tsx');

    expect(src).not.toMatch(/stroke="#|fill="#|"red"/);
    // cells must rely on the generic name-keyed var, no backend-color fallback
    expect(src).not.toContain('?? entry.color');
    expect(src).toContain('fill={`var(--color-${entry.name})`}');
    // lines/bars use the config-emitted per-key vars
    expect(src).toContain('stroke="var(--color-completed)"');
    expect(src).toContain('stroke="var(--color-inProgress)"');
    expect(src).toContain('stroke="var(--color-todo)"');
    expect(src).toContain('fill="var(--color-total)"');
    expect(src).toContain('fill="var(--color-completed)"');
  });
});
