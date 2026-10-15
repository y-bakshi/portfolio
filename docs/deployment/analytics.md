# Analytics

How the guide is used, without identifying anyone. There are two parts: first-party events for the guide (an owner-only page at `/admin`), and cookieless Cloudflare Web Analytics for site traffic.

## Privacy

- Events hold only the random chat id, an event type and a few numbers or short codes (latency, tokens, cost, a model name, a card id). They never hold free text; question text lives in saved messages, which expire after 90 days.
- No IP address, email, account or cookie is recorded for analytics. Nothing identifies a visitor.
- Events older than 90 days are deleted by the daily cleanup.

## Owner setup (once)

1. In the Cloudflare dashboard, open Zero Trust, then Access, Applications, and add a self-hosted application for `yashbakshi.com` with the paths `/admin`, `/admin/*` and `/api/admin/*`.
2. Add an Allow policy that includes only the owner's email address.
3. Copy the application's Audience (AUD) tag from the application's overview.
4. Set the Worker variables: `ACCESS_AUD` to that tag and `ACCESS_TEAM_DOMAIN` to the team domain, for example `myteam.cloudflareaccess.com` (Zero Trust, Settings). Both are plain variables, not secrets.
5. Deploy, then open `https://yashbakshi.com/admin` and sign in.

The Worker checks the Access token itself, so a mistake in the Access policy does not open the page. If either variable is missing, every admin request is refused. For local work only, `ADMIN_DEV_BYPASS=true` (for example in `.dev.vars`) skips the check for requests to `localhost`; never set it in production.

## What the numbers mean

- **Chats, questions, answers:** chats started, questions asked and answers shown in the chosen range (7, 30 or 90 days).
- **Questions and cost per day:** one bar per UTC day. Cost is the provider cost the guide recorded, shown in dollars.
- **Latency p50 and p95:** half of answers were faster than p50; 19 in 20 were faster than p95. Worked out in the Worker from the latency of each answer.
- **Thumbs up:** the share of thumbs ratings that were up.
- **Fallback rate:** how often the built-in keyword guide answered instead, per question. High means the API, a limit or the budget is getting in the way.
- **Rate limited:** how many questions a limit turned away.
- **Top questions:** the 20 most common questions, matched after lowercasing and trimming.
- **Low confidence:** questions whose best retrieval score was below 0.5, or that the guide refused ("not in my notes"), newest first, up to 50. This is the list of what to write next.

## Site traffic: Cloudflare Web Analytics

Cookieless and free, so no banner is needed. Not enabled yet. To turn it on:

1. In the dashboard, open Web Analytics and add the site `yashbakshi.com` (Cloudflare can add the beacon itself, or you can paste the one-line script tag it gives you).
2. Allow the beacon in the Content-Security-Policy in `apps/web/public/_headers`: add `https://static.cloudflareinsights.com` to `script-src` and `https://cloudflareinsights.com` to `connect-src`.

Do not add a token to the repository until the owner decides.
