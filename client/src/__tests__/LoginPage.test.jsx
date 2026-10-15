import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { LoginPage } from '../pages/LoginPage';
import { AuthProvider } from '../context/AuthContext';

describe('LoginPage Component', () => {
  it('should render login form and fill demo credentials upon clicking demo pill', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Welcome to ExpenseFlow/i)).toBeInTheDocument();

    const emailInput = screen.getByPlaceholderText(/you@example\.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);

    expect(emailInput.value).toBe('');
    expect(passwordInput.value).toBe('');

    // Click demo fill button
    const demoButton = screen.getByRole('button', { name: /fill demo account/i });
    fireEvent.click(demoButton);

    expect(emailInput.value).toBe('demo@expenseflow.app');
    expect(passwordInput.value).toBe('DemoPassword123!');
  });
});
