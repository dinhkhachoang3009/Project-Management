import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ColorPicker } from '../color-picker';

describe('ColorPicker (F3)', () => {
  const options = ['#FF5733', '#33C1FF', '#28A745'];

  test('renders one focusable (not display:none) radio per color', () => {
    render(<ColorPicker options={options} value="#FF5733" onChange={vi.fn()} />);

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(options.length);
    radios.forEach((radio) => {
      expect(radio.className).toContain('sr-only');
      expect(radio.className).not.toContain('hidden');
    });
  });

  test('clicking a swatch reports the picked color', () => {
    const onChange = vi.fn();
    render(<ColorPicker options={options} value="#FF5733" onChange={onChange} />);

    fireEvent.click(screen.getByLabelText('#28A745'));
    expect(onChange).toHaveBeenCalledWith('#28A745');
  });

  test('the current value is checked', () => {
    render(<ColorPicker options={options} value="#33C1FF" onChange={vi.fn()} />);

    expect(
      (screen.getByLabelText('#33C1FF') as HTMLInputElement).checked
    ).toBe(true);
    expect(
      (screen.getByLabelText('#FF5733') as HTMLInputElement).checked
    ).toBe(false);
  });
});
