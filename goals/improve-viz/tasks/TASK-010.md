---
id: TASK-010
title: Remove the old breakeven finder and its notation
milestone: M-3
state: approved
depends_on: [TASK-009]
delivery: pr
---

## Why

SC-7. After TASK-008 and TASK-009 nothing uses `BreakevenFinder` or the anchor/slope notation. Dead code and a stale notation row would confuse the next reader.

## Scope

Remove `src/components/plots/BreakevenFinder.tsx`, its import in chapter 05 (if still present), and `scripts/clickthrough-breakevens-05.mjs`. Remove the anchor/slope notation rows that TASK-006 added to `docs/STYLE_GUIDE.md` if the chapter no longer uses them. Keep `src/lib/pricing/breakevens.ts` and its tests (they are tested, small, and may be reused later); say so in the PR. Check `docs/CURRICULUM.md` chapter 5 text still matches the chapter ("breakevens per linear piece") and adjust it only if it is wrong. Change nothing else.

## Acceptance

- No file references `BreakevenFinder` or `clickthrough-breakevens-05`: `grep -rn "BreakevenFinder\|clickthrough-breakevens-05" src scripts docs` returns nothing.
- `npm test` and `npm run build` pass; `npm run screenshots 05` passes.
- The STYLE_GUIDE notation table has no row for a symbol the course no longer uses.

## Verify

```sh
npm test
npm run build
npm run screenshots 05
grep -rn "BreakevenFinder\|clickthrough-breakevens-05" src scripts docs
```
