# TASK-009 outcome — Chapter 05: teach breakevens in place, plain words

## Acceptance

- [x] **1. Old derivation, recipe and finder `Try this` gone.** `grep -n "anchor\|K_{\text{next}}\|S_T^{\*}" src/content/chapters/05-strategies.mdx` prints nothing (exit 1).
- [x] **2. Each strategy that shows a breakeven says where it starts to pay, right under its picture.** Hook straddle: "below \$83.98 or above \$116.02 … a move of about \$16 either way". Bull call spread: "must end above \$105.98 before the spread pays back its \$5.98". Volatility picture: butterfly \$91.84–\$108.16, strangle \$81.65 / \$118.35. Collar picture: \$96.27, protective put \$103.71. Every number comes from `breakevens(PRESETS[...])` and matches the StrategyBuilder readout in the screenshots.
- [x] **3. Formalisation `Breakevens` paragraph ≤120 words, one displayed equation, no new symbol.** 88 words, one `$$` block, no new symbol. The butterfly is the only worked case (\$92 and \$108, cost rounded to \$2). The straddle result $K \pm (C+P)$ is a separate two-line paragraph after it, stated once.
- [x] **4. `BreakevenSlider` once, after the bull call spread, with a `Try this` line.** `grep -c "<BreakevenSlider"` returns 1. The line follows the spread paragraph.
- [x] **5. `npm run screenshots 05` passes in both themes, desktop and phone.** Four ✓, exit 0. I cropped and viewed every changed paragraph in all four combinations; see the PR body.

## Summary

- **What.** Only `src/content/chapters/05-strategies.mdx` changed (plus this file). Deleted the anchor/slope derivation, the four-step recipe, the straddle and bull-spread worked cases and the old finder `Try this`. Added one plain-words note under each picture that shows a breakeven, moved `BreakevenSlider` after the bull call spread, added the short Formalisation `Breakevens` paragraph and one Recap bullet. The Check-yourself questions stay correct and are unchanged.
- **Deviation.** The butterfly shows \$91.84 / \$108.16 under its picture (the true Black–Scholes cost, \$1.84) but \$92 / \$108 in Formalisation (cost rounded to \$2, as the spec asks and as the widget shows). The Formalisation says "rounding its cost to \$2". Also dropped the straddle range from the list bullet, since the hook note now states it.
- **Fix found by viewing.** My first equation (`profit at the start + …`) was cut off at 360px. I shortened it to `profit at start + …`, and it fits.
- **Left alone.** The unused `BreakevenFinder` import stays for TASK-010. No GitHub Actions were used.
- **Verified revision.** `npm test` 28 files / 420 tests pass; `npm run build` 74 pages, 0 errors; `npm run screenshots 05` exit 0; `node scripts/clickthrough-breakeven-slider-05.mjs` prints PASS.
- **Follow-up.** TASK-010 can remove the `BreakevenFinder` import.
