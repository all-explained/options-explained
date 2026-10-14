/**
 * A continuous, piecewise-linear payoff for an underlying price S >= 0:
 *
 * f(S) = f(0) + s0 * S + Σ (slopeAfter_k - slopeBefore_k) * (S - K_k)+.
 *
 * Cash and shares set the initial value and slope. Each call changes the
 * slope at its strike by its signed quantity (negative means a short call).
 * These are expiry payoffs per share, not today's prices or net profits.
 */

export interface SlopeKink {
  strike: number;
  /** Slope immediately to the right of this strike. */
  slopeAfter: number;
}

export interface DecompositionCall {
  strike: number;
  /** Signed number of calls at this strike. */
  quantity: number;
}

export interface Decomposition {
  /** Constant cash payoff, equal to f(0). */
  cash: number;
  /** Signed share quantity, equal to the initial slope. */
  shares: number;
  calls: DecompositionCall[];
}

/**
 * Decompose slopes into cash, shares, and calls.
 *
 * Strikes must be finite, non-negative, and distinct. Kinks may be supplied
 * in any order; the input is not mutated. The output calls are strike-sorted.
 */
export function decomposeSlopes(f0: number, s0: number, kinks: readonly SlopeKink[]): Decomposition {
  if (!Number.isFinite(f0) || !Number.isFinite(s0)) {
    throw new RangeError('Initial payoff and slope must be finite');
  }
  for (const kink of kinks) {
    if (!Number.isFinite(kink.strike) || kink.strike < 0 || !Number.isFinite(kink.slopeAfter)) {
      throw new RangeError('Kink strikes must be non-negative and kink slopes must be finite');
    }
  }

  const sorted = [...kinks].sort((a, b) => a.strike - b.strike);
  let previousSlope = s0;
  const calls: DecompositionCall[] = sorted.map(({ strike, slopeAfter }, index) => {
    if (index > 0 && strike === sorted[index - 1].strike) {
      throw new RangeError('Kink strikes must be distinct');
    }
    const quantity = slopeAfter - previousSlope;
    if (!Number.isFinite(quantity)) {
      throw new RangeError('Slope change must be finite');
    }
    previousSlope = slopeAfter;
    return { strike, quantity };
  });

  return { cash: f0, shares: s0, calls };
}

/** Evaluate the replicated payoff at underlying price S (typically S >= 0). */
export function evalDecomposition(decomposition: Decomposition, s: number): number {
  return decomposition.calls.reduce(
    (value, { strike, quantity }) => value + quantity * Math.max(s - strike, 0),
    decomposition.cash + decomposition.shares * s,
  );
}
