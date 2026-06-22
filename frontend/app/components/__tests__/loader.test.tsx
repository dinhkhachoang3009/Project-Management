import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Loader } from '../loader';

describe('Loader Component', () => {
  test('render loader với icon spin', () => {
    const { container } = render(<Loader />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  test('có class flex và justify-center', () => {
    const { container } = render(<Loader />);
    const wrapper = container.querySelector('.flex');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveClass('justify-center');
  });
});
