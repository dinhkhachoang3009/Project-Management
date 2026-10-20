import { describe, expect, test } from 'vitest';
import { canManageProject, getManageableProjects } from '../permissions';

describe('canManageProject (D2: project manager OR workspace owner/admin)', () => {
  test('project manager can manage', () => {
    expect(canManageProject('manager', 'member')).toBe(true);
  });

  test('project manager with no workspace role can manage', () => {
    expect(canManageProject('manager', null)).toBe(true);
    expect(canManageProject('manager', undefined)).toBe(true);
  });

  test('workspace owner can manage even without a project role', () => {
    expect(canManageProject(null, 'owner')).toBe(true);
    expect(canManageProject(undefined, 'owner')).toBe(true);
    expect(canManageProject('contributor', 'owner')).toBe(true);
  });

  test('workspace admin can manage even without a project role', () => {
    expect(canManageProject(null, 'admin')).toBe(true);
    expect(canManageProject(undefined, 'admin')).toBe(true);
    expect(canManageProject('viewer', 'admin')).toBe(true);
  });

  test('project contributor alone cannot manage', () => {
    expect(canManageProject('contributor', 'member')).toBe(false);
  });

  test('project viewer alone cannot manage', () => {
    expect(canManageProject('viewer', 'member')).toBe(false);
  });

  test('plain workspace member cannot manage', () => {
    expect(canManageProject(null, 'member')).toBe(false);
    expect(canManageProject(undefined, 'member')).toBe(false);
  });

  test('no roles at all cannot manage', () => {
    expect(canManageProject(null, null)).toBe(false);
    expect(canManageProject(undefined, undefined)).toBe(false);
  });

  test('workspace viewer cannot manage', () => {
    expect(canManageProject('manager', 'viewer')).toBe(true); // manager wins regardless
    expect(canManageProject(null, 'viewer')).toBe(false);
  });
});

describe('getManageableProjects (D2 delete listing — review fix #1)', () => {
  const me = 'me-1';

  const mkProject = (members: { user: string; role: string }[], id: string) =>
    ({
      _id: id,
      title: id,
      members,
    }) as never;

  test('workspace owner sees every project, even ones they are not a member of', () => {
    const projects = [
      mkProject([{ user: me, role: 'manager' }], 'p-managed'),
      mkProject([{ user: 'someone-else', role: 'manager' }], 'p-not-member'),
    ];

    const listed = getManageableProjects(projects, me, 'owner');
    expect(listed.map((p: { _id: string }) => p._id)).toEqual([
      'p-managed',
      'p-not-member',
    ]);
  });

  test('plain workspace member sees only the projects they manage', () => {
    const projects = [
      mkProject([{ user: me, role: 'manager' }], 'p-managed'),
      mkProject([{ user: me, role: 'contributor' }], 'p-contrib'),
      mkProject([{ user: 'someone-else', role: 'manager' }], 'p-others'),
    ];

    const listed = getManageableProjects(projects, me, 'member');
    expect(listed.map((p: { _id: string }) => p._id)).toEqual(['p-managed']);
  });

  test('workspace viewer with no project role sees nothing', () => {
    const projects = [mkProject([{ user: 'someone-else', role: 'manager' }], 'p-others')];

    expect(getManageableProjects(projects, me, 'viewer')).toEqual([]);
  });
});
