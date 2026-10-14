import { describe, expect, it } from 'vitest';
import {
  decomposeSlopes,
  evalDecomposition,
  type DecompositionCall,
  type SlopeKink,
} from '../src/lib/pricing/decompose';

interface ReferenceCase {
  name: string;
  f0: number;
  s0: number;
  kinks: SlopeKink[];
  calls: DecompositionCall[];
  /** Independent piecewise payoff (not built using the decomposition). */
  payoff: (s: number) => number;
  samples: number[];
}

const cases: ReferenceCase[] = [
  {
    name: 'butterfly (+1, -2, +1 calls at 90/100/110)',
    f0: 0,
    s0: 0,
    kinks: [
      { strike: 90, slopeAfter: 1 },
      { strike: 100, slopeAfter: -1 },
      { strike: 110, slopeAfter: 0 },
    ],
    calls: [
      { strike: 90, quantity: 1 },
      { strike: 100, quantity: -2 },
      { strike: 110, quantity: 1 },
    ],
    payoff: (s) => (s <= 90 ? 0 : s <= 100 ? s - 90 : s <= 110 ? 110 - s : 0),
    samples: [0, 80, 90, 95, 100, 105, 110, 120, 150],
  },
  {
    name: 'put from cash, a short share and a long call',
    f0: 100,
    s0: -1,
    kinks: [{ strike: 100, slopeAfter: 0 }],
    calls: [{ strike: 100, quantity: 1 }],
    payoff: (s) => Math.max(100 - s, 0),
    samples: [0, 50, 99, 100, 101, 130, 200],
  },
  {
    name: 'bull call spread (+1 at 90, -1 at 110)',
    f0: 0,
    s0: 0,
    kinks: [
      { strike: 90, slopeAfter: 1 },
      { strike: 110, slopeAfter: 0 },
    ],
    calls: [
      { strike: 90, quantity: 1 },
      { strike: 110, quantity: -1 },
    ],
    payoff: (s) => (s <= 90 ? 0 : s <= 110 ? s - 90 : 20),
    samples: [0, 80, 90, 100, 110, 120, 150],
  },
];

describe('decomposeSlopes and evalDecomposition', () => {
  for (const example of cases) {
    it(`matches the independent piecewise payoff for ${example.name}`, () => {
      const d = decomposeSlopes(example.f0, example.s0, example.kinks);
      expect(d).toEqual({
        cash: example.f0,
        shares: example.s0,
        calls: example.calls,
      });

      // Explicitly require spot zero, every strike, and beyond the last strike.
      const lastStrike = example.kinks.at(-1)!.strike;
      for (const s of new Set([0, ...example.kinks.map((k) => k.strike), lastStrike + 50, ...example.samples])) {
        expect(evalDecomposition(d, s)).toBeCloseTo(example.payoff(s), 10);
      }
    });
  }

  it('sorts kinks without mutating the caller or changing the slope changes', () => {
    const input = [
      { strike: 110, slopeAfter: 0 },
      { strike: 90, slopeAfter: 1 },
      { strike: 100, slopeAfter: -1 },
    ];
    const original = input.map((k) => ({ ...k }));
    expect(decomposeSlopes(0, 0, input).calls).toEqual(cases[0].calls);
    expect(input).toEqual(original);
  });

  it('handles a straight line without calls', () => {
    const d = decomposeSlopes(5, -0.5, []);
    expect(d).toEqual({ cash: 5, shares: -0.5, calls: [] });
    expect(evalDecomposition(d, 20)).toBe(-5);
  });

  it('rejects duplicate, negative, or non-finite kinks and initial values', () => {
    expect(() => decomposeSlopes(0, 0, [
      { strike: 100, slopeAfter: 1 },
      { strike: 100, slopeAfter: 0 },
    ])).toThrow(RangeError);
    expect(() => decomposeSlopes(0, 0, [{ strike: -1, slopeAfter: 0 }])).toThrow(RangeError);
    expect(() => decomposeSlopes(0, 0, [{ strike: NaN, slopeAfter: 0 }])).toThrow(RangeError);
    expect(() => decomposeSlopes(0, 0, [{ strike: 100, slopeAfter: Infinity }])).toThrow(RangeError);
    expect(() => decomposeSlopes(Infinity, 0, [])).toThrow(RangeError);
    expect(() => decomposeSlopes(0, NaN, [])).toThrow(RangeError);
  });
});
