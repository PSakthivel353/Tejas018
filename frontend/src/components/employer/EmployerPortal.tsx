"use client";

import { useState } from "react";
import { CandidateList } from "./CandidateList";
import { JobPostingForm } from "./JobPostingForm";

export function EmployerPortal() {
  // Bumping this number makes the candidate list reload after a new vacancy is posted.
  const [refreshKey, setRefreshKey] = useState(0);
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)]">
      <JobPostingForm onPosted={() => setRefreshKey((k) => k + 1)} />
      <CandidateList refreshKey={refreshKey} />
    </div>
  );
}
