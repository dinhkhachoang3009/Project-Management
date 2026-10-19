import { describe, expect, test } from 'vitest';
import { filterMyTasks } from '../my-tasks';
import type { Task } from '@/types';

const makeTask = (over: Partial<Task>): Task =>
  ({
    _id: Math.random().toString(36).slice(2),
    title: 'Task',
    description: '',
    status: 'To Do',
    priority: 'Medium',
    isArchived: false,
    ...over,
  } as Task);

const tasks: Task[] = [
  makeTask({ _id: 'a', title: 'Active Todo' }),
  makeTask({ _id: 'b', title: 'Archived Todo', isArchived: true }),
  makeTask({ _id: 'c', title: 'Active Done', status: 'Done' }),
  makeTask({ _id: 'd', title: 'Archived Done', status: 'Done', isArchived: true }),
  makeTask({ _id: 'e', title: 'Active High Priority', priority: 'High', description: 'needle hay' }),
];

describe('filterMyTasks (archived-aware semantics)', () => {
  test("default 'all' excludes archived", () => {
    const ids = filterMyTasks(tasks, 'all', '').map((t) => t._id);
    expect(ids).toEqual(['a', 'c', 'e']);
  });

  test("'achieved' returns only archived", () => {
    const ids = filterMyTasks(tasks, 'achieved', '').map((t) => t._id);
    expect(ids).toEqual(['b', 'd']);
  });

  test("'todo' excludes archived To Do", () => {
    const ids = filterMyTasks(tasks, 'todo', '').map((t) => t._id);
    expect(ids).toEqual(['a', 'e']); // e is an active To Do (priority High)
  });

  test("'done' excludes archived Done", () => {
    const ids = filterMyTasks(tasks, 'done', '').map((t) => t._id);
    expect(ids).toEqual(['c']);
  });

  test("'high' excludes archived High", () => {
    const ids = filterMyTasks(tasks, 'high', '').map((t) => t._id);
    expect(ids).toEqual(['e']);
  });

  test('search still filters within non-achieved views', () => {
    const ids = filterMyTasks(tasks, 'all', 'high priority').map((t) => t._id);
    expect(ids).toEqual(['e']);
    // and inside achieved view
    expect(filterMyTasks([...tasks, makeTask({ _id: 'f', title: 'done needle', isArchived: true })], 'achieved', 'needle').map((t) => t._id)).toEqual(['f']);
  });
});
