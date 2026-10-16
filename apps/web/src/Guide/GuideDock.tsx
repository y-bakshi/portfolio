import { GuideLauncher } from './GuideLauncher';
import { GuidePanel } from './GuidePanel';

/** The guide's two parts on every page: the launcher button and the chat panel it opens. */
export function GuideDock() {
  return (
    <>
      <GuideLauncher />
      <GuidePanel />
    </>
  );
}
