# TASK-006 outcome — Derive the general breakeven rule in chapter 05

## Summary

- Replaced only the straddle-only breakeven paragraph in the Formalisation section of src/content/chapters/05-strategies.mdx with the general per-piece equation, its algebraic solution, explicit in-piece bounds, flat-piece edge cases, and a four-step recipe. Kept the existing colour-coded straddle formula.
- Derived the straddle's two slopes and anchors, then worked the already-introduced 100/115 bull call spread with a net debit of \$5.98. Its flat lower and upper pieces have no roots; its rising middle piece yields **105.98**.
- Added chapter-specific anchor/slope definitions to the notation table in docs/STYLE_GUIDE.md. No other chapter sections, quiz components, pricing code, widgets, specs, other tasks, decisions, or goal.yaml were changed.
- **Text revision inspected through the GitHub connector:** ef5178355c846f56f6756c3d46a7caf1f6c5eb2f (the outcome file is a later commit). The TASK-005 implementation and reference cases are already on main.
- **Verification provenance:** ChatGPT reviewed source and GitHub metadata but did not execute npm or inspect screenshots. GitHub Actions run #38714575516 (https://github.com/jesusvillota/options-explained/actions/runs/38714575516) completed successfully for outcome-commit revision 3936dd081201c2bfebf2c631f323a525610b22af. The runner reported completed/success for npm test and npm run build. The screenshot script is not part of that workflow. This note is a later documentation-only commit; check CI on its final head as well.

## Acceptance

- [x] **1. State the per-piece equation, candidate root and validity condition in course notation/colours.** Evidence: the Formalisation breakeven block now gives profit(S_T) = profit(A) + s(S_T - A) followed by S_T* = A - profit(A)/s, requires a nonzero slope and an in-piece candidate, and spells out inclusive bounds, outside-piece rejection, flat never-zero/zero-everywhere cases and shared-kink deduplication. It uses the KaTeX macros \Spot, \Strike, \Call and \Put. Confirmed by inspecting the committed chapter diff (source inspection, not a rendered-page test).
- [x] **2. Numbered recipe, straddle special case, and asymmetric worked example.** Evidence: a four-step numbered procedure; straddle slopes -1/+1 yield K ± (C + P); the bull call spread has flat profit -5.98 below 100, rising profit -5.98 + (S_T - 100) between 100 and 115, and flat profit 15 - 5.98 = 9.02 above 115. The middle candidate 100 - (-5.98)/1 = 105.98 lies inside its segment. TASK-005.outcome.md records breakevenPoints(...) = [105.98] for the same spread. These are source and arithmetic comparisons; no test was executed in this session.
- [ ] **3. npm run build and npm run screenshots 05 pass, both themes/desktop/phone, with no KaTeX errors.** **Blocked / unverified:** GitHub Actions confirmed the build at revision 3936dd081201c2bfebf2c631f323a525610b22af, but no screenshot rendering or four-view inspection is available through the GitHub connector. .github/workflows/ci.yml does **not** run the screenshot script. No claim that the full Verify sequence passed or that the page was visually inspected is made.

## Blocker

A screenshot-enabled environment and the four resulting renders (light/dark × desktop/phone) are required to verify the new text and check for KaTeX errors, clipping and horizontal overflow. This evidence cannot be obtained through the available GitHub connector. Consequently the pull request remains **draft** with Goal-Blocked, rather than being represented as fully delivered.

## Verify (human, on goal/improve-viz/task-006)

```sh
npm test
npm run build
npm run screenshots 05
```

Inspect chapter 05 screenshots in both themes on desktop and phone, including all display equations and the numbered recipe. Report clipping, overflow and KaTeX errors (if any). Confirm passing CI checks on the final PR head before marking the PR ready for review.
