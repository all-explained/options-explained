import { Line, MovablePoint, Point, Polyline } from 'mafs';
import { useEffect, useState, type ReactNode } from 'react';
import {
  decomposeSlopes, evalDecomposition, evalDecompositionTerm,
  evalDecompositionTerms, evalPiecewiseSlopes, type SlopeKink,
} from '../../lib/pricing/decompose';
import { Button, Segmented, Slider } from '../ui/controls';
import { WidgetFrame } from '../ui/WidgetFrame';
import { useTweened } from './animation';
import { clamp, niceTicks, signedMoney } from './format';
import { Label, PlotFrame, Sub } from './PlotFrame';

type View = 'rebuild' | 'terms' | 'payoff' | 'comparison';

export interface PayoffFromCallsProps {
  title?: string;
  caption?: string;
  /** Initial f(0), the cash payoff at expiry. */
  f0?: number;
  /** Slope on [0, first strike): equivalent to a signed share quantity. */
  s0?: number;
  /** One to five (strike, slope immediately after strike) pairs. */
  kinks?: readonly SlopeKink[];
  initialSpot?: number;
  /** Initial view; can also be changed by a parent preset. */
  display?: View;
  /** Add this many shares to both sides of the payoff identity. */
  comparisonShares?: number;
  showTermsInRebuild?: boolean;
  targetColor?: string;
  includedTerms?: number;
  showStepSlider?: boolean;
  onSpotChange?: (spot: number) => void;
  extraControls?: ReactNode;
  extraReadout?: ReactNode;
  lockEdits?: boolean;
  lockCash?: boolean;
  lockShares?: boolean;
  lockStrikes?: boolean;
  lockSlopes?: boolean;
  lockKinkCount?: boolean;
  showDisplayPicker?: boolean;
  showTable?: boolean;
  showReadout?: boolean;
}

const DEFAULT_KINKS: readonly SlopeKink[] = [
  { strike: 90, slopeAfter: 1 },
  { strike: 100, slopeAfter: -1 },
  { strike: 110, slopeAfter: 0 },
];
const MIN_STRIKE = 10;
const GAP = 5;
const HEIGHT = 330;

function sortedKinks(input: readonly SlopeKink[]): SlopeKink[] {
  if (input.length < 1 || input.length > 5) {
    throw new RangeError('The widget needs between one and five kinks');
  }
  return input.map((k) => ({ ...k })).sort((a, b) => a.strike - b.strike);
}

function signed(v: number): string {
  const rounded = Math.abs(v) < 1e-9 ? 0 : Number(v.toFixed(2));
  return (rounded > 0 ? '+' : rounded < 0 ? '−' : '') + String(Math.abs(rounded));
}

function newKinkPosition(kinks: readonly SlopeKink[], max: number): { strike: number; after: number } | null {
  const boundaries = [MIN_STRIKE, ...kinks.map((k) => k.strike), max - MIN_STRIKE];
  let best = -1;
  let widest = 0;
  for (let i = 0; i < boundaries.length - 1; i++) {
    const width = boundaries[i + 1] - boundaries[i];
    if (width >= GAP * 2 && width > widest) {
      best = i;
      widest = width;
    }
  }
  if (best < 0) return null;
  return {
    strike: Math.round((boundaries[best] + boundaries[best + 1]) / 2),
    after: best === 0 ? 0 : kinks[best - 1].slopeAfter,
  };
}

/**
 * Edit any continuous 1–5-kink expiry payoff. Independently reconstruct its
 * graph from cash, shares and signed calls. Math is delegated to src/lib.
 */
