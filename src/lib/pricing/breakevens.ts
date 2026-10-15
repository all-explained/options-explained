import { decomposeSlopes, type SlopeKink } from './decompose';

/** Profit on each segment of a continuous, piecewise-linear expiry payoff. */
export interface BreakevenPiece {
  /** Inclusive lower underlying price for the segment. */
  from: number;
  /** Inclusive upper underlying price, or Infinity for the final segment. */
  to: number;
  slope: number;
  /** f(from) - netCost: profit at this segment's left endpoint. */
  profitAtFrom: number;
  /** The linear equation's candidate; null for a flat segment. */
  candidate: number | null;
  /** True only for an isolated candidate that falls on this segment. */
  valid: boolean;
  status: 'root' | 'outside piece' | 'flat, never zero' | 'flat, zero everywhere';
}

const ROOT_TOLERANCE = 1e-9;

/**
 * Solve profit(S) = f(S) - netCost = 0 independently on every linear piece.
 *
 * On [from, to], profit(S) = profitAtFrom + slope * (S - from),
 * so the candidate is from - profitAtFrom / slope when slope is nonzero.
 *
 * Flat zero pieces are identified but produce no candidate: they contain
 * infinitely many breakevens, not one distinguished isolated point.
 * Input validation matches decomposeSlopes (nonnegative distinct strikes,
 * finite payoff values/slopes); the supplied kinks are never mutated.
 */
export function breakevenPieces(
  f0: number,
  s0: number,
  kinks: readonly SlopeKink[],
  netCost: number,
): BreakevenPiece[] {
  if (!Number.isFinite(netCost)) throw new RangeError('Net cost must be finite');
  decomposeSlopes(f0, s0, kinks); // Validate the shared piecewise-payoff representation.
  const sorted = [...kinks].sort((a, b) => a.strike - b.strike);
  const pieces: BreakevenPiece[] = [];
  let from = 0;
  let slope = s0;
  let profitAtFrom = f0 - netCost;

  const addPiece = (to: number) => {
    if (slope === 0) {
      pieces.push({
        from, to, slope, profitAtFrom, candidate: null, valid: false,
        status: profitAtFrom === 0 ? 'flat, zero everywhere' : 'flat, never zero',
      });
      return;
    }

    const candidate = from - profitAtFrom / slope;
    const valid = Number.isFinite(candidate)
      && candidate >= from
      && candidate <= to;
    pieces.push({
      from, to, slope, profitAtFrom, candidate, valid,
      status: valid ? 'root' : 'outside piece',
    });
  };

  for (const kink of sorted) {
    addPiece(kink.strike);
    profitAtFrom += slope * (kink.strike - from);
    from = kink.strike;
    slope = kink.slopeAfter;
  }
  addPiece(Infinity);
  return pieces;
}

/** Sorted, distinct isolated breakeven prices (shared-kink roots appear once). */
export function breakevenPoints(
  f0: number,
  s0: number,
  kinks: readonly SlopeKink[],
  netCost: number,
): number[] {
  const roots = breakevenPieces(f0, s0, kinks, netCost)
    .filter((piece) => piece.valid)
    .map((piece) => piece.candidate!)
    .sort((a, b) => a - b);
  const distinct: number[] = [];
  for (const root of roots) {
    if (distinct.length === 0 || root - distinct[distinct.length - 1] > ROOT_TOLERANCE) {
      distinct.push(root);
    }
  }
  return distinct;
}
