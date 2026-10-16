# TASK-008 outcome — Drag-the-stock breakeven widget

## Acceptance

- [x] **1. `BreakevenSlider` renders in chapter 05, bull call spread first.** `05-strategies.mdx` now embeds `<BreakevenSlider client:visible />` in place of `<BreakevenFinder />`. The click-through asserts the checked radio is "Bull call spread" on load (1280px and 360px). Built page rendered, no console or KaTeX errors.
- [x] **2. Breakevens \$105.98; \$84 and \$116; \$92 and \$108, equal to `breakevens(legs)` to the cent.** `tests/breakevenExamples.test.ts` (3 cases) checks net cost 5.98 / 16 / 2 and `breakevens(legs)` to 10 decimals. The click-through reads the plot labels `$105.98`, `$84`/`$116`, `$92`/`$108` from the rendered SVG.
- [x] **3. Drag changes readout and sign colour; "That's the breakeven" within \$0.50 of a crossing.** Real mouse drags: S_T=100 → `lose $5.98` (red `.bad`); 115 → `make $9.02` (green `.good`); 106 → `make $0.02. That's the breakeven`; straddle 84 and 116, butterfly 92 and 108 all show `That's the breakeven`; away from a crossing the second line reads `Drag the blue point along the line.`
- [x] **4. One `Segmented`, one toggle, one drag; no table; 360px clean.** Click-through counts: 1 `.ctl-segmented`, 1 `.ctl-button`, 1 `.mafs-movable-point`, 0 `table, input, select`. At 360px no horizontal overflow, every control, readout and plot inside the card (asserted), and the click-through asserts the two breakeven labels of each strategy do not overlap. I viewed all 12 widget crops (3 strategies × dark/light × desktop/phone). The first pass showed `$92` and `$108` colliding on the phone, and `$105.98` crossed by the drop line; labels now go outward on the side the line isn't, and the second pass was clean.
- [x] **5. `npm run screenshots 05` passes in both themes, desktop and phone; click-through run and readouts reported.** `npm run screenshots 05` exit 0 (four ✓). `node scripts/clickthrough-breakeven-slider-05.mjs` prints `PASS`; readouts are in the PR body.

## Summary

- **What.** `src/components/plots/BreakevenSlider.tsx` (WidgetFrame + PlotFrame + Label; green profit above zero, red below, split at each kink and crossing; draggable point snapped to \$0.50; `Segmented` of three strategies; `Show/Hide the breakevens` button; two-line readout; caption `Profit turns from loss to gain at the breakeven.`). Chapter 05 embed swapped; old import and `BreakevenFinder` left for TASK-010. No other chapter text edited.
- **Maths in `src/lib`.** New `src/lib/pricing/breakevenExamples.ts` builds the three strategies from `PRESETS`/`makeLeg`, nudging the first leg's premium so the net cost is exactly the chapter's \$5.98 / \$16 / \$2 (Black-Scholes gives 5.984 / 16.024 / 1.838, which would show \$83.98 and \$91.84). The widget uses `strategyProfit`, `breakevens`, `kinks`. `breakevenPieces` is not used.
- **Deviation / choice.** The readout names the breakeven even while "Show the breakevens" is off, so the student can discover it by dragging. The marks and their labels appear only with the toggle on. The Y axis range is fixed per strategy.
- **Environment.** Playwright's Chromium download timed out here; I symlinked the cached 1248 builds as `chromium-1243` / `chromium_headless_shell-1243` in `~/Library/Caches/ms-playwright` (outside the repo). No GitHub Actions were used.
- **Verified revision.** `npm test` 28 files / 420 tests pass; `npm run build` completes (74 pages); `npm run screenshots 05` exit 0.
- **Follow-up.** The "Try this" paragraph under the widget still talks about stepping through pieces and cost. TASK-009 rewrites it.
