import { useState } from 'react';
import { decomposeSlopes, evalDecomposition, evalDecompositionTerms, evalDecompositionTerm } from '../../lib/pricing/decompose';
import { makeLeg, strategyPayoff } from '../../lib/pricing/strategy';
import { Segmented, Slider } from '../ui/controls';
import { signedMoney } from './format';
import PayoffFromCalls from './PayoffFromCalls';

type Mode = 'pieces' | 'parity';

/**
 * Expiry put-call parity as a locked one-kink preset of the general
 * slope-to-calls editor. The graph, partial sums and parity overlays
 * all come from PayoffFromCalls; this component adds the lesson controls.
 */
export default function PutFromCalls() {
  const [strike, setStrike] = useState(100);
  const [spot, setSpot] = useState(90);
  const [mode, setMode] = useState<Mode>('pieces');
  const [pieces, setPieces] = useState(3);

  // f(0) = K, initial slope = -1, slope after K = 0.
  const decomposition = decomposeSlopes(strike, -1, [{ strike, slopeAfter: 0 }]);
  const put = strategyPayoff([makeLeg('put', 'long', strike)], spot);
  const stock = strategyPayoff([makeLeg('stock', 'long')], spot);
  const call = strategyPayoff([makeLeg('call', 'long', strike)], spot);
  const cash = evalDecompositionTerm(decomposition, spot, 0);
  const shortShare = evalDecompositionTerm(decomposition, spot, 1);
  const rebuilt = evalDecomposition(decomposition, spot);
  const runningSum = evalDecompositionTerms(decomposition, spot, pieces);
  const left = stock + put;
  const right = cash + call;
  const exact = Math.abs(put - rebuilt) < 1e-9 && Math.abs(left - right) < 1e-9;

  const stepLabel = [
    'No parts yet',
    'Cash K',
    'Cash K minus one share',
    'Cash K minus one share plus one call',
  ][pieces];

  const controls = (
    <>
      <Segmented label="Put construction view" value={mode} onChange={setMode} options={[
        { value: 'pieces', label: 'Build the put', color: 'var(--c-put)' },
        { value: 'parity', label: 'Stock + put = call + cash', color: 'var(--c-call)' },
      ]} />
      <Slider label="Strike $\\Strike{K}$" value={strike} min={50} max={150} step={5}
        onChange={setStrike} format={(value) => '$' + value} color="var(--c-strike)" />
      {mode === 'pieces' && (
        <Slider label="Add building blocks" value={pieces} min={0} max={3}
          onChange={setPieces} format={(value) => value + ' / 3'} color="var(--c-call)" />
      )}
    </>
  );

  const readout = (
    <div data-testid="put-from-calls-readout">
      <p>
        At stock price <strong className="num">{'$' + spot}</strong> and strike{' '}
        <strong className="num">{'$' + strike}</strong>, the put pays{' '}
        <strong className="num" data-testid="put-payoff">{signedMoney(put)}</strong>.
      </p>
      {mode === 'pieces' ? (
        <>
          <p>
            <span style={{ color: 'var(--c-rate)' }}>Cash</span>{' '}
            <strong className="num" data-testid="cash-term">{signedMoney(cash)}</strong>
            {' + '}
            <span style={{ color: 'var(--c-spot)' }}>short share</span>{' '}
            <strong className="num" data-testid="stock-term">{signedMoney(shortShare)}</strong>
            {' + '}
            <span style={{ color: 'var(--c-call)' }}>call</span>{' '}
            <strong className="num" data-testid="call-term">{signedMoney(call)}</strong>
            {' = '}
            <strong className="num" data-testid="full-sum">{signedMoney(rebuilt)}</strong>.
          </p>
          <p>
            Step <strong className="num" data-testid="step-count">{pieces} / 3</strong>:{' '}
            {stepLabel}. Running sum{' '}
            <strong className="num" data-testid="running-sum">{signedMoney(runningSum)}</strong>.
          </p>
          <p className="muted">
            Dashed red: put. Thin dashed lines: the three terms (cash orange,
            short share blue, call green). Thick green: their running sum.
            At step 3 it lies exactly on the put.
          </p>
        </>
      ) : (
        <>
          <p>
            <span style={{ color: 'var(--c-put)' }}>Stock + put</span>{' '}
            <strong className="num" data-testid="parity-left">{signedMoney(left)}</strong>
            {' = '}
            <span style={{ color: 'var(--c-call)' }}>Call + cash</span>{' '}
            <strong className="num" data-testid="parity-right">{signedMoney(right)}</strong>.
          </p>
          <p className="muted">
            Dashed red: stock + put. Solid green: call + cash.
            The curves coincide for every stock price at expiry.
            This is a payoff identity, not an equality of today's unadjusted option prices.
          </p>
        </>
      )}
      <p className="muted" data-testid="put-exactness">
        {exact ? 'Exact identity at this price and across all plotted prices.' : 'Mismatch — check the inputs.'}
      </p>
    </div>
  );

  return (
    <PayoffFromCalls
      title="A put, assembled from calls"
      caption="Move the strike and inspect the payoff at expiry. First build the put from three pieces, then switch to the stock + put versus call + cash comparison. Values are dollars per share, before premiums."
      f0={strike} s0={-1} kinks={[{ strike, slopeAfter: 0 }]}
      initialSpot={90} display={mode === 'pieces' ? 'rebuild' : 'comparison'}
      comparisonShares={1} targetColor="var(--c-put)" showTermsInRebuild
      includedTerms={pieces} showStepSlider={false}
      onSpotChange={setSpot} extraControls={controls} extraReadout={readout}
      lockEdits showDisplayPicker={false} showTable={false} showReadout={false}
    />
  );
}
