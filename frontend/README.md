# SkillBridge frontend

Next.js 14 (App Router) + Tailwind CSS + Recharts. Three portals, light and dark mode.

| Route | Portal | What is in it |
| --- | --- | --- |
| `/` | Home | Three doors into the portals |
| `/seeker` | Job seeker | PDF CV uploader, progress bar, ranked job matches, apply button, and application decisions |
| `/employer` | Employer | Job posting form, submitted applications, and hire/reject decisions |
| `/officer` | District officer | Stats, Recharts heatmap, Skill Gap Score chart, 1-click DSDP export |

## 1. Where to place it

Put this whole folder at the **root of the team repo**, named `frontend/`:

```
skillbridge/            <- the team repo
  backend/              <- Member 3's FastAPI
  frontend/             <- THIS folder (replaces the old Streamlit frontend/ folder)
    package.json
    src/
    ...
```

If the repo still has the Streamlit `frontend/` from the plan, delete its contents first. Then, from the repo root:

```bash
git switch dev && git pull origin dev
git switch -c feature/d-frontend-init
# copy this folder in as frontend/
git add frontend
git commit -m "feat(frontend): next.js portals for seeker, employer and officer"
git push -u origin feature/d-frontend-init
gh pr create --base dev --fill
```

`node_modules/` and `.next/` are git-ignored, so never commit them.

## 2. Run it

You need **Node 18.17 or newer** (check with `node -v`).

```bash
cd frontend
cp .env.example .env.local      # Windows: copy .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000. That is all: **it works with no backend running**. Any endpoint the backend
has not built yet (or that is down) quietly uses built-in demo data, and the pill in the navbar says
**Demo data**. Hover the pill to see exactly which endpoints are still on demo data. When everything is
wired it turns into **Live API**.

Other commands: `npm run build` (production build, also type-checks), `npm run start` (serve the build),
`npm run typecheck`.

### Modes (set in `.env.local`, restart `npm run dev` after changing)

| Setting | Meaning |
| --- | --- |
| `BACKEND_URL=http://localhost:8000` | Where Member 3's FastAPI runs |
| `NEXT_PUBLIC_USE_MOCK=true` | Never call the backend, always demo data (good for rehearsing the pitch offline) |
| `NEXT_PUBLIC_USE_MOCK=false` | Call the backend, fall back to demo data per endpoint when it is missing (404) or down (5xx) |

The browser only calls `/api/...` on the Next.js server, which forwards to `BACKEND_URL`
(see `next.config.mjs`). So **the backend does not need CORS settings**.

## 3. How the files are organised

```
src/
  app/                      one folder per route (page.tsx = the screen)
    layout.tsx              fonts, theme, navbar
    globals.css             ALL colours (light + dark) live here, as CSS variables
  components/
    ui.tsx                  Button, Card, Badge, Field, ProgressBar, Notice, Skeleton ...
    Navbar.tsx  ThemeToggle.tsx  ThemeProvider.tsx  ApiStatus.tsx
    seeker/   CvUploader  JobMatches  SeekerPortal
    employer/ JobPostingForm  CandidateList  EmployerPortal
    officer/  SkillHeatmap  GapChart  DsdpExport  OfficerDashboard
  lib/
    api.ts                  THE ONLY FILE THAT CALLS THE BACKEND
    types.ts                the JSON shapes (the contract with Member 3)
    mock.ts                 demo data
    status.ts               feeds the Demo data / Live API pill
tools/stub_backend.py       a tiny FastAPI server with the exact shapes (see below)
```

Change colours in `globals.css`, never in components. Change a backend path or field name in
`lib/api.ts` and `lib/types.ts`, never in screens.

## 4. The contract for Member 3 (backend)

Send this table to Member 3. Every path below is called through `lib/api.ts`.

