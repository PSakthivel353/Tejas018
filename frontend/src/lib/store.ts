// Shared real-time synchronized store across Candidate, Employer, and Officer portals.
// Uses localStorage with window event dispatching so multiple tabs stay synchronized simultaneously.

import { MOCK_MATCHES } from "./mock";
import type { Candidate, Course, InterviewDetails, JobMatch, RejectReason, SeekerProfile, VacancyInput } from "./types";

const APPS_KEY = "skillbridge_apps_v4";
const JOBS_KEY = "skillbridge_jobs_v4";
const PROFILE_KEY = "skillbridge_profile_v4";
const COURSES_KEY = "skillbridge_courses_v4";

export const DEFAULT_PROFILE: SeekerProfile = {
  seeker_id: 101,
  name: "Arun Kumar",
  age: 22,
  qualification: "ITI Machinist (NCVT Trade Certificate)",
  phone: "+91 98765 43210",
  email: "candidate@skillbridge.org",
  location: "Tiruchirappalli, Tamil Nadu",
  experience: "1 Year Apprenticeship at BHEL Trichy",
  trade_id: 1,
  detected_trade: "CNC Operation",
  skills: [
    "Lathe operation",
    "G-code programming",
    "Blueprint reading",
    "Micrometer & Vernier Calipers",
    "Shopfloor 5S",
  ],
  confidence: 0.94,
  bio: "NCVT certified ITI Machinist with experience in 3-axis CNC turning and manual lathe operation. Passionate about precision manufacturing and quality adherence.",
};

export const DEFAULT_COURSES: Course[] = [
  // Ongoing courses
  {
    id: "c-101",
    title: "Advanced 5-Axis CNC Programming & Tool Offsetting",
    provider: "Government ITI Thuvakudi & Siemens Technical Academy",
    trade: "CNC Operation",
    status: "ongoing",
    progressPct: 68,
    duration: "8 Weeks (60 Hours)",
    modulesTotal: 12,
    modulesDone: 8,
    badge: "Industry 4.0 Certified",
  },
  {
    id: "c-102",
    title: "Geometric Dimensioning & Tolerancing (GD&T) Masterclass",
    provider: "Skill India Digital / NCVT Hub",
    trade: "Machining & Quality Control",
    status: "ongoing",
    progressPct: 40,
    duration: "4 Weeks (30 Hours)",
    modulesTotal: 8,
    modulesDone: 3,
    badge: "Quality Assurance",
  },
  // Completed courses
  {
    id: "c-201",
    title: "National Trade Certificate in Machinist Trade",
    provider: "Directorate General of Training (DGT), Ministry of Skill Development",
    trade: "Machinist",
    status: "completed",
    progressPct: 100,
    duration: "2 Years Full-Time",
    completedDate: "July 2024",
    certificateId: "NCVT-TN-TR-2024-99214",
    badge: "NCVT Verified",
  },
  {
    id: "c-202",
    title: "Industrial Safety & Fire Hazards Shopfloor Protocol",
    provider: "National Safety Council of India (NSCI)",
    trade: "Industrial Safety",
    status: "completed",
    progressPct: 100,
    duration: "40 Hours",
    completedDate: "May 2024",
    certificateId: "NSCI-SAF-TR-4081",
    badge: "Safety Inspector",
  },
  {
    id: "c-203",
    title: "Basic CAD / CAM Modeling with Fusion 360",
    provider: "Autodesk Authorized Academic Center",
    trade: "CAD/CAM",
    status: "completed",
    progressPct: 100,
    duration: "6 Weeks",
    completedDate: "January 2024",
    certificateId: "ADSK-TN-88204",
    badge: "Autodesk Credentialed",
  },
];

