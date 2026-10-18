-- Answers to the questions the suggestion buttons ask, kept so the model is not paid for the same
-- answer again. The key includes a version of the notes, the rules and the model, so any change to
-- them makes the old rows unused. They are public site answers, so nothing here is personal.

CREATE TABLE answer_cache (
  key TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  cites_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
