---
id: TASK-008
title: Drag-the-stock breakeven widget (replaces BreakevenFinder)
milestone: M-3
state: approved
depends_on: []
delivery: pr
---

## Why

SC-7. The owner found the current `BreakevenFinder` unclear: it is a control panel (preset menu, five sliders, add/remove kink, a solve button, a five-column table that is cut off on a phone). It teaches an algorithm. A student needs one idea: *the breakeven is the stock price where the profit line crosses zero.* The site's widgets are small, one idea each (see `PayoffTracer`, `PayoffDiagram`).

## Scope

Add `src/components/plots/BreakevenSlider.tsx` on `WidgetFrame` + `PlotFrame` + `Label`. Delete nothing yet (TASK-010 removes the old finder). Maths stays in `src/lib`: use `strategyProfit`, `breakevens` and `PRESETS`/`makeLeg` from `src/lib/pricing/strategy.ts`. Do not use `breakevenPieces` here.

Behaviour (keep it this small):
- Plot the **profit** line of one strategy against $S_T$, with a clear zero line. Colour the part above zero green and the part below zero red (CSS tokens, not hex).
- One draggable stock-price point (reuse the drag/slider interaction of `PayoffDiagram`; read it first). A readout, at most two lines, in plain words: `If the stock ends at $X, you make $Y` / `lose $Y`, coloured by sign.
- A `Segmented` control with three strategies: bull call spread, long straddle, long butterfly. Use the same legs and prices as the chapter's examples (bull call spread \$5.98 net; straddle \$16; butterfly 90/100/110 costing \$2).
- A `Button` or toggle `Show the breakevens`. When on, mark each zero crossing with a point and a label with its value (\$105.98; \$84 and \$116; \$92 and \$108). While the student drags, the readout names the crossing when the point passes it (`That's the breakeven`).
- No cost slider, no kink sliders, no table, no step-through, no equations in the widget. Short caption: `Profit turns from loss to gain at the breakeven.`

Swap the embed: in `src/content/chapters/05-strategies.mdx` replace the single line `<BreakevenFinder client:visible />` with `<BreakevenSlider client:visible />` (import it, keep the old import until TASK-010). Do not edit any other chapter text; TASK-009 rewrites the text and moves the embed.

Follow `CLAUDE.md` and `docs/STYLE_GUIDE.md`: colour tokens, `client:visible`, 360px width, `prefers-reduced-motion`, escaped dollars. Add a Playwright click-through `scripts/clickthrough-breakeven-slider-05.mjs` modelled on `scripts/clickthrough-breakevens-05.mjs` (keep the `/opt/pw-browsers` fallback as is).

## Acceptance

- `BreakevenSlider` renders in chapter 05, with the bull call spread selected first.
- The three strategies show the breakevens \$105.98; \$84 and \$116; \$92 and \$108, equal to `breakevens(legs)` to the cent.
- Dragging the point changes the readout and its sign colour; the readout switches to `That's the breakeven` within \$0.50 of a crossing.
- Controls: one `Segmented`, one toggle, one drag. No other controls. No table. At 360px nothing is cut off or overlapping.
- `npm run screenshots 05` passes in both themes, desktop and phone; the click-through script runs and its readouts are reported.

## Verify

```sh
npm test
npm run build
npm run screenshots 05
```
Then click through the controls with Playwright and report the readouts in the PR. Look at the screenshots of the new or changed text and widget (both themes, desktop and phone) and report what you saw.
