---
id: TASK-002
title: 'Butterfly widget: drag slope changes, see the calls'
milestone: M-1
state: approved
depends_on: [TASK-001]
delivery: pr
---

## Why

SC-1. The butterfly example is prose only; the student should drag the slope changes and see which calls they imply.

## Scope

Add `src/components/plots/SlopeToCalls.tsx` (or similar). Show the payoff line with kinks at 90/100/110 (draggable slope per segment or a slope-change control per kink, default = butterfly); beside it show the implied position table (cash, shares, calls per strike, from `decomposeSlopes`) and optionally the individual call legs fading in. A readout shows slope changes like +1, -2, +1 and the rebuilt payoff matching the drawn one. Embed it in chapter 05 in place of the butterfly bullet's description, keeping the text. Read `CLAUDE.md`, `docs/STYLE_GUIDE.md` and `src/content/chapters/05-strategies.mdx` (section 'Any payoff from calls') first. Reuse `src/lib/pricing/strategy.ts` (`StrategyLeg`, `strategyPayoff`, `makeLeg`) and `WidgetFrame`, `PlotFrame`, `Label`, `Slider`, `useTweened`; look at `StrategyBuilder.tsx` and `PayoffDiagram.tsx` for the pattern. Colours are CSS variables, hydrate with `client:visible`, works at 360px, respects `prefers-reduced-motion`. Pricing maths stays in `src/lib`.

## Acceptance

- The widget renders in chapter 05 and its default state shows buy 1x90, sell 2x100, buy 1x110.
- Changing a slope control updates the table and the plot; the table always reproduces the drawn payoff.
- `npm run screenshots 05` passes (no console/KaTeX/overflow errors), both themes, desktop and phone.
- A Playwright click-through of the controls is run and its readouts reported.

## Verify

```sh
npm test
npm run build
npm run screenshots 05
```
Then click through the controls with Playwright and report the readouts in the PR.
