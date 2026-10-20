import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AvatarPicker } from '../avatar-picker';

describe('AvatarPicker (E3)', () => {
  test('renders 32 avatar options', () => {
    render(<AvatarPicker value="/avatars/av-01.svg" onChange={vi.fn()} />);

    const group = screen.getByRole('radiogroup', { name: /choose an avatar/i });
    expect(group.querySelectorAll('button')).toHaveLength(32);
  });

  test('clicking an option calls onChange with its src', () => {
    const onChange = vi.fn();
    render(<AvatarPicker value={undefined} onChange={onChange} />);

    const buttons = screen
      .getByRole('radiogroup', { name: /choose an avatar/i })
      .querySelectorAll('button');
    fireEvent.click(buttons[7]);

    expect(onChange).toHaveBeenCalledWith('/avatars/av-08.svg');
  });

  test('marks exactly the selected option', () => {
    render(<AvatarPicker value="/avatars/av-02.svg" onChange={vi.fn()} />);

    const radios = screen.getAllByRole('radio');
    expect(radios[1].getAttribute('aria-checked')).toBe('true');
    expect(radios.filter((r) => r.getAttribute('aria-checked') === 'true')).toHaveLength(1);
  });
});
