import { describe, expect, it } from 'vitest';
import { breakevenPieces, breakevenPoints } from '../src/lib/pricing/breakevens';
import { evalPiecewiseSlopes, type SlopeKink } from '../src/lib/pricing/decompose';
import {
  breakevens, makeLeg, netCost, strategyProfit, type LegKind, type StrategyLeg,
} from '../src/lib/pricing/strategy';
import type { Side } from '../src/lib/pricing/payoff';

const leg = (kind: LegKind, side: Side, strike: number, premium: number, quantity = 1): StrategyLeg =>
  ({ ...makeLeg(kind, side, strike, quantity), premium });

interface ReferenceCase {
  name: string;
  f0: number;
  s0: number;
  kinks: SlopeKink[];
  cost: number;
  expected: number[];
  legs: StrategyLeg[];
}

const cases: ReferenceCase[] = [
  {
    name: 'long straddle at 100 with 16 total premium',
    f0: 100,
    s0: -1,
    kinks: [{ strike: 100, slopeAfter: 1 }],
    cost: 16,
    expected: [84, 116],
    legs: [leg('call', 'long', 100, 9), leg('put', 'long', 100, 7)],
  },
  {
    name: '100/115 bull call spread with 5.98 debit',
    f0: 0,
    s0: 0,
    kinks: [{ strike: 100, slopeAfter: 1 }, { strike: 115, slopeAfter: 0 }],
    cost: 5.98,
    expected: [105.98],
    legs: [leg('call', 'long', 100, 8), leg('call', 'short', 115, 2.02)],
  },
  {
    name: '90/100/110 long butterfly with 2 debit',
    f0: 0,
    s0: 0,
    kinks: [
      { strike: 90, slopeAfter: 1 },
      { strike: 100, slopeAfter: -1 },
      { strike: 110, slopeAfter: 0 },
    ],
    cost: 2,
    expected: [92, 108],
    legs: [
      leg('call', 'long', 90, 5),
      leg('call', 'short', 100, 2, 2),
      leg('call', 'long', 110, 1),
    ],
  },
  {
    name: 'short straddle at 100, profitable between breakevens',
    f0: -100,
    s0: 1,
    kinks: [{ strike: 100, slopeAfter: -1 }],
    cost: -16,
    expected: [84, 116],
    legs: [leg('call', 'short', 100, 9), leg('put', 'short', 100, 7)],
  },
  {
    name: 'off-centre 80/95/130 three-kink line with stock',
    f0: 0,
    s0: 0.5,
    kinks: [
      { strike: 80, slopeAfter: 1.5 },
      { strike: 95, slopeAfter: -0.5 },
      { strike: 130, slopeAfter: 0.5 },
    ],
    cost: 50,
    // The vertices are f(80)=40, f(95)=62.5, f(130)=45.
    // Subtracting cost 50 gives profits -10, +12.5, -5.
    // Piece roots: 80+10/1.5 = 86 2/3, 95+12.5/0.5 = 120,
    // and 130+5/0.5 = 140 (on the final unbounded piece).
    expected: [80 + 10 / 1.5, 120, 140],
    legs: [
      leg('stock', 'long', 100, 100, 0.5),
      leg('call', 'long', 80, 8),
      leg('call', 'short', 95, 5, 2),
      leg('call', 'long', 130, 2),
    ],
  },
];

describe('breakevenPieces / breakevenPoints: reference strategies', () => {
  for (const example of cases) {
    it(example.name, () => {
      // Premiums are explicit, so the reference debits/credits are exact
      // rather than depending on the Black-Scholes market defaults.
      expect(netCost(example.legs)).toBeCloseTo(example.cost, 10);
      for (const s of [0, ...example.kinks.map((k) => k.strike), 200]) {
        expect(evalPiecewiseSlopes(example.f0, example.s0, example.kinks, s) - example.cost)
          .toBeCloseTo(strategyProfit(example.legs, s), 10);
      }

      const pieces = breakevenPieces(example.f0, example.s0, example.kinks, example.cost);
      const roots = breakevenPoints(example.f0, example.s0, example.kinks, example.cost);
      const independent = breakevens(example.legs);
      expect(pieces).toHaveLength(example.kinks.length + 1);
      expect(pieces.at(-1)!.to).toBe(Infinity);
      expect(roots).toHaveLength(example.expected.length);
      expect(roots).toHaveLength(independent.length);
      for (const [i, root] of roots.entries()) {
        expect(root).toBeCloseTo(example.expected[i], 9);
        expect(root).toBeCloseTo(independent[i], 9);
        expect(Math.abs(evalPiecewiseSlopes(example.f0, example.s0, example.kinks, root)
          - example.cost)).toBeLessThanOrEqual(1e-9);
        expect(Math.abs(strategyProfit(example.legs, root))).toBeLessThanOrEqual(1e-9);
      }
      for (const piece of pieces) {
        expect(piece.profitAtFrom).toBeCloseTo(
          evalPiecewiseSlopes(example.f0, example.s0, example.kinks, piece.from) - example.cost, 9);
        if (piece.valid) {
          expect(piece.status).toBe('root');
          expect(piece.candidate).not.toBeNull();
        }
      }
    });
  }

  it('makes a short straddle profitable strictly between its two roots', () => {
    const sample = cases[3];
    expect(strategyProfit(sample.legs, 100)).toBeGreaterThan(0);
    expect(strategyProfit(sample.legs, 80)).toBeLessThan(0);
    expect(strategyProfit(sample.legs, 120)).toBeLessThan(0);
  });
});

