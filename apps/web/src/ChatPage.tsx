import { GuideChat } from './Guide/GuideChat';
import { GuideProvider } from './Guide/GuideContext';

/** Goes back to where the visitor came from on this site, or to the home page if they came straight here. */
function leave() {
  const fromHere = document.referrer.startsWith(window.location.origin);
  if (fromHere && window.history.length > 1) window.history.back();
  else window.location.assign('/');
}

/**
 * The chat as a page of its own, which is what phones get instead of a panel over the page. The chat
 * itself is kept on the server and in the browser, so it is the same conversation as on any other page.
 */
export function ChatPage() {
  return (
    <GuideProvider page>
      <main
        id="main"
        aria-label="Chat with the guide"
        className="fixed inset-x-0 top-(--vvt,0px) flex h-(--vvh,100dvh) flex-col bg-ground"
      >
        <GuideChat variant="page" onLeave={leave} />
      </main>
    </GuideProvider>
  );
}

export default ChatPage;
