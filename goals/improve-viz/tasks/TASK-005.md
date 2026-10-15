---
id: TASK-005
title: 'Breakeven library: general per-piece rule for any piecewise-linear profit'
milestone: M-2
state: approved
depends_on: []
delivery: pr
route: {platform: chatgptweb}
---

## Why

SC-5. Chapter 05 says each breakeven is found by solving a linear equation on one piece, but gives no general expression, only the straddle result S* = K ± (C+P). The widget and the chapter text both need one tested rule for any piecewise-linear profit.

## Scope

Add to `src/lib/pricing/decompose.ts` (or a new `src/lib/pricing/breakevens.ts` if it reads better) a function `breakevenPieces(f0, s0, kinks, netCost)` that works on the same representation as `decomposeSlopes`. Profit is pi(S) = f(S) - netCost, where f is the payoff of the decomposition.

The rule, per piece. Pieces are [0, K_1], [K_1, K_2], ..., [K_m, infinity). Piece i starts at anchor A_i (A_0 = 0, A_i = K_i) with slope s_i (the slope after kink i; s_0 for the first piece). On the piece, pi(S) = pi(A_i) + s_i (S - A_i). So the candidate root is S*_i = A_i - pi(A_i) / s_i when s_i != 0. It is a breakeven only if it lies inside the piece: A_i <= S*_i <= A_{i+1} (no upper bound on the last piece).

Return, for every piece, a record with: `from`, `to` (Infinity for the last), `slope`, `profitAtFrom`, `candidate` (number or null when the slope is 0), `valid` (boolean), and a `status` string: 'root', 'outside piece', 'flat, never zero', or 'flat, zero everywhere'. Also export `breakevenPoints(...)` returning the sorted distinct valid roots (a root at a shared kink is reported once).

Edge cases to handle and test: a root exactly at a kink; a flat piece at profit 0 (report 'flat, zero everywhere', do not invent a root); profit that touches 0 without crossing; a payoff with no breakeven; the last piece with a nonzero slope.

Tests in `tests/breakevens.test.ts` with reference cases: (1) long straddle K = 100, C + P = 16: roots 84 and 116, as K -/+ (C+P); (2) bull call spread 100/115 with debit 5.98: one root 105.98; (3) long butterfly 90/100/110 with debit 2: roots 92 and 108; (4) a short straddle (two roots, profit positive between them); (5) an off-centre 3-kink case with hand-computed roots in a comment. Cross-check: for each case, `breakevenPoints` agrees with `breakevens(legs)` from `src/lib/pricing/strategy.ts` built from the equivalent legs (reuse the existing `makeLeg`/legs helpers; do not copy its algorithm), and profit evaluated at every returned root is 0 within 1e-9. No UI and no chapter edits.

## Acceptance

- `npm test` passes, including the five reference cases above.
- `breakevenPoints` returns 84 and 116 for the straddle, 105.98 for the bull call spread, and 92 and 108 for the butterfly.
- Profit at each returned root is 0 within 1e-9, and `breakevenPoints` agrees with `breakevens(legs)` from `strategy.ts` on every case.
- Flat pieces, a root at a kink and a no-breakeven payoff are covered by tests.
- `npm run build` passes.

## Verify

```sh
npm test
npm run build
```
