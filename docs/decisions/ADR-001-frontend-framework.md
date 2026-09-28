# ADR-001: Frontend Framework

Status: accepted; scaffold implemented. Date: 2026-09-28.

## Context

The portfolio is primarily an editorial publication with project exhibits and case studies. It also requires an interactive AI guide, optional voice, and a Bloub avatar currently provided as Vue code. Desktop and mobile are equally important. The static site and FastAPI backend can deploy independently within a $25 monthly target.

## Decision

Use Astro with TypeScript for pre-rendered publication pages and Vue islands for the assistant. Use structured content collections for project metadata and case studies, and custom CSS for the editorial visual system. Deploy static output to Firebase Hosting.

## Alternatives

Next.js supports pre-rendering and static export but adds a React framework boundary while the planned API is Python. Vue with Vite favors an application-wide client runtime. Nuxt is a credible alternative if extensive shared interactive state becomes central.

## Consequences

Content remains readable without assistant JavaScript; Bloub integrates through Vue. Interactive islands require deliberate state/navigation boundaries. Preserving the guide across routes needs client-routing or explicit restoration design. Astro does not by itself guarantee accessibility, SEO, or performance; verify those separately.

Revisit if most of the site becomes a continuously interactive application rather than a publication enhanced by a guide.

Reference: [Astro islands](https://docs.astro.build/en/concepts/islands/), [Next.js static exports](https://nextjs.org/docs/app/guides/static-exports).
