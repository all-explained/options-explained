---
id: TASK-003
title: 'Put-from-calls widget: stock + put = call + cash'
milestone: M-1
state: approved
depends_on: [TASK-001, TASK-004]
delivery: pr
route: {platform: chatgptweb}
---

## Why

SC-2. The put-from-calls identity (stock + put = call + cash, put-call parity at expiry) is prose only.

## Scope

Build this on the general `PayoffFromCalls` widget from TASK-004 (put preset: f0=K, s0=-1, one kink at K with slope 0) instead of a separate plot. Add only what is example-specific (the K slider, the step-by-step addition of parts, the stock + put = call + cash view).

Add `src/components/plots/PutFromCalls.tsx`. Slider for K; show four payoff curves: put (K-S)+, and its parts cash K, minus one share, plus one call (S-K)+, with a toggle or stepper that adds the parts one at a time until the sum overlays the put. A second view shows stock + put equal to call + cash. Embed it in chapter 05 beside the 'A put, from calls' bullet, keeping the text and the Chapter 8 and Chapter 27 pointers. Use `decomposeSlopes`. Read `CLAUDE.md`, `docs/STYLE_GUIDE.md` and `src/content/chapters/05-strategies.mdx` (section 'Any payoff from calls') first. Reuse `src/lib/pricing/strategy.ts` (`StrategyLeg`, `strategyPayoff`, `makeLeg`) and `WidgetFrame`, `PlotFrame`, `Label`, `Slider`, `useTweened`; look at `StrategyBuilder.tsx` and `PayoffDiagram.tsx` for the pattern. Colours are CSS variables, hydrate with `client:visible`, works at 360px, respects `prefers-reduced-motion`.

## Acceptance

- The widget renders in chapter 05; at default K = 100 the sum of parts equals the put at every plotted S.
- Moving the K slider updates all curves and readouts; the stock + put and call + cash curves coincide.
- `npm run screenshots 05` passes, both themes, desktop and phone.
- A Playwright click-through of the controls is run and its readouts reported.

## Verify

```sh
npm test
npm run build
npm run screenshots 05
```
Then click through the controls with Playwright and report the readouts in the PR.
