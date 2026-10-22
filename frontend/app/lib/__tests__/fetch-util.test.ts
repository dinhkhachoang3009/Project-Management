import { describe, expect, test, vi, beforeEach } from 'vitest';

const create = vi.fn(() => ({
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
}));

vi.mock('axios', () => ({ default: { create } }));

await import('../fetch-util');

let errorHandler: (error: unknown) => Promise<unknown>;

const noopListener = () => {};
let events: Event[] = [];
const recorder = (e: Event) => events.push(e);

beforeEach(() => {
  // (responseHandler, errorHandler) — grab the rejection handler
  errorHandler = create.mock.results[0]!.value.interceptors.response.use.mock
    .calls[0]![1] as typeof errorHandler;
  window.removeEventListener('force-logout', noopListener);
  window.removeEventListener('force-logout', recorder);
  events = [];
  window.addEventListener('force-logout', recorder);
});

const err401 = (url: string) => ({
  response: { status: 401 },
  config: { url },
});

describe('401 interceptor vs part-G login status change', () => {
  test('auth-endpoint 401s do NOT force-logout (login failures live there)', async () => {
    await expect(errorHandler(err401('/auth/login'))).rejects.toBeTruthy();
    expect(events).toHaveLength(0);
    await expect(
      errorHandler(err401('/auth/reset-password-request'))
    ).rejects.toBeTruthy();
    expect(events).toHaveLength(0);
  });

  test('other 401s still force-logout (stale session tokens)', async () => {
    await expect(errorHandler(err401('/workspaces'))).rejects.toBeTruthy();
    expect(events).toHaveLength(1);

    await expect(errorHandler(err401('/user/profile'))).rejects.toBeTruthy();
    expect(events).toHaveLength(2);
  });
});
