// Demo data. Used when NEXT_PUBLIC_USE_MOCK=true, or automatically for any endpoint
// the backend has not built yet. Everything here is invented for the demo.

import type {
  Candidate,
  DistrictSummary,
  GapLabel,
  HeatmapData,
  JobMatch,
  SeekerProfile,
  TradeGap,
  VacancyInput,
  VacancyResult,
} from "./types";

export const DISTRICT = process.env.NEXT_PUBLIC_DISTRICT || "Tiruchirappalli";

// ---- Trades and Skill Gap Score ------------------------------------------------------

// [name, projected demand, expected graduates, employers hiring]
const TRADE_ROWS: [string, number, number, number][] = [
  ["CNC Operation", 410, 240, 12],
  ["EV Mechanic", 260, 120, 8],
  ["Solar Technician", 220, 110, 9],
  ["Refrigeration & AC", 160, 120, 6],
  ["Plumber", 120, 100, 4],
  ["Electrician", 300, 270, 14],
  ["Welder", 340, 310, 11],
  ["COPA", 200, 190, 7],
  ["Draughtsman Mechanical", 90, 110, 3],
  ["Fitter", 280, 420, 10],
  ["Wireman", 170, 260, 5],
  ["Turner", 180, 300, 6],
];

function labelFor(sgs: number): GapLabel {
  if (sgs > 0.2) return "shortage";
  if (sgs < -0.2) return "surplus";
  return "balanced";
}

export const MOCK_TRADES: TradeGap[] = TRADE_ROWS.map(([trade, demand, grads, hiring], i) => {
  const sgs = Number(((demand - grads) / demand).toFixed(2));
  const label = labelFor(sgs);
  // Rough rule for the demo: close a quarter of the gap per intake, in blocks of 10 seats (CNC Operation = 40)
  const seats = label === "shortage" ? Math.max(10, Math.round((demand - grads) / 4 / 10) * 10) : 0;
  const recommendation =
    label === "shortage"
      ? `Add ${seats} seats in ${trade}. ${hiring} employers are hiring nearby.`
      : label === "surplus"
        ? `Review the ${trade} syllabus. Graduates outnumber projected openings by ${grads - demand}.`
        : `Keep ${trade} seats as they are for now.`;
  return {
    trade_id: i + 1,
    trade,
    projected_demand: demand,
    expected_graduates: grads,
    sgs,
    label,
    seats_to_add: seats,
    employers_hiring: hiring,
    recommendation,
  };
});

// ---- Heatmap: projected openings per month ---------------------------------------------

const MONTHS = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];

export function mockHeatmap(): HeatmapData {
  const cells: HeatmapData["cells"] = [];
  MOCK_TRADES.forEach((t, ti) => {
    const base = t.projected_demand / 24; // openings per month over a 24-month horizon
    const growth = t.sgs > 0.2 ? 0.045 : t.sgs < -0.2 ? -0.02 : 0.005;
    MONTHS.forEach((m, mi) => {
      const season = 1 + 0.18 * Math.sin(((mi + ti) / 12) * Math.PI * 2);
      cells.push({
        trade: t.trade,
        month: m,
        value: Math.max(1, Math.round(base * (1 + growth * mi) * season * 2)),
      });
    });
  });
  return { months: MONTHS, trades: MOCK_TRADES.map((t) => t.trade), cells };
}

export const MOCK_SUMMARY: DistrictSummary = {
  district: DISTRICT,
  trades: MOCK_TRADES.length,
  itis: 8,
  employers: 212,
  open_vacancies: 1486,
};

// ---- Job seeker --------------------------------------------------------------------------

export function mockProfile(fileName: string): SeekerProfile {
  const name = fileName.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ").trim() || "Demo candidate";
  return {
    seeker_id: 101,
    name,
    trade_id: 1,
    detected_trade: "CNC Operation",
    skills: ["Lathe operation", "Micrometer and vernier use", "Blueprint reading"],
    confidence: 0.86,
  };
}

export const MOCK_MATCHES: JobMatch[] = [
  {
    vacancy_id: 118,
    title: "CNC machine operator",
    employer: "Kaveri Precision Works",
    score: 0.88,
    distance_km: 11.4,
    is_formal: true,
    wage_min: 16000,
    wage_max: 21000,
    matched_skills: ["Lathe operation", "Blueprint reading"],
    missing_skills: ["G-code programming"],
    bridge_course: "G-code programming, 4 weeks",
  },
  {
    vacancy_id: 121,
    title: "Turner, CNC lathe",
    employer: "Anbu Engineering",
    score: 0.81,
    distance_km: 18.2,
    is_formal: true,
    wage_min: 15000,
    wage_max: 19000,
    matched_skills: ["Lathe operation", "Micrometer and vernier use"],
    missing_skills: ["Tool offset setting"],
    bridge_course: "Tool offset setting, 3 weeks",
  },
  {
    vacancy_id: 130,
    title: "Machine shop assistant",
    employer: "Sri Valli Auto Components",
    score: 0.72,
    distance_km: 26.7,
    is_formal: true,
    wage_min: 13000,
    wage_max: 17000,
    matched_skills: ["Micrometer and vernier use"],
    missing_skills: ["G-code programming", "Tool offset setting"],
    bridge_course: "CNC basics, 6 weeks",
  },
  {
    vacancy_id: 137,
    title: "Lathe operator",
    employer: "Meenakshi Fabricators",
    score: 0.65,
    distance_km: 8.1,
    is_formal: false,
    wage_min: 11000,
    wage_max: 14000,
    matched_skills: ["Lathe operation"],
    missing_skills: [],
    bridge_course: null,
  },
];

