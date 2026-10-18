"use client";

import { useCallback, useEffect, useState } from "react";
import { DsdpExport } from "./DsdpExport";
import { GapChart } from "./GapChart";
import { SkillHeatmap } from "./SkillHeatmap";
import { Badge, Button, Card, CardHeader, Notice, Skeleton } from "@/components/ui";
import { getHeatmap, getSummary, getTrades } from "@/lib/api";
import type { DistrictSummary, HeatmapData, TradeGap } from "@/lib/types";
import { errorMessage } from "@/lib/utils";

type Data = { summary: DistrictSummary; trades: TradeGap[]; heatmap: HeatmapData };

function StatStrip({ s }: { s: DistrictSummary }) {
  const stats = [
    { label: "Trades tracked", value: s.trades },
    { label: "ITIs", value: s.itis },
    { label: "Employers", value: s.employers },
    { label: "Open vacancies", value: s.open_vacancies },
  ];
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
      {stats.map((st) => (
        <div key={st.label} className="bg-surface px-5 py-4">
          <dt className="text-sm text-muted">{st.label}</dt>
          <dd className="mt-1 font-display text-3xl font-bold tabular-nums">{st.value.toLocaleString("en-IN")}</dd>
        </div>
      ))}
    </dl>
  );
}

function Actions({ trades }: { trades: TradeGap[] }) {
  const short = trades.filter((t) => t.label === "shortage").sort((a, b) => b.sgs - a.sgs).slice(0, 3);
  const surplus = trades.filter((t) => t.label === "surplus").sort((a, b) => a.sgs - b.sgs).slice(0, 2);
  const rows = [...short, ...surplus];
  return (
    <Card>
      <CardHeader title="What to do next" description="The most urgent changes to seats and syllabi." />
      {rows.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted">No trade needs a change right now.</p>
      ) : (
        <ul className="divide-y divide-line">
          {rows.map((t) => (
            <li key={t.trade_id} className="flex items-start gap-3 px-5 py-3.5">
              <Badge tone={t.label === "shortage" ? "warn" : "good"} className="mt-0.5 shrink-0">
                {t.label === "shortage" ? "Add seats" : "Review"}
              </Badge>
              <p className="text-sm">{t.recommendation}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function OfficerDashboard() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [summary, trades, heatmap] = await Promise.all([getSummary(), getTrades(), getHeatmap()]);
      setData({ summary, trades, heatmap });
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <div className="max-w-lg space-y-3">
        <Notice kind="error">{error}</Notice>
        <Button variant="secondary" onClick={load}>
          Try again
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="pt-2.5 text-sm text-muted">
          District: <span className="font-semibold text-ink">{data.summary.district}</span>
        </p>
        <DsdpExport />
      </div>

      <StatStrip s={data.summary} />

      <Card>
        <CardHeader
          title="Where the jobs will be"
          description="Projected job openings for each trade over the next 12 months. Darker squares mean more openings."
        />
        <div className="overflow-x-auto p-5">
          <div className="min-w-[640px]">
            <SkillHeatmap data={data.heatmap} />
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Card>
          <CardHeader
            title="Skill Gap Score by trade"
            description="Above zero, demand is higher than the graduates we expect. Below zero, there are more graduates than jobs."
          />
          <div className="p-5">
            <GapChart trades={data.trades} />
          </div>
        </Card>
        <div className="self-start">
          <Actions trades={data.trades} />
        </div>
      </div>
    </div>
  );
}
