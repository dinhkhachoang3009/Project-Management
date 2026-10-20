import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Header } from '../header';
import type { Workspace } from '@/types';

const logout = vi.fn();

vi.mock('@/provider/auth-context', () => ({
  useAuth: () => ({
    user: {
      _id: 'u-1',
      name: 'John Doe',
      email: 'john.doe@test.local',
    },
    logout,
  }),
}));

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return {
    ...actual,
    // Header reads workspaces via useLoaderData; no data router in tests
    useLoaderData: () => ({ workspaces: [] as Workspace[] }),
  };
});

const renderHeader = () =>
  render(
    <MemoryRouter>
      <Header
        onWorkspaceSelected={vi.fn()}
        selectedWorkspace={null}
        onCreateWorkspace={vi.fn()}
      />
    </MemoryRouter>
  );

const openAccountMenu = () => {
  const trigger = screen.getByRole('button', { name: /account menu/i });
  // radix DropdownMenuTrigger opens on pointerdown, not click
  fireEvent.pointerDown(trigger);
  fireEvent.click(trigger);
  return trigger;
};

describe('Header identity block (E2)', () => {
  test('avatar trigger has an accessible name', () => {
    renderHeader();
    expect(
      screen.getByRole('button', { name: /account menu/i })
    ).toBeTruthy();
  });

  test('user name is visible next to the avatar', () => {
    renderHeader();
    expect(screen.getByText('John Doe')).toBeTruthy();
  });

  test('opened menu labels with name and email', () => {
    renderHeader();
    openAccountMenu();

    expect(screen.getByText('john.doe@test.local')).toBeTruthy();
  });

  test('Profile menu item links to /user/profile', () => {
    renderHeader();
    openAccountMenu();

    // DropdownMenuItem asChild merges role="menuitem" onto the Link
    const profileItem = screen.getByRole('menuitem', { name: /profile/i });
    expect(profileItem.getAttribute('href')).toBe('/user/profile');
  });

  test('bell has an accessible name and opens the under-development popover (E4)', () => {
    renderHeader();

    const bell = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(bell);

    expect(screen.getByText(/under development/i)).toBeTruthy();
  });
});
