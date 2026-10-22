"use client";

import { useState, type FormEvent } from "react";
import { Calendar, Clock, MapPin, Video, X } from "lucide-react";
import { Button, Card, Field, inputClass } from "@/components/ui";
import type { Candidate, InterviewDetails } from "@/lib/types";

export function ScheduleInterviewModal({
  candidate,
  onSchedule,
  onClose,
}: {
  candidate: Candidate;
  onSchedule: (details: InterviewDetails) => void;
  onClose: () => void;
}) {
  // Default to tomorrow at 10:00 AM
  const defaultDate = new Date(Date.now() + 86400000);
  defaultDate.setHours(10, 0, 0, 0);
  const defaultIso = defaultDate.toISOString().slice(0, 16);

  const [dateTime, setDateTime] = useState(defaultIso);
  const [mode, setMode] = useState<"in_person" | "video_call" | "phone">("in_person");
  const [venue, setVenue] = useState("Main Plant Gate 2, Thuvakudi Industrial Estate, Trichy");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSchedule({
      interview_at: new Date(dateTime).toISOString(),
      mode,
      location_or_link: venue.trim(),
      notes: notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h3 className="font-display text-lg font-bold">Schedule Candidate Interview</h3>
            <p className="text-xs text-muted">
              Applicant: <span className="font-semibold text-ink">{candidate.name}</span> for {candidate.job_title}
            </p>
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
          <Field label="Interview Date & Time" htmlFor="int-dt">
            <input
              id="int-dt"
              type="datetime-local"
              required
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Interview Mode" htmlFor="int-mode">
            <select
              id="int-mode"
              value={mode}
              onChange={(e) => {
                const newMode = e.target.value as "in_person" | "video_call" | "phone";
                setMode(newMode);
                if (newMode === "video_call") {
                  setVenue("Google Meet: meet.google.com/sb-eval-trichy");
                } else if (newMode === "phone") {
                  setVenue("Direct phone call to candidate number");
                } else {
                  setVenue("Main Plant Gate 2, Thuvakudi Industrial Estate, Trichy");
                }
              }}
              className={inputClass}
            >
              <option value="in_person">🏢 In-Person (Plant / Office Visit)</option>
              <option value="video_call">📹 Online Video Call (Google Meet)</option>
              <option value="phone">📞 Telephonic Screening</option>
            </select>
          </Field>

          <Field
            label={mode === "video_call" ? "Meeting Link" : mode === "phone" ? "Phone Contact" : "Plant Address / Venue"}
            htmlFor="int-venue"
          >
            <input
              id="int-venue"
              required
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className={inputClass}
              placeholder="e.g. Workshop floor B or Meet link"
            />
          </Field>

          <Field
            label="Candidate Instructions & Notes"
            htmlFor="int-notes"
            hint="This instruction will be visible immediately in the candidate's portal."
          >
            <textarea
              id="int-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClass}
              placeholder="Mention what to bring, documents required, or topics to prepare..."
            />
          </Field>

          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Confirm & Notify Candidate
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

