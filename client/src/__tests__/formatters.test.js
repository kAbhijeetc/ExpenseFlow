import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatDate,
  formatPercentage,
  formatDateForInput,
} from '../utils/formatters';

describe('Frontend Formatter Utilities', () => {
  it('should format INR currency properly', () => {
    const formatted = formatCurrency(5400.5, 'INR');
    expect(formatted).toContain('₹');
    expect(formatted).toContain('5,400.50');
  });

  it('should format USD currency properly', () => {
    const formatted = formatCurrency(1250.75, 'USD');
    expect(formatted).toContain('$');
    expect(formatted).toContain('1,250.75');
  });

  it('should format percentages to 1 decimal place', () => {
    expect(formatPercentage(74.567)).toBe('74.6%');
    expect(formatPercentage(0)).toBe('0.0%');
  });

  it('should format date for form inputs (YYYY-MM-DD)', () => {
    const date = new Date(2026, 9, 14); // Oct 14, 2026
    const formatted = formatDateForInput(date);
    expect(formatted).toBe('2026-10-14');
  });
});
