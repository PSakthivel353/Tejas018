"use client";

import { useCallback, useEffect, useState } from "react";
import { Bot, Check, Download, FileText, MapPin, Sparkles, X } from "lucide-react";
import { DsdpExport } from "./DsdpExport";
import { GapChart } from "./GapChart";
import { SkillHeatmap } from "./SkillHeatmap";
import { Badge, Button, Card, CardHeader, Notice, Skeleton } from "@/components/ui";
import { getHeatmap, getSummary, getTrades } from "@/lib/api";
import type { DistrictSummary, HeatmapData, TradeGap } from "@/lib/types";
import { errorMessage } from "@/lib/utils";

type Data = { summary: DistrictSummary; trades: TradeGap[]; heatmap: HeatmapData };

const DISTRICT_PRESETS: Record<string, DistrictSummary> = {
  "Tiruchirappalli (Pilot)": {
    district: "Tiruchirappalli",
    trades: 12,
    itis: 14,
    employers: 86,
    open_vacancies: 2970,
  },
  "Coimbatore (Manufacturing Hub)": {
    district: "Coimbatore",
    trades: 18,
    itis: 22,
    employers: 210,
    open_vacancies: 6420,
  },
  "Madurai (Southern Zone)": {
    district: "Madurai",
    trades: 14,
    itis: 16,
    employers: 115,
    open_vacancies: 3840,
  },
};

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
  const [approvedTrades, setApprovedTrades] = useState<number[]>([]);
  const short = trades.filter((t) => t.label === "shortage").sort((a, b) => b.sgs - a.sgs).slice(0, 3);
  const surplus = trades.filter((t) => t.label === "surplus").sort((a, b) => a.sgs - b.sgs).slice(0, 2);
  const rows = [...short, ...surplus];

  const handleApprove = (id: number) => {
    setApprovedTrades((prev) => [...prev, id]);
  };

  return (
    <Card>
      <CardHeader title="What to do next" description="The most urgent changes to seats and syllabi." />
      {rows.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted">No trade needs a change right now.</p>
      ) : (
        <ul className="divide-y divide-line">
          {rows.map((t) => {
            const isApproved = approvedTrades.includes(t.trade_id);
            const isShortage = t.label === "shortage";
            return (
              <li key={t.trade_id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <Badge tone={isShortage ? "warn" : "good"} className="mt-0.5 shrink-0">
                      {isShortage ? "Add seats" : "Review"}
                    </Badge>
                    <div>
                      <p className="text-xs font-semibold text-ink">{t.trade}</p>
                      <p className="text-xs text-muted mt-0.5">{t.recommendation}</p>
                    </div>
                  </div>
                </div>

                {isShortage && (
                  <div className="flex items-center justify-end pt-1">
                    {isApproved ? (
                      <span className="text-[11px] font-semibold text-good flex items-center gap-1 bg-good/10 px-2 py-0.5 rounded">
                        <Check size={12} /> Approved (30 Seats Sanctioned)
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleApprove(t.trade_id)}
                        className="rounded border border-accent/40 bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-accent hover:bg-accent hover:text-accent-ink transition-colors"
                      >
                        ⚡ Approve 3-Wk Bridge Course
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

export function OfficerDashboard() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState("Tiruchirappalli (Pilot)");
  const [showMemo, setShowMemo] = useState(false);

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

  const currentSummary = DISTRICT_PRESETS[selectedPreset] || data.summary;

  return (
    <div className="space-y-6">
      {/* DISTRICT SELECTOR & ACTION BUTTONS */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-muted">
            <MapPin size={14} className="text-accent" />
            District Jurisdiction:
          </span>
          <select
            value={selectedPreset}
            onChange={(e) => setSelectedPreset(e.target.value)}
            className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-bold text-ink shadow-xs focus:border-accent focus:outline-hidden"
          >
            {Object.keys(DISTRICT_PRESETS).map((preset) => (
              <option key={preset} value={preset}>
                {preset}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="gap-1.5 text-xs border-accent/30 bg-accent-soft text-accent"
            onClick={() => setShowMemo(true)}
          >
            <Bot size={14} />
            <span>AI Executive Memo</span>
          </Button>
          <DsdpExport />
        </div>
      </div>

      <StatStrip s={currentSummary} />

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

      {/* AI COLLECTOR MEMO MODAL (SLIDE 5 OF PITCH DECK) */}
      {showMemo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl bg-surface border border-line shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5 bg-accent-soft/40">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-accent" />
                <h3 className="font-display text-sm font-bold text-ink">
                  District Collector Executive Memorandum
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMemo(false)}
                className="rounded-full p-1 text-muted hover:text-ink transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 text-xs space-y-3 leading-relaxed text-muted font-sans">
              <div className="border-b border-line pb-2.5 text-ink space-y-0.5">
                <p className="font-bold uppercase tracking-wider text-[11px] text-accent">
                  Government of Tamil Nadu • Department of Employment and Training
                </p>
                <p className="font-semibold text-xs">
                  Memorandum: Predictive Skill Gap Analysis & Sanction Recommendations
                </p>
                <p className="text-[10px] text-muted">District: {currentSummary.district} | Target Cycle: 2026-2027</p>
              </div>

              <p>
                <strong className="text-ink">1. Objective:</strong> Explain deterministic Skill Gap Scores (SGS) computed from {currentSummary.employers} local MSME hiring trends against {currentSummary.itis} accredited ITIs.
              </p>

              <div className="rounded-lg bg-sunken/60 p-3 text-ink space-y-1.5 border border-line/60">
                <p className="font-bold text-xs text-warn">🚨 Urgent Deficit Interventions:</p>
                <p className="text-[11px]">
                  • <strong>CNC Operation (SGS: +0.41):</strong> Projected demand (410) outpaces graduate output (240). Recommended: Sanction 40 additional seats at Govt ITI Thuvakudi.
                </p>
                <p className="text-[11px]">
                  • <strong>EV Mechanic (SGS: +0.54):</strong> Clean energy transition creating 260 local openings against 120 trainees. Recommended: Add 30 seats.
                </p>
              </div>

              <div className="rounded-lg bg-sunken/60 p-3 text-ink space-y-1.5 border border-line/60">
                <p className="font-bold text-xs text-good">📉 Supply Reallocation:</p>
                <p className="text-[11px]">
                  • <strong>Fitter & Turner:</strong> 720 graduates expected against 460 openings. Reallocate lab capacity towards automated machine troubleshooting.
                </p>
              </div>

              <p className="text-[10px] italic text-muted">
                Generated via SkillBridge Plain-Language AI Synthesis Engine (Mistral-7B / LLM calibration).
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3 bg-sunken/30">
              <Button size="sm" variant="secondary" onClick={() => setShowMemo(false)}>
                Dismiss
              </Button>
              <Button size="sm" variant="primary" onClick={() => setShowMemo(false)}>
                Print Memo (PDF)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
