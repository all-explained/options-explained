# TASK-007 outcome — Interactive per-piece breakeven finder

## Summary

- Created `src/components/plots/BreakevenFinder.tsx`: expiry-profit curve, zero line, alternating shaded pieces, valid labeled roots and hollow rejected candidates on the selected piece's extended line. Uses the existing `WidgetFrame`, `PlotFrame`, `Label`, `Slider`, `Select`, and `Button` components and CSS-variable colours. No pricing formula or root filtering is reimplemented: the component calls TASK-005 `breakevenPieces` and `breakevenPoints`; the curve uses `evalPiecewiseSlopes` in `src/lib`.
- Added it to `src/content/chapters/05-strategies.mdx` directly after TASK-006's straddle and bull-spread breakeven derivation, before "Any payoff from calls", using `client:visible`; included one exploratory prompt.
- Added a **new** `scripts/clickthrough-breakevens-05.mjs` for TASK-007 rather than overwriting TASK-004's existing `scripts/clickthrough-05.mjs`. The script is designed to exercise the preset picker, solve-step, strike, slope, cost, custom fourth kink, table and root readouts, and report their actual contents.
- Controls preserve a straddle's geometry when its strike moves (the left payoff at zero follows K); changes to other shape parameters switch to custom. The net-cost range includes cases with no isolated crossings; flat-zero pieces are disclosed separately.
- No task specifications, other tasks, accepted decisions, `goal.yaml`, other chapters, or pricing-library files were edited. No material product decision is needed.
- **Source inspected:** GitHub connector source files and PR diff on branch `goal/improve-viz/task-007`.
- **CI provenance:** GitHub Actions [run #38715848833](https://github.com/jesusvillota/options-explained/actions/runs/38715848833) on implementation revision `c128be9fd9ca30206f405ffa187c432c8324299e` reported `npm test` and `npm run build` completed/success. Runner log: 27 test files, 417 tests passed; Astro check reported 0 errors, 0 warnings; 74 pages built. This is **GitHub's runner**, not a local test or screenshot run by ChatGPT. The outcome commit will advance the PR head; its final checks require separate confirmation.

## Acceptance

- [ ] **1. Widget after the derivation with long-straddle breakevens K ± (C + P).** **Source implemented**, not visually verified: chapter import/embed occurs before "Any payoff from calls"; default shape is `f0=100, s0=-1, K=100, s_after=1, cost=16`. The `breakevenPoints` implementation's pre-existing reference test expects 84 and 116. The displayed roots and straddle check use those source values. Pending hydration/screenshots to confirm it actually renders.
- [ ] **2. Preset, strike, slope and net cost update chart, piece table and roots.** **Source implemented**, no browser interaction run: shared React state calls `breakevenPieces` and `breakevenPoints` every render, with one data path feeding the table, diagram and readout. Default spread reference 105.98 and butterfly 92/108 are asserted in the existing library tests. Changes require a real click-through to establish rendered behaviour.
- [ ] **3. Step arithmetic, accepted/rejected candidates and no-breakeven state.** **Source implemented**, no browser interaction run: piece data supplies `A`, `profit(A)`, `s`, `A-profit(A)/s`, inclusive validity and flat statuses. Expected no-crossing demonstration: long butterfly `cost=20` (max payoff 10) should display "no breakeven" and a rejected candidate. No actual runtime readout was captured.
- [ ] **4. `npm run screenshots 05` in dark/light × desktop/phone.** **Blocked**: cannot execute Playwright Chromium or inspect the four screenshots through the GitHub connector; existing CI does not run this screenshot script. No claimed screenshot result, console/KaTeX/overflow check, visual appearance or exit code.
- [ ] **5. Run Playwright click-through and report actual readouts.** **Blocked**: `scripts/clickthrough-breakevens-05.mjs` is committed with expected readout assertions, but has not been executed. **Expected from mathematical reference cases, NOT observed browser output:** straddle 84/116; straddle K=110 → 94/126; bull 105.98; K1=95 → 100.98; middle slope=0.5 → 106.96; butterfly 92/108; butterfly cost 20 → no breakeven; adding a fourth kink → five table rows. These are predictions only, not an actual click-through report.

## Blocker

Browser access to the **PR branch's built page**, an executable Playwright/Chromium environment, and the resulting four rendered chapter-05 screenshots is unavailable through this GitHub-only connector session. The acceptance conditions specifically require the script to be run, its actual readouts reported, the screenshots visually inspected, and passing final-head checks before delivery. No one has verified those in this session; the PR must remain **draft** and **not be merged**. This is an access/verification blocker, not a request to change task scope.

## Verify (human on the PR branch)

```sh
git switch goal/improve-viz/task-007
npm ci
npm test
npm run build
npm run screenshots 05
node scripts/clickthrough-breakevens-05.mjs
```

Inspect `screenshots/chapters_05-strategies-{dark,light}-{desktop,phone}.png` (all four) for widget visibility after the derivation, plot labels, alternating bands, candidate symbols, accepted roots, text/table clipping, KaTeX failures, horizontal overflow and 360–375px usability. Paste **actual** click-through readout lines plus the command exit statuses and log tails into the PR; inspect final-head GitHub CI and mark ready only if all required checks and visual/browser verification pass.
