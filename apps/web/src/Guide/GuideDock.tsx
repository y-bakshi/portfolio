import { Icon } from '../Icon';
import { statusLabel } from './shared';
import { StatusLight } from './StatusLight';
import type { Guide } from './useGuide';

/** The bar at the bottom right and the chat it opens. */
export function GuideDock({ g }: { g: Guide }) {
  const {
    question,
    setQuestion,
    asked,
    status,
    announce,
    open,
    setOpen,
    closing,
    closeDock,
    onDockKey,
    scrolled,
    showLog,
    onSubmit,
    thread,
    chipList,
    refs,
  } = g;

  const showTop = !showLog && scrolled;

  return (
    <>
      <button
        type="button"
        className={`to-top${showTop ? ' is-shown' : ''}`}
        tabIndex={showTop ? 0 : -1}
        aria-hidden={!showTop}
        onClick={() => window.scrollTo({ top: 0 })}
      >
        <Icon name="angleUp" />
        Back to top
      </button>
      <div
        className={`dock-scrim${open ? ' is-open' : ''}`}
        onClick={closeDock}
        aria-hidden="true"
      />
      <aside
        className={`dock${open ? ' is-open' : ''}${closing ? ' is-closing' : ''}`}
        aria-label="Guide chat"
        onKeyDown={onDockKey}
      >
        <p className="sr-only" aria-live="polite">
          {statusLabel[status]}
        </p>
        <p className="sr-only" role="status">
          {announce}
        </p>
        <button
          type="button"
          ref={refs.toggleRef}
          className="dock-bar"
          aria-expanded={open}
          aria-controls="dock-open"
          aria-label={`Ask the guide, ${statusLabel[status].toLowerCase()}`}
          onClick={() => setOpen(true)}
          tabIndex={open ? -1 : 0}
        >
          <StatusLight status={status} />
          <Icon name="comment" className="dock-chevron" />
          <span className="dock-title">
            Ask the guide
            <span className="dock-state">{statusLabel[status]}</span>
          </span>
        </button>
        <div id="dock-open" className="dock-open" inert={!open}>
          {showLog && (
            <>
              <span className="dock-handle" aria-hidden="true" />
              <div className="dock-head">
                <StatusLight status={status} />
                <h2>
                  Ask the guide
                  <span className="dock-state">{statusLabel[status]}</span>
                </h2>
                <button
                  type="button"
                  className="dock-close"
                  aria-label="Close the guide"
                  onClick={closeDock}
                >
                  <Icon name="cross" />
                </button>
              </div>
              <div className="dock-log" ref={refs.logRef}>
                {!asked && (
                  <>
                    <p className="chat-note">
                      I answer from Yash’s project notes. The full version is still in development.
                    </p>
                    {chipList}
                  </>
                )}
                {thread}
              </div>
              {asked && <div className="chips-strip">{chipList}</div>}
            </>
          )}
          {!showLog && chipList}
          <form className="dock-form" onSubmit={onSubmit}>
            <StatusLight status={status} />
            <label htmlFor="ask-input" className="sr-only">
              Ask the guide about Yash’s work
            </label>
            <input
              id="ask-input"
              ref={refs.inputRef}
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={statusLabel[status]}
              autoComplete="off"
            />
            <button type="submit" className="dock-ask" disabled={status !== 'ready'}>
              Ask
            </button>
            {!showLog && (
              <button
                type="button"
                className="dock-close"
                aria-label="Close the guide"
                onClick={closeDock}
              >
                <Icon name="cross" />
              </button>
            )}
          </form>
        </div>
      </aside>
    </>
  );
}
