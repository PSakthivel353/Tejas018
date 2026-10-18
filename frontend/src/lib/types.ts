// These shapes are the contract with Member 3's FastAPI backend.
// If the backend returns different field names, change them HERE (and in mock.ts) only.

export type SeekerProfile = {
  seeker_id: number;
  name: string;
  trade_id: number;
  detected_trade: string;
  skills: string[];
  confidence: number; // 0 to 1
};

export type JobMatch = {
  vacancy_id: number;
  title: string;
  employer: string;
  score: number; // 0 to 1
  distance_km: number;
  is_formal: boolean;
  wage_min?: number;
  wage_max?: number;
  matched_skills: string[];
  missing_skills: string[];
  bridge_course?: string | null;
};

export type MatchRequest = {
  trade_id: number;
  skills: string[];
  lat: number;
  lon: number;
  radius_km: number;
};

export type VacancyInput = {
  employer_id: number;
  employer_name: string;
  title: string;
  description: string;
  openings: number;
  wage_min: number;
  wage_max: number;
  is_formal: boolean;
  location: string;
};

export type VacancyResult = {
  vacancy_id: number;
  detected_trade: string;
  skills: string[];
  confidence: number;
  sgs_before?: number;
  sgs_after?: number;
};

export type RejectReason =
  | "skills_mismatch"
  | "too_far"
  | "salary_expectation"
  | "experience"
  | "other";

export type Candidate = {
  application_id: number;
  name: string;
  trade: string;
  score: number; // 0 to 1
  distance_km: number;
  skills: string[];
  status: "new" | "rejected";
  reject_reason?: RejectReason | null;
};

export type GapLabel = "shortage" | "balanced" | "surplus";

export type TradeGap = {
  trade_id: number;
  trade: string;
  projected_demand: number;
  expected_graduates: number;
  sgs: number; // Skill Gap Score, roughly -1 to 1
  label: GapLabel;
  seats_to_add: number;
  employers_hiring: number;
  recommendation: string;
};

export type HeatmapData = {
  months: string[]; // e.g. ["Nov", "Dec", ...]
  trades: string[];
  cells: { trade: string; month: string; value: number }[]; // projected openings
};

export type DistrictSummary = {
  district: string;
  trades: number;
  itis: number;
  employers: number;
  open_vacancies: number;
};