export default function PayoffFromCalls({
  title = 'Any payoff from calls',
  caption = 'Drag a yellow kink to change its strike; change its right-hand slope to change the call quantity. These are expiry payoffs per share, not option prices today.',
  f0 = 0,
  s0 = 0,
  kinks: presetKinks = DEFAULT_KINKS,
  initialSpot = 105,
  display = 'rebuild',
  comparisonShares = 0,
  showTermsInRebuild = false,
  targetColor = 'var(--text)',
  includedTerms,
  showStepSlider = true,
  onSpotChange,
  extraControls,
  extraReadout,
  lockEdits = false,
  lockCash = false,
  lockShares = false,
  lockStrikes = false,
  lockSlopes = false,
  lockKinkCount = false,
  showDisplayPicker = true,
  showTable = true,
  showReadout = true,
}: PayoffFromCallsProps) {
  const presetKey = JSON.stringify(presetKinks);
  const [cash, setCash] = useState(f0);
  const [shares, setShares] = useState(s0);
  const [bends, setBends] = useState<SlopeKink[]>(() => sortedKinks(presetKinks));
  const [view, setView] = useState<View>(display);
  const [spot, setSpot] = useState(initialSpot);
  const [included, setIncluded] = useState(2 + presetKinks.length);

  // External preset updates propagate without resetting subsequent local edits.
  useEffect(() => setCash(f0), [f0]);
  useEffect(() => setShares(s0), [s0]);
  useEffect(() => {
    const next = sortedKinks(presetKinks);
    setBends(next);
    setIncluded(2 + next.length);
  }, [presetKey]);
  useEffect(() => setView(display), [display]);
  useEffect(() => setSpot(initialSpot), [initialSpot]);

  const lastStrike = bends[bends.length - 1].strike;
  const xMax = Math.max(160, Math.ceil((lastStrike + 20) / 20) * 20);
  const X: [number, number] = [0, xMax];
  const currentSpot = clamp(spot, ...X);

  const decomposition = decomposeSlopes(cash, shares, bends);
  const count = 2 + decomposition.calls.length;
  const shown = Math.max(0, Math.min(includedTerms ?? included, count));
  const original = (s: number) => evalPiecewiseSlopes(cash, shares, bends, s);
  const partial = (s: number) => evalDecompositionTerms(decomposition, s, shown);
  // Comparison overlays an identical share position on each side.
  const comparisonOriginal = (s: number) => original(s) + comparisonShares * s;
  const comparisonRebuilt = (s: number) => evalDecomposition(decomposition, s) + comparisonShares * s;
  const plotOriginal = view === 'comparison' ? comparisonOriginal : original;
  // Piecewise lines need only their breakpoints and endpoints to plot exactly.
  const xs = [0, ...bends.map((k) => k.strike), xMax];
  const allYs = [
    0, ...xs.map(original),
    ...(view === 'rebuild' ? xs.map(partial) : []),
    ...(view === 'comparison' ? [...xs.map(comparisonOriginal), ...xs.map(comparisonRebuilt)] : []),
    ...(view === 'terms' || (view === 'rebuild' && showTermsInRebuild)
      ? Array.from({ length: count }, (_, i) =>
      xs.map((s) => evalDecompositionTerm(decomposition, s, i))).flat() : []),
  ];
  const lo = Math.min(...allYs);
  const hi = Math.max(...allYs);
  const pad = Math.max(5, (hi - lo) * 0.12);
  const yTicks = niceTicks(lo - pad, hi + pad, 5);
  const Y: [number, number] = [Math.min(lo - pad, yTicks[0]), Math.max(hi + pad, yTicks[yTicks.length - 1])];
  const xTicks = Array.from({ length: 9 }, (_, i) => (xMax * i) / 8);
  const opacity = useTweened(view === 'rebuild' ? 1 : 0, 350);

  const exact = xs.every((s) => Math.abs(original(s) - evalDecomposition(decomposition, s)) < 1e-8)
    && xs.slice(1).every((s, i) =>
      Math.abs(original((xs[i] + s) / 2) - evalDecomposition(decomposition, (xs[i] + s) / 2)) < 1e-8);
  const originalAtSpot = original(currentSpot);
  const plottedAtSpot = plotOriginal(currentSpot);
  const partialAtSpot = partial(currentSpot);
  const changeSpot = (next: number) => {
    const value = Math.round(clamp(next, ...X));
    setSpot(value);
    onSpotChange?.(value);
  };
  const isComplete = shown === count;
  const changeStrike = (index: number, strike: number) =>
    setBends((prior) => prior.map((b, i) => i === index ? { ...b, strike } : b));
  const changeSlope = (index: number, slopeAfter: number) =>
    setBends((prior) => prior.map((b, i) => i === index ? { ...b, slopeAfter } : b));
  const canEdit = !lockEdits;
  const canMoveStrikes = canEdit && !lockStrikes;
  const canChangeSlopes = canEdit && !lockSlopes;
  const canChangeCount = canEdit && !lockKinkCount;
  const proposal = newKinkPosition(bends, xMax);

  const plot = (
    <PlotFrame
      x={X} y={Y} height={HEIGHT} xTicks={xTicks} yTicks={yTicks}
      formatX={(v) => '$' + Math.round(v)} formatY={signed}
      xLabel={<>stock price at expiry <Sub base="S" sub="T" /></>}
      yLabel="payoff ($ per share)" baseline={0} marginLeft={48}
    >
      {bends.map((k, i) => (
        <Line.Segment key={'strike-' + i} point1={[k.strike, Y[0]]} point2={[k.strike, Y[1]]}
          color="var(--c-strike)" style="dashed" weight={1} opacity={0.4} />
      ))}
      {(view === 'terms' || (view === 'rebuild' && showTermsInRebuild)) && Array.from({ length: count }, (_, i) => (
        <Polyline key={'term-' + i}
          points={xs.map((s) => [s, evalDecompositionTerm(decomposition, s, i)] as [number, number])}
          color={i === 0 ? 'var(--c-rate)' : i === 1 ? 'var(--c-spot)' : 'var(--c-call)'}
          weight={2} strokeStyle="dashed" strokeOpacity={0.72} fillOpacity={0} />
      ))}
      {view === 'comparison' ? (
        <>
          <Polyline points={xs.map((s) => [s, comparisonRebuilt(s)] as [number, number])}
            color="var(--c-call)" weight={4} fillOpacity={0} />
          <Polyline points={xs.map((s) => [s, comparisonOriginal(s)] as [number, number])}
            color="var(--c-put)" weight={3} strokeStyle="dashed" fillOpacity={0} />
        </>
      ) : (
        <Polyline points={xs.map((s) => [s, original(s)] as [number, number])}
          color={targetColor} weight={3.5} strokeStyle="dashed" fillOpacity={0} />
      )}
      {view === 'rebuild' && (
        <Polyline points={xs.map((s) => [s, partial(s)] as [number, number])}
          color="var(--c-call)" weight={4} strokeOpacity={opacity} fillOpacity={0} />
      )}
      <Line.Segment point1={[currentSpot, 0]} point2={[currentSpot, plottedAtSpot]}
        color="var(--c-spot)" style="dashed" weight={1} opacity={0.75} />
      <Label x={currentSpot} y={plottedAtSpot} attach="nw" attachDistance={14}
        color="var(--c-spot)" size={12}>{signedMoney(plottedAtSpot)}</Label>
      <MovablePoint point={[currentSpot, plottedAtSpot]} color="var(--c-spot)"
        onMove={([x]) => changeSpot(x)}
        constrain={([x]) => { const s = clamp(x, ...X); return [s, plotOriginal(s)]; }} />
      {bends.map((k, i) => {
        const min = i === 0 ? MIN_STRIKE : bends[i - 1].strike + GAP;
        const max = i === bends.length - 1 ? xMax - MIN_STRIKE : bends[i + 1].strike - GAP;
        const y = plotOriginal(k.strike);
        return (
          <g key={'handle-' + i}>
            {canMoveStrikes && max > min ? (
              <MovablePoint point={[k.strike, y]} color="var(--c-strike)"
                onMove={([x]) => changeStrike(i, Math.round(clamp(x, min, max)))}
                constrain={([x]) => {
                  const nextX = clamp(x, min, max);
                  const moved = bends.map((b, j) => j === i ? { ...b, strike: nextX } : b);
                  return [nextX, evalPiecewiseSlopes(cash, shares, moved, nextX)];
                }} />
            ) : <Point x={k.strike} y={y} color="var(--c-strike)" />}
            <Label x={k.strike} y={y} attach={i % 2 === 0 ? 'n' : 's'}
              attachDistance={14} color="var(--c-strike)" size={11}>{'K' + (i + 1)}</Label>
          </g>
        );
      })}
    </PlotFrame>
  );

  const controls = (
    <div className="strategy-controls">
      <div className="widget-controls">
        {extraControls}
        {showDisplayPicker && (
          <Segmented label="Show decomposition" value={view} onChange={setView} options={[
            { value: 'rebuild', label: 'Rebuild', color: 'var(--c-call)' },
            { value: 'terms', label: 'Each term' },
            { value: 'payoff', label: 'Payoff only' },
          ]} />
        )}
        {canEdit && !lockCash && (
          <Slider label="Cash payoff $f(0)$" value={cash} min={-50} max={150} step={1}
            onChange={setCash} format={signed} color="var(--c-rate)" />
        )}
        {canEdit && !lockShares && (
          <Slider label="Initial slope $s_0$ (shares)" value={shares} min={-2} max={2} step={0.25}
            onChange={setShares} format={signed} color="var(--c-spot)" />
        )}
        <Slider label="Inspect expiry price $S_T$" value={currentSpot} min={0} max={xMax}
          onChange={changeSpot} format={(v) => '
        {view === 'rebuild' && showStepSlider && (
          <Slider label="Running sum: terms included" value={shown} min={0} max={count}
            onChange={setIncluded} format={(v) => String(v) + ' / ' + count} color="var(--c-call)" />
        )}
      </div>
      {(canMoveStrikes || canChangeSlopes || canChangeCount) && (
        <>
          <ol className="legs" aria-label="Payoff kinks">
            {bends.map((k, i) => {
              const min = i === 0 ? MIN_STRIKE : bends[i - 1].strike + GAP;
              const max = i === bends.length - 1 ? xMax - MIN_STRIKE : bends[i + 1].strike - GAP;
              const before = i === 0 ? shares : bends[i - 1].slopeAfter;
              return (
                <li className="leg" key={i} style={{ ['--leg' as string]: 'var(--c-strike)' }}>
                  <span className="leg-name">
                    Kink {i + 1}: strike {'$' + k.strike}; slope {signed(before)} to {signed(k.slopeAfter)};
                    calls {signed(k.slopeAfter - before)}
                  </span>
                  <div className="leg-edit">
                    {canMoveStrikes && max > min && (
                      <Slider label={'Strike K' + (i + 1)} value={k.strike} min={min} max={max}
                        onChange={(value) => changeStrike(i, value)}
                        format={(value) => '$' + value} color="var(--c-strike)" />
                    )}
                    {canChangeSlopes && (
                      <Slider label={'Slope after kink ' + (i + 1)} value={k.slopeAfter} min={-2} max={2} step={0.25}
                        onChange={(value) => changeSlope(i, value)} format={signed} color="var(--c-call)" />
                    )}
                    {canChangeCount && (
                      <Button disabled={bends.length <= 1} onClick={() => {
                        setBends((current) => current.filter((_, j) => j !== i));
                        setIncluded(count - 1);
                      }}>Remove kink {i + 1}</Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
          {canChangeCount && (
            <Button disabled={bends.length >= 5 || !proposal} onClick={() => {
              if (!proposal) return;
              setBends((current) => [...current, { strike: proposal.strike, slopeAfter: proposal.after + 0.5 }]
                .sort((a, b) => a.strike - b.strike));
              setIncluded(count + 1);
            }}>+ Add kink ({bends.length} of 5)</Button>
          )}
        </>
      )}
    </div>
  );

  const rows = [
    { name: 'Cash', quantity: signed(decomposition.cash), term: 'f(0)', color: 'var(--c-rate)' },
    { name: 'Shares', quantity: signed(decomposition.shares), term: 's₀ × S', color: 'var(--c-spot)' },
    ...decomposition.calls.map((c, i) => ({
      name: 'Call at $' + c.strike,
      quantity: signed(c.quantity),
      term: '(s' + (i + 1) + ' − s' + i + ') × (S − ' + c.strike + ')⁺',
      color: 'var(--c-call)',
    })),
  ];

  const readout = (
    <>
      {showTable && (
        <table className="iter-table" aria-label="Replicating cash, shares and calls" style={{ width: '100%' }}>
          <thead><tr>
            <th scope="col" style={{ textAlign: 'left' }}>Building block</th>
            <th scope="col">Quantity</th>
            <th scope="col">Payoff term</th>
          </tr></thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ color: row.color }}>
                <td style={{ textAlign: 'left' }}>{row.name}</td>
                <td>{row.quantity}</td>
                <td>{row.term}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {showReadout && (
        <div style={{ marginTop: showTable ? '0.65rem' : 0 }}>
          <p>At <strong className="num" style={{ color: 'var(--c-spot)' }}>{'$' + currentSpot}</strong>: drawn payoff{' '}
            <strong className="num">{signedMoney(originalAtSpot)}</strong>;{' '}
            {isComplete ? 'rebuilt payoff' : 'partial sum'}{' '}
            <strong className="num" style={{ color: 'var(--c-call)' }}>{signedMoney(partialAtSpot)}</strong>.
          </p>
          <p className="muted">
            {view === 'rebuild' ? 'Running sum: ' + shown + ' of ' + count + ' terms. ' : ''}
            {exact && isComplete
              ? 'Exact match at every plotted price (and between kinks).'
              : exact ? 'All terms together exactly reproduce the drawn payoff.' : 'Reconstruction mismatch — check the inputs.'}
          </p>
        </div>
      )}
      {extraReadout}
    </>
  );

  return (
    <WidgetFrame
      title={title}
      ariaLabel={'Payoff with ' + bends.length + ' kinks. The continuous piecewise line is ' +
        (exact ? 'exactly reconstructed' : 'not reconstructed') + ' by ' +
        decomposition.cash + ' cash, ' + decomposition.shares + ' shares and ' +
        decomposition.calls.map((c) => signed(c.quantity) + ' calls at $' + c.strike).join(', ') + '.'}
      plotHeight={HEIGHT} plot={plot} controls={controls}
      readout={showTable || showReadout || extraReadout ? readout : undefined} caption={caption}
    />
  );
}
 + v} color="var(--c-spot)" />
        {view === 'rebuild' && (
          <Slider label="Running sum: terms included" value={shown} min={0} max={count}
            onChange={setIncluded} format={(v) => String(v) + ' / ' + count} color="var(--c-call)" />
        )}
      </div>
      {(canMoveStrikes || canChangeSlopes || canChangeCount) && (
        <>
          <ol className="legs" aria-label="Payoff kinks">
            {bends.map((k, i) => {
              const min = i === 0 ? MIN_STRIKE : bends[i - 1].strike + GAP;
              const max = i === bends.length - 1 ? xMax - MIN_STRIKE : bends[i + 1].strike - GAP;
              const before = i === 0 ? shares : bends[i - 1].slopeAfter;
              return (
                <li className="leg" key={i} style={{ ['--leg' as string]: 'var(--c-strike)' }}>
                  <span className="leg-name">
                    Kink {i + 1}: strike {'$' + k.strike}; slope {signed(before)} to {signed(k.slopeAfter)};
                    calls {signed(k.slopeAfter - before)}
                  </span>
                  <div className="leg-edit">
                    {canMoveStrikes && max > min && (
                      <Slider label={'Strike K' + (i + 1)} value={k.strike} min={min} max={max}
                        onChange={(value) => changeStrike(i, value)}
                        format={(value) => '$' + value} color="var(--c-strike)" />
                    )}
                    {canChangeSlopes && (
                      <Slider label={'Slope after kink ' + (i + 1)} value={k.slopeAfter} min={-2} max={2} step={0.25}
                        onChange={(value) => changeSlope(i, value)} format={signed} color="var(--c-call)" />
                    )}
                    {canChangeCount && (
                      <Button disabled={bends.length <= 1} onClick={() => {
                        setBends((current) => current.filter((_, j) => j !== i));
                        setIncluded(count - 1);
                      }}>Remove kink {i + 1}</Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
          {canChangeCount && (
            <Button disabled={bends.length >= 5 || !proposal} onClick={() => {
              if (!proposal) return;
              setBends((current) => [...current, { strike: proposal.strike, slopeAfter: proposal.after + 0.5 }]
                .sort((a, b) => a.strike - b.strike));
              setIncluded(count + 1);
            }}>+ Add kink ({bends.length} of 5)</Button>
          )}
        </>
      )}
    </div>
  );

  const rows = [
    { name: 'Cash', quantity: signed(decomposition.cash), term: 'f(0)', color: 'var(--c-rate)' },
    { name: 'Shares', quantity: signed(decomposition.shares), term: 's₀ × S', color: 'var(--c-spot)' },
    ...decomposition.calls.map((c, i) => ({
      name: 'Call at $' + c.strike,
      quantity: signed(c.quantity),
      term: '(s' + (i + 1) + ' − s' + i + ') × (S − ' + c.strike + ')⁺',
      color: 'var(--c-call)',
    })),
  ];

  const readout = (
    <>
      {showTable && (
        <table className="iter-table" aria-label="Replicating cash, shares and calls" style={{ width: '100%' }}>
          <thead><tr>
            <th scope="col" style={{ textAlign: 'left' }}>Building block</th>
            <th scope="col">Quantity</th>
            <th scope="col">Payoff term</th>
          </tr></thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ color: row.color }}>
                <td style={{ textAlign: 'left' }}>{row.name}</td>
                <td>{row.quantity}</td>
                <td>{row.term}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {showReadout && (
        <div style={{ marginTop: showTable ? '0.65rem' : 0 }}>
          <p>At <strong className="num" style={{ color: 'var(--c-spot)' }}>{'$' + currentSpot}</strong>: drawn payoff{' '}
            <strong className="num">{signedMoney(originalAtSpot)}</strong>;{' '}
            {isComplete ? 'rebuilt payoff' : 'partial sum'}{' '}
            <strong className="num" style={{ color: 'var(--c-call)' }}>{signedMoney(partialAtSpot)}</strong>.
          </p>
          <p className="muted">
            {view === 'rebuild' ? 'Running sum: ' + shown + ' of ' + count + ' terms. ' : ''}
            {exact && isComplete
              ? 'Exact match at every plotted price (and between kinks).'
              : exact ? 'All terms together exactly reproduce the drawn payoff.' : 'Reconstruction mismatch — check the inputs.'}
          </p>
        </div>
      )}
    </>
  );

  return (
    <WidgetFrame
      title={title}
      ariaLabel={'Payoff with ' + bends.length + ' kinks. The continuous piecewise line is ' +
        (exact ? 'exactly reconstructed' : 'not reconstructed') + ' by ' +
        decomposition.cash + ' cash, ' + decomposition.shares + ' shares and ' +
        decomposition.calls.map((c) => signed(c.quantity) + ' calls at $' + c.strike).join(', ') + '.'}
      plotHeight={HEIGHT} plot={plot} controls={controls}
      readout={showTable || showReadout ? readout : undefined} caption={caption}
    />
  );
}
