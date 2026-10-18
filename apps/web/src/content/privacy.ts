/** The privacy page's words. They describe what the site's code really does; change them when the code changes. */
export const PRIVACY_UPDATED = 'October 2026';

/** One line, also shown in the footer of every page. */
export const privacyShort =
  'This site sets one cookie, only to keep your chat working. There are no ads, no tracking and no third-party analytics, and nothing is sold, so there is nothing to accept.';

export type PrivacySection = { title: string; body: string[] };

export const privacySections: PrivacySection[] = [
  {
    title: 'What is saved when you use the guide',
    body: [
      'The questions you ask and the answers you get are saved for 90 days, to see what visitors want to know and to improve the guide. They are saved without your name, an account or your IP address. Email addresses and phone numbers typed into a question are masked before it is saved, but please do not type anything you would not want kept.',
      'You can delete your chat at any time with “Clear this chat” in the guide. That removes it from your browser and from the server.',
    ],
  },
  {
    title: 'The cookie and your browser’s storage',
    body: [
      'The guide sets one cookie, called “chat”. It holds a random number that ties you to your own chat, so a reload brings your conversation back. It lasts 30 days, is sent only to this site, and is not used to follow you around the web.',
      'Your browser also keeps a copy of your recent chat and an unsent draft, so the page can show them at once. This stays on your device.',
    ],
  },
  {
    title: 'What the site counts',
    body: [
      'The site counts a few things without your words: that a chat started, how long a question was, how long an answer took, which source button was pressed, and whether you gave an answer a thumbs up or down. To stop abuse it also limits how often one visitor can ask. For that it uses a code made from your connection that changes every day and cannot be turned back into your address.',
    ],
  },
  {
    title: 'Who else handles it',
    body: [
      'Your question, with the closest notes about Yash’s work, is sent to Google’s Gemini model so it can write the answer.',
      'The site is served by Cloudflare, which also runs the check that tells people from bots. That check loads a script from Cloudflare when you first use the guide.',
      'Nothing is sold or shared for advertising, and there are no advertising or analytics services on the site.',
    ],
  },
  {
    title: 'Children',
    body: [
      'The site is not meant for children under 13, and nothing on it asks for their details.',
    ],
  },
  {
    title: 'Questions or deletion',
    body: [
      'To ask about your data or have it deleted, email Yash. If you can, say roughly when you used the guide.',
    ],
  },
];
