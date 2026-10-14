import { describe, expect, it } from 'vitest';
import {
  decomposeSlopes, evalDecomposition, evalDecompositionTerm,
  evalDecompositionTerms, evalPiecewiseSlopes,
} from '../src/lib/pricing/decompose';
import { makeLeg, strategyPayoff } from '../src/lib/pricing/strategy';

describe('put-from-calls chapter 05 preset', () => {
  for (const strike of [50, 80, 100, 110, 150]) {
    it('reconstructs the put and put-call parity at every plotted price, K=' + strike, () => {
      const d = decomposeSlopes(strike, -1, [{ strike, slopeAfter: 0 }]);
      expect(d).toEqual({ cash: strike, shares: -1, calls: [{ strike, quantity: 1 }] });
      const stockLeg = makeLeg('stock', 'long');
      const putLeg = makeLeg('put', 'long', strike);
      const callLeg = makeLeg('call', 'long', strike);
      // The graph is piecewise-linear and these cover both its kink and interiors.
      const prices = [0, strike, 160, strike - 1, strike + 1,
        ...Array.from({ length: 161 }, (_, s) => s)];
      for (const s of prices) {
        const put = strategyPayoff([putLeg], s);
        const parityLeft = strategyPayoff([stockLeg, putLeg], s);
        const parityRight = strike + strategyPayoff([callLeg], s);
        expect(evalPiecewiseSlopes(strike, -1, [{ strike, slopeAfter: 0 }], s)).toBeCloseTo(put, 9);
        expect(evalDecomposition(d, s)).toBeCloseTo(put, 9);
        expect(evalDecompositionTerms(d, s, 3)).toBeCloseTo(put, 9);
        expect(parityLeft).toBeCloseTo(parityRight, 9);
        expect(evalDecomposition(d, s) + s).toBeCloseTo(parityRight, 9);
        const parts = [0, 1, 2].map((i) => evalDecompositionTerm(d, s, i));
        for (let n = 0; n <= 3; n++) {
          expect(evalDecompositionTerms(d, s, n)).toBeCloseTo(
            parts.slice(0, n).reduce((sum, term) => sum + term, 0), 9);
        }
      }
    });
  }

  it('updates a visible inspection example when moving K and S', () => {
    const readout = (strike: number, s: number) => {
      const d = decomposeSlopes(strike, -1, [{ strike, slopeAfter: 0 }]);
      return {
        put: strategyPayoff([makeLeg('put', 'long', strike)], s),
        parts: [0, 1, 2, 3].map((n) => evalDecompositionTerms(d, s, n)),
        left: strategyPayoff([makeLeg('stock', 'long'), makeLeg('put', 'long', strike)], s),
        right: strike + strategyPayoff([makeLeg('call', 'long', strike)], s),
      };
    };
    expect(readout(100, 90)).toEqual({ put: 10, parts: [0, 100, 10, 10], left: 100, right: 100 });
    expect(readout(110, 90)).toEqual({ put: 20, parts: [0, 110, 20, 20], left: 110, right: 110 });
    expect(readout(110, 160)).toEqual({ put: 0, parts: [0, 110, -50, 0], left: 160, right: 160 });
  });
});
