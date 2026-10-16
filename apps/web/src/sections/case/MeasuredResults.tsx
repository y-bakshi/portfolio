import { testpilotCase as study } from '../../content/testpilot-case';

/** The results table: each measurement is reported together with its limit. */
export function MeasuredResults() {
  return (
    <>
      <div
        role="region"
        aria-label="Measured results"
        tabIndex={0}
        className="overflow-x-auto rounded-xl border border-line/70 bg-panel shadow-soft"
      >
        <table className="w-full min-w-[34rem] border-collapse text-left text-[0.95rem]">
          <caption className="sr-only">Measured results and their limitations</caption>
          <thead className="bg-ink/6">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">
                Evaluation
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Result
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Limitation
              </th>
            </tr>
          </thead>
          <tbody>
            {study.measured.map((m) => (
              <tr key={m.evaluation} className="border-t border-line/70 align-top">
                <th scope="row" className="px-4 py-3 font-medium">
                  {m.evaluation}
                </th>
                <td className="px-4 py-3">{m.result}</td>
                <td className="px-4 py-3 text-muted">{m.limitation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted">Measurements and limitations are reported together.</p>
    </>
  );
}
