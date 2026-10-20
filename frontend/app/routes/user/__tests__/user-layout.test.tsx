import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import UserLayout from '../user-layout';

let authState = { isAuthenticated: false, isLoading: false };

vi.mock('@/provider/auth-context', () => ({
  useAuth: () => ({
    ...authState,
    user: null,
    logout: vi.fn(),
  }),
}));

const renderUserRoute = () =>
  render(
    <MemoryRouter initialEntries={['/user/profile']}>
      <Routes>
        <Route path="/user" element={<UserLayout />}>
          <Route path="profile" element={<div>PROFILE-CONTENT</div>} />
        </Route>
        <Route path="/sign-in" element={<div>SIGN-IN-PAGE</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('UserLayout auth guard (E6)', () => {
  test('unauthenticated → redirected to /sign-in, no profile content', () => {
    authState = { isAuthenticated: false, isLoading: false };
    renderUserRoute();

    expect(screen.getByText('SIGN-IN-PAGE')).toBeTruthy();
    expect(screen.queryByText('PROFILE-CONTENT')).toBeNull();
  });

  test('authenticated → nested route content renders', () => {
    authState = { isAuthenticated: true, isLoading: false };
    renderUserRoute();

    expect(screen.getByText('PROFILE-CONTENT')).toBeTruthy();
    expect(screen.queryByText('SIGN-IN-PAGE')).toBeNull();
  });

  test('still loading → no bounce to /sign-in yet, no flash of content', () => {
    authState = { isAuthenticated: false, isLoading: true };
    renderUserRoute();

    expect(screen.queryByText('SIGN-IN-PAGE')).toBeNull();
    expect(screen.queryByText('PROFILE-CONTENT')).toBeNull();
  });
});
