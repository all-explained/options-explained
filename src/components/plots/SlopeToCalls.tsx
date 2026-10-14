import type { SlopeKink } from '../../lib/pricing/decompose';
import PayoffFromCalls from './PayoffFromCalls';

/** The long 90/100/110 call butterfly, expressed as slopes rather than option legs. */
const BUTTERFLY: readonly SlopeKink[] = [
  { strike: 90, slopeAfter: 1 },
  { strike: 100, slopeAfter: -1 },
  { strike: 110, slopeAfter: 0 },
];

/**
 * A worked example of the general decomposition widget, not a second plot.
 * Cash and initial shares stay at zero; changing slopes or strikes recomputes
 * the exact cash/share/call table and the implied trades in PayoffFromCalls.
 */
export default function SlopeToCalls() {
  return (
    <PayoffFromCalls
      title="Butterfly: slopes become calls"
      caption="Expiry payoff per share, before option premiums. Drag a yellow kink to move its strike, or change the slope just after a kink. The call trades and the rebuilt line respond together."
      f0={0}
      s0={0}
      kinks={BUTTERFLY}
      initialSpot={105}
      display="rebuild"
      lockCash
      lockShares
      lockKinkCount
      showDisplayPicker={false}
      showSlopeChangeExplanation
    />
  );
}
