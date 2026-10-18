import { act, fireEvent, render, screen } from '@testing-library/react';
import { labelFor, ResumeButton, RESUME_HREF } from './ResumeButton';

const pdf = () => new Blob(['%PDF'], { type: 'application/pdf' });

function stubDownload() {
  const created = vi.fn(() => 'blob:resume');
  const revoked = vi.fn();
  URL.createObjectURL = created as unknown as typeof URL.createObjectURL;
  URL.revokeObjectURL = revoked as unknown as typeof URL.revokeObjectURL;
  const clicked = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  return { created, clicked };
}

describe('the résumé button', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('is a plain download link before anything happens', () => {
    render(<ResumeButton />);
    const link = screen.getByRole('link', { name: /download résumé/i });
    expect(link).toHaveAttribute('href', RESUME_HREF);
    expect(link).toHaveAttribute('download');
  });

  it('says Downloading… while it waits, then Downloaded, then goes back', async () => {
    const { clicked } = stubDownload();
    let finish!: (r: Response) => void;
    globalThis.fetch = vi.fn(
      () => new Promise<Response>((r) => (finish = r)),
    ) as unknown as typeof fetch;
    render(<ResumeButton label="Resume" />);
    fireEvent.click(screen.getByRole('link'));
    expect(screen.getByRole('link')).toHaveTextContent('Downloading…');
    expect(screen.getByRole('link')).toHaveAttribute('aria-busy', 'true');
    await act(async () => finish(new Response(pdf())));
    expect(screen.getByRole('link')).toHaveTextContent('Downloaded');
    expect(clicked).toHaveBeenCalledTimes(1);
    await act(async () => void vi.advanceTimersByTime(3000));
    expect(screen.getByRole('link')).toHaveTextContent('Resume');
  });

  it('does not start a second download while one is running', async () => {
    stubDownload();
    globalThis.fetch = vi.fn(() => new Promise<Response>(() => {})) as unknown as typeof fetch;
    render(<ResumeButton />);
    fireEvent.click(screen.getByRole('link'));
    fireEvent.click(screen.getByRole('link'));
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('says so when the file is not there, and lets the visitor try again', async () => {
    stubDownload();
    globalThis.fetch = vi.fn(async () => new Response('nope', { status: 404 })) as typeof fetch;
    render(<ResumeButton />);
    await act(async () => void fireEvent.click(screen.getByRole('link')));
    expect(screen.getByRole('link')).toHaveTextContent('Not available, try again');
    await act(async () => void vi.advanceTimersByTime(3000));
    expect(screen.getByRole('link')).toHaveTextContent('Download résumé');
  });

  it('leaves a click with a modifier to the browser', () => {
    globalThis.fetch = vi.fn() as unknown as typeof fetch;
    render(<ResumeButton />);
    fireEvent.click(screen.getByRole('link'), { ctrlKey: true });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('words each state', () => {
    expect(labelFor('idle', 'Resume')).toBe('Resume');
    expect(labelFor('downloading', 'Resume')).toBe('Downloading…');
  });
});
