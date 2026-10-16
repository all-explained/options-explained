---
id: TASK-009
title: 'Chapter 05: teach breakevens in place, plain words'
milestone: M-3
state: approved
depends_on: [TASK-008]
delivery: pr
---

## Why

SC-7. The breakeven section sits in the wrong place and reads as an algorithm, not as teaching. It interrupts "The algebra of Lego" just before the real high point (`Any payoff from calls`). It introduces symbols ($A$, $s$, $S_T^*$, $K_{\text{next}}$) for a simple idea. Chapter 2 already teaches the breakeven of one option; Chapter 5 should only extend it, one strategy at a time.

## Scope

Rewrite the breakeven teaching in `src/content/chapters/05-strategies.mdx` (read lines 31-110 and the whole Formalisation section first, plus the voice section of `docs/STYLE_GUIDE.md`, and Chapters 1-2 for the tone to match).

1. **Delete** the whole block that starts `**Breakevens** are expiry stock prices...` and ends with the bull call spread bullet list (the anchor/slope derivation, the four-step recipe, the straddle and bull-spread worked cases), and the old `Try this` paragraph after the finder.
2. **In place, under each strategy picture** (bull call spread, straddle, butterfly, and any other strategy in the chapter that already shows a breakeven): one or two plain sentences answering *where does this start to pay?*, with the number. Example of the register: "The stock must end above \$105.98 before the spread pays back its \$5.98." Say it as a distance from a strike where that is clearer ("the straddle needs a move of \$16 either way"). Place the `BreakevenSlider` (TASK-008) right after the bull call spread paragraph, where breakevens first matter, with one `Try this` line (drag the point; press Show the breakevens; switch to the straddle and count the crossings).
3. **In Formalisation**, right after the profit formula, add one short `Breakevens` paragraph (at most 120 words, at most one displayed equation, no new symbols, no anchors). Say: on each straight stretch profit is a line; a breakeven is where a stretch crosses zero; to find it, look for the stretch where profit changes sign, then solve once: *profit at the start of the stretch + slope × distance = 0*. Work the butterfly as the only example (two crossings, on two stretches, \$92 and \$108). Mention flat stretches in one sentence ("a flat stretch never crosses zero, or lies on it").
4. Update the chapter's Recap (one bullet) and the Check-yourself question that mentions breakevens only if the new wording makes them wrong.
5. Keep the straddle result $K \pm (C+P)$ once, as a short consequence of the butterfly-style reading, not as a derivation.

Style: short sentences, one idea per sentence, define each term once in plain words, everyday comparisons where they help, section template unchanged. Do not touch `PayoffFromCalls`/`Any payoff from calls` text. Do not delete components or scripts (TASK-010).

## Acceptance

- The old derivation, four-step recipe and finder `Try this` text are gone from chapter 05; `grep -n "anchor\|K_{\\text{next}}\|S_T^{\*}" src/content/chapters/05-strategies.mdx` returns nothing.
- Each strategy that shows a breakeven states, right under its picture, where it starts to pay, in plain words with the number.
- The Formalisation `Breakevens` paragraph is at most 120 words, has at most one displayed equation, and introduces no new symbol.
- `BreakevenSlider` appears once, after the bull call spread, with a `Try this` line.
- `npm run screenshots 05` passes in both themes, desktop and phone. The PR describes what you saw in the screenshots of every changed paragraph.
- In the PR body, quote the new Formalisation paragraph and one strategy note, so the owner can judge the voice.

## Verify

```sh
npm test
npm run build
npm run screenshots 05
```
Then click through the controls with Playwright and report the readouts in the PR. Look at the screenshots of the new or changed text and widget (both themes, desktop and phone) and report what you saw.
