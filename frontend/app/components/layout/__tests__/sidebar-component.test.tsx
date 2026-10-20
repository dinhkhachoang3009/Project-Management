import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { SidebarComponent } from '../sidebar-component';

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

const renderSidebar = () =>
  render(
    <MemoryRouter>
      <SidebarComponent currentWorkspace={null} />
    </MemoryRouter>
  );

describe('Sidebar controls a11y (F1)', () => {
  test('collapse button has an accessible name that flips on click', () => {
    renderSidebar();

    const toggle = screen.getByRole('button', { name: /collapse sidebar/i });
    fireEvent.click(toggle);

    expect(
      screen.getByRole('button', { name: /expand sidebar/i })
    ).toBeTruthy();
  });

  test('logout button is accessible while its visible text hides on mobile', () => {
    renderSidebar();

    const logoutBtn = screen.getByRole('button', { name: 'Logout' });
    expect(logoutBtn).toBeTruthy();

    const visibleLabel = logoutBtn.querySelector('.hidden');
    expect(visibleLabel?.className).toContain('md:block');
  });
});
