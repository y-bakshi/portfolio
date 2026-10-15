/** The prose of the TestPilot case study. The page and the guide both read it, so they cannot drift. */
export const testpilotCase = {
  problem: [
    'Writing unit tests is slow, and teams rarely know which files deserve tests first. General code assistants write tests that ignore a team’s own conventions, and nothing tells you where defects are most likely. TestPilot was our SER 594 course project at Arizona State University: generate tests that follow a team’s coding standards, and point at the files most worth testing.',
  ],
  built: [
    'I led the AI pipeline, the model integration and the backend. Coding standards are split into chunks, embedded with all-MiniLM-L6-v2 and stored in pgvector. For each request the five closest chunks go into a structured prompt, and a local Qwen Coder 7B model, served by Ollama on a Cloud Run GPU, streams the tests back as they are written.',
    'A second pass scores each result for correctness, assertion quality, edge-case coverage and readability. Anything below 0.6 is regenerated with the critique as feedback.',
    'The defect heatmap scans a public GitHub repository with PyDriller and Radon and ranks files with a Random Forest. A teammate trained that model, and the team fine-tuned the generator with QLoRA on 10,000 Methods2Test pairs, keeping the training, validation and test splits separate.',
  ],
  results: [
    {
      lead: 'Defect prediction.',
      text: 'A Random Forest trained on 6,052 Java files with 21 code metrics, split 70/30, reached precision 0.39, recall 0.29, F1 0.34 and ROC-AUC 0.66. That beats chance but is not good enough to trust alone, so the heatmap is for ranking where to look first, not for deciding.',
    },
    {
      lead: 'Retrieval.',
      text: 'Over 8 labelled queries against 10 standards documents, precision at 5 was 0.375 and recall at 5 was 0.94: nearly every relevant standard reaches the top five, alongside some that are not. This was measured with TF-IDF as a stand-in for pgvector.',
    },
  ],
  team: 'Four people, SER 594 at Arizona State University.',
  source: 'Private course repository. Code walkthrough on request.',
  demo: {
    href: 'https://ser-594-team14-test-pilot.vercel.app/',
    after:
      '. Sign up with an email and a one-time code; the AI engine takes about 30 seconds to wake on a first visit.',
  },
};
