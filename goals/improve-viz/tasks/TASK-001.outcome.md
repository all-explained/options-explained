# TASK-001 outcome — Decomposition library: slopes to cash, shares and calls

## Summary

- Added `src/lib/pricing/decompose.ts` with `decomposeSlopes(f0, s0, kinks)` and `evalDecomposition(d, s)`. Cash is `f(0)`, shares are the initial slope, and the signed call quantity at each strike is the slope change to `slopeAfter`.
- Added `tests/decompose.test.ts` with independent piecewise-payoff references for the 90/100/110 butterfly, a 100-strike put, and a 90/110 bull call spread. The tests explicitly cover `S=0`, every strike, between strikes, and beyond the last strike; additional tests cover unsorted immutable input, no kinks, and input validation.
- Deviations: none to task scope. No UI, chapters, other tasks, decisions, or goal metadata changed. Finite nonnegative, distinct strikes are required to preserve the `cash = f(0)` interpretation.
- Implemented code and tests at revision `5d3abbe5ff553c7cefeacb537f53ba9f69419d7e`. GitHub Actions [run #38614416025](https://github.com/jesusvillota/options-explained/actions/runs/38614416025) passed on `b0f890dca5af503a4a852904e62934c38f07cd11` (identical implementation and test files). The final PR-head CI check must also be successful.
- **Verification provenance:** A GitHub Actions runner executed the commands below; ChatGPT did **not** execute them locally. The human must still run the Verify commands on the PR branch to independently reproduce the results.

## Acceptance

- [x] `npm test` succeeds, including new butterfly, put, and bull call spread tests. **Evidence (GitHub CI, not local):** run #38614416025 `Run npm test` step was `completed/success`; its log includes `tests/decompose.test.ts (6 tests)`, `Test Files 24 passed (24)`, and `Tests 389 passed (389)`.
- [x] `evalDecomposition` matches the piecewise payoff at `S=0`, every strike, and beyond the final strike for all three cases. **Evidence (GitHub CI, not local):** independent reference functions and all required evaluation points are asserted in the three strategy tests of `tests/decompose.test.ts`, and CI reports that test file successful. The implementation is the exact slope-change identity `f(S) = f0 + s0*S + Σ Δs_k max(S-K_k,0)`.
- [x] `npm run build` succeeds. **Evidence (GitHub CI, not local):** run #38614416025 `Run npm run build` step was `completed/success`. Log tail: `Result (219 files): 0 errors, 0 warnings, 0 hints`; `[build] 74 page(s) built in 19.83s`; `[build] Complete!`.

## Verify (human, on `goal/improve-viz/task-001`)

```sh
npm test
npm run build
```

Both commands should exit 0; capture their final output tails as independent local evidence. Do not merge this task PR.
