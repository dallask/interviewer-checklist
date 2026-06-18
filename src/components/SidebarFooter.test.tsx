import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chrome } from 'vitest-chrome';
import { SidebarFooter } from './SidebarFooter.js';

describe('SidebarFooter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    chrome.runtime.getManifest.mockReturnValue({
      name: 'Interviewer Checklist',
      manifest_version: 3,
      version: '1.0.0',
    } as chrome.runtime.Manifest);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders "Developed by" credit text', () => {
    const { container } = render(<SidebarFooter />);
    expect(container.textContent).toMatch(/Developed by/);
  });

  it('renders Ievgen Kyvgyla link with href="https://kivgila.pro"', () => {
    const { getByRole } = render(<SidebarFooter />);
    const link = getByRole('link', { name: /Ievgen Kyvgyla/ });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://kivgila.pro');
  });

  it('Ievgen Kyvgyla link has rel="noopener noreferrer"', () => {
    const { getByRole } = render(<SidebarFooter />);
    const link = getByRole('link', { name: /Ievgen Kyvgyla/ });
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders About icon button with aria-label="About this app"', () => {
    const { getByRole } = render(<SidebarFooter />);
    const btn = getByRole('button', { name: 'About this app' });
    expect(btn).toBeInTheDocument();
  });

  it('About button has data-about-trigger attribute', () => {
    const { getByRole } = render(<SidebarFooter />);
    const btn = getByRole('button', { name: 'About this app' });
    expect(btn).toHaveAttribute('data-about-trigger');
  });

  it('does not render version string or "What\'s new" in the footer strip', () => {
    const { container } = render(<SidebarFooter />);
    // The footer strip (first child div) must not show the version or changelog link
    const footerStrip = container.firstElementChild?.firstElementChild as HTMLElement | undefined;
    expect(footerStrip?.textContent).not.toMatch(/v1\.0\.0/);
    expect(container.textContent).not.toMatch(/What's new/);
  });
});
