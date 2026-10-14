# TASK-004 outcome — General piecewise-linear payoff widget

## Summary

- Added `src/components/plots/PayoffFromCalls.tsx`: configurable 1–5 kink payoff editor, independent target and replicated lines, draggable ordered strikes, slope/cash/share sliders, term view, partial running-sum view, position table and inspection readout.
- Embedded the general widget in `src/content/chapters/05-strategies.mdx` directly after “Why it works” and before “Two examples”, leaving the worked-example text and Chapter 27 pointer intact.
- Added `evalPiecewiseSlopes`, `evalDecompositionTerm` and `evalDecompositionTerms` to `src/lib/pricing/decompose.ts` to keep maths outside the React component. `tests/payoffFromCalls.test.ts` checks 1–5 kinks, vertices, interior and external prices, independent reconstruction, partial sums and edited slopes/strikes.
- Added `scripts/clickthrough-05.mjs`, a reproducible Playwright script that prints and asserts the actual readouts. **The script was not run in this session.**
- Preset API: `f0`, `s0`, `kinks`, `initialSpot`, `display`, `lockEdits`, `lockCash`, `lockShares`, `lockStrikes`, `lockSlopes`, `lockKinkCount`, `showDisplayPicker`, `showTable`, `showReadout`. A parent changing preset parameters updates the editor.
- Implementation revision before this outcome: `3dded5f2c3b3ac33f4b45b65534df08a32a03d58`. GitHub Actions [run 38616789273](https://github.com/jesusvillota/options-explained/actions/runs/38616789273) completed with success for that revision, including its test and build jobs. This is GitHub-hosted CI evidence, **not a local execution by ChatGPT**, and does not cover screenshots or the click-through. The final outcome commit triggers its own checks.
- No task specs, other tasks, decisions, goal.yaml, or unrelated chapters were changed.

## Acceptance

- [ ] **1. Chapter 05 default rendering and complete reconstruction.** Source evidence: chapter 05 imports and hydrates `PayoffFromCalls` with `client:visible`, default 90/100/110 three-kink payoff; independent piecewise and decomposition evaluations match over all vertices, interval midpoints and sampled stock prices in `tests/payoffFromCalls.test.ts`. GitHub CI test/build success on implementation revision. **Actual rendered browser state was not inspected**.
- [ ] **2. Drag/edit propagation, ordered 1–5 kinks.** Source evidence: constrained `MovablePoint` strike controls, per-kink strike/slope sliders, add/remove controls, derived plot/table/readout, and a Playwright click-through script that exercises one to five ordered kinks. **Interaction was not executed in a browser**.
- [x] **3. Preset props and locks.** Source evidence: typed `PayoffFromCallsProps` includes `f0`, `s0`, `kinks`, fine-grained lock flags and section visibility flags, with prop-change synchronization. TASK-002/TASK-003 may import this component; no edits to those tasks were made.
- [ ] **4. `npm run screenshots 05`, two themes and both sizes.** Not run. Screenshot script is configured to use light/dark and 1280×900/375×800; no screenshots or overflow observations from this session.
- [ ] **5. Playwright click-through and reported actual readouts.** `node scripts/clickthrough-05.mjs` was added but could not run. Expected mathematics (not observed browser results): default S=105 gives +$5.00; moving first strike from 90 to 91 gives +$4.00; changing second right-hand slope from -1 to -0.75 then gives +$5.25. No actual UI readouts are claimed.

## Blocker

**Exit B — browser verification access unavailable.** The GitHub connector allows code and PR mutations, but does not provide a runnable browser workspace. An attempted clone into the available container failed with `Could not resolve host: github.com`. Therefore there is no local checkout in which to run screenshots or the Playwright control click-through, and acceptance items 1, 2, 4 and 5 cannot be verified. Keep the PR **draft**, even if GitHub's test/build CI checks succeed, until screenshots and browser click-through are performed and their results attached.

## Human verification

On the PR branch, run exactly:

```sh
npm test
npm run build
npm run screenshots 05
```

Then run the provided Playwright control test:

```sh
node scripts/clickthrough-05.mjs
```

Paste the command exit-code tails and actual click-through readouts in the PR. Check both themes and desktop/phone screenshots. Do not mark ready if any check is failing or pending.
