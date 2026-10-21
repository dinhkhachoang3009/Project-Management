import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NoDataFound } from '../no-data-found';

describe('NoDataFound Component', () => {
  test('render đúng title, description và button text', () => {
    const mockAction = vi.fn();
    render(
      <NoDataFound
        title="Không có dữ liệu"
        description="Hãy tạo mục đầu tiên"
        buttonText="Tạo mới"
        buttonAction={mockAction}
      />
    );

    expect(screen.getByText('Không có dữ liệu')).toBeInTheDocument();
    expect(screen.getByText('Hãy tạo mục đầu tiên')).toBeInTheDocument();
    expect(screen.getByText('Tạo mới')).toBeInTheDocument();
  });

  test('click button gọi action', () => {
    const mockAction = vi.fn();
    render(
      <NoDataFound
        title="Test"
        description="Test desc"
        buttonText="Click me"
        buttonAction={mockAction}
      />
    );

    const button = screen.getByText('Click me');
    fireEvent.click(button);
    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  test('omits the button entirely when no CTA is given (F8)', () => {
    render(<NoDataFound title="Empty" description="Nothing here yet" />);

    expect(screen.getByText('Empty')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
