"use client";

import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { GapLabel, TradeGap } from "@/lib/types";

const fillClass: Record<GapLabel, string> = {
  shortage: "fill-warn",
  balanced: "fill-muted",
  surplus: "fill-good",
};

function GapTooltip({ active, payload }: { active?: boolean; payload?: { payload: TradeGap }[] }) {
  if (!active || !payload?.length) return null;
  const t = payload[0].payload;
  return (
    <div className="rounded border border-line bg-surface px-3 py-2 text-sm">
      <p className="font-medium">{t.trade}</p>
      <p className="text-muted">
        Score <span className="font-semibold text-ink">{t.sgs.toFixed(2)}</span> ({t.label})
      </p>
      <p className="text-muted">
        {t.projected_demand} openings, {t.expected_graduates} graduates
      </p>
    </div>
  );
}

export function GapChart({ trades }: { trades: TradeGap[] }) {
  const data = [...trades].sort((a, b) => b.sgs - a.sgs);
  return (
    <div>
      <div style={{ height: data.length * 30 + 36 }} role="img" aria-label="Skill Gap Score by trade">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 0 }} barCategoryGap={6}>
            <XAxis type="number" domain={[-1, 1]} ticks={[-1, -0.5, 0, 0.5, 1]} allowDataOverflow tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="trade" width={150} interval={0} tickLine={false} axisLine={false} />
            <ReferenceLine x={0} />
            <Tooltip cursor={{ fill: "rgb(var(--sunken))" }} content={<GapTooltip />} isAnimationActive={false} />
            <Bar dataKey="sgs" radius={3} isAnimationActive={false}>
              {data.map((t) => (
                <Cell key={t.trade} className={fillClass[t.label]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-warn" aria-hidden /> Shortage: add seats
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-muted" aria-hidden /> Balanced
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-good" aria-hidden /> Surplus: review syllabus
        </span>
      </div>
    </div>
  );
}
