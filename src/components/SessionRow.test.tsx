import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionRow } from './SessionRow.js';

const mockSession = {
  id: 'session-1',
  name: 'Session 1',
  createdAt: '2026-06-17T00:00:00Z',
  updatedAt: '2026-06-17T00:00:00Z',
};

describe('SessionRow', () => {
  const onSwitch = vi.fn();
  const onRename = vi.fn();
  const onDuplicate = vi.fn();
  const onDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('default: renders session name in a button with aria-label="Switch to Session 1"', () => {
    render(
      <SessionRow
        session={mockSession}
        isActive={false}
        onSwitch={onSwitch}
        onRename={onRename}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />,
    );
    const switchBtn = screen.getByRole('button', {
      name: /switch to session 1/i,
    });
    expect(switchBtn).toBeInTheDocument();
    expect(switchBtn).toHaveTextContent('Session 1');
  });

  it('active: li has bg-blue-50 class (no aria-selected after WR-01 fix)', () => {
    render(
      <SessionRow
        session={mockSession}
        isActive={true}
        onSwitch={onSwitch}
        onRename={onRename}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />,
    );
    // aria-selected removed (WR-01): role="option" was orphaned after listbox removal.
    // Active state is now conveyed via bg-blue-50 class on the li element.
    const li = document.getElementById('session-row-session-1');
    expect(li).not.toHaveAttribute('aria-selected');
    expect(li?.className).toContain('bg-blue-50');
  });

  it('inactive: li does not have bg-blue-50 class (no aria-selected after WR-01 fix)', () => {
    render(
      <SessionRow
        session={mockSession}
        isActive={false}
        onSwitch={onSwitch}
        onRename={onRename}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />,
    );
    // aria-selected removed (WR-01): inactive row has no blue background.
    const li = document.getElementById('session-row-session-1');
    expect(li).not.toHaveAttribute('aria-selected');
    expect(li?.className).not.toContain('bg-blue-50');
  });

  it('active: checkmark span does not have text-transparent class', () => {
    render(
      <SessionRow
        session={mockSession}
        isActive={true}
        onSwitch={onSwitch}
        onRename={onRename}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />,
    );
    // Find the checkmark span by aria-hidden attribute (Check SVG has no text node)
    const checkmarkSpan = document
      .getElementById('session-row-session-1')
      ?.querySelector('[aria-hidden="true"]');
    expect(checkmarkSpan).toBeTruthy();
    expect(checkmarkSpan?.className).not.toContain('text-transparent');
    expect(checkmarkSpan?.className).toContain('text-blue-600');
  });

  it('inactive: checkmark span has text-transparent class', () => {
    render(
      <SessionRow
        session={mockSession}
        isActive={false}
        onSwitch={onSwitch}
        onRename={onRename}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />,
    );
    // Find the checkmark span by aria-hidden attribute (Check SVG has no text node)
    const checkmarkSpan = document
      .getElementById('session-row-session-1')
      ?.querySelector('[aria-hidden="true"]');
    expect(checkmarkSpan).toBeTruthy();
    expect(checkmarkSpan?.className).toContain('text-transparent');
  });

  it('rename click: editing state activates; input appears with current name; maxLength=50', () => {
    render(
      <SessionRow
        session={mockSession}
        isActive={false}
        onSwitch={onSwitch}
        onRename={onRename}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />,
    );
    const renameBtn = screen.getByRole('button', { name: /rename session 1/i });
    fireEvent.click(renameBtn);
    const input = screen.getByRole('textbox', { name: /rename session/i });
    expect(input).toBeInTheDocument();
    expect((input as HTMLInputElement).value).toBe('Session 1');
    expect(input).toHaveAttribute('maxLength', '50');
  });

  it('rename commit (Enter): calls onRename with trimmed value; exits editing state', () => {
    render(
      <SessionRow
        session={mockSession}
        isActive={false}
        onSwitch={onSwitch}
        onRename={onRename}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /rename session 1/i }));
    const input = screen.getByRole('textbox', { name: /rename session/i });
    fireEvent.change(input, { target: { value: 'New Name  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    // The blur should trigger commit
    fireEvent.blur(input);
    expect(onRename).toHaveBeenCalledWith('New Name');
    // Input should be gone, back to button
    expect(
      screen.queryByRole('textbox', { name: /rename session/i }),
    ).toBeNull();
  });

  it('rename cancel (Escape): calls no actions; exits editing state', () => {
    render(
      <SessionRow
        session={mockSession}
        isActive={false}
        onSwitch={onSwitch}
        onRename={onRename}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /rename session 1/i }));
    const input = screen.getByRole('textbox', { name: /rename session/i });
    fireEvent.change(input, { target: { value: 'Partial edit' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onRename).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('textbox', { name: /rename session/i }),
    ).toBeNull();
    // Original name still shown
    expect(
      screen.getByRole('button', { name: /switch to session 1/i }),
    ).toBeInTheDocument();
  });

  it('blank name on blur: calls no actions; reverts to original name', () => {
    render(
      <SessionRow
        session={mockSession}
        isActive={false}
        onSwitch={onSwitch}
        onRename={onRename}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /rename session 1/i }));
    const input = screen.getByRole('textbox', { name: /rename session/i });
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.blur(input);
    expect(onRename).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('textbox', { name: /rename session/i }),
    ).toBeNull();
    expect(
      screen.getByRole('button', { name: /switch to session 1/i }),
    ).toBeInTheDocument();
  });

  it('duplicate click: calls onDuplicate()', () => {
    render(
      <SessionRow
        session={mockSession}
        isActive={false}
        onSwitch={onSwitch}
        onRename={onRename}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: /duplicate session 1/i }),
    );
    expect(onDuplicate).toHaveBeenCalledTimes(1);
  });

  it('delete click: calls onDelete()', () => {
    render(
      <SessionRow
        session={mockSession}
        isActive={false}
        onSwitch={onSwitch}
        onRename={onRename}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /delete session 1/i }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('icon buttons have opacity-0 class at rest', () => {
    render(
      <SessionRow
        session={mockSession}
        isActive={false}
        onSwitch={onSwitch}
        onRename={onRename}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />,
    );
    const renameBtn = screen.getByRole('button', { name: /rename session 1/i });
    const iconsContainer = renameBtn.parentElement;
    expect(iconsContainer).toHaveClass('opacity-0');
  });

  it('icon buttons container has group-hover:opacity-100 class', () => {
    render(
      <SessionRow
        session={mockSession}
        isActive={false}
        onSwitch={onSwitch}
        onRename={onRename}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />,
    );
    const renameBtn = screen.getByRole('button', { name: /rename session 1/i });
    const iconsContainer = renameBtn.parentElement;
    expect(iconsContainer?.className).toContain('group-hover:opacity-100');
  });
});
