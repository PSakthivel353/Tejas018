"use client";

import { useState } from "react";
import { ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";
import type { HeatmapData } from "@/lib/types";

// Recharts has no heatmap chart, so this is a ScatterChart whose points are drawn as squares:
// one square per trade and month, darker = more projected openings.

const ROW_H = 34; // height of one trade row
const AXIS_H = 28; // height of the month labels on top
const LEFT = 150; // room for the trade names

type Point = { x: number; y: number; value: number; trade: string; month: string };

const shade = (t: number) =>
  `color-mix(in srgb, rgb(var(--accent)) ${Math.round(10 + t * 90)}%, rgb(var(--sunken)))`;

function HeatTooltip({ active, payload }: { active?: boolean; payload?: { payload: Point }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded border border-line bg-surface px-3 py-2 text-sm">
      <p className="font-medium">{p.trade}</p>
      <p className="text-muted">
        {p.month}: <span className="font-semibold text-ink">{p.value}</span> projected openings
      </p>
    </div>
  );
}

export function SkillHeatmap({ data }: { data: HeatmapData }) {
  const { months, trades, cells } = data;
  const [width, setWidth] = useState(0);

  const max = Math.max(1, ...cells.map((c) => c.value));
  const points: Point[] = cells.map((c) => ({
    x: months.indexOf(c.month),
    y: trades.indexOf(c.trade),
    value: c.value,
    trade: c.trade,
    month: c.month,
  }));

  const height = trades.length * ROW_H + AXIS_H;
  const cellW = Math.max(8, (width - LEFT - 8) / months.length);

  return (
    <div>
      <div style={{ height }} role="img" aria-label="Heatmap of projected openings by trade and month">
        <ResponsiveContainer width="100%" height="100%" onResize={(w) => setWidth(w)}>
          <ScatterChart margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
            <XAxis
              type="number"
              dataKey="x"
              domain={[-0.5, months.length - 0.5]}
              ticks={months.map((_, i) => i)}
              tickFormatter={(i: number) => months[i] ?? ""}
              orientation="top"
              height={AXIS_H}
              interval={0}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={[-0.5, trades.length - 0.5]}
              ticks={trades.map((_, i) => i)}
              tickFormatter={(i: number) => trades[i] ?? ""}
              reversed
              width={LEFT}
              interval={0}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip cursor={false} content={<HeatTooltip />} isAnimationActive={false} />
            <Scatter
              data={points}
              isAnimationActive={false}
              shape={(props: { cx?: number; cy?: number; payload?: Point }) => {
                const { cx = 0, cy = 0, payload } = props;
                if (!payload) return <g />;
                return (
                  <rect
                    x={cx - cellW / 2 + 1.5}
                    y={cy - ROW_H / 2 + 1.5}
                    width={Math.max(0, cellW - 3)}
                    height={ROW_H - 3}
                    rx={3}
                    style={{ fill: shade(payload.value / max) }}
                  />
                );
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center gap-3 text-xs text-muted">
        <span>Fewer openings</span>
        <span
          className="h-2.5 w-40 rounded-full border border-line"
          style={{ background: `linear-gradient(to right, ${shade(0)}, ${shade(1)})` }}
          aria-hidden
        />
        <span>More openings</span>
      </div>
    </div>
  );
}
