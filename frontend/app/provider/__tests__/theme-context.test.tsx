import { describe, expect, test } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../theme-context';

const Probe = () => {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button aria-label="set-dark" onClick={() => setTheme('dark')}>
        dark
      </button>
      <button aria-label="set-light" onClick={() => setTheme('light')}>
        light
      </button>
    </div>
  );
};

describe('ThemeProvider (F11)', () => {
  test('defaults to light and toggles the html class + persists on choice', () => {
    localStorage.removeItem('theme');

    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme').textContent).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    act(() => {
      screen.getByLabelText('set-dark').click();
    });

    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');

    act(() => {
      screen.getByLabelText('set-light').click();
    });

    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
  });

  test('hydrates the stored theme', () => {
    localStorage.setItem('theme', 'dark');
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    localStorage.removeItem('theme');
  });
});
