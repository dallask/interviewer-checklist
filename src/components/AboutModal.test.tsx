import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { chrome } from 'vitest-chrome';
import { AboutModal } from './AboutModal.js';

describe('AboutModal', () => {
  beforeEach(() => {
    chrome.runtime.getManifest.mockReturnValue({
      name: 'Interviewer Checklist',
      manifest_version: 3,
      version: '1.1.0',
    } as chrome.runtime.Manifest);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders without crashing', () => {
    const ref = React.createRef<HTMLDialogElement>();
    expect(() => {
      render(<AboutModal dialogRef={ref} />);
    }).not.toThrow();
  });

  it('dialog has aria-labelledby="about-modal-title"', () => {
    const ref = React.createRef<HTMLDialogElement>();
    render(<AboutModal dialogRef={ref} />);
    const dialog = screen.getByRole('dialog', { hidden: true });
    expect(dialog).toHaveAttribute('aria-labelledby', 'about-modal-title');
  });

  it('shows "Interviewer Checklist" as title', () => {
    const ref = React.createRef<HTMLDialogElement>();
    render(<AboutModal dialogRef={ref} />);
    ref.current?.showModal();
    expect(
      screen.getByRole('heading', { name: 'Interviewer Checklist' }),
    ).toBeInTheDocument();
  });

  it('shows version from manifest', () => {
    const ref = React.createRef<HTMLDialogElement>();
    render(<AboutModal dialogRef={ref} />);
    ref.current?.showModal();
    expect(screen.getByText(/1\.1\.0/)).toBeInTheDocument();
  });

  it('shows credits "Developed by"', () => {
    const ref = React.createRef<HTMLDialogElement>();
    render(<AboutModal dialogRef={ref} />);
    ref.current?.showModal();
    expect(screen.getByText(/Developed by/)).toBeInTheDocument();
  });

  it('shows link to kivgila.pro with href', () => {
    const ref = React.createRef<HTMLDialogElement>();
    render(<AboutModal dialogRef={ref} />);
    ref.current?.showModal();
    const link = screen.getByRole('link', { name: /Ievgen Kyvgyla/ });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://kivgila.pro');
  });

  it('kivgila.pro link has rel="noopener noreferrer"', () => {
    const ref = React.createRef<HTMLDialogElement>();
    render(<AboutModal dialogRef={ref} />);
    ref.current?.showModal();
    const link = screen.getByRole('link', { name: /Ievgen Kyvgyla/ });
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('Close button has aria-label "Close about modal"', () => {
    const ref = React.createRef<HTMLDialogElement>();
    render(<AboutModal dialogRef={ref} />);
    ref.current?.showModal();
    const btn = screen.getByRole('button', { name: 'Close about modal' });
    expect(btn).toBeInTheDocument();
  });
});
