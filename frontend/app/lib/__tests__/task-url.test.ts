import { describe, expect, test } from 'vitest';
import { buildTaskDetailUrl } from '../task-url';
import type { Task } from '@/types';

const makeTask = (over: Record<string, unknown>): Task =>
  ({
    _id: 't1',
    title: 'Task',
    status: 'To Do',
    priority: 'Medium',
    isArchived: true,
    ...over,
  }) as Task;

describe('buildTaskDetailUrl (E1b: /achieved broken link)', () => {
  test('populated project with string workspace id', () => {
    const task = makeTask({
      project: { _id: 'p1', title: 'Project One', workspace: 'w1' },
    });
    expect(buildTaskDetailUrl(task)).toBe('/workspaces/w1/projects/p1/tasks/t1');
  });

  test('populated project with object workspace', () => {
    const task = makeTask({
      project: { _id: 'p2', title: 'Project Two', workspace: { _id: 'w2' } },
    });
    expect(buildTaskDetailUrl(task)).toBe('/workspaces/w2/projects/p2/tasks/t1');
  });

  test('unpopulated string project → null (workspace unknown)', () => {
    const task = makeTask({ project: 'p9' });
    expect(buildTaskDetailUrl(task)).toBeNull();
  });

  test('missing project → null', () => {
    const task = makeTask({ project: undefined });
    expect(buildTaskDetailUrl(task)).toBeNull();
  });

  test('missing task id → null', () => {
    const task = makeTask({
      _id: undefined,
      project: { _id: 'p1', workspace: 'w1' },
    });
    expect(buildTaskDetailUrl(task)).toBeNull();
  });
});
