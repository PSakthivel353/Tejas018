// ONE file that talks to the backend. Every screen imports from here, never calls fetch itself.
//
// How the fallback works (so the UI is demo-able before the backend is finished):
//   - network error, 404 (endpoint not built yet) or 5xx  -> use demo data, badge says "Demo data"
//   - 400/422 (validation error from the backend)         -> show the backend's message to the user
//   - NEXT_PUBLIC_USE_MOCK=true                           -> never call the backend

import {
  DISTRICT,
  MOCK_MATCHES,
  MOCK_SUMMARY,
  MOCK_TRADES,
  mockApplicationsForSeeker,
  mockCandidatesForEmployer,
  mockDsdpCsv,
  mockHireApplication,
  mockHeatmap,
  mockProfile,
  mockRejectApplication,
  mockSubmitApplication,
  mockVacancyResult,
} from "./mock";
import { markSource } from "./status";
import type {
  Candidate,
  DistrictSummary,
  HeatmapData,
  JobMatch,
  MatchRequest,
  RejectReason,
  SeekerProfile,
  TradeGap,
  VacancyInput,
  VacancyResult,
} from "./types";
import { delay } from "./utils";

const BASE = "/api"; // rewritten to BACKEND_URL by next.config.mjs
const MOCK_ONLY = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export const EMPLOYER_ID = Number(process.env.NEXT_PUBLIC_EMPLOYER_ID || 1);
export const DISTRICT_LAT = Number(process.env.NEXT_PUBLIC_DISTRICT_LAT || 10.8);
export const DISTRICT_LON = Number(process.env.NEXT_PUBLIC_DISTRICT_LON || 78.69);

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const isUnavailable = (status: number) => status === 404 || status >= 500;

function detailFrom(text: string, fallback: string): string {
  try {
    const body = JSON.parse(text);
    if (typeof body.detail === "string") return body.detail;
    if (Array.isArray(body.detail) && body.detail[0]?.msg) return body.detail[0].msg; // FastAPI 422
  } catch {
    /* not JSON */
  }
  return fallback;
}

async function call<T>(
  label: string,
  path: string,
  init: RequestInit | undefined,
  fallback: () => T | Promise<T>,
): Promise<T> {
  const useDemo = async () => {
    markSource(label, "mock");
    await delay(350); // feels like a real request
    return fallback();
  };
  if (MOCK_ONLY) return useDemo();
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, init);
  } catch {
    return useDemo();
  }
  if (isUnavailable(res.status)) return useDemo();
  if (!res.ok) throw new ApiError(res.status, detailFrom(await res.text(), `Request failed (${res.status})`));
  markSource(label, "api");
  return (await res.json()) as T;
}

const jsonInit = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

// ---- Job seeker ---------------------------------------------------------------------------------