// Initial seed applications so the employer pipeline and candidate tracker have realistic data immediately
const INITIAL_APPLICATIONS: Candidate[] = [
  {
    application_id: 1,
    seeker_id: 101,
    vacancy_id: 118,
    job_title: "CNC machine operator",
    employer: "Kaveri Precision Works",
    name: "Arun Kumar",
    trade: "CNC Operation",
    score: 0.91,
    distance_km: 6.2,
    skills: ["Lathe operation", "G-code programming", "Blueprint reading"],
    missing_skills: ["Tool offset setting"],
    bridge_course: "Tool offset setting, 3 weeks",
    status: "pending",
    applied_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    application_id: 2,
    seeker_id: 101,
    vacancy_id: 125,
    job_title: "Quality Inspector - Precision Tools",
    employer: "Roots Industries Trichy",
    name: "Arun Kumar",
    trade: "CNC Operation",
    score: 0.72,
    distance_km: 18.4,
    skills: ["Lathe operation", "Blueprint reading"],
    missing_skills: ["Coordinate Measuring Machine (CMM)", "GD&T Quality Auditing"],
    bridge_course: "CMM Inspection & GD&T Standard, 3 weeks",
    status: "rejected",
    reject_reason: "skills_mismatch",
    reject_feedback: "Screening review: Requires certified CMM inspection and GD&T quality verification. We recommend taking the 3-week Government ITI bridge course to qualify for the next hiring cycle.",
    applied_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    application_id: 3,
    seeker_id: 102,
    vacancy_id: 118,
    job_title: "CNC machine operator",
    employer: "Kaveri Precision Works",
    name: "Divya S.",
    trade: "CNC Operation",
    score: 0.84,
    distance_km: 14.8,
    skills: ["Tool offset setting", "Micrometer and vernier use"],
    missing_skills: ["G-code programming"],
    bridge_course: "G-code programming, 4 weeks",
    status: "interview_scheduled",
    interview_at: new Date(Date.now() + 86400000 * 2).toISOString(),
    interview_mode: "in_person",
    interview_location: "Main Plant Gate 2, Thuvakudi Industrial Estate, Trichy",
    interview_notes: null,
    applied_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    application_id: 4,
    seeker_id: 103,
    vacancy_id: 118,
    job_title: "CNC machine operator",
    employer: "Kaveri Precision Works",
    name: "Karthik R.",
    trade: "CNC Operation",
    score: 0.62,
    distance_km: 42.5,
    skills: ["Bench fitting"],
    missing_skills: ["G-code programming", "Tool offset setting"],
    bridge_course: "CNC basics, 6 weeks",
    status: "rejected",
    reject_reason: "skills_mismatch",
    reject_feedback: "Required at least 1 year hands-on CNC G-code setup. Suggested completing the 4-week bridging course.",
    applied_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    application_id: 5,
    seeker_id: 104,
    vacancy_id: 121,
    job_title: "Turner, CNC lathe",
    employer: "Kaveri Precision Works",
    name: "Suresh Mani",
    trade: "Turner",
    score: 0.94,
    distance_km: 4.8,
    skills: ["Lathe operation", "Micrometer and vernier use", "G-code programming"],
    missing_skills: [],
    bridge_course: null,
    status: "hired",
    interview_at: new Date(Date.now() - 86400000).toISOString(),
    interview_mode: "in_person",
    interview_location: "Factory Floor B",
    interview_notes: "Passed practical test with 95% precision. Offer letter issued.",
    applied_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
];

function notifyChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("skillbridge_store_updated"));
  }
}

export function getStoredApplications(): Candidate[] {
  if (typeof window === "undefined") return INITIAL_APPLICATIONS;
  try {
    const raw = localStorage.getItem(APPS_KEY);
    if (!raw) {
      localStorage.setItem(APPS_KEY, JSON.stringify(INITIAL_APPLICATIONS));
      return INITIAL_APPLICATIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_APPLICATIONS;
  }
}

export function saveStoredApplications(apps: Candidate[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(APPS_KEY, JSON.stringify(apps));
    notifyChange();
  }
}

export function getApplicationsForSeeker(seekerId: number): Candidate[] {
  const apps = getStoredApplications();
  return apps.filter((a) => a.seeker_id === seekerId);
}

export function getApplicationsForEmployer(employerId: number): Candidate[] {
  return getStoredApplications();
}

export function storeApplyToJob(seeker: SeekerProfile, job: JobMatch): Candidate {
  const current = getStoredApplications();
  const existing = current.find(
    (a) => a.seeker_id === seeker.seeker_id && a.vacancy_id === job.vacancy_id,
  );
  if (existing) return existing;

  const newApp: Candidate = {
    application_id: Math.max(10, ...current.map((a) => a.application_id)) + 1,
    seeker_id: seeker.seeker_id,
    vacancy_id: job.vacancy_id,
    job_title: job.title,
    employer: job.employer,
    name: seeker.name,
    trade: seeker.detected_trade,
    score: job.score,
    distance_km: job.distance_km,
    skills: [...seeker.skills],
    missing_skills: [...(job.missing_skills || [])],
    bridge_course: job.bridge_course,
    status: "pending",
    applied_at: new Date().toISOString(),
  };

  saveStoredApplications([newApp, ...current]);
  return newApp;
}

export function storeScheduleInterview(applicationId: number, details: InterviewDetails): Candidate {
  const current = getStoredApplications();
  const index = current.findIndex((a) => a.application_id === applicationId);
  if (index === -1) throw new Error("Application not found");

  const updated: Candidate = {
    ...current[index],
    status: "interview_scheduled",
    interview_at: details.interview_at,
    interview_mode: details.mode,
    interview_location: details.location_or_link,
    interview_notes: details.notes || null,
  };

  current[index] = updated;
  saveStoredApplications([...current]);
  return updated;
}

export function storeSelectCandidate(applicationId: number, notes?: string): Candidate {
  const current = getStoredApplications();
  const index = current.findIndex((a) => a.application_id === applicationId);
  if (index === -1) throw new Error("Application not found");

  const updated: Candidate = {
    ...current[index],
    status: "hired",
    interview_notes: notes || current[index].interview_notes || "Selected and offer released.",
  };

  current[index] = updated;
  saveStoredApplications([...current]);
  return updated;
}

export function storeRejectCandidate(
  applicationId: number,
  reason: RejectReason,
  feedback?: string,
  extraMissingSkill?: string,
): Candidate {
  const current = getStoredApplications();
  const index = current.findIndex((a) => a.application_id === applicationId);
  if (index === -1) throw new Error("Application not found");

  const currentMissing = current[index].missing_skills || [];
  const updatedMissing = extraMissingSkill && !currentMissing.includes(extraMissingSkill)
    ? [...currentMissing, extraMissingSkill]
    : currentMissing;

  const updated: Candidate = {
    ...current[index],
    status: "rejected",
    reject_reason: reason,
    reject_feedback: feedback || null,
    missing_skills: updatedMissing,
  };

  current[index] = updated;
  saveStoredApplications([...current]);
  return updated;
}

export function getStoredJobs(): JobMatch[] {
  if (typeof window === "undefined") return MOCK_MATCHES;
  try {
    const raw = localStorage.getItem(JOBS_KEY);
    if (!raw) {
      localStorage.setItem(JOBS_KEY, JSON.stringify(MOCK_MATCHES));
      return MOCK_MATCHES;
    }
    return JSON.parse(raw);
  } catch {
    return MOCK_MATCHES;
  }
}

export function storePostJob(input: VacancyInput): JobMatch {
  const jobs = getStoredJobs();
  const newId = Math.max(200, ...jobs.map((j) => j.vacancy_id)) + 1;
  const newJob: JobMatch = {
    vacancy_id: newId,
    title: input.title,
    employer: input.employer_name,
    score: 0.88,
    distance_km: 8.5,
    is_formal: input.is_formal,
    wage_min: input.wage_min,
    wage_max: input.wage_max,
    matched_skills: input.required_skills || ["G-code programming"],
    missing_skills: [],
    bridge_course: null,
    location: input.location,
    description: input.description,
  };

  const updated = [newJob, ...jobs];
  if (typeof window !== "undefined") {
    localStorage.setItem(JOBS_KEY, JSON.stringify(updated));
    notifyChange();
  }
  return newJob;
}

export function getStoredProfile(): SeekerProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(DEFAULT_PROFILE));
      return DEFAULT_PROFILE;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveStoredProfile(profile: SeekerProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new Event("skillbridge_profile_updated"));
  notifyChange();
}

