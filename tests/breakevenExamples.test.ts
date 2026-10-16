import { describe, expect, it } from 'vitest';
import { BREAKEVEN_EXAMPLES } from '../src/lib/pricing/breakevenExamples';
import { breakevens, netCost } from '../src/lib/pricing/strategy';

describe('breakeven widget examples', () => {
  const cases: [keyof typeof BREAKEVEN_EXAMPLES, number, number[]][] = [
    ['bull', 5.98, [105.98]],
    ['straddle', 16, [84, 116]],
    ['butterfly', 2, [92, 108]],
  ];
  it.each(cases)('%s: net cost and breakevens match the chapter to the cent', (key, cost, roots) => {
    const { legs } = BREAKEVEN_EXAMPLES[key];
    expect(netCost(legs)).toBeCloseTo(cost, 10);
    const got = breakevens(legs);
    expect(got).toHaveLength(roots.length);
    got.forEach((g, i) => expect(g).toBeCloseTo(roots[i], 10));
  });
});
