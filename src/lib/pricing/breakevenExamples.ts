import { makeLeg, netCost, PRESETS, type StrategyLeg } from './strategy';

/**
 * The three strategies of the Chapter 5 breakeven widget, with the round net costs
 * the chapter quotes: bull call spread $5.98, long straddle $16, long butterfly $2.
 * The legs come from `PRESETS`; the first leg's premium is nudged so the net cost is
 * exactly the quoted one (the Black-Scholes prices differ by a few cents).
 */
export type BreakevenExampleKey = 'bull' | 'straddle' | 'butterfly';

function withNetCost(legs: StrategyLeg[], cost: number): StrategyLeg[] {
  const first = legs[0];
  const sign = first.side === 'long' ? 1 : -1;
  return [{ ...first, premium: first.premium + (cost - netCost(legs)) / (sign * first.quantity) }, ...legs.slice(1)];
}

export const BREAKEVEN_EXAMPLES: Record<BreakevenExampleKey, { name: string; legs: StrategyLeg[] }> = {
  bull: { name: 'Bull call spread', legs: withNetCost(PRESETS['bull-call-spread'].legs(), 5.98) },
  straddle: { name: 'Long straddle', legs: withNetCost([makeLeg('call', 'long', 100), makeLeg('put', 'long', 100)], 16) },
  butterfly: { name: 'Long butterfly', legs: withNetCost(PRESETS['long-butterfly'].legs(), 2) },
};
