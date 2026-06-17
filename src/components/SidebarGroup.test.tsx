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

  it('does not render children when isOpen=false', () => {
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
    expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();
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
