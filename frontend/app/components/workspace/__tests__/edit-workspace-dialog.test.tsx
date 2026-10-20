import { describe, expect, test, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { EditWorkspaceDialog } from '../edit-workspace-dialog';
import type { Workspace } from '@/types';

const updateWorkspace = vi.fn();

vi.mock('@/hooks/use-workspace', () => ({
  useUpdateWorkspaceMutation: () => ({
    mutate: updateWorkspace,
    isPending: false,
  }),
}));

const workspace = {
  _id: 'ws-1',
  name: 'Acme Product Team',
  description: 'Original description',
  color: '#FF5733',
  owner: 'u-1',
  members: [],
  createdAt: new Date(),
  updatedAt: new Date(),
} as unknown as Workspace;

beforeEach(() => {
  updateWorkspace.mockClear();
});

describe('EditWorkspaceDialog (C1)', () => {
  test('prefills name, description and color from the workspace', () => {
    render(
      <EditWorkspaceDialog workspace={workspace} isOpen={true} onOpenChange={vi.fn()} />
    );

    expect(screen.getByDisplayValue('Acme Product Team')).toBeTruthy();
    expect(screen.getByDisplayValue('Original description')).toBeTruthy();
    expect(screen.getByLabelText('Name')).toBeTruthy();
  });

  test('submitting sends the edited values to PUT /workspaces/:id', async () => {
    render(
      <EditWorkspaceDialog workspace={workspace} isOpen={true} onOpenChange={vi.fn()} />
    );

    const nameInput = screen.getByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: 'Renamed Team' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(updateWorkspace).toHaveBeenCalledTimes(1);
    });
    expect(updateWorkspace.mock.calls[0][0]).toEqual({
      workspaceId: 'ws-1',
      name: 'Renamed Team',
      description: 'Original description',
      color: '#FF5733',
    });
  });
});
