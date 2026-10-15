---
id: TASK-006
title: 'Chapter text: derive the general breakeven rule'
milestone: M-2
state: approved
depends_on: [TASK-005]
delivery: pr
route: {platform: chatgptweb}
---

## Why

SC-6. The Formalisation section of chapter 05 says 'each breakeven can be found by solving a linear equation on one piece' and then gives only the straddle result. A student cannot reproduce the method for any other strategy.

## Scope

In `src/content/chapters/05-strategies.mdx`, replace the single straddle-only paragraph that starts 'Breakevens are where the profit crosses zero' (and its display equation) with a short derivation of the general rule. No widget in this task; TASK-007 adds it right after this text. Use the rule and notation of TASK-005 (read its outcome and `src/lib/pricing/decompose.ts`).

Content, in this order:
1. Profit between two consecutive strikes is a straight line: on the piece that starts at anchor $A$ with slope $s$, $	ext{profit}(S_T) = 	ext{profit}(A) + s\,(S_T - A)$.
2. Set it to zero and solve: $S_T^{*} = A - 	ext{profit}(A)/s$, valid only if $s 
e 0$ and the root lies inside the piece. State the three outcomes: root inside the piece, root outside it (no breakeven there), flat piece (never zero, or zero everywhere).
3. A recipe as a numbered list: list the pieces; compute the profit at each kink (payoff minus net cost); on each piece with a sign change, or ending at zero, solve; keep the roots inside their piece. Mention the quick sign-change test: a piece has a breakeven when profit at its two ends has opposite signs.
4. Show the straddle as a special case: two outer pieces with slopes -1 and +1, giving $K \pm (C+P)$. Keep the existing $\Call{C}+\Put{P}$ result and colours.
5. One second worked example with numbers where the answer is not symmetric: the bull call spread already in the chapter (breakeven \$105.98) or a butterfly with two breakevens. Show the piece-by-piece arithmetic.

Follow `docs/STYLE_GUIDE.md` (voice, notation, colour macros `\Spot`, `\Strike`, `\Call`, `\Put`; escape literal dollars as `\$`). If you add a symbol, add it to the notation table. Do not touch other sections, the Quiz components, or other chapters.

## Acceptance

- The chapter states the per-piece equation, its solution $A - \text{profit}(A)/s$, and the validity condition, in the course notation and colours.
- It gives the numbered recipe, derives the straddle result as a special case, and works one asymmetric example with numbers that agree with `breakevenPoints` from TASK-005 (the outcome file lists the comparison).
- `npm run build` passes and `npm run screenshots 05` passes in both themes, desktop and phone, with no KaTeX errors.

## Verify

```sh
npm test
npm run build
npm run screenshots 05
```
Then look at the new text in the screenshots (both themes, desktop and phone) and report what you saw.
