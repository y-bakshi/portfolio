-- One row per offline evaluation of the guide: the 65 labelled questions run through the real
-- pipeline, with the scores kept so the owner page can show them and how they change. Nothing here
-- is about a visitor.

CREATE TABLE eval_runs (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  -- 'live' (the real model, the numbers that matter) or 'mock' (the fake one, a regression check)
  kind TEXT NOT NULL,
  model TEXT NOT NULL,
  -- names the notes and the prompt the run was made with, to tell whether it still describes the site
  corpus_version TEXT NOT NULL,
  questions INTEGER NOT NULL,
  report_json TEXT NOT NULL
);

CREATE INDEX eval_runs_created ON eval_runs (created_at);
