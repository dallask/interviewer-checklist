import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SidebarGroup } from './SidebarGroup.js';

describe('SidebarGroup', () => {
  const onToggle = vi.fn();

  it('renders group header button with aria-expanded="true" when isOpen=true', () => {
    render(
      <SidebarGroup
        groupId="search"
        label="Search"
        isOpen={true}
        onToggle={onToggle}
      >
        <p>Content</p>
      </SidebarGroup>,
    );
    const btn = screen.getByRole('button', { name: /search/i });
    expect(btn).toHaveAttribute('aria-expanded', 'true');
  });

  it('renders group header button with aria-expanded="false" when isOpen=false', () => {
    render(
      <SidebarGroup
        groupId="search"
        label="Search"
        isOpen={false}
        onToggle={onToggle}
      >
        <p>Content</p>
      </SidebarGroup>,
    );
    const btn = screen.getByRole('button', { name: /search/i });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders children when isOpen=true', () => {
    render(
      <SidebarGroup
        groupId="search"
        label="Search"
        isOpen={true}
        onToggle={onToggle}
      >
        <p>Visible content</p>
      </SidebarGroup>,
    );
    expect(screen.getByText('Visible content')).toBeInTheDocument();
  });

  it('region div is always in DOM when isOpen=false (aria-controls always resolves)', () => {
    render(
      <SidebarGroup
        groupId="search"
        label="Search"
        isOpen={false}
        onToggle={onToggle}
      >
        <p>Hidden content</p>
      </SidebarGroup>,
    );
    // D-03: region is always in the DOM so aria-controls resolves;
    // grid-template-rows: 0fr collapses visually without display:none.
    const region = document.getElementById('sidebar-group-search');
    expect(region).toBeInTheDocument();
    expect(region).not.toHaveAttribute('hidden');
    expect(region?.style.gridTemplateRows).toBe('0fr');
  });

  it('calls onToggle when button is clicked', () => {
    render(
      <SidebarGroup
        groupId="search"
        label="Search"
        isOpen={true}
        onToggle={onToggle}
      >
        <p>Content</p>
      </SidebarGroup>,
    );
    fireEvent.click(screen.getByRole('button', { name: /search/i }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('button has focus-visible ring classes', () => {
    render(
      <SidebarGroup
        groupId="search"
        label="Search"
        isOpen={true}
        onToggle={onToggle}
      >
        <p>Content</p>
      </SidebarGroup>,
    );
    const btn = screen.getByRole('button', { name: /search/i });
    expect(btn.className).toContain('focus-visible:ring-2');
    expect(btn.className).toContain('focus-visible:ring-blue-500');
  });
});
