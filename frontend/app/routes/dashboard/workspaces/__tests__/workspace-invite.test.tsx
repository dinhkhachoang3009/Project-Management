import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import WorkspaceInvite from '../workspace-invite';

const acceptInviteByToken = vi.fn();

// details 403/undefined -> the join flow must NOT depend on member-only data
vi.mock('@/hooks/use-workspace', () => ({
  useGetWorkspaceDetailsQuery: () => ({ data: undefined, isLoading: false }),
  useAcceptInviteByTokenMutation: () => ({
    mutate: acceptInviteByToken,
    isPending: false,
  }),
  useAcceptGenerateInviteMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));

const renderInvitePage = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route
          path="/workspace-invite/:workspaceId"
          element={<WorkspaceInvite />}
        />
      </Routes>
    </MemoryRouter>
  );

describe('WorkspaceInvite page (non-member join flow)', () => {
  test('shows the Accept CTA and uses it when tk present, even without workspace details', () => {
    renderInvitePage('/workspace-invite/ws123?tk=tok123');
    const button = screen.getByRole('button', { name: 'Accept Invitation' });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(acceptInviteByToken).toHaveBeenCalledWith(
      'tok123',
      expect.anything()
    );
  });
});
