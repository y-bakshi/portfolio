import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { motion } from './test/setup';
import Home from './App';
import { answerStream, cannedGuide, fakeApi } from './test/fake-api';

vi.mock('./DotGrid', () => ({ DotGrid: () => null }));
vi.mock('./MistPortrait', () => ({ MistPortrait: () => <div data-testid="portrait" /> }));

// the page's own guide is the API; these are the answers it gives in these tests
const renderHome = () => {
  cannedGuide({
    'What has Yash built with RAG?': [
      'TestPilot is the RAG project. It retrieves coding standards first.',
      ['testpilot'],
    ],
    'Has he worked with agents?': [
      'GuardianAI has a ReAct path for open-ended questions.',
      ['guardianai'],
    ],
    'Tell me about his education': [
      'Arizona State University, after a degree in India.',
      ['asu', 'manipal'],
    ],
    'Tell me about the rust process monitor': [
      'ProcWatch is a Rust terminal monitor.',
      ['procwatch'],
    ],
    'What cloud work has he done?': [
      'CityWatch and the face recognition pipeline are both AWS.',
      ['citywatch', 'face-recognition', 'testpilot'],
    ],
  });
  return render(<Home />);
};

const bar = () => screen.getByRole('button', { name: /^ask the guide/i });
const panel = () => document.getElementById('dock-open') as HTMLElement;
// Answer text appears twice on purpose: in its bubble, and once in a status region for screen readers.
const input = () => screen.getByLabelText(/ask the guide about yash/i) as HTMLInputElement;

async function openAndAsk(user: ReturnType<typeof userEvent.setup>, question: string) {
  if (bar().getAttribute('aria-expanded') !== 'true') await user.click(bar());
  await user.click(within(panel()).getByRole('button', { name: question }));
}

describe('the guide chat', () => {
  it('starts closed, with its contents out of reach', () => {
    renderHome();
    expect(bar()).toHaveAttribute('aria-expanded', 'false');
    expect(panel()).toHaveAttribute('inert');
  });

  it('opens when the bar is pressed and moves focus to the input', async () => {
    const user = userEvent.setup();
    renderHome();
    await user.click(bar());
    expect(bar()).toHaveAttribute('aria-expanded', 'true');
    expect(panel()).not.toHaveAttribute('inert');
    expect(input()).toHaveFocus();
  });

  it('closes on Escape and gives focus back to the bar', async () => {
    const user = userEvent.setup();
    renderHome();
    await user.click(bar());
    await user.keyboard('{Escape}');
    await waitFor(() => expect(bar()).toHaveAttribute('aria-expanded', 'false'));
    expect(bar()).toHaveFocus();
  });

  it('answers a suggested question and shows the sources it used', async () => {
    const user = userEvent.setup();
    renderHome();
    await openAndAsk(user, 'What has Yash built with RAG?');
    expect(
      await screen.findByText(/TestPilot is the RAG project/, { selector: '.msg-answer' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('What has Yash built with RAG?', { selector: '.msg-user' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: 'Show TestPilot on the page' }),
    ).toBeInTheDocument();
  });

  it('announces the finished answer once, through a status region', async () => {
    const user = userEvent.setup();
    renderHome();
    await openAndAsk(user, 'Has he worked with agents?');
    await waitFor(() => {
      const spoken = screen
        .getAllByRole('status')
        .map((n) => n.textContent)
        .join(' ');
      expect(spoken).toMatch(/GuardianAI has a ReAct path/);
    });
  });

  it('keeps earlier exchanges when a new question is asked', async () => {
    const user = userEvent.setup();
    renderHome();
    await openAndAsk(user, 'What has Yash built with RAG?');
    await screen.findByRole('button', { name: 'Show TestPilot on the page' });
    await user.click(within(panel()).getByRole('button', { name: 'Has he worked with agents?' }));
    await screen.findByText(/GuardianAI has a ReAct path/, { selector: '.msg-answer' });
    expect(document.querySelectorAll('.exchange')).toHaveLength(1);
    expect(
      screen.getByText(/TestPilot is the RAG project/, { selector: '.msg-answer' }),
    ).toBeInTheDocument();
    expect(document.querySelectorAll('.msg-user')).toHaveLength(2);
  });

  it('ignores an empty question and keeps focus in the input', async () => {
    const user = userEvent.setup();
    renderHome();
    await user.click(bar());
    await user.click(screen.getByRole('button', { name: 'Ask' }));
    expect(document.querySelector('.msg-user')).toBeNull();
    expect(input()).toHaveFocus();
  });

  it('answers a typed question', async () => {
    const user = userEvent.setup();
    renderHome();
    await user.click(bar());
    await user.type(input(), 'Tell me about his education{Enter}');
    expect(
      await screen.findByText(/Arizona State University, after/, {
        selector: '.msg-answer',
      }),
    ).toBeInTheDocument();
    expect(input()).toHaveValue('');
  });

  it('jumps to a cited card, focuses it and highlights it', async () => {
    const user = userEvent.setup();
    renderHome();
    await openAndAsk(user, 'What has Yash built with RAG?');
    await user.click(await screen.findByRole('button', { name: 'Show TestPilot on the page' }));
    const card = document.getElementById('testpilot') as HTMLElement;
    expect(card.scrollIntoView).toHaveBeenCalled();
    expect(card).toHaveFocus();
    await waitFor(() => expect(card).toHaveClass('is-marked'));
  });

  it('opens the all-projects page for a cited project that is not on this page', async () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign });
    const user = userEvent.setup();
    renderHome();
    await user.click(bar());
    await user.type(input(), 'Tell me about the rust process monitor{Enter}');
    await user.click(await screen.findByRole('button', { name: 'Show ProcWatch on the page' }));
    expect(assign).toHaveBeenCalledWith('/projects/#procwatch');
    vi.unstubAllGlobals();
  });

  it('takes the new question while the answer streams: status runs thinking, answering, ready', async () => {
    motion.reduce = false;
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    // a model takes a moment to start answering
    fakeApi({
      'GET /api/chat': () => Response.json({ messages: [] }),
      'POST /api/session': () => Response.json({ ok: true }),
      'POST /api/chat': () =>
        new Promise<Response>((resolve) =>
          setTimeout(
            () =>
              resolve(
                answerStream('CityWatch and the face recognition pipeline are both AWS.', [
                  'citywatch',
                ]),
              ),
            800,
          ),
        ),
    });
    render(<Home />);
    await user.click(bar());
    const chip = within(panel()).getByRole('button', { name: 'What cloud work has he done?' });
    await user.click(chip);
    expect(screen.getAllByText('Looking through the notes').length).toBeGreaterThan(0);
    expect(chip).toBeDisabled();
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(chip).toBeDisabled();
    // the answer arrives, is revealed word by word, and the chip comes back
    for (let i = 0; i < 40 && chip.hasAttribute('disabled'); i++) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
      });
    }
    expect(chip).toBeEnabled();
    expect(
      screen.getByText(/CityWatch and the face recognition pipeline/, { selector: '.msg-answer' }),
    ).toBeInTheDocument();
  });
});
