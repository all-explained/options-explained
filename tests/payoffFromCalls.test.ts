import { describe, expect, it } from 'vitest';
import {
  decomposeSlopes, evalDecomposition, evalDecompositionTerm,
  evalDecompositionTerms, evalPiecewiseSlopes, type SlopeKink,
} from '../src/lib/pricing/decompose';

describe('payoff-from-calls reconstruction for the general widget', () => {
  const examples: { name: string; f0: number; s0: number; kinks: SlopeKink[] }[] = [
    { name: 'put', f0: 100, s0: -1, kinks: [{ strike: 100, slopeAfter: 0 }] },
    { name: 'bull call spread', f0: 0, s0: 0, kinks: [
      { strike: 90, slopeAfter: 1 }, { strike: 110, slopeAfter: 0 },
    ] },
    { name: 'three-kink butterfly', f0: 0, s0: 0, kinks: [
      { strike: 90, slopeAfter: 1 }, { strike: 100, slopeAfter: -1 },
      { strike: 110, slopeAfter: 0 },
    ] },
  ];
  for (let n = 1; n <= 5; n++) {
    examples.push({
      name: n + '-kink arbitrary curve with nonzero cash and initial slope',
      f0: -12,
      s0: 0.75,
      kinks: Array.from({ length: n }, (_, i) => ({
        strike: 55 + i * 17, slopeAfter: [-1.25, 0.5, -0.5, 1, 0][i],
      })),
    });
  }

  for (const example of examples) {
    it('matches every vertex, interval midpoint and inspected price for ' + example.name, () => {
      const d = decomposeSlopes(example.f0, example.s0, example.kinks);
      const k = example.kinks.map((b) => b.strike);
      const vertices = [0, ...k, Math.max(...k) + 60];
      const points = [
        ...vertices,
        ...vertices.slice(1).map((s, i) => (s + vertices[i]) / 2),
        ...Array.from({ length: 201 }, (_, i) => i),
      ];
      for (const s of points) {
        const target = evalPiecewiseSlopes(example.f0, example.s0, example.kinks, s);
        expect(evalDecomposition(d, s)).toBeCloseTo(target, 9);
        expect(evalDecompositionTerms(d, s, d.calls.length + 2)).toBeCloseTo(target, 9);
        const individual = Array.from({ length: d.calls.length + 2 }, (_, i) =>
          evalDecompositionTerm(d, s, i));
        expect(individual.reduce((sum, term) => sum + term, 0)).toBeCloseTo(target, 9);
        for (let n = 0; n <= d.calls.length + 2; n++) {
          expect(evalDecompositionTerms(d, s, n)).toBeCloseTo(
            individual.slice(0, n).reduce((sum, term) => sum + term, 0), 9);
        }
      }
    });
  }

  it('keeps the correct slopes when a strike or right-hand slope is edited', () => {
    const initial: SlopeKink[] = [
      { strike: 90, slopeAfter: 1 },
      { strike: 100, slopeAfter: -1 },
      { strike: 110, slopeAfter: 0 },
    ];
    const dragged = initial.map((k, i) => i === 0 ? { ...k, strike: 91 } : k);
    const resloped = dragged.map((k, i) => i === 1 ? { ...k, slopeAfter: -0.75 } : k);
    expect(evalPiecewiseSlopes(0, 0, initial, 105)).toBe(5);
    expect(evalPiecewiseSlopes(0, 0, dragged, 105)).toBe(4);
    const d = decomposeSlopes(0, 0, resloped);
    expect(d.calls).toEqual([
      { strike: 91, quantity: 1 },
      { strike: 100, quantity: -1.75 },
      { strike: 110, quantity: 0.75 },
    ]);
    expect(evalPiecewiseSlopes(0, 0, resloped, 105)).toBe(5.25);
    expect(evalDecomposition(d, 105)).toBeCloseTo(5.25, 9);
  });

  it('rejects invalid term indexes and counts', () => {
    const d = decomposeSlopes(0, 1, [{ strike: 100, slopeAfter: 0 }]);
    expect(() => evalDecompositionTerms(d, 105, -1)).toThrow(RangeError);
    expect(() => evalDecompositionTerms(d, 105, 4)).toThrow(RangeError);
    expect(() => evalDecompositionTerm(d, 105, 3)).toThrow(RangeError);
  });
});
