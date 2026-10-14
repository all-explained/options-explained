# TASK-003 outcome — Put from calls and payoff parity

## Summary

- Implemented `src/components/plots/PutFromCalls.tsx` as a fixed one-kink preset of `PayoffFromCalls`: `f0=K`, `s0=-1`, kink `(K, slopeAfter=0)`; default `K=100`, inspected `S=90`.
- Added a strike slider (50–150), a 0–3-part running-sum slider, and a two-mode switch between constructing a put and expiry parity. The graph displays the put plus its cash, short-share and call terms; parity mode superimposes stock + put and call + cash.
- Extended the general `PayoffFromCalls` view narrowly with optional projected-share comparison, reconstruction-term overlays, controlled term count, external controls/readout and a stock-price callback. Existing defaults stay unchanged.
- Embedded the widget beside “A put, from calls” in `src/content/chapters/05-strategies.mdx` with `client:visible` and a Try this prompt. Existing prose and Chapters 8 and 27 references remain.
- Added `tests/putFromCalls.test.ts` for five K values, all S from 0 through 160, interpolation/strike points, partial sums, and independent parity via `strategyPayoff`. Added `scripts/clickthrough-put-05.mjs`, a Playwright control walkthrough configured for light/dark and desktop/phone that prints and asserts actual DOM readouts when run.
- Changes are isolated to this task; no other task specs, outcomes, decisions, goal.yaml, other chapters, or unrelated code were edited. PR #18 targets `main` and carries `goal:improve-viz`.
- **Exit B:** This execution environment has GitHub file/PR access, but no checked-out, executable Astro/Playwright browser workspace. No local npm commands, screenshots or browser clicks were performed. GitHub's CI was pending at the last inspection; CI results do not substitute for screenshots or the required clicked readouts.

## Acceptance

- [ ] **1. Widget renders in chapter 05; default K=100 reproduces the put at every plotted S.** Source evidence: chapter import plus `<PutFromCalls client:visible />`; the preset calls `decomposeSlopes(100,-1,[{strike:100,slopeAfter:0}])` and uses `evalDecomposition` against an independently evaluated put. `tests/putFromCalls.test.ts` asserts this for all plotted S and five strikes, but the tests and browser render **have not been executed here**.
- [ ] **2. K slider synchronizes curves/readouts; stock + put equals call + cash.** Source evidence: K controls `f0`, the preset kink and both `strategyPayoff` readouts, with a `comparisonShares=1` view in the general graph. The independent mathematical identity is `max(K-S,0) = K-S+max(S-K,0)`. Not browser-verified.
- [ ] **3. Screenshots pass light/dark × desktop/phone.** `npm run screenshots 05` **not run**. The existing script checks both themes, 1280×900 and 375×800, console/KaTeX errors, and horizontal overflow; results are unavailable.
- [ ] **4. Playwright clicks and actual readouts reported.** `scripts/clickthrough-put-05.mjs` was committed but **not executed**. It exercises the stepper (0–3), K slider, inspected stock price slider, parity toggle, and return to the construction view across two themes and both viewports. No actual DOM readouts are available to report. Expected mathematical outputs, **not browser observations**: at K=100/S=90, put +$10.00, cash +$100.00, short share −$90.00, call $0.00, full sum +$10.00, parity sides +$100.00 each; at K=110/S=90, put +$20.00 and both parity sides +$110.00; at K=110/S=160, put $0.00, call +$50.00 and both parity sides +$160.00.

## Blocker

**Goal-Blocked: Browser verification access unavailable; required Playwright click-through and screenshots not run.**

The available GitHub connector cannot start Astro, run local npm commands or control a Playwright browser. The required verification must be executed in an environment with an installed project checkout and Chromium. CI was pending at the last observation, another reason to keep PR #18 draft. No claims of successful verification are made.

## Human verification

Check out `goal/improve-viz/task-003`, install dependencies if needed, and run:

```sh
npm test
npm run build
npm run screenshots 05
node scripts/clickthrough-put-05.mjs
```

Paste the actual exit-0 output tails of the first three commands and the Playwright readouts into PR #18. Review the light/dark desktop and phone images (also check 360px if desired), confirm no console/KaTeX/overflow issues, and ensure CI checks pass or none are configured before marking ready for review. Never merge as part of this task.