describe('flat segments and kink boundaries', () => {
  it('reports an isolated tangent root at a kink only once (no sign change)', () => {
    const kinks: SlopeKink[] = [
      { strike: 90, slopeAfter: 1 },
      { strike: 100, slopeAfter: -1 },
      { strike: 110, slopeAfter: 0 },
    ];
    const legs = [
      leg('call', 'long', 90, 12),
      leg('call', 'short', 100, 1, 2),
      leg('call', 'long', 110, 0),
    ];
    const pieces = breakevenPieces(0, 0, kinks, 10);
    expect(pieces[1]).toMatchObject({ from: 90, to: 100, candidate: 100, valid: true, status: 'root' });
    expect(pieces[2]).toMatchObject({ from: 100, to: 110, candidate: 100, valid: true, status: 'root' });
    expect(breakevenPoints(0, 0, kinks, 10)).toEqual([100]);
    expect(breakevens(legs)).toEqual([100]);
    expect(strategyProfit(legs, 100)).toBe(0);
  });

  it('identifies flat zero pieces without inventing a continuum of numeric roots', () => {
    const freeCall = [leg('call', 'long', 100, 0)];
    const pieces = breakevenPieces(0, 0, [{ strike: 100, slopeAfter: 1 }], 0);
    expect(pieces[0]).toMatchObject({
      from: 0, to: 100, slope: 0, profitAtFrom: 0,
      candidate: null, valid: false, status: 'flat, zero everywhere',
    });
    expect(breakevenPoints(0, 0, [{ strike: 100, slopeAfter: 1 }], 0)).toEqual([100]);
    expect(breakevens(freeCall)).toEqual([100]);

    const capped = [
      leg('call', 'long', 100, 15),
      leg('call', 'short', 115, 0),
    ];
    const cappedKinks = [{ strike: 100, slopeAfter: 1 }, { strike: 115, slopeAfter: 0 }];
    expect(breakevenPieces(0, 0, cappedKinks, 15)[2]).toMatchObject({
      from: 115, to: Infinity, candidate: null, valid: false, status: 'flat, zero everywhere',
    });
    expect(breakevenPoints(0, 0, cappedKinks, 15)).toEqual([115]);
    expect(breakevens(capped)).toEqual([115]);
  });

  it('rejects a root candidate outside its piece and finds no roots for positive constant profit', () => {
    const pieces = breakevenPieces(0, 0, [{ strike: 100, slopeAfter: 1 }], 5);
    expect(pieces[0].status).toBe('flat, never zero');
    expect(pieces[1]).toMatchObject({ from: 100, to: Infinity, candidate: 105, valid: true });

    const constantLegs = [
      leg('call', 'long', 100, 0),
      leg('call', 'short', 100, 5),
    ];
    expect(netCost(constantLegs)).toBe(-5);
    const noRoots = breakevenPieces(0, 0, [], -5);
    expect(noRoots).toMatchObject([{
      from: 0, to: Infinity, slope: 0, profitAtFrom: 5,
      candidate: null, valid: false, status: 'flat, never zero',
    }]);
    expect(breakevenPoints(0, 0, [], -5)).toEqual([]);
    expect(breakevens(constantLegs)).toEqual([]);
  });

  it('sorts without mutating input, allows zero kinks and reports outside-piece candidates', () => {
    const input = [{ strike: 110, slopeAfter: 0 }, { strike: 90, slopeAfter: 1 },
      { strike: 100, slopeAfter: -1 }];
    const before = input.map((k) => ({ ...k }));
    expect(breakevenPoints(0, 0, input, 2)).toEqual([92, 108]);
    expect(input).toEqual(before);
    expect(breakevenPieces(1, 1, [{ strike: 3, slopeAfter: 1 }], 10)[0])
      .toMatchObject({ candidate: 9, valid: false, status: 'outside piece' });
    expect(breakevenPoints(0, 1, [{ strike: 0, slopeAfter: 2 }], 0)).toEqual([0]);
  });

  it('does not accept a root just beyond a kink or label a nearly zero flat piece as zero', () => {
    const kinks = [{ strike: 100, slopeAfter: 0 }];
    const pieces = breakevenPieces(-100 - 5e-10, 1, kinks, 0);
    expect(pieces[0].candidate).toBeGreaterThan(100);
    expect(pieces[0]).toMatchObject({ valid: false, status: 'outside piece' });
    expect(pieces[1]).toMatchObject({ valid: false, status: 'flat, never zero' });
    expect(breakevenPoints(-100 - 5e-10, 1, kinks, 0)).toEqual([]);
  });

  it('rejects non-finite cost and invalid kinks/initial values', () => {
    expect(() => breakevenPieces(0, 0, [], Infinity)).toThrow(RangeError);
    expect(() => breakevenPoints(NaN, 0, [], 0)).toThrow(RangeError);
    expect(() => breakevenPieces(0, 0, [{ strike: -1, slopeAfter: 1 }], 0)).toThrow(RangeError);
    expect(() => breakevenPieces(0, 0, [
      { strike: 100, slopeAfter: 1 }, { strike: 100, slopeAfter: 2 },
    ], 0)).toThrow(RangeError);
  });
});
