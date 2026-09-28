# Performance Testing

All numbers are proposed targets; baseline measurements are pending.

## Publication

Test the homepage, a diagram-heavy case study, and project archive using a production build. Run at least three comparable Lighthouse sessions with documented browser version, network/CPU settings, cache state, and viewport. Report median and spread. Measure both narrow touch layouts and desktop layouts.

Target compressed initial transfer ≤500 KB and initial JS ≤100 KB excluding deferred assistant/audio. Target Core Web Vitals p75 LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1 once field data is available. Do not load high-resolution portraits, textures, voice libraries, or below-the-fold diagrams prematurely.

## API Load Scenarios

Use k6 when the backend exists. Default to stub providers and isolated quota data. Proposed scenarios:

1. Warm baseline: 5 concurrent visitors for 5 minutes; measure chat p50/p95/p99 and errors.
2. Short burst: 20 concurrent visitors for 30 seconds; verify queue/error behavior and bounded spend.
3. Quota contention: simultaneous calls from one session/network at the remaining limit.
4. Cold start: first request after scale-to-zero, reported separately from warm latency.
5. Dependency failure: timeouts, Firestore failure, and model errors; verify fallback and reservations.

Warm response target is p95 ≤8 s; cold-start results determine UI and hosting adjustments. Measure full response rather than claiming first-token latency for the proposed JSON API.

## Cost Experiment

Use a small explicitly capped live-provider sample only after mock testing. Measure input/output tokens, speech characters/minutes, retrieval overhead, and maximum per-answer cost. Derive daily/global allowances from this evidence and the $25 monthly target. Include egress, builds, registry storage, logs, cleanup, and attestation charges in the estimate.

Save results with date, Git SHA, scenario, provider/model, configuration, and test limitations. Load tests must not target production or paid providers by default.
