import { Line, Point, Polyline, useTransformContext, vec } from 'mafs';
import { useState } from 'react';
import { breakevenPieces, breakevenPoints } from '../../lib/pricing/breakevens';
import { evalPiecewiseSlopes, type SlopeKink } from '../../lib/pricing/decompose';
import { Button, Select, Slider } from '../ui/controls';
import { WidgetFrame } from '../ui/WidgetFrame';
import { clamp, niceTicks } from './format';
import { Label, PlotFrame, Sub } from './PlotFrame';

type Preset = 'straddle' | 'bull' | 'butterfly' | 'custom';
interface Shape {
  f0: number;
  s0: number;
  kinks: SlopeKink[];
  cost: number;
}

// Use the exact reference numbers from tests/breakevens.test.ts.
// The diagram uses expiry payoff less net cost, never a pricing approximation.
const EXAMPLES: Record<Exclude<Preset, 'custom'>, Shape> = {
  straddle: { f0: 100, s0: -1, kinks: [{ strike: 100, slopeAfter: 1 }], cost: 16 },
  bull: { f0: 0, s0: 0, kinks: [
    { strike: 100, slopeAfter: 1 }, { strike: 115, slopeAfter: 0 },
  ], cost: 5.98 },
  butterfly: { f0: 0, s0: 0, kinks: [
    { strike: 90, slopeAfter: 1 }, { strike: 100, slopeAfter: -1 },
    { strike: 110, slopeAfter: 0 },
  ], cost: 2 },
};

const HEIGHT = 340;
const MAX_KINKS = 4;
const STRIKE_GAP = 5;

function fmt(n: number): string {
  return (Math.abs(n) < 0.000000001 ? 0 : n).toFixed(2);
}
function signed(n: number): string {
  return (n > 0 ? '+' : n < 0 ? '−' : '') + fmt(Math.abs(n));
}
function dollars(n: number): string {
  return '$' + fmt(n);
}

/** SVG overlay in the same transformed coordinates as PlotFrame's Mafs axes. */
function PieceBand({ from, to, bottom, top, active, alternating }: {
  from: number; to: number; bottom: number; top: number; active: boolean; alternating: boolean;
}) {
  const { viewTransform, userTransform } = useTransformContext();
  const transform = vec.matrixMult(viewTransform, userTransform);
  const corners: [number, number][] = [[from, bottom], [to, bottom], [to, top], [from, top]];
  return (
    <polygon
      points={corners.map((corner) => vec.transform(corner, transform).join(',')).join(' ')}
      fill="var(--c-strike)"
      fillOpacity={active ? 0.17 : alternating ? 0.065 : 0.025}
      stroke="none"
    />
  );
}

/** Hollow candidate: a solution of a line equation that is outside its interval. */
function RejectedCandidate({ x }: { x: number }) {
  const { viewTransform, userTransform } = useTransformContext();
  const [cx, cy] = vec.transform([x, 0], vec.matrixMult(viewTransform, userTransform));
  return <circle cx={cx} cy={cy} r={5} fill="var(--bg-inset)" stroke="var(--c-put)" strokeWidth={2} />;
}

/**
 * Solve each straight-line piece of a strategy's expiry profit.
 * All breakeven decisions and profit evaluations come from src/lib/pricing.
 * No motion is needed: controls redraw directly, including in reduced-motion mode.
 */
