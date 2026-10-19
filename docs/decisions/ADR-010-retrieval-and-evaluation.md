# ADR-010: Answer from retrieved notes, and measure the answers

Status: accepted. Date: 2026-10-19. Replaces the keyword-matched guide described in [ADR-005](ADR-005-ask-first-design-direction.md).

## Context

The first guide matched keywords against a small fixed set of answers. It could not answer follow-up questions and could not say what it did not know. The details of past work were also sensitive: an employer's internal systems should not be published, so the wording of the notes mattered as much as the retrieval.

## Decision

- **Notes, written at the level of the résumé.** The guide answers only from notes: facts the owner approved, project and role summaries, and longer notes. Notes about an employer stay at what the résumé already says; the owner reviewed that list.
- **Retrieval.** Each note is embedded once with Gemini (`gemini-embedding-001`, 768 numbers) and the vector is stored in the D1 `chunks` table. A question is embedded, compared with every vector in code, and the closest six notes go to the model as data, never as instructions.
- **Answer.** A Gemini Flash-Lite model writes two to five sentences, cites the notes it used, and may say only that something is not in the notes. The code, not the model, adds the pointer to Yash and the cited cards.
- **Three kinds of "I can't".** Not about Yash at all (a fixed reply, no pointer and no cards), about Yash but not in the notes (a refusal plus the contact pointer), and part answered (the answered part plus what is missing).
- **Saved answers.** The suggestion buttons are answered from a stored copy, keyed by a hash of the notes, the prompt and the model, so a change to any of them never serves an old answer.
- **Evaluation.** 64 labelled questions run through the real pipeline, scoring context recall and precision, faithfulness, correctness, relevancy, citation accuracy, gap handling and cost. A mock model runs in CI as a regression check. A live run (`npm run eval:record`) is saved to D1 and shown on the owner page, and is marked out of date when the notes or the prompt change.

## Alternatives

- **Keyword matching (the first guide):** free and predictable, but it could not handle questions it had not been written for.
- **Putting all notes in every prompt:** simple, but costs more per answer and gives the model no way to tell which note matters. The evaluation can run this as a baseline (`EVAL_BASELINE=1`); it has only been run with the mock model so far.
- **A hosted vector index (Vectorize):** supported by the code and left off, because about 70 notes are searched in code in milliseconds. Revisit at thousands of notes.
- **Letting the model decide everything, including the pointer:** the pointer would depend on the model remembering to write it, and the prompt already has to forbid invented contact details. The code now owns the pointer.

## Consequences

- Vectors are not updated automatically. After a note changes, the corpus must be rebuilt, re-embedded and loaded into D1; until then retrieval uses the old vectors.
- Questions, with the closest notes, go to Google for each answer. The privacy page says so.
- The word-overlap relevancy score is blunt, and moves by a few points between runs even when the model judge scores relevancy at 100%. Read the failures list rather than chasing the number.
- A live run uses about 240 paid calls and costs a few cents.
