---
id: TASK-004
title: 'General widget: any piecewise-linear payoff from cash, shares and calls'
milestone: M-1
state: approved
depends_on: [TASK-001]
delivery: pr
route: {platform: chatgptweb}
---

## Why

SC-4. The general theorem f(S) = f(0) + s0*S + sum (s_k - s_{k-1})(S-K_k)+ ('Any payoff from calls') is prose and a formula only. The student should build any piecewise-linear payoff and see it rebuilt from cash, shares and calls. The two worked examples (TASK-002, TASK-003) are special cases of this widget.

## Scope

Add a reusable `src/components/plots/PayoffFromCalls.tsx` using `decomposeSlopes` from TASK-001. The student sets f(0), s0 and 1 to 5 kinks (drag kink strikes, edit the slope after each kink). The plot shows the drawn payoff, and a table lists cash f(0), shares s0 and the call quantity (s_k - s_{k-1}) at each K_k, with the formula terms in the style-guide colours. Toggle to show each term's curve and the running sum rebuilding the payoff. Expose props for presets (initial f0, s0, kinks), locking edits, and which parts are shown, so TASK-002 and TASK-003 can use it as a special case rather than build separate plots. Embed the general widget in chapter 05 right after the 'Why it works' details, before 'Two examples'. Read `CLAUDE.md`, `docs/STYLE_GUIDE.md`, `StrategyBuilder.tsx`, `PayoffDiagram.tsx`; use `WidgetFrame`, `PlotFrame`, `Label`, `Slider`, `useTweened`, CSS-variable colours, `client:visible`, 360px width, reduced motion. Maths stays in `src/lib`.

## Acceptance

- The widget renders in chapter 05 with a default example (for instance a 3-kink payoff) and the rebuilt sum equals the drawn payoff at every plotted S.
- Dragging a kink or editing a slope updates plot, table and readout; kinks stay ordered; 1 to 5 kinks work.
- It accepts preset props (f0, s0, kinks, lock flags) usable by the two example widgets.
- `npm run screenshots 05` passes, both themes, desktop and phone.
- A Playwright click-through of the controls is run and its readouts reported.

## Verify

```sh
npm test
npm run build
npm run screenshots 05
```
Then click through the controls with Playwright and report the readouts in the PR.
