# Roadmap

The site is live. This page records what was built and what is left.

## Built

- **Foundation and pages:** React, TypeScript, Vite, Tailwind v4 and shadcn/ui; home (introduction, experience, degrees), projects, a case study, contact, privacy and credits, a phone chat page and a 404. The old experience page redirects to the home page.
- **Evidence:** project rows with an animated flow chart each, a work history in short descriptions, a résumé download, a contact page with email, profiles and a booking link.
- **Artwork:** the portrait, a favicon set, the social preview and the guide's mascot.
- **Guide:** retrieval over approved notes, Gemini answers, citations that highlight cards, a stored anonymous chat, a phone chat page, a shrinking launcher, suggestion buttons answered from a cache.
- **Protection:** Turnstile, signed session cookie, per-chat and per-network limits, a spending cap, a kill switch.
- **Owner page:** six tabs behind Cloudflare Access (overview, page analytics, AI usage, questions, answer quality, cost and safety), and saved evaluations of the guide against 64 labelled questions.
- **Release:** a CI workflow, deployment from `main` to Cloudflare, a privacy page and a cookie and privacy notice, security headers, a sitemap, `llms.txt` and structured data.
- **Records:** decision records ADR-001 to ADR-010, with the earlier plans marked superseded.

## Before sharing the link widely

- Ask the guide a real question and an off-topic one on the live site (the bot check needs a real browser).
- Set a budget alert on the Gemini key in Google AI Studio or Cloud.
- Open the home page and the chat on a real phone.
- Upload the newest résumé PDF to R2 if the CV changed.
- Submit `sitemap.xml` in Google Search Console and check what Google sees ([seo](deployment/seo.md)).

## Decisions only the owner can make

- Whether to check with Thryv about what is published about the internship, and whether to ask GitHub Support to purge cached commits from deleted branches.
- Whether to turn branch previews back on, behind Cloudflare Access.
- The `yashbakshi.dev` domain: transfer it to Cloudflare before its renewal at Name.com ([deployment](deployment/deployment.md)).

## Content gaps in the guide

The guide cannot yet answer: the role Yash is looking for, relocation or remote work, certifications, and why to hire him. Add each as an approved fact in `worker/rag/facts.ts`, then rebuild and re-embed the notes. Other hobbies besides photography are not listed.

## Later

- A photography gallery page.
- Answer relevancy scores about 87% against a 90% target on word overlap while the model judge scores 100%; read the failures list on the owner page before tuning.
- Owner page extras: a feedback tab for thumbs-down answers, cache hit rate, a budget used versus cap line, and a warning when the notes' vectors are out of date.
- Tracked links (for example `?from=linkedin`) to see which applications work, because Cloudflare's free plan does not give referrers.
- HSTS in the Cloudflare dashboard.
- Optional voice, which is not built. The [voice sequence](design/sequence-diagrams/voice.md) is a design only.
- Real-device checks on iOS Safari and Android Chrome beyond emulation.