| Call | Request | Response |
| --- | --- | --- |
| `POST /seekers/cv` | multipart form, field name `file` (a PDF) | `{seeker_id, name, trade_id, detected_trade, skills[], confidence}` |
| `POST /jobs/match` | `{trade_id, skills[], lat, lon, radius_km}` | list of `{vacancy_id, title, employer, score, distance_km, is_formal, wage_min, wage_max, matched_skills[], missing_skills[], bridge_course}` |
| `POST /applications` | `{seeker_id, vacancy_id}` | application record including applicant/job details and `status: "pending"` |
| `GET /seekers/{id}/applications` | none | list of the seeker's applications and their latest decisions |
| `POST /employers/vacancies` | `{employer_id, employer_name, title, description, openings, wage_min, wage_max, is_formal, location}` | `{vacancy_id, detected_trade, skills[], confidence, sgs_before, sgs_after}` |
| `GET /employers/{id}/candidates` | none | submitted applications with applicant skills, matched job, missing skills, and status |
| `PATCH /applications/{id}/hire` | `{}` | updated application with `status: "hired"` and `interview_at` (ISO-8601 date/time) |
| `PATCH /applications/{id}/reject` | `{reason}`: `skills_mismatch`, `too_far`, `salary_expectation`, `experience`, `other` | updated application with `status: "rejected"` |
| `GET /district/summary` | none | `{district, trades, itis, employers, open_vacancies}` |
| `GET /trades` | none | list of `{trade_id, trade, projected_demand, expected_graduates, sgs, label, seats_to_add, employers_hiring, recommendation}` |
| `GET /district/heatmap` | none | `{months[], trades[], cells: [{trade, month, value}]}` (value = projected openings) |
| `GET /dsdp/export` | none | a file (PDF or CSV); send a `Content-Disposition: attachment; filename="..."` header so the download gets a proper name |

Rules that keep the frontend and backend friendly:

1. **No trailing slashes** in routes. FastAPI redirects `/trades/` to an absolute URL, which bypasses the proxy.
2. **Use 400 or 422 for bad input** (with `{"detail": "plain message"}`), because the frontend shows that message to the user. FastAPI's default 422 already works.
3. **404 and 5xx mean "not built / down"** to the frontend, which then switches that one endpoint to demo data. Do not return 404 for "this record does not exist"; use 400.
4. Field names must match `src/lib/types.ts`. If the backend's names differ, change `types.ts` (and `mock.ts`) in one place.

`tools/stub_backend.py` is a working example of the routes above. To try the frontend against it:

```bash
pip install fastapi "uvicorn[standard]" python-multipart
uvicorn tools.stub_backend:app --port 8000      # run from the frontend/ folder
```

## 5. Your five steps, and where each one lives

| Step | Done in |
| --- | --- |
| 1. Project, Tailwind, navbar, layouts | `app/layout.tsx`, `globals.css`, `components/Navbar.tsx`, `components/ui.tsx` |
| 2. Job Seeker: CV uploader, matches, progress bar | `components/seeker/*` |
| 3. Employer: posting form, candidates, 2-click rejection | `components/employer/*` |
| 4. Officer: Recharts heatmap, DSDP export | `components/officer/*` |
| 5. Wire forms and charts to the FastAPI backend | `lib/api.ts` (every call goes through it) |

## 6. Assumptions to confirm as the hackathon goes on

- **DSDP** is shown as "District Skill Development Plan". If your team means something else, change the
  `title` text in `components/officer/DsdpExport.tsx`.
- There is **no login**. The Employer portal acts as employer `NEXT_PUBLIC_EMPLOYER_ID` (default 1).
- The heatmap reads a new endpoint, `GET /district/heatmap`. If Member 3 prefers per-trade forecasts, only
  `getHeatmap()` in `lib/api.ts` changes.
- Employer decisions are stored on each application. Seekers see a hire confirmation or, after rejection,
  the missing skills and suggested bridge course for that job.
- Rejection still takes two clicks: Reject, then pick a reason. The reason is stored, so the officer dashboard
  can later show why local candidates are turned away.
- Demo numbers (for example "Add 40 seats in CNC Operation") are invented for the demo, see `lib/mock.ts`.
- Recharts 2.x is used (it prints a "deprecated" notice on install; it is stable and works with React 18).

## 7. If something goes wrong

| Problem | Fix |
| --- | --- |
| `npm install` fails | Check `node -v` is 18.17 or newer. Delete `node_modules` and `package-lock.json`, run again |
| Port 3000 is busy | `npm run dev -- -p 3001` |
| Navbar says Demo data but the backend is running | Hover the pill: it lists the endpoints that returned 404 or 5xx. Check the path spelling and that `BACKEND_URL` is correct, then restart `npm run dev` |
| Changed `.env.local` and nothing happened | Stop and restart `npm run dev`; env files are read at start |
| Upload says "not a readable PDF" | That message came from the backend (422). The frontend only checks the file ends in `.pdf` and is under 5 MB |
| Charts look empty | Open the browser console; the heatmap needs `months`, `trades` and `cells` all present |