export default function BreakevenFinder() {
  const [preset, setPreset] = useState<Preset>('straddle');
  const [shape, setShape] = useState<Shape>(() => ({
    ...EXAMPLES.straddle, kinks: EXAMPLES.straddle.kinks.map((k) => ({ ...k })),
  }));
  const [selected, setSelected] = useState(0);

  const choosePreset = (next: Preset) => {
    setPreset(next);
    if (next !== 'custom') {
      const example = EXAMPLES[next];
      setShape({ ...example, kinks: example.kinks.map((k) => ({ ...k })) });
    }
    setSelected(0);
  };
  const changeShape = (update: (prior: Shape) => Shape, preserveStraddle = false) => {
    if (!(preserveStraddle && preset === 'straddle')) setPreset('custom');
    setShape(update);
  };
  const changeStrike = (index: number, strike: number) => {
    // Below a straddle's only strike, its put payoff at zero is exactly K.
    const isStraddle = preset === 'straddle' && shape.kinks.length === 1;
    changeShape((prior) => ({
      ...prior,
      f0: isStraddle ? strike : prior.f0,
      kinks: prior.kinks.map((k, i) => i === index ? { ...k, strike } : k),
    }), isStraddle);
  };
  const changeSlope = (index: number, slopeAfter: number) => changeShape((prior) => ({
    ...prior, kinks: prior.kinks.map((k, i) => i === index ? { ...k, slopeAfter } : k),
  }));
  const changeCost = (cost: number) => setShape((prior) => ({ ...prior, cost }));

  const { f0, s0, kinks, cost } = shape;
  const pieces = breakevenPieces(f0, s0, kinks, cost);
  const roots = breakevenPoints(f0, s0, kinks, cost);
  const index = Math.min(selected, pieces.length - 1);
  const piece = pieces[index];
  const hasZeroPlateau = pieces.some((p) => p.status === 'flat, zero everywhere');

  const maxRoot = roots.length ? Math.max(...roots) : 0;
  const xMax = Math.max(160, Math.ceil((Math.max(maxRoot, kinks[kinks.length - 1].strike) + 20) / 20) * 20);
  const X: [number, number] = [0, xMax];
  const profit = (s: number) => evalPiecewiseSlopes(f0, s0, kinks, s) - cost;
  const xs = [0, ...kinks.map((k) => k.strike), xMax];
  const ys = [0, ...xs.map(profit)];
  const lower = Math.min(...ys);
  const upper = Math.max(...ys);
  const padding = Math.max(4, 0.12 * (upper - lower));
  const ticks = niceTicks(lower - padding, upper + padding, 5);
  const Y: [number, number] = [Math.min(lower - padding, ticks[0]), Math.max(upper + padding, ticks[ticks.length - 1])];
  const xTicks = Array.from({ length: 7 }, (_, i) => xMax * i / 6);

  const right = Math.min(piece.to, xMax);
  const candidateVisible = piece.candidate !== null
    && Number.isFinite(piece.candidate) && piece.candidate >= X[0] && piece.candidate <= X[1];
  const rejected = !piece.valid && candidateVisible && piece.candidate !== null;
  // The extended segment is a visualisation of the library's candidate equation,
  // not a second breakeven calculation. Only the selected piece is extended.
  const extendedEnd = rejected ? piece.candidate! : right;
  const extendedProfit = piece.profitAtFrom + piece.slope * (extendedEnd - piece.from);

  const plot = (
    <PlotFrame
      x={X} y={Y} height={HEIGHT} xTicks={xTicks} yTicks={ticks}
      formatX={(v) => '$' + Math.round(v)} formatY={signed}
      xLabel={<>stock price at expiry <Sub base="S" sub="T" /></>}
      yLabel="profit ($ per share)" baseline={0} marginLeft={55}
    >
      {pieces.map((p, i) => (
        <PieceBand key={'band-' + i}
          from={p.from} to={Math.min(p.to, xMax)} bottom={Y[0]} top={Y[1]}
          active={i === index} alternating={i % 2 === 0} />
      ))}
      {kinks.map((k) => (
        <Line.Segment key={'strike-' + k.strike}
          point1={[k.strike, Y[0]]} point2={[k.strike, Y[1]]}
          color="var(--c-strike)" opacity={0.55} weight={1} style="dashed" />
      ))}
      <Polyline points={xs.map((s) => [s, profit(s)] as [number, number])}
        color="var(--text)" weight={3.5} fillOpacity={0} />
      {piece.from < right && (
        <Line.Segment point1={[piece.from, piece.profitAtFrom]} point2={[right, profit(right)]}
          color="var(--c-spot)" weight={4} opacity={0.85} />
      )}
      {rejected && (
        <>
          <Line.Segment point1={[piece.from, piece.profitAtFrom]}
            point2={[extendedEnd, extendedProfit]}
            color="var(--c-put)" weight={2} opacity={0.85} style="dashed" />
          <RejectedCandidate x={piece.candidate!} />
          <Label x={piece.candidate!} y={0} attach="n" attachDistance={12}
            color="var(--c-put)" size={11}>rejected {dollars(piece.candidate!)}</Label>
        </>
      )}
      {roots.filter((root) => root >= X[0] && root <= X[1]).map((root, i) => (
        <g key={'root-' + i}>
          <Point x={root} y={0} color="var(--c-call)" />
          <Label x={root} y={0} attach={i % 2 ? 'ne' : 'nw'} attachDistance={13}
            color="var(--c-call)" size={12}>{dollars(root)}</Label>
        </g>
      ))}
    </PlotFrame>
  );

  const canAdd = kinks.length < MAX_KINKS && kinks[kinks.length - 1].strike <= 140;
  const controls = (
    <div className="strategy-controls">
      <Select label="Strategy preset" value={preset} onChange={choosePreset} options={[
        { value: 'straddle', label: 'Long straddle' },
        { value: 'bull', label: 'Bull call spread' },
        { value: 'butterfly', label: 'Long butterfly' },
        { value: 'custom', label: 'Custom (keep current shape)' },
      ]} />
      <Slider label="Net cost today" value={cost} min={-20} max={40} step={0.5}
        onChange={changeCost} format={(n) => signed(n) + ' per share'} color="var(--c-put)" />
      <div className="widget-controls">
        <Slider label="Payoff at zero $f(0)$" value={f0} min={-20} max={150}
          onChange={(next) => changeShape((prior) => ({ ...prior, f0: next }))}
          color="var(--c-rate)" format={fmt} />
        <Slider label="Slope before first kink $s_0$" value={s0} min={-2} max={2} step={0.25}
          onChange={(next) => changeShape((prior) => ({ ...prior, s0: next }))}
          color="var(--c-spot)" format={signed} />
      </div>
      <ol className="legs" aria-label="Edit payoff kinks">
        {kinks.map((k, i) => {
          const min = i ? kinks[i - 1].strike + STRIKE_GAP : 20;
          const max = i < kinks.length - 1 ? kinks[i + 1].strike - STRIKE_GAP : 150;
          return (
            <li key={'kink-' + i} className="leg" style={{ ['--leg' as string]: 'var(--c-strike)' }}>
              <span className="leg-name">Kink {i + 1}: {dollars(k.strike)}</span>
              <div className="leg-edit">
                <Slider label={'Strike K' + (i + 1)} value={k.strike} min={min} max={max}
                  onChange={(next) => changeStrike(i, clamp(next, min, max))}
                  format={dollars} color="var(--c-strike)" />
                <Slider label={'Slope after kink ' + (i + 1)} value={k.slopeAfter}
                  min={-2} max={2} step={0.25}
                  onChange={(next) => changeSlope(i, next)} format={signed} color="var(--c-call)" />
                <Button disabled={kinks.length <= 1} onClick={() => {
                  changeShape((prior) => ({ ...prior, kinks: prior.kinks.filter((_, j) => j !== i) }));
                  setSelected(0);
                }}>Remove kink</Button>
              </div>
            </li>
          );
        })}
      </ol>
      <Button disabled={!canAdd} onClick={() => {
        changeShape((prior) => ({
          ...prior, kinks: [...prior.kinks, {
            strike: prior.kinks[prior.kinks.length - 1].strike + 10,
            slopeAfter: prior.kinks[prior.kinks.length - 1].slopeAfter + 0.5,
          }],
        }));
      }}>+ Add kink ({kinks.length} of {MAX_KINKS})</Button>
      <div className="widget-controls">
        <Button onClick={() => setSelected((index + 1) % pieces.length)}>
          Solve piece {index + 1} / {pieces.length} → next
        </Button>
      </div>
    </div>
  );

  const readout = (
    <>
      <p aria-label="Final breakevens">
        <strong>Breakevens: </strong>
        <strong style={{ color: 'var(--c-call)' }}>{roots.length
          ? roots.map(dollars).join(' and ') : 'no breakeven'}</strong>
        {hasZeroPlateau && <span className="muted"> · A flat zero-profit piece also contains infinitely many breakeven prices.</span>}
      </p>
      {preset === 'straddle' && (
        <p aria-label="Straddle formula check">
          <strong>Straddle check:</strong> K ± (C + P) = {fmt(kinks[0].strike)} ± {fmt(cost)}
          {' = '}{dollars(kinks[0].strike - cost)} and {dollars(kinks[0].strike + cost)}.
          {' '}Only candidates inside their pieces count.
        </p>
      )}
      <div style={{ overflowX: 'auto', marginTop: '0.75rem', width: '100%' }}>
        <table className="iter-table" style={{ width: '100%' }} aria-label="Breakeven pieces">
          <thead><tr>
            <th scope="col" style={{ textAlign: 'left' }}>Piece</th>
            <th scope="col">Slope</th>
            <th scope="col">Profit at start</th>
            <th scope="col">Candidate root</th>
            <th scope="col">Accepted?</th>
          </tr></thead>
          <tbody>
            {pieces.map((p, i) => (
              <tr key={'piece-' + i} style={{
                background: i === index ? 'color-mix(in srgb, var(--c-spot) 10%, transparent)' : undefined,
              }}>
                <td style={{ textAlign: 'left' }}>
                  <button type="button" className="ctl-button" style={{ padding: '0 0.3rem' }}
                    aria-label={'Inspect piece ' + (i + 1)}
                    aria-pressed={i === index} onClick={() => setSelected(i)}>
                    {fmt(p.from)}–{p.to === Infinity ? '∞' : fmt(p.to)}
                  </button>
                </td>
                <td>{signed(p.slope)}</td>
                <td>{signed(p.profitAtFrom)}</td>
                <td>{p.candidate === null ? 'flat' : fmt(p.candidate)}</td>
                <td style={{ color: p.valid ? 'var(--c-call)' : 'var(--c-put)' }}>
                  {p.valid ? 'yes' : 'no'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div aria-label="Selected piece arithmetic" style={{ marginTop: '0.7rem' }}>
        <p><strong>Piece {index + 1}:</strong> {dollars(piece.from)} to{' '}
          {piece.to === Infinity ? '∞' : dollars(piece.to)}.
          {' '}Anchor A = {fmt(piece.from)}; profit(A) = {signed(piece.profitAtFrom)};
          {' '}s = {signed(piece.slope)}.</p>
        <p>
          {piece.candidate === null
            ? 'Flat (s = 0): ' + (piece.status === 'flat, zero everywhere'
              ? 'profit is zero everywhere in this piece; there is no isolated candidate.'
              : 'profit never reaches zero on this piece.')
            : 'Solve A − profit(A)/s = ' + fmt(piece.from) + ' − (' +
              signed(piece.profitAtFrom) + ')/(' + signed(piece.slope) + ') = ' +
              fmt(piece.candidate) + '. Inside this piece: ' + (piece.valid ? 'yes (accepted)' : 'no (rejected)') + '.'}
        </p>
      </div>
    </>
  );

  return (
    <WidgetFrame
      title="Find the breakevens, one piece at a time"
      ariaLabel={'Expiry profit with ' + pieces.length + ' straight pieces. Breakevens: ' +
        (roots.length ? roots.map(dollars).join(', ') : 'none') + '. Selected piece ' + (index + 1) + '.'}
      plotHeight={HEIGHT} plot={plot} controls={controls} readout={readout}
      caption="Shaded bands are the linear pieces. The highlighted piece is solved below; filled green dots are valid breakevens, and a hollow red dot is a rejected candidate outside its piece. All numbers are per share at expiry."
    />
  );
}
