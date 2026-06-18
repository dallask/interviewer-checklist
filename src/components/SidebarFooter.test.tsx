import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chrome } from 'vitest-chrome';
import { SidebarFooter } from './SidebarFooter.js';

/**
 * POLISH-06: SidebarFooter tests.
 */
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

  it('renders the "v{version}" string from chrome.runtime.getManifest()', () => {
    const { getByText } = render(<SidebarFooter />);
    expect(getByText('v1.0.0')).toBeInTheDocument();
  });

  it('"What\'s new" button toggles the ChangelogViewer visibility', () => {
    const { getByText, container } = render(<SidebarFooter />);
    // Initially closed — no <pre> rendered.
    expect(container.querySelector('pre')).toBeNull();
    fireEvent.click(getByText("What's new"));
    expect(container.querySelector('pre')).not.toBeNull();
    fireEvent.click(getByText("What's new"));
    expect(container.querySelector('pre')).toBeNull();
  });

  it('dispatching open-changelog CustomEvent opens the ChangelogViewer', () => {
    const { container } = render(<SidebarFooter />);
    expect(container.querySelector('pre')).toBeNull();
    act(() => {
      window.dispatchEvent(new CustomEvent('open-changelog'));
    });
    expect(container.querySelector('pre')).not.toBeNull();
  });

  it('"What\'s new" button has aria-expanded reflecting open state', () => {
    const { getByText } = render(<SidebarFooter />);
    const btn = getByText("What's new");
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
  });

  it('removes the open-changelog listener on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<SidebarFooter />);
    unmount();
    expect(removeSpy).toHaveBeenCalledWith(
      'open-changelog',
      expect.any(Function),
    );
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

  it('renders About button', () => {
    const { getByRole } = render(<SidebarFooter />);
    const btn = getByRole('button', { name: 'About' });
    expect(btn).toBeInTheDocument();
  });

  it('About button has data-about-trigger attribute', () => {
    const { getByRole } = render(<SidebarFooter />);
    const btn = getByRole('button', { name: 'About' });
    expect(btn).toHaveAttribute('data-about-trigger');
  });
});
