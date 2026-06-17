import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { StorageToast } from './StorageToast.js';

describe('StorageToast', () => {
  it('initially renders nothing', () => {
    render(<StorageToast />);
    const alert = document.querySelector('[role="alert"]');
    expect(alert).not.toBeInTheDocument();
  });

  it('shows toast with role="alert" after storage-quota-warning event fires', () => {
    render(<StorageToast />);
    act(() => {
      window.dispatchEvent(new CustomEvent('storage-quota-warning'));
    });
    const alert = document.querySelector('[role="alert"]');
    expect(alert).toBeInTheDocument();
  });

  it('shows correct copy text when visible', () => {
    render(<StorageToast />);
    act(() => {
      window.dispatchEvent(new CustomEvent('storage-quota-warning'));
    });
    expect(
      screen.getByText('Storage is almost full. Export a YAML backup to free space.'),
    ).toBeInTheDocument();
  });

  it('has dismiss button with aria-label="Dismiss storage warning"', () => {
    render(<StorageToast />);
    act(() => {
      window.dispatchEvent(new CustomEvent('storage-quota-warning'));
    });
    const dismissBtn = screen.getByRole('button', { name: /dismiss storage warning/i });
    expect(dismissBtn).toBeInTheDocument();
  });

  it('clicking dismiss button removes the toast from DOM', () => {
    render(<StorageToast />);
    act(() => {
      window.dispatchEvent(new CustomEvent('storage-quota-warning'));
    });
    const dismissBtn = screen.getByRole('button', { name: /dismiss storage warning/i });
    fireEvent.click(dismissBtn);
    const alert = document.querySelector('[role="alert"]');
    expect(alert).not.toBeInTheDocument();
  });

  it('toast is positioned with fixed bottom-4 right-4 z-50 classes', () => {
    render(<StorageToast />);
    act(() => {
      window.dispatchEvent(new CustomEvent('storage-quota-warning'));
    });
    const alert = document.querySelector('[role="alert"]');
    expect(alert?.className).toContain('fixed');
    expect(alert?.className).toContain('bottom-4');
    expect(alert?.className).toContain('right-4');
    expect(alert?.className).toContain('z-50');
  });
});
