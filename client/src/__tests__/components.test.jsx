import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';

describe('Reusable UI Components', () => {
  it('should render Button with text and handle clicks', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Submit Transaction</Button>);

    const button = screen.getByRole('button', { name: /submit transaction/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should disable button when loading is true', () => {
    render(<Button loading>Processing</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should render Badge with semantic text', () => {
    render(<Badge variant="income">Income</Badge>);
    expect(screen.getByText('Income')).toBeInTheDocument();
  });

  it('should render Card with title and children', () => {
    render(
      <Card title="Monthly Spending">
        <p>Card body content</p>
      </Card>
    );
    expect(screen.getByText('Monthly Spending')).toBeInTheDocument();
    expect(screen.getByText('Card body content')).toBeInTheDocument();
  });

  it('should render EmptyState with action button', () => {
    const handleAction = vi.fn();
    render(
      <EmptyState
        title="No entries"
        description="Try adding one"
        actionText="Add New"
        onAction={handleAction}
      />
    );
    expect(screen.getByText('No entries')).toBeInTheDocument();
    const actionBtn = screen.getByRole('button', { name: /add new/i });
    fireEvent.click(actionBtn);
    expect(handleAction).toHaveBeenCalledTimes(1);
  });
});