// ---- Employer --------------------------------------------------------------------------------

export function mockVacancyResult(input: VacancyInput): VacancyResult {
  const text = `${input.title} ${input.description}`.toLowerCase();
  const trade = /solar/.test(text)
    ? "Solar Technician"
    : /\bev\b|electric vehicle/.test(text)
      ? "EV Mechanic"
      : /weld/.test(text)
        ? "Welder"
        : "CNC Operation";
  return {
    vacancy_id: 301,
    detected_trade: trade,
    skills: ["G-code programming", "Tool offset setting"],
    confidence: 0.88,
    sgs_before: 0.41,
    sgs_after: 0.44,
  };
}

export const MOCK_CANDIDATES: Candidate[] = [
  // Employer applications are populated by mockSubmitApplication, not by unrelated sample candidates.
];

let mockApplications: Candidate[] | null = null;

function getMockApplications(): Candidate[] {
  if (mockApplications) return mockApplications;
  const saved = typeof window === "undefined" ? null : window.sessionStorage.getItem("skillbridge.mockApplications");
  if (!saved) {
    mockApplications = [];
    return mockApplications;
  }
  const parsed: unknown = JSON.parse(saved);
  if (
    !Array.isArray(parsed) ||
    !parsed.every(
      (application) =>
        typeof application.application_id === "number" &&
        typeof application.seeker_id === "number" &&
        typeof application.vacancy_id === "number" &&
        ["pending", "hired", "rejected"].includes(application.status),
    )
  ) {
    throw new Error("Saved demo applications could not be read. Clear this tab's session data and try again.");
  }
  mockApplications = parsed as Candidate[];
  return mockApplications;
}

function saveMockApplications(applications: Candidate[]) {
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem("skillbridge.mockApplications", JSON.stringify(applications));
  }
  mockApplications = applications;
}

export function mockSubmitApplication(
  seeker: SeekerProfile,
  job: JobMatch,
): Candidate {
  const applications = getMockApplications();
  const existing = applications.find(
    (application) => application.seeker_id === seeker.seeker_id && application.vacancy_id === job.vacancy_id,
  );
  if (existing) return { ...existing };

  const application: Candidate = {
    application_id: Math.max(0, ...applications.map((application) => application.application_id)) + 1,
    seeker_id: seeker.seeker_id,
    vacancy_id: job.vacancy_id,
    job_title: job.title,
    employer: job.employer,
    name: seeker.name,
    trade: seeker.detected_trade,
    score: job.score,
    distance_km: job.distance_km,
    skills: [...seeker.skills],
    missing_skills: [...job.missing_skills],
    bridge_course: job.bridge_course,
    status: "pending",
    reject_reason: null,
  };
  saveMockApplications([...applications, application]);
  return { ...application };
}

export function mockApplicationsForSeeker(seekerId: number): Candidate[] {
  return getMockApplications()
    .filter((application) => application.seeker_id === seekerId)
    .map((application) => ({ ...application }));
}

export function mockCandidatesForEmployer(): Candidate[] {
  return getMockApplications().map((application) => ({ ...application }));
}

export function mockHireApplication(applicationId: number): Candidate {
  return updateMockApplication(applicationId, (application) => ({
    ...application,
    status: "hired",
    interview_at: application.interview_at ?? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  }));
}

export function mockRejectApplication(applicationId: number, reason: Candidate["reject_reason"]): Candidate {
  return updateMockApplication(applicationId, (application) => ({
    ...application,
    status: "rejected",
    reject_reason: reason,
  }));
}

function updateMockApplication(applicationId: number, update: (application: Candidate) => Candidate): Candidate {
  const applications = getMockApplications();
  const index = applications.findIndex((application) => application.application_id === applicationId);
  if (index < 0) throw new Error("Unknown application.");
  const updated = applications.map((application, itemIndex) =>
    itemIndex === index ? update(application) : application,
  );
  saveMockApplications(updated);
  return { ...updated[index] };
}

// ---- DSDP export ---------------------------------------------------------------------------------

export function mockDsdpCsv(): string {
  const header = "Trade,Projected demand (24 months),Expected graduates,Skill Gap Score,Label,Seats to add,Recommendation";
  const rows = MOCK_TRADES.map((t) =>
    [t.trade, t.projected_demand, t.expected_graduates, t.sgs, t.label, t.seats_to_add, `"${t.recommendation}"`].join(","),
  );
  return [header, ...rows].join("\n");
}
