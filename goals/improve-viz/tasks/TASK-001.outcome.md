# TASK-001 outcome — Decomposition library: slopes to cash, shares and calls

## Summary

- Added `src/lib/pricing/decompose.ts` with `decomposeSlopes(f0, s0, kinks)` and `evalDecomposition(d, s)`. Cash is `f(0)`, shares are the initial slope, and the signed call quantity at each strike is the change from the previous slope to `slopeAfter`.
- Added `tests/decompose.test.ts` with independent piecewise-payoff references for the 90/100/110 butterfly, a 100-strike put, and a 90/110 bull call spread. Tests explicitly include `S=0`, all kink strikes, intermediate spots, and spots beyond the last strike. Also tested in source: unsorted non-mutating input, zero kinks, and invalid kink/value guards.
- Deviations: none to task scope. No UI, chapters, other tasks, decisions, or goal metadata changed. The function rejects non-finite or negative strikes and duplicate strike locations to keep the initial cash interpretation unambiguous.
- Implementation revision before this outcome: `5d3abbe5ff553c7cefeacb537f53ba9f69419d7e`.
- **Verification limitation:** This ChatGPT GitHub-connector session did not execute local shell commands. The human must run the Verify commands below. The pull-request workflow runs them independently, and its final conclusion must be inspected before this task is considered delivered.

## Acceptance

- [ ] `npm test` exits 0, including the butterfly, put, and bull call spread tests. **Evidence:** the three reference cases and boundary assertions are committed in `tests/decompose.test.ts`; no local test exit code has been observed. CI run [#38614269081](https://github.com/jesusvillota/options-explained/actions/runs/38614269081) was `in_progress` at the time of writing.
- [ ] `evalDecomposition` matches the piecewise payoff at `S=0`, all strikes, and beyond the final strike for all three examples. **Evidence:** direct algebraic construction `f(S)=f0+s0*S+Σ Δs_k max(S-K_k,0)`, with independent reference functions and explicit required points in `tests/decompose.test.ts`; executable verification pending.
- [ ] `npm run build` exits 0. **Evidence:** `package.json` defines `build` as `astro check && astro build`, and the PR workflow invokes `npm run build`; no local build exit code has been observed; CI conclusion pending.

## Verify (human, on `goal/improve-viz/task-001`)

```sh
npm test
npm run build
```

Both commands must exit 0, with their final output tails captured. Also ensure GitHub PR checks are successful before marking the PR ready for review. Do not merge this task PR.
