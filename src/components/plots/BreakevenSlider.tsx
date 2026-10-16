import { Line, MovablePoint, Point, Polyline } from 'mafs';
import { useState } from 'react';
import { BREAKEVEN_EXAMPLES, type BreakevenExampleKey } from '../../lib/pricing/breakevenExamples';
import { breakevens, kinks, strategyProfit } from '../../lib/pricing/strategy';
import { Button, Segmented } from '../ui/controls';
import { WidgetFrame } from '../ui/WidgetFrame';
import { clamp, money, niceTicks } from './format';
import { Label, PlotFrame, Sub } from './PlotFrame';

const X: [number, number] = [60, 140];
const Y: Record<BreakevenExampleKey, [number, number]> = {
  bull: [-10, 12],
  straddle: [-20, 30],
  butterfly: [-4, 10],
};
const HEIGHT = 320;
/** The readout names a breakeven when the point is this close ($). */
const NEAR = 0.5;

/** $84 for a whole-dollar breakeven, $105.98 otherwise. */
const price = (v: number) => money(v, Math.abs(v - Math.round(v)) < 0.005 ? 0 : 2);

/**
 * Chapter 5: drag the stock price along a strategy's profit line. The profit is
 * green above zero and red below it; the breakeven is where it crosses zero.
 * All maths comes from src/lib/pricing (strategy.ts, breakevenExamples.ts).
 */
export default function BreakevenSlider() {
  const [key, setKey] = useState<BreakevenExampleKey>('bull');
  const [spot, setSpot] = useState(100);
  const [show, setShow] = useState(false);

  const { legs } = BREAKEVEN_EXAMPLES[key];
  const y = Y[key];
  const profit = (s: number) => strategyProfit(legs, s);
  const roots = breakevens(legs);

  // Split the line at every kink and crossing so each piece is wholly green or wholly red.
  const cuts = [X[0], ...[...kinks(legs), ...roots].filter((v) => v > X[0] && v < X[1]), X[1]].sort((a, b) => a - b);
  const pieces = cuts.slice(1).map((b, i) => {
    const a = cuts[i];
    return { a, b, gain: profit((a + b) / 2) > 0 };
  });

  const here = profit(spot);
  const rounded = Number(here.toFixed(2));
  const sign = rounded > 0 ? 'good' : rounded < 0 ? 'bad' : '';
  const near = roots.some((r) => Math.abs(spot - r) <= NEAR);

  const plot = (
    <PlotFrame
      x={X}
      y={y}
      height={HEIGHT}
      xTicks={niceTicks(X[0], X[1], 4)}
      yTicks={niceTicks(y[0], y[1], 5)}
      formatX={(v) => `$${v}`}
      formatY={(v) => (v > 0 ? `+${v}` : v < 0 ? `−${-v}` : '0')}
      baseline={0}
      xLabel={<>stock price at expiry <Sub base="S" sub="T" /></>}
      yLabel="profit ($)"
    >
      {pieces.map((p) => (
        <Polyline
          key={`${p.a}-${p.b}`}
          points={[[p.a, profit(p.a)], [p.b, profit(p.b)]]}
          color={p.gain ? 'var(--c-call)' : 'var(--c-put)'}
          weight={4}
          fillOpacity={0}
        />
      ))}
      {show && roots.map((r) => {
        const rising = profit(r + 1) > profit(r - 1);
        return (
          <g key={r}>
            <Point x={r} y={0} color="var(--text)" />
            <Label x={r} y={0} attach={rising ? 'se' : 'sw'} attachDistance={10} size={12} color="var(--text)">
              {price(r)}
            </Label>
          </g>
        );
      })}
      <Line.Segment point1={[spot, 0]} point2={[spot, here]} color="var(--c-spot)" style="dashed" weight={1.5} />
      <MovablePoint
        point={[spot, here]}
        color="var(--c-spot)"
        onMove={([x]) => setSpot(Math.round(clamp(x, ...X) * 2) / 2)}
        constrain={([x]) => {
          const xc = Math.round(clamp(x, ...X) * 2) / 2;
          return [xc, profit(xc)];
        }}
      />
    </PlotFrame>
  );

  const controls = (
    <>
      <Segmented label="Strategy" value={key} onChange={setKey} options={
        (Object.keys(BREAKEVEN_EXAMPLES) as BreakevenExampleKey[]).map((k) => ({ value: k, label: BREAKEVEN_EXAMPLES[k].name }))
      } />
      <Button onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'} the breakevens</Button>
    </>
  );

  const readout = (
    <>
      <p>
        If the stock ends at <strong className="num" style={{ color: 'var(--c-spot)' }}>{money(spot)}</strong>,{' '}
        {rounded === 0 ? 'you break even' : (
          <>you <strong className={`num ${sign}`}>{rounded > 0 ? 'make' : 'lose'} {money(here)}</strong></>
        )}.
      </p>
      <p>{near ? <strong>That's the breakeven</strong> : 'Drag the blue point along the line.'}</p>
    </>
  );

  return (
    <WidgetFrame
      title="Where does profit cross zero?"
      ariaLabel={`Profit at expiry of a ${BREAKEVEN_EXAMPLES[key].name.toLowerCase()} against the stock price: green where it is above zero, red where it is below. The breakeven is where the line crosses zero.`}
      plotHeight={HEIGHT}
      plot={plot}
      controls={controls}
      readout={readout}
      caption="Profit turns from loss to gain at the breakeven."
    />
  );
}
