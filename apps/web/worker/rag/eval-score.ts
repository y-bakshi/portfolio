import type { Answerer } from '../lib/answerer';
import { percentile } from '../lib/stats';
import { registryIds } from './chunks';
import { judge } from './eval-judge';
import {
  add,
  cited,
  correct,
  documentFrequency,
  faithful,
  gapCorrect,
  hasPointer,
  partialNamed,
  precision,
  ratio,
  recall,
  refused,
  relevant,
  share,
  type Sample,
} from './eval-metrics';
import { claimSentences } from './eval-text';
import type { EvalDeps, EvalQuestion, EvalReport, Share } from './eval-types';
import { retrieve } from './retrieve';

const zero = (): Share => share(0, 0);
const tally = (to: Share, ok: boolean | null | undefined) =>
  ok == null ? to : add(to, share(+ok, 1));

export async function score(
  questions: EvalQuestion[],
  answerer: Answerer,
  deps: Required<Pick<EvalDeps, 'chunks'>> & EvalDeps,
  k: number,
): Promise<EvalReport> {
  const byId = new Map(deps.chunks.map((c) => [c.id, c]));
  const freq = documentFrequency(deps.chunks);
  const now = deps.now ?? (() => performance.now());
  const failures: string[] = [];
  const fail = (q: EvalQuestion, why: string) => failures.push(`${q.id}: ${why}`);
  const t = Object.fromEntries(
    'hit hit4 rec prec valid acc exp corr faith rel gap leak part refuse refUns ansSup'
      .split(' ')
      .map((n) => [n, zero()]),
  ) as Record<string, Share>;
  const judged = { claims: zero(), rel: zero(), part: zero(), n: 0 };
  const latencies: number[] = [];
  let fallbacks = 0;
  let cost = 0,
    tokensIn = 0,
    tokensOut = 0;

  for (const q of questions) {
    const started = now();
    const result = await answerer.answer(q.question, []);
    latencies.push(Math.max(0, now() - started));
    cost += result.meta?.costMicroUsd ?? 0;
    tokensIn += result.meta?.inputTokens ?? 0;
    tokensOut += result.meta?.outputTokens ?? 0;
    const keyword = result.meta?.model === 'keyword';
    if (keyword) {
      fallbacks++;
      fail(q, 'the keyword fallback answered');
    }

    const found = await retrieve(
      q.question,
      { embedder: deps.embedder, index: deps.index, chunks: byId },
      k,
    );
    const sources = found.hits.map((h) => h.chunk.sourceId);
    const notes = (result.meta?.retrievalIds ?? []).flatMap((id) => byId.get(id) ?? []);
    const sample: Sample = { q, result, notes, sources };
    const given = new Set(notes.map((c) => c.sourceId));

    // the contact card on a pointer is the way forward, not a claim, so it was never retrieved
    const valid = result.cites.every(
      (c) => registryIds.has(c) && (given.has(c) || (c === 'contact' && hasPointer(result))),
    );
    t.valid = tally(t.valid, valid);
    if (!valid) fail(q, `a citation was not a retrieved card (${result.cites.join(', ')})`);

    const didRefuse = refused(result);
    const partial = q.category === 'partial';
    if (!partial) {
      t.refuse = tally(t.refuse, didRefuse === Boolean(q.unsupported));
      if (didRefuse !== Boolean(q.unsupported))
        fail(q, q.unsupported ? 'should have refused' : 'refused wrongly');
    }
    const gap = gapCorrect(q, result);
    t.gap = tally(t.gap, gap);
    if (gap === false)
      fail(q, 'the pointer to Yash was wrong (missing, or given when it should not be)');
    if (q.category === 'offtopic' || q.category === 'injection')
      t.leak = tally(t.leak, result.cites.includes('contact'));
    t.part = tally(t.part, partialNamed(q, result));

    const ok = correct(q, result.text);
    t.corr = tally(t.corr, ok);
    if (ok === false) fail(q, 'the answer is missing a required text or has a forbidden one');

    if (q.unsupported) {
      t.refUns = tally(t.refUns, didRefuse);
    } else {
      if (!partial) t.ansSup = tally(t.ansSup, !didRefuse);
      const r = recall(q, sources);
      if (r) t.rec = add(t.rec, share(r.pass / r.of, 1));
      const p = precision(q, sources);
      if (p) t.prec = add(t.prec, share(p.pass / p.of, 1));
      const want = new Set(q.expect ?? []);
      t.hit = tally(
        t.hit,
        sources.some((s) => want.has(s)),
      );
      t.hit4 = tally(
        t.hit4,
        sources.slice(0, 4).some((s) => want.has(s)),
      );
      t.exp = tally(
        t.exp,
        result.cites.some((c) => want.has(c)),
      );
    }

    if (keyword) continue; // no notes were given, so these would only repeat the failure
    const f = faithful(sample);
    t.faith = add(t.faith, f);
    if (f.pass < f.of) fail(q, `${f.of - f.pass} claim sentence(s) not backed by the notes`);
    t.acc = add(t.acc, cited(sample, freq));
    t.rel = tally(t.rel, relevant(sample));

    if (deps.judge && claimSentences(result.text).length) {
      const j = await judge(deps.judge, q.question, result.text, notes);
      if (j) {
        judged.n++;
        judged.claims = add(judged.claims, share(j.supported, j.claims));
        judged.rel = tally(judged.rel, j.answersQuestion);
        if (partial) judged.part = tally(judged.part, j.namesMissing);
      }
    }
  }

  const sorted = [...latencies].sort((a, b) => a - b);
  const n = questions.length;
  return {
    questions: n,
    hitRateAtK: ratio(t.hit),
    hitRateAt4: ratio(t.hit4),
    // recall and precision were added as one share per question, so this is their mean
    contextRecall: ratio(t.rec),
    contextPrecision: ratio(t.prec),
    citationValidity: ratio(t.valid),
    citationAccuracy: ratio(t.acc),
    citesExpected: ratio(t.exp),
    answerCorrectness: ratio(t.corr),
    faithfulness: ratio(t.faith),
    answerRelevancy: ratio(t.rel),
    gapHandling: ratio(t.gap),
    falsePointers: ratio(t.leak),
    partialNamed: ratio(t.part),
    refusalCorrectness: ratio(t.refuse),
    refusedWhenUnsupported: ratio(t.refUns),
    answeredWhenSupported: ratio(t.ansSup),
    fallbacks,
    latencyMs: {
      p50: percentile(sorted, 50) ?? 0,
      p95: percentile(sorted, 95) ?? 0,
      total: latencies.reduce((a, b) => a + b, 0),
    },
    cost: {
      totalMicroUsd: cost,
      perQuestionMicroUsd: n ? cost / n : 0,
      inputTokens: tokensIn,
      outputTokens: tokensOut,
    },
    ...(deps.judge && {
      judge: {
        faithfulness: ratio(judged.claims),
        relevancy: ratio(judged.rel),
        partialNamed: judged.part.of ? ratio(judged.part) : null,
        judged: judged.n,
      },
    }),
    providerCalls: deps.calls?.() ?? 0,
    failures,
  };
}
