# TASK-005 outcome — General breakevens for piecewise-linear profits

## Summary

- Added `src/lib/pricing/breakevens.ts` with `breakevenPieces(f0, s0, kinks, netCost)` and `breakevenPoints(...)`. The implementation walks the sorted kinks and solves `S = from - profitAtFrom / slope` only within the inclusive bounds of each nonflat segment. It reports the required piece metadata/status, ignores continuum roots on identically zero flat segments, and deduplicates isolated roots at a shared kink.
- Added `tests/breakevens.test.ts` with five independent reference strategies (long and short straddles, 100/115 bull call spread, 90/100/110 butterfly, and off-centre 80/95/130 three-kink profile with stock). Equivalent `makeLeg`-based `StrategyLeg` positions cross-check against the existing `breakevens(legs)` and `strategyProfit` rather than reusing the strategy algorithm.
- Additional tests cover tangent roots at a kink without sign change, zero/nonzero flat pieces, a no-breakeven constant-positive payoff, unsorted/immutable inputs, a zero strike, invalid inputs, and a candidate infinitesimally beyond an interval endpoint.
- No UI, chapters, specs, other tasks, decisions, or `goal.yaml` were changed. No material decision required.
- **Verified implementation and test revision:** `e922071ec23fab7a7a80587745c9e9f8b4da0584`. GitHub Actions [run #38712956598](https://github.com/jesusvillota/options-explained/actions/runs/38712956598) completed successfully for this SHA. This outcome file is a subsequent documentation-only commit; the final PR-head CI should be checked as well.
- **Verification provenance:** GitHub Actions executed the commands below on its runner. ChatGPT did not execute them locally. Reproduce independently on the PR branch.

## Acceptance

- [x] **1. `npm test`, including all five reference cases.** Evidence: GitHub Actions run #38712956598, `Run npm test` step `completed/success`; the log reports `tests/breakevens.test.ts (12 tests)`, `Test Files 27 passed (27)`, `Tests 417 passed (417)`.
- [x] **2. Exact reference breakevens.** Evidence: reference assertions in `tests/breakevens.test.ts` require straddle `[84, 116]`, bull call spread `[105.98]`, and butterfly `[92, 108]`; the full test file passed in the above CI run.
- [x] **3. Zero profit at every root and independent agreement with `strategy.ts`.** Evidence: all five reference cases compare each result to `breakevens(legs)` and check absolute piecewise profit and `strategyProfit(legs, root)` are at most `1e-9`; these tests passed in CI.
- [x] **4. Flat segments, roots at kinks, and no-breakeven payoffs.** Evidence: tests exercise a zero plateau, a flat nonzero payoff, a tangent kink root appearing once, an unbounded flat zero tail, out-of-segment candidates (including a near-kink floating-point case), and constant-positive payoff with no roots. All passed in CI.
- [x] **5. `npm run build`.** Evidence: GitHub Actions run #38712956598, `Run npm run build` step `completed/success`; the log reports `Result (229 files): 0 errors, 0 warnings, 1 hint`, `74 page(s) built in 20.09s`, `[build] Complete!`.

## Verify (human, on `goal/improve-viz/task-005`)

```sh
npm test
npm run build
```

Runner log tail (GitHub CI, not a local ChatGPT execution):

```text
✓ tests/breakevens.test.ts (12 tests)
Test Files  27 passed (27)
Tests       417 passed (417)

Result (229 files):
- 0 errors
- 0 warnings
- 1 hint
[build] 74 page(s) built in 20.09s
[build] Complete!
```

The human must independently run the two Verify commands if local proof is required. Do not merge this task PR.
