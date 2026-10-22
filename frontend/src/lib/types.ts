// These shapes are the contract between Frontend, RBAC Auth, and Backend API / Supabase.

export type Role = "candidate" | "recruiter" | "admin";

export type User = {
  id: string; // e.g. "cand101", "rec201", "admin001"
  name: string;
  email: string;
  role: Role;
  companyName?: string;
  trade?: string;
  phone?: string;
  seeker_id?: number;
  employer_id?: number;
};

export type SeekerProfile = {
  seeker_id: number;
  name: string;
  trade_id: number;
  detected_trade: string;
  skills: string[];
  confidence: number; // 0 to 1
  phone?: string;
  email?: string;
  location?: string;
  experience?: string;
  bio?: string;
  age?: number;
  qualification?: string;
};

export type Course = {
  id: string;
  title: string;
  provider: string;
  trade: string;
  status: "ongoing" | "completed";
  progressPct?: number;
  completedDate?: string;
  duration: string;
  certificateId?: string;
  modulesTotal?: number;
  modulesDone?: number;
  badge?: string;
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
  location?: string;
  description?: string;
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
  trade?: string;
  required_skills?: string[];
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

export type ApplicationStatus = "pending" | "interview_scheduled" | "hired" | "rejected";

export type InterviewDetails = {
  interview_at: string;
  mode: "in_person" | "video_call" | "phone";
  location_or_link: string;
  notes?: string;
};

export type Candidate = {
  application_id: number;
  seeker_id: number;
  vacancy_id: number;
  job_title: string;
  employer: string;
  name: string;
  trade: string;
  score: number; // 0 to 1
  distance_km: number;
  skills: string[];
  missing_skills: string[];
  bridge_course?: string | null;
  status: ApplicationStatus;
  reject_reason?: RejectReason | null;
  reject_feedback?: string | null;
  interview_at?: string | null;
  interview_mode?: "in_person" | "video_call" | "phone" | null;
  interview_location?: string | null;
  interview_notes?: string | null;
  applied_at?: string;
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

export type RejectionStat = {
  reason: RejectReason;
  label: string;
  count: number;
  percentage: number;
};

export type DistrictAnalytics = {
  total_applications: number;
  total_hired: number;
  total_rejected: number;
  top_missing_skills: { skill: string; count: number }[];
  rejection_breakdown: RejectionStat[];
};

