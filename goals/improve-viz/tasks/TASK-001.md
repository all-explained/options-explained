---
id: TASK-001
title: 'Decomposition library: slopes to cash, shares and calls'
milestone: M-1
state: approved
depends_on: []
delivery: pr
---

## Why

SC-3. Both widgets need one shared, tested formula: f(S) = f(0) + s0*S + sum (s_k - s_{k-1})(S-K_k)+.

## Scope

Add `decomposeSlopes(f0, s0, kinks: {strike, slopeAfter}[])` to a new `src/lib/pricing/decompose.ts`, returning cash, shares and call quantities per strike, plus `evalDecomposition(d, s)`. Add `decompose.test.ts` with reference cases: butterfly (+1,-2,+1 at 90/100/110), put (cash K, -1 share, +1 call at K), bull call spread. No UI, no chapter edits.

## Acceptance

- `npm test` passes, including the new tests for butterfly, put and bull call spread.
- `evalDecomposition` equals the piecewise payoff at S = 0, every strike, and beyond the last strike for each case.
- `npm run build` passes.

## Verify

```sh
npm test
npm run build
```
