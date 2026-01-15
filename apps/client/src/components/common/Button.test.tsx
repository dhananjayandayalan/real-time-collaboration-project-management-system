import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('applies default variant and size', () => {
    render(<Button>Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn--primary');
    expect(button).toHaveClass('btn--md');
  });

  it('applies custom variant', () => {
    render(<Button variant="secondary">Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn--secondary');
  });

  it('applies custom size', () => {
    render(<Button size="lg">Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn--lg');
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Button</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled when isLoading is true', () => {
    render(<Button isLoading>Button</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows loading spinner when isLoading', () => {
    render(<Button isLoading>Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn--loading');
  });

  it('applies full width class when fullWidth is true', () => {
    render(<Button fullWidth>Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn--full-width');
  });

  it('renders left icon', () => {
    render(<Button leftIcon={<span data-testid="left-icon">+</span>}>Button</Button>);
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
  });

  it('renders right icon', () => {
    render(<Button rightIcon={<span data-testid="right-icon">+</span>}>Button</Button>);
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('does not render icons when loading', () => {
    render(
      <Button
        isLoading
        leftIcon={<span data-testid="left-icon">+</span>}
        rightIcon={<span data-testid="right-icon">+</span>}
      >
        Button
      </Button>
    );
    expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('right-icon')).not.toBeInTheDocument();
  });
});
