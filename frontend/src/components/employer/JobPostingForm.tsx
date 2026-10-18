"use client";

import { useId, useState, type FormEvent } from "react";
import { Badge, Button, Card, CardHeader, Field, Notice, SkillChip, inputClass } from "@/components/ui";
import { EMPLOYER_ID, postVacancy } from "@/lib/api";
import type { VacancyResult } from "@/lib/types";
import { cn, errorMessage, percent } from "@/lib/utils";

type Props = { onPosted: () => void };

export function JobPostingForm({ onPosted }: Props) {
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;

  const [employer, setEmployer] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [openings, setOpenings] = useState("1");
  const [wageMin, setWageMin] = useState("");
  const [wageMax, setWageMax] = useState("");
  const [formal, setFormal] = useState(true);
  const [location, setLocation] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VacancyResult | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    const min = Number(wageMin);
    const max = Number(wageMax);
    if (max < min) {
      setError("The highest pay must be at least the lowest pay.");
      return;
    }
    setBusy(true);
    try {
      const res = await postVacancy({
        employer_id: EMPLOYER_ID,
        employer_name: employer.trim(),
        title: title.trim(),
        description: description.trim(),
        openings: Number(openings),
        wage_min: min,
        wage_max: max,
        is_formal: formal,
        location: location.trim(),
      });
      setResult(res);
      setTitle("");
      setDescription("");
      onPosted();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Post a vacancy"
        description="Describe the work in your own words. We pick out the trade and the skills for you."
      />
      <form onSubmit={submit} className="space-y-4 p-5">
        <Field label="Company name" htmlFor={id("employer")}>
          <input id={id("employer")} required value={employer} onChange={(e) => setEmployer(e.target.value)} className={inputClass} autoComplete="organization" />
        </Field>
        <Field label="Job title" htmlFor={id("title")}>
          <input id={id("title")} required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="CNC machine operator" />
        </Field>
        <Field label="What will the person do?" htmlFor={id("description")} hint="Mention machines, tools and any experience you need.">
          <textarea
            id={id("description")}
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
            placeholder="Run CNC lathes, set tool offsets, read drawings, check parts with a micrometer."
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Openings" htmlFor={id("openings")}>
            <input id={id("openings")} required type="number" min={1} value={openings} onChange={(e) => setOpenings(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Lowest pay (₹/month)" htmlFor={id("wmin")}>
            <input id={id("wmin")} required type="number" min={0} step={500} value={wageMin} onChange={(e) => setWageMin(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Highest pay (₹/month)" htmlFor={id("wmax")}>
            <input id={id("wmax")} required type="number" min={0} step={500} value={wageMax} onChange={(e) => setWageMax(e.target.value)} className={inputClass} />
          </Field>
        </div>
        <Field label="Work location" htmlFor={id("location")} hint="Town or industrial area.">
          <input id={id("location")} required value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} />
        </Field>

        <div className="flex items-start gap-3 rounded border border-line bg-sunken px-3 py-3">
          <button
            type="button"
            role="switch"
            aria-checked={formal}
            aria-labelledby={id("formal")}
            onClick={() => setFormal((v) => !v)}
            className={cn(
              "relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors",
              formal ? "bg-accent" : "bg-line",
            )}
          >
            <span
              className={cn(
                "absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                formal ? "translate-x-[22px]" : "translate-x-0.5",
              )}
            />
          </button>
          <div>
            <p id={id("formal")} className="text-sm font-medium">
              Formal job with payslip and bank pay
            </p>
            <p className="text-xs text-muted">Workers get a payslip and are paid into a bank account.</p>
          </div>
        </div>

        {error && <Notice kind="error">{error}</Notice>}
        <Button type="submit" loading={busy} className="w-full sm:w-auto">
          Post vacancy
        </Button>

        {result && (
          <div className="space-y-3 rounded border border-good/40 bg-good/10 p-4" role="status">
            <p className="font-medium">Vacancy posted</p>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted">Trade we found:</span>
              <Badge tone="accent">{result.detected_trade}</Badge>
              <span className="text-muted">{percent(result.confidence)} sure</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {result.skills.map((s) => (
                <SkillChip key={s}>{s}</SkillChip>
              ))}
            </div>
            {result.sgs_before !== undefined && result.sgs_after !== undefined && (
              <p className="text-sm text-muted">
                Skill Gap Score for {result.detected_trade} moved from {result.sgs_before.toFixed(2)} to{" "}
                {result.sgs_after.toFixed(2)}.
              </p>
            )}
          </div>
        )}
      </form>
    </Card>
  );
}