export function getStoredCourses(): Course[] {
  if (typeof window === "undefined") return DEFAULT_COURSES;
  try {
    const raw = localStorage.getItem(COURSES_KEY);
    if (!raw) {
      localStorage.setItem(COURSES_KEY, JSON.stringify(DEFAULT_COURSES));
      return DEFAULT_COURSES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_COURSES;
  }
}

export function saveStoredCourses(courses: Course[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
  window.dispatchEvent(new Event("skillbridge_courses_updated"));
  notifyChange();
}

export function storeEnrollInBridgeCourse(courseTitle: string, trade: string, provider = "Government ITI Thuvakudi"): boolean {
  const courses = getStoredCourses();
  const exists = courses.some((c) => c.title.toLowerCase() === courseTitle.toLowerCase());
  if (exists) return false;

  const newCourse: Course = {
    id: `bc-${Date.now()}`,
    title: courseTitle,
    provider,
    trade,
    status: "ongoing",
    progressPct: 15,
    duration: "3 Weeks (30 Hours)",
    modulesTotal: 6,
    modulesDone: 1,
    badge: "ITI Bridge Module",
  };

  saveStoredCourses([newCourse, ...courses]);
  return true;
}

/**
 * Completely resets all demo data (Applications, Jobs, Candidate Profile, and Courses)
 * back to pristine baseline seed data and cleans up any old localStorage artifacts.
 */
export function resetAllDemoData() {
  if (typeof window === "undefined") return;

  const keysToRemove = [
    APPS_KEY,
    JOBS_KEY,
    PROFILE_KEY,
    COURSES_KEY,
    "skillbridge_shared_applications",
    "skillbridge_shared_jobs",
    "skillbridge_candidate_profile",
    "skillbridge_candidate_courses",
    "skillbridge_apps_v2",
    "skillbridge_jobs_v2",
    "skillbridge_profile_v2",
    "skillbridge_courses_v2",
    "skillbridge_apps_v3",
    "skillbridge_jobs_v3",
    "skillbridge_profile_v3",
    "skillbridge_courses_v3",
  ];

  keysToRemove.forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      // ignore
    }
  });

  try {
    localStorage.setItem(APPS_KEY, JSON.stringify(INITIAL_APPLICATIONS));
    localStorage.setItem(JOBS_KEY, JSON.stringify(MOCK_MATCHES));
    localStorage.setItem(PROFILE_KEY, JSON.stringify(DEFAULT_PROFILE));
    localStorage.setItem(COURSES_KEY, JSON.stringify(DEFAULT_COURSES));
  } catch {
    // ignore
  }

  notifyChange();
  window.dispatchEvent(new Event("skillbridge_profile_updated"));
  window.dispatchEvent(new Event("skillbridge_courses_updated"));
}



