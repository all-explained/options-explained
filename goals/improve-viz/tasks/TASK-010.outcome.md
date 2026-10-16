## Acceptance

- [x] No file references `BreakevenFinder` or `clickthrough-breakevens-05`.
  Evidence: `grep -rn "BreakevenFinder\|clickthrough-breakevens-05" src scripts docs` printed nothing (grep exit 1, which is how grep reports "no match").
- [x] `npm test` and `npm run build` pass; `npm run screenshots 05` passes.
  Evidence: 28 test files, 420 tests passed; build "74 page(s) built", `astro check` clean; screenshots wrote all four `chapters_05-strategies-{dark,light}-{desktop,phone}.png` with no console, KaTeX or overflow errors.
- [x] The STYLE_GUIDE notation table has no row for a symbol the course no longer uses.
  Evidence: removed the `$A$, $s$ (Chapter 5 breakevens)` row. Chapter 05 no longer uses the anchor `A`. The separate `$s$` quoted-spread row stays.

## Summary

- **What:** deleted `src/components/plots/BreakevenFinder.tsx` and `scripts/clickthrough-breakevens-05.mjs`; removed the unused `BreakevenFinder` import from chapter 05; removed the anchor/slope notation row.
- **Kept:** `src/lib/pricing/breakevens.ts` and its tests. They are small and tested, and may be reused later.
- **CURRICULUM.md:** chapter 5 text ("breakevens per linear piece") still matches the chapter, so it is unchanged.
- **Deviation:** the spec's last Verify command is a `grep` that must find nothing, so it exits 1 on success. That is the passing result.
- **Verified revision:** this branch's HEAD at delivery.
- **Follow-ups:** none.
