"use client";

import { useState, type FormEvent } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button, Card, Field, inputClass } from "@/components/ui";
import type { Candidate, RejectReason } from "@/lib/types";

const REASONS: { value: RejectReason; label: string }[] = [
  { value: "skills_mismatch", label: "Skills do not fit role requirements" },
  { value: "experience", label: "Not enough practical / shop floor experience" },
  { value: "salary_expectation", label: "Pay expectation exceeds budget" },
  { value: "too_far", label: "Lives too far / daily commute challenges" },
  { value: "other", label: "Other evaluation criteria" },
];

export function RejectFeedbackModal({
  candidate,
  onReject,
  onClose,
}: {
  candidate: Candidate;
  onReject: (reason: RejectReason, feedback: string, missingSkill: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<RejectReason>("skills_mismatch");
  const [feedback, setFeedback] = useState(
    "Candidate demonstrated basic theoretical knowledge but needs more practical practice with machine offsets and blueprint precision.",
  );
  const [missingSkill, setMissingSkill] = useState("Tool offset setting");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onReject(reason, feedback.trim(), missingSkill.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-bad/15 text-bad">
              <AlertTriangle size={16} />
            </span>
            <div>
              <h3 className="font-display text-lg font-bold">Provide Rejection Feedback</h3>
              <p className="text-xs text-muted">Applicant: {candidate.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted hover:bg-sunken hover:text-ink"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <Field label="Primary Rejection Reason" htmlFor="rej-reason">
            <select
              id="rej-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value as RejectReason)}
              className={inputClass}
            >
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Key Missing Skill / Area for Improvement"
            htmlFor="rej-skill"
            hint="This skill gap helps the District Officer identify training shortfalls in local ITIs."
          >
            <input
              id="rej-skill"
              required
              value={missingSkill}
              onChange={(e) => setMissingSkill(e.target.value)}
              className={inputClass}
              placeholder="e.g. Advanced CNC G-code offsets, Precision micrometer calibration"
            />
          </Field>

          <Field
            label="Detailed Constructive Feedback"
            htmlFor="rej-feedback"
            hint="This will be shared directly on the candidate's applied jobs portal to guide their upskilling."
          >
            <textarea
              id="rej-feedback"
              required
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className={inputClass}
              placeholder="Explain specifically what areas the candidate should focus on..."
            />
          </Field>

          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="danger">
              Submit Feedback & Update Status
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

