---
id: TASK-007
title: 'Breakeven finder widget: solve each piece, see the roots'
milestone: M-2
state: approved
depends_on: [TASK-006]
delivery: pr
---

## Why

SC-6. TASK-006 explains the breakeven rule in text. The student should see it work: pick a strategy, watch the profit line, and see each piece's equation solved and accepted or rejected.

## Scope

Add `src/components/plots/BreakevenFinder.tsx`, built on `WidgetFrame`, `PlotFrame` and `Label`, using `breakevenPieces` and `breakevenPoints` from TASK-005 (maths stays in `src/lib`). Embed it in chapter 05 immediately after the breakeven derivation added by TASK-006 (read its outcome), before 'Any payoff from calls'.

Behaviour:
- Plot the profit curve against $S_T$ with the zero line. Shade the pieces between kinks in alternating light bands, and mark each valid breakeven with a point and a label showing its value.
- A preset picker: long straddle, bull call spread, long butterfly, and 'custom' (the student edits kinks, slopes and net cost). Reuse `PayoffFromCalls` or the `StrategyBuilder` presets if that needs only small additive props; otherwise keep the editing simple (strike sliders and slope sliders for 1 to 4 kinks, plus a net cost slider). If you change an existing component, keep its current props and behaviour.
- A net cost slider, so the student sees the breakevens slide out or in, and disappear when the profit never crosses zero.
- A step-through: a 'Solve piece' control (or a selected-piece click) highlights one piece and shows its arithmetic in the readout in the chapter's notation: anchor, profit at the anchor, slope, the root $A - \text{profit}(A)/s$, and 'inside the piece: yes/no'. Rejected candidates are drawn as hollow markers on the extended line.
- A table of all pieces with these columns: piece, slope, profit at start, candidate root, accepted. Flat pieces say 'flat'.
- A readout stating the final breakevens, and for the straddle preset the check $K \pm (C+P)$.

Follow `CLAUDE.md` and `docs/STYLE_GUIDE.md`: CSS-variable colours, `client:visible`, 360px width, `prefers-reduced-motion`, `Slider`/`Segmented`/`Button` controls, escaped dollars. Read `PayoffFromCalls.tsx` and `StrategyBuilder.tsx` first; reuse before creating.

## Acceptance

- The widget renders in chapter 05 after the breakeven text with the straddle preset, showing breakevens $K \pm (C+P)$ that match `breakevenPoints`.
- Changing preset, a strike, a slope or the net cost updates the plot, the piece table and the readout; the displayed roots always equal `breakevenPoints`.
- Stepping through pieces shows the arithmetic and an accepted or rejected status; a net cost with no crossing shows 'no breakeven'.
- `npm run screenshots 05` passes in both themes, desktop and phone.
- A Playwright click-through of the controls is run and its readouts are reported (a script like `scripts/clickthrough-05.mjs` is fine).

## Verify

```sh
npm test
npm run build
npm run screenshots 05
```
Then click through the controls with Playwright and report the readouts in the PR. Look at the screenshots of the widget (both themes, desktop and phone) and report what you saw.
