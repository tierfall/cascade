import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import { Button } from '../src/Button.js';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('fires onClick when clicked', () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Go</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders disabled state and blocks clicks', () => {
    const onClick = jest.fn();
    render(
      <Button disabled onClick={onClick}>
        Disabled
      </Button>,
    );
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies variant classes for primary, secondary, and ghost', () => {
    const { rerender, container } = render(<Button variant="primary">P</Button>);
    expect(container.firstChild).toHaveClass('bg-tier-2');
    rerender(<Button variant="secondary">S</Button>);
    expect(container.firstChild).toHaveClass('bg-transparent');
    rerender(<Button variant="ghost">G</Button>);
    expect(container.firstChild).toHaveClass('bg-transparent');
  });

  it('forwards arbitrary props (aria-label) onto the underlying button', () => {
    render(<Button aria-label="custom">x</Button>);
    expect(screen.getByLabelText('custom')).toBeInTheDocument();
  });

  it('renders as a Slot when asChild=true', () => {
    render(
      <Button asChild>
        <a href="/somewhere">Link</a>
      </Button>,
    );
    expect(screen.getByRole('link', { name: 'Link' })).toHaveAttribute('href', '/somewhere');
  });
});
