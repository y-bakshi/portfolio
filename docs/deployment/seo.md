# Search and AI-agent visibility

Status: built and tested locally. Nothing here is verified against Google, Bing or any AI crawler yet; the owner steps at the end are what make it real.

## The problem this solves

Every page used to be an empty `<div id="root"></div>` plus a script. Google can run JavaScript but often indexes late or thinly, and most AI crawlers and agents (GPTBot, ClaudeBot, PerplexityBot, tools that fetch a page as plain HTML) do not run it, so to them the site was empty.

## What the build does now

All of it happens in `npm run build` and reads the same content modules the pages use (`src/content/`), so the HTML, the structured data and the text files cannot drift apart.

1. **Prerendered HTML** (`vite.prerender.ts`, `src/seo/render.tsx`). After Vite writes `dist/`, a plugin loads the page components through Vite's own TypeScript loader (the same way `scripts/run.mjs` does for the corpus), renders each with `react-dom/server` and puts the markup inside `#root` of the built file. The browser entry is unchanged: `createRoot(...).render(...)` throws the markup away and draws the page itself. It is deliberately not hydration, because the components read `window`, `matchMedia`, canvas and random values. The markup is the desktop first render (portrait canvas empty, intro waiting), so there is no visible jump; this was checked in Playwright by comparing element boxes with JavaScript off and on for all three pages (no differences). The full intro sentence is in the page as the screen-reader copy. Preload links React puts at the front of its output are moved into `<head>`. Dev (`vite`) and the Playwright tests are not affected; only `vite build` prerenders.
2. **Structured data** (`src/seo/jsonld.ts`, injected by `vite.site.ts`). One `<script type="application/ld+json">` per page:
   - home: `Person` (name, url, `jobTitle` "Software engineer" as the page's own heading says, portrait, `sameAs` LinkedIn and GitHub from the contact links, `alumniOf` the two universities, `knowsAbout` the technologies on the home page cards) and `WebSite`;
   - `/projects/` and the case study: `BreadcrumbList`;
   - the case study also gets a `TechArticle`.
   Everything in it is visible on the page. There are no dates, ratings, addresses or employer links because the site does not state them in a form that fits. The unit test checks every URL is absolute and on the site (or one of the two profiles) and that no field is empty. JSON-LD blocks are data, so the `script-src 'self'` policy in `public/_headers` is unaffected; no CSP violation appears in the browser console (checked under `wrangler dev`, which applies the headers).
3. **For AI agents** (`src/seo/llms.ts`). `/llms.txt` follows the llms.txt convention (title, one paragraph, link list with one-line descriptions); `/llms-full.txt` is all of the site as markdown: roles, degrees, every project with role, stack, pipeline and links, the TestPilot case study, smaller projects, contact. The home page head has `<link rel="alternate" type="text/plain" href="/llms.txt">`. Cloudflare serves both as `text/plain; charset=utf-8` (checked under `wrangler dev`).
4. **robots.txt and sitemap.xml** (`vite.site.ts`). `Allow: /`, `Disallow: /api/`, `Disallow: /admin` for everyone, plus an explicit group for GPTBot, ChatGPT-User, OAI-SearchBot, ClaudeBot, Claude-User, Claude-SearchBot, PerplexityBot, Perplexity-User, Google-Extended, Applebot-Extended and CCBot. Each named group repeats the `Disallow` lines, because a crawler that has its own group ignores the `*` group. CCBot (Common Crawl) is included on purpose: the owner wants to be found, and its archive feeds many search and answer tools. Remove a name from `AI_CRAWLERS` to turn one away. The sitemap lists only the three real pages, each with `lastmod` set to the build date (so every deploy says the pages changed; that is honest enough for a small site and can be narrowed later).
5. **Metadata** (`index.html`, `projects/index.html`, `projects/testpilot/index.html`). Every indexable page has a title and description that name the real specialities (AI applications, backend services, cloud delivery), `author`, `robots` with `max-image-preview:large`, `og:site_name`, `og:locale`, `og:image` width, height and alt, and `twitter:title`, `twitter:description`, `twitter:image`. The titles and descriptions live in `src/seo/pages.ts` as well, for the structured data, and a test fails if the HTML files disagree. `404.html` stays `noindex`. Each page has one `h1`.
6. **Fonts**. The two Latin font files every first screen uses are preloaded (found in the build's file list, since their names carry a hash), so they no longer wait for the stylesheet.

One thing to know: if Cloudflare's zone-level "Block AI bots" or "Managed robots.txt" setting is on, it can override or prepend to this `robots.txt`. Check Security, Bots in the dashboard if an AI crawler is turned away.

## Lighthouse (built output, `vite preview`, headless Chromium, no throttled network beyond Lighthouse's own)

Preview does not apply `public/_headers`, so cache audits are not representative. Mobile scores move a few points between runs (total blocking time ranges 20 to 130 ms on identical builds).

| | Performance | Accessibility | Best practices | SEO |
| --- | --- | --- | --- | --- |
| Before, mobile | 90, 92, 92 | 100 | 96 | 100 |
| After, mobile | 86, 90, 92 | 100 | 96 | 100 |
| Before, desktop | 100 | 100 | 96 | 100 |
| After, desktop | 100 | 100 | 96 | 100 |

First contentful paint on mobile went from 2.0 s to 1.7 s; layout shift went from 0.003 to 0. Best practices 96 is a console error from the API request failing under `vite preview` (there is no Worker there). The remaining findings are the logo images (about 110 KiB could be saved by recompressing `asu.png`, `manipal.png`, `insight.webp`) and the render-blocking stylesheet; neither was changed, to leave the design and the animations alone. The scores do not measure what this work is for: a crawler that runs no script now gets the whole page, which the scores cannot show.

## Owner steps

1. **Google Search Console.** Add `https://yashbakshi.com` as a Domain property. Google gives a TXT record; add it in the Cloudflare dashboard (DNS, Records, Add record, type TXT, name `@`). Verify.
2. Submit `https://yashbakshi.com/sitemap.xml` under Sitemaps.
3. Request indexing for the home page with URL Inspection (paste `https://yashbakshi.com/`, Test live URL, Request indexing). Do the case study too.
4. **Bing Webmaster Tools.** Add the site (you can import it from Search Console), submit the sitemap. Bing also feeds several AI search products.
5. **Check what Google sees.** URL Inspection, View tested page, Screenshot and HTML: the HTML should contain "Thryv" and the project names.
6. **Test the structured data.** Paste the page URL into the [Rich Results Test](https://search.google.com/test/rich-results) (it reports breadcrumbs) and the [Schema Markup Validator](https://validator.schema.org/) (it reports `Person`, `WebSite`, `TechArticle`). Person and WebSite do not produce a rich result; a clean parse is the goal.
7. **Test as an AI agent.** A plain fetch must show the content:
   ```
   curl -s -A "Mozilla/5.0 (compatible; test)" https://yashbakshi.com/ | grep -o "Thryv\|TestPilot\|Arizona State University" | sort | uniq -c
   curl -s https://yashbakshi.com/llms.txt
   curl -sI https://yashbakshi.com/llms-full.txt | grep -i content-type
   curl -s https://yashbakshi.com/robots.txt
   ```
8. After a deploy, check `/llms-full.txt` mentions anything you just changed on the site; it is rebuilt from the same content.

## Search phrases worth targeting

These are targets, not verified rankings. Check them in Search Console's Performance report after a few weeks.

- Name and role: "Yash Bakshi software engineer", "Yash Bakshi backend engineer", "Yash Bakshi AI engineer".
- Name and employer: "Yash Bakshi Thryv", "Yash Bakshi Tata Consultancy Services", "Yash Bakshi InfoCenter Insight".
- Name and university: "Yash Bakshi Arizona State University", "Yash Bakshi ASU", "Yash Bakshi Manipal University Jaipur".
- Name and place: "Yash Bakshi Arizona". The site does not state a city, so a city phrase cannot be supported until a location line is added to the page and the structured data.
- Name and technology: "Yash Bakshi Java Micronaut", "Yash Bakshi RAG", "Yash Bakshi AWS".
- Projects: "TestPilot unit test generator", "CityWatch AWS Ideathon".

## Not done

- No `sameAs` beyond LinkedIn and GitHub, no `worksFor` (the Thryv internship has ended), no `image` beyond the portrait: the site does not say more.
- No per-page `lastmod` history; every build stamps today's date.
- Recompressing the logo images and inlining the stylesheet.
