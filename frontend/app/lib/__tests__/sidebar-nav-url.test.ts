import { describe, expect, test } from 'vitest';
import { buildSidebarHref } from '@/components/layout/sidebar-nav';
import type { Workspace } from '@/types';

const ws = { _id: 'ws1' } as unknown as Workspace;

describe('buildSidebarHref (F4)', () => {
  test('appends the workspace query for regular nav items', () => {
    expect(buildSidebarHref('/dashboard', ws)).toBe('/dashboard?workspaceId=ws1');
    expect(buildSidebarHref('/my-tasks', ws)).toBe('/my-tasks?workspaceId=ws1');
  });

  test('passes plain hrefs through without a workspace', () => {
    expect(buildSidebarHref('/dashboard', null)).toBe('/dashboard');
    expect(buildSidebarHref('/dashboard', {} as Workspace)).toBe('/dashboard');
  });

  test('never adds the query to /workspaces (it carries its own id in the path)', () => {
    expect(buildSidebarHref('/workspaces', ws)).toBe('/workspaces');
    expect(buildSidebarHref('/workspaces', null)).toBe('/workspaces');
  });
});
