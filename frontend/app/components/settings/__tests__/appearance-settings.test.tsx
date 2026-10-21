import { describe, expect, test, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AppearanceSettings } from '../appearance-settings';

const setTheme = vi.fn();
const useThemeMock = vi.fn();

vi.mock('@/provider/theme-context', () => ({
  useTheme: (...args: unknown[]) => useThemeMock(...args),
}));

beforeEach(() => {
  setTheme.mockClear();
  useThemeMock.mockReset();
});

describe('AppearanceSettings (F11)', () => {
  test('light mode: switch unchecked; toggling asks for dark', () => {
    useThemeMock.mockReturnValue({ theme: 'light', setTheme });
    render(<AppearanceSettings />);

    const sw = screen.getByRole('switch', { name: /dark mode/i });
    expect(sw.getAttribute('data-state')).toBe('unchecked');

    fireEvent.click(sw);
    expect(setTheme).toHaveBeenCalledWith('dark');
  });

  test('dark mode: switch checked; toggling asks for light', () => {
    useThemeMock.mockReturnValue({ theme: 'dark', setTheme });
    render(<AppearanceSettings />);

    const sw = screen.getByRole('switch', { name: /dark mode/i });
    expect(sw.getAttribute('data-state')).toBe('checked');

    fireEvent.click(sw);
    expect(setTheme).toHaveBeenCalledWith('light');
  });
});