/** POST /seekers/cv  (multipart form, field name "file")  ->  SeekerProfile */
export function uploadCv(file: File, onProgress: (percent: number) => void): Promise<SeekerProfile> {
  const label = "POST /seekers/cv";
  const simulate = async () => {
    markSource(label, "mock");
    for (let p = 0; p <= 100; p += 10) {
      onProgress(p);
      await delay(110);
    }
    await delay(500);
    return mockProfile(file.name);
  };
  if (MOCK_ONLY) return simulate();

  return new Promise<SeekerProfile>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE}/seekers/cv`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (isUnavailable(xhr.status)) {
        simulate().then(resolve, reject);
        return;
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new ApiError(xhr.status, detailFrom(xhr.responseText, `Upload failed (${xhr.status})`)));
        return;
      }
      try {
        markSource(label, "api");
        resolve(JSON.parse(xhr.responseText) as SeekerProfile);
      } catch {
        reject(new Error("The server sent a reply we could not read."));
      }
    };
    xhr.onerror = () => {
      simulate().then(resolve, reject);
    };
    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  });
}

/** POST /jobs/match  ->  JobMatch[] */
export function matchJobs(req: MatchRequest): Promise<JobMatch[]> {
  return call("POST /jobs/match", "/jobs/match", jsonInit("POST", req), () =>
    MOCK_MATCHES.filter((m) => m.distance_km <= req.radius_km),
  );
}

/** POST /applications -> the submitted application record */
export function applyToJob(seeker: SeekerProfile, job: JobMatch): Promise<Candidate> {
  return call(
    "POST /applications",
    "/applications",
    jsonInit("POST", { seeker_id: seeker.seeker_id, vacancy_id: job.vacancy_id }),
    () => mockSubmitApplication(seeker, job),
  );
}

/** GET /seekers/{id}/applications -> applications and their latest decisions */
export function getSeekerApplications(seekerId: number): Promise<Candidate[]> {
  return call(
    "GET /seekers/{id}/applications",
    `/seekers/${seekerId}/applications`,
    undefined,
    () => mockApplicationsForSeeker(seekerId),
  );
}

// ---- Employer ----------------------------------------------------------------------------------------

/** POST /employers/vacancies  ->  VacancyResult */
export function postVacancy(input: VacancyInput): Promise<VacancyResult> {
  return call("POST /employers/vacancies", "/employers/vacancies", jsonInit("POST", input), () =>
    mockVacancyResult(input),
  );
}

/** GET /employers/{id}/candidates  ->  Candidate[] */
export function getCandidates(employerId: number): Promise<Candidate[]> {
  return call(
    "GET /employers/{id}/candidates",
    `/employers/${employerId}/candidates`,
    undefined,
    mockCandidatesForEmployer,
  );
}

/** PATCH /applications/{id}/hire -> the updated application */
export function hireCandidate(applicationId: number): Promise<Candidate> {
  return call(
    "PATCH /applications/{id}/hire",
    `/applications/${applicationId}/hire`,
    jsonInit("PATCH", {}),
    () => mockHireApplication(applicationId),
  );
}

/** PATCH /applications/{id}/reject body {reason} -> the updated application */
export function rejectCandidate(applicationId: number, reason: RejectReason): Promise<Candidate> {
  return call(
    "PATCH /applications/{id}/reject",
    `/applications/${applicationId}/reject`,
    jsonInit("PATCH", { reason }),
    () => mockRejectApplication(applicationId, reason),
  );
}

// ---- District officer ------------------------------------------------------------------------------------

/** GET /district/summary  ->  DistrictSummary */
export function getSummary(): Promise<DistrictSummary> {
  return call("GET /district/summary", "/district/summary", undefined, () => MOCK_SUMMARY);
}

/** GET /trades  ->  TradeGap[] */
export function getTrades(): Promise<TradeGap[]> {
  return call("GET /trades", "/trades", undefined, () => MOCK_TRADES);
}

/** GET /district/heatmap  ->  HeatmapData  (projected openings, trade x month) */
export function getHeatmap(): Promise<HeatmapData> {
  return call("GET /district/heatmap", "/district/heatmap", undefined, mockHeatmap);
}

/** GET /dsdp/export  ->  a file (PDF or CSV). Returns the file and a name for it. */
export async function exportDsdp(): Promise<{ blob: Blob; filename: string }> {
  const label = "GET /dsdp/export";
  const demo = async () => {
    markSource(label, "mock");
    await delay(600);
    return { blob: new Blob([mockDsdpCsv()], { type: "text/csv" }), filename: `DSDP-${DISTRICT}-demo.csv` };
  };
  if (MOCK_ONLY) return demo();
  let res: Response;
  try {
    res = await fetch(`${BASE}/dsdp/export`);
  } catch {
    return demo();
  }
  if (isUnavailable(res.status)) return demo();
  if (!res.ok) throw new ApiError(res.status, detailFrom(await res.text(), `Export failed (${res.status})`));
  markSource(label, "api");
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  const type = res.headers.get("Content-Type") || "";
  const fallbackName = `DSDP-${DISTRICT}.${type.includes("pdf") ? "pdf" : type.includes("csv") ? "csv" : "bin"}`;
  return { blob: await res.blob(), filename: match ? decodeURIComponent(match[1]) : fallbackName };
}

/** Saves a Blob as a file download in the browser. */
export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
