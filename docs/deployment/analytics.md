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
- **Fallback rate:** how often the guide could not answer (the model failed or was unavailable), per question. High means the API, a limit or the budget is getting in the way.
- **Rate limited:** how many questions a limit turned away.
- **Top questions:** the 20 most common questions, matched after lowercasing and trimming.
- **Low confidence:** questions whose best retrieval score was below 0.5, or that the guide refused ("not in my notes"), newest first, up to 50. This is the list of what to write next.

## Tabs on the owner page

`/admin` has six tabs. The range buttons (7, 30, 90 days) apply to all but Answer quality.

- **Overview:** headline numbers and a short "needs attention" list (traffic not set up, an evaluation older than the notes, metrics below target, questions the guide could not answer).
- **Page analytics:** visitors (an estimate), page views, requests, top pages, referrers, countries and browsers, from Cloudflare's own counts for the domain. Nothing is added to the pages, so the privacy page stays true. The numbers include bots and file requests and are for trends, not exact audience size. Top pages and referrers come from a second query that some plans or ranges refuse; the panel then says so.
- **AI usage:** chats, questions, answers, cost, latency p50 and p95, thumbs, fallback rate, rate limits, and per-day charts.
- **Questions:** top questions, low confidence ("what to write next") and which source buttons were pressed.
- **Answer quality:** the saved evaluations against the 64 labelled questions: context recall and precision, faithfulness, correctness, relevancy, citation accuracy, gap handling and more, with pass or fail against the live targets, a recent-runs table and the failures to read. A run is marked out of date when the notes or the prompt changed after it. Recall, precision and correctness need labels, so they cannot be measured on visitor traffic; they come from offline runs.
- **Cost and safety:** spend, cost per answer, which limits were hit, why answers fell back, and errors.

## Owner setup: page analytics (once)

1. In the dashboard, open your profile, API Tokens, Create Token, Custom token. Permission: Zone, Analytics, Read. Zone resources: include the specific zone `yashbakshi.com`.
2. `npx wrangler secret put CF_ANALYTICS_TOKEN` in `apps/web` and paste the token.
3. Copy the Zone ID from the domain's Overview page (right sidebar) into `CF_ZONE_ID` under `vars` in `wrangler.jsonc` (it is public) and deploy.

Without both, the panel says traffic is not set up. The Worker asks Cloudflare server to server and keeps each answer for five minutes. Cloudflare Web Analytics (the browser beacon) is not used and must stay off, because it would need a script on every page and a looser content security policy.

## Recording an evaluation

```
npm run eval:record -- --mock     # free: checks the plumbing and the page
GEMINI_API_KEY=... npm run eval:record -- --live   # real Gemini, about 200 paid calls
npx wrangler d1 execute DB --remote --file=worker/rag/eval-run.generated.sql
```

`--live` is the run that says how good the guide is. `EVAL_MAX_CALLS` (default 300) caps the calls and `EVAL_JUDGE=0` skips the judge. The generated SQL file is not committed. Use `--local` to see a run on the local database.
