# TASK-002 outcome — Butterfly widget: drag slope changes, see the calls

## Summary

- Added `src/components/plots/SlopeToCalls.tsx` as a **preset of the existing general `PayoffFromCalls` widget**. It fixes `f0=0` and `s0=0`, starts at strikes 90/100/110 with slopes after each strike `+1/-1/0`, leaves slope and strike edits available, and locks cash, shares, and kink count.
- Added optional `showSlopeChangeExplanation` to the reusable general widget. It uses quantities already returned by `decomposeSlopes` for live slope jumps and human-readable buy/sell call instructions; no pricing formula or duplicate plot was added.
- Embedded the preset immediately after the butterfly prose in chapter 05, preserving the original prose and put-call-parity example.
- Added `scripts/clickthrough-butterfly-05.mjs` to drive and assert a real Chromium interaction and print readouts, with independent evaluation of the displayed position table. **The script was not executed in this session.**
- Implementation revision preceding this outcome: `5a234723704a1db186b06b58df6a4201225a4eba`. No task specifications, other outcomes, decisions, `goal.yaml`, or unrelated chapters were changed.
- Deviation: browser verification cannot be performed through the connected GitHub file/PR API, so this deliverable remains **blocked and in a draft PR**, not falsely marked ready.

## Acceptance

- [ ] **1. Rendered in chapter 05; default buy 1×90, sell 2×100, buy 1×110.** Source evidence: `05-strategies.mdx` imports/hydrates `SlopeToCalls` with `client:visible`; its preset is `f0=0, s0=0, [(90,+1),(100,-1),(110,0)]`; the shared `decomposeSlopes` gives signed call positions `+1,-2,+1`. Source-level evidence only; actual browser rendering was not inspected.
- [ ] **2. Changing a slope updates the graph, table, and exact reconstruction.** Source evidence: per-kink `Slider` updates `bends`, then `decomposeSlopes`, the independent `evalPiecewiseSlopes` line, the `evalDecompositionTerms` reconstructed line, and the table/readout all recompute. The new Playwright script asserts live updates. A browser click-through has not been executed.
- [ ] **3. Screenshots in both themes at desktop and phone, without console/KaTeX/overflow errors.** `npm run screenshots 05` was **not run**. The repository's existing screenshot script provides those viewport/theme/error checks; there are no observed screenshot results from this session.
- [ ] **4. Run a Playwright click-through and report actual readouts.** `node scripts/clickthrough-butterfly-05.mjs` was added but **not run**, so actual browser readouts cannot be reported. Predicted outputs from the payoff maths (NOT observed browser output) for `S_T=105`: default `+$5.00` with `+1,-2,+1` calls; changing slope after kink 2 to `-0.75` gives `+$6.25` with `+1,-1.75,+0.75`; moving strike 1 to 91 gives `+$5.25`; changing slope after kink 1 to `+1.25` gives `+$7.50`.

## Blocker

**Exit B — browser verification access unavailable.** The GitHub connector supports reading and changing repository files, commits, PRs and statuses but provides no executable Playwright/browser workspace. Required screenshot checks and actual click-through readouts therefore cannot be obtained here. The PR is deliberately kept draft until the actual browser evidence is available. CI test/build results, if present, do not substitute for screenshot and click-through verification.

## Human verification

On branch `goal/improve-viz/task-002`, run and capture the real exit-0 output tails:

```sh
npm test
npm run build
npm run screenshots 05
```

Then run this Chromium control walkthrough and paste its **actual** printed readouts in the PR:

```sh
node scripts/clickthrough-butterfly-05.mjs
```

Check light and dark themes at desktop and phone sizes. Do not mark the PR ready while any required check is pending or failing, or while browser evidence is missing.
