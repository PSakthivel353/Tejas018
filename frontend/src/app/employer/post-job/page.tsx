"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Plus, Sparkles, X } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Badge, Button, Card, CardHeader, Field, Notice, PageHeader, inputClass } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { postVacancy } from "@/lib/api";
import { storePostJob } from "@/lib/store";
import { cn } from "@/lib/utils";

const TRADE_OPTIONS = [
  "CNC Operation",
  "EV Mechanic",
  "Solar Technician",
  "Electrician",
  "Welder",
  "Fitter",
  "Turner",
  "Refrigeration & AC",
];

const PRESET_SKILLS: Record<string, string[]> = {
  "CNC Operation": ["G-code programming", "Tool offset setting", "Lathe operation", "Blueprint reading"],
  "EV Mechanic": ["Battery pack diagnostics", "High-voltage wiring", "Motor controller tuning"],
  "Solar Technician": ["PV panel installation", "Inverter wiring", "Earthing standards"],
  Electrician: ["Conduit wiring", "Panel board installation", "Circuit testing"],
  Welder: ["MIG/TIG welding", "Arc welding", "Blueprint reading"],
  Fitter: ["Bench fitting", "Machine assembly", "Tolerance testing"],
  Turner: ["Precision turning", "Facing", "Thread cutting"],
  "Refrigeration & AC": ["Refrigerant charging", "Compressor overhaul", "Leak detection"],
};

export default function PostJobPage() {
  return (
    <ProtectedRoute allowedRoles={["recruiter", "admin"]}>
      <PostJobContent />
    </ProtectedRoute>
  );
}

function PostJobContent() {
  const router = useRouter();
  const { user } = useAuth();

  const [company, setCompany] = useState(user?.companyName || "Kaveri Precision Works");
  const [title, setTitle] = useState("CNC Lathe Programmer & Operator");
  const [trade, setTrade] = useState("CNC Operation");
  const [description, setDescription] = useState(
    "Operate CNC turning centers, write and optimize G-code routines, set tool offsets, check dimensions using vernier and micrometers with 10-micron tolerance.",
  );
  const [openings, setOpenings] = useState("3");
  const [wageMin, setWageMin] = useState("18000");
  const [wageMax, setWageMax] = useState("24000");
  const [formal, setFormal] = useState(true);
  const [location, setLocation] = useState("Thuvakudi Industrial Estate, Tiruchirappalli");

  const [skills, setSkills] = useState<string[]>(["G-code programming", "Tool offset setting"]);
  const [customSkill, setCustomSkill] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleTradeChange = (newTrade: string) => {
    setTrade(newTrade);
    setSkills(PRESET_SKILLS[newTrade] || []);
  };

  const addSkill = () => {
    const trimmed = customSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setCustomSkill("");
    }
  };

  const removeSkill = (s: string) => {
    setSkills(skills.filter((item) => item !== s));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const min = Number(wageMin);
    const max = Number(wageMax);

    if (max < min) {
      setError("Maximum pay must be greater than or equal to minimum pay.");
      return;
    }

    setBusy(true);
    try {
      const vacancyInput = {
        employer_id: user?.employer_id || 1,
        employer_name: company.trim(),
        title: title.trim(),
        description: description.trim(),
        openings: Number(openings),
        wage_min: min,
        wage_max: max,
        is_formal: formal,
        location: location.trim(),
        trade,
        required_skills: skills,
      };

      // 1. Post to API / backend
      try {
        await postVacancy(vacancyInput);
      } catch {
        /* fallback handled by store */
      }

      // 2. Persist in shared real-time store so candidate matches update
      storePostJob(vacancyInput);

      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to post job");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/employer">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted">
            <ArrowLeft size={14} /> Back to Pipeline
          </Button>
        </Link>
      </div>

      <PageHeader
        title="Post a New Trade Vacancy"
        description="List job openings for local ITI graduates. SkillBridge matches qualified candidates based on technical trade competencies."
      />

      {success ? (
        <Card className="border-good/50 bg-good/10 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-good text-good-ink">
            <CheckCircle2 size={28} />
          </div>
          <h2 className="mt-4 font-display text-2xl font-bold text-good">Job Vacancy Published!</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink">
            <span className="font-semibold">{title}</span> at <span className="font-semibold">{company}</span> is now active.
            Nearby qualified candidates will immediately receive match recommendations.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="primary" onClick={() => router.push("/employer")}>
              View Candidate Pipeline ➔
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setSuccess(false);
                setTitle("");
                setDescription("");
              }}
            >
              Post Another Vacancy
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <CardHeader
            title="Vacancy Details & Competency Requirements"
            description="Our skill matching engine uses these details to score applicants automatically."
          />

          <form onSubmit={handleSubmit} className="space-y-5 p-6">
            {error && <Notice kind="error">{error}</Notice>}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Company / Enterprise Name" htmlFor="v-comp">
                <input
                  id="v-comp"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Trade Category" htmlFor="v-trade">
                <select
                  id="v-trade"
                  value={trade}
                  onChange={(e) => handleTradeChange(e.target.value)}
                  className={inputClass}
                >
                  {TRADE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Job Title" htmlFor="v-title">
              <input
                id="v-title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
                placeholder="e.g. CNC Turning Center Operator"
              />
            </Field>

            <Field
              label="Job Description & Responsibilities"
              htmlFor="v-desc"
              hint="Mention specific machine types, blueprint standards, tool offsets, or shop floor conditions."
            >
              <textarea
                id="v-desc"
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputClass}
              />
            </Field>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Required Competency Skills</label>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {skills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 rounded bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => removeSkill(s)}
                      className="rounded-full hover:bg-accent/20"
                      aria-label={`Remove ${s}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  placeholder="Add required skill (press enter)"
                  className={inputClass}
                />
                <Button type="button" variant="secondary" size="sm" onClick={addSkill}>
                  <Plus size={14} className="mr-1" /> Add
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Openings Count" htmlFor="v-openings">
                <input
                  id="v-openings"
                  type="number"
                  min={1}
                  required
                  value={openings}
                  onChange={(e) => setOpenings(e.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Minimum Pay (₹/mo)" htmlFor="v-wmin">
                <input
                  id="v-wmin"
                  type="number"
                  step={500}
                  required
                  value={wageMin}
                  onChange={(e) => setWageMin(e.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Maximum Pay (₹/mo)" htmlFor="v-wmax">
                <input
                  id="v-wmax"
                  type="number"
                  step={500}
                  required
                  value={wageMax}
                  onChange={(e) => setWageMax(e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Plant / Workshop Location" htmlFor="v-loc">
              <input
                id="v-loc"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={inputClass}
                placeholder="e.g. Thuvakudi Industrial Estate, Trichy"
              />
            </Field>

            <div className="flex items-start gap-3 rounded-lg border border-line bg-sunken p-4">
              <input
                id="v-formal"
                type="checkbox"
                checked={formal}
                onChange={(e) => setFormal(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-line text-accent focus:ring-accent"
              />
              <label htmlFor="v-formal" className="cursor-pointer">
                <span className="block text-sm font-semibold">Formal Employment Role</span>
                <span className="block text-xs text-muted">
                  Includes monthly payslip, provident fund (EPF), and state employee insurance (ESI).
                </span>
              </label>
            </div>

            <div className="pt-3">
              <Button type="submit" variant="primary" loading={busy} className="w-full">
                Publish Vacancy & Start Candidate Matching
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}

