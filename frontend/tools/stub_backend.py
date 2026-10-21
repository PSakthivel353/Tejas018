"""
A tiny FastAPI server that returns the exact JSON shapes the frontend expects.

Two uses:
  1. Try the frontend against a "real" backend before Member 3's is ready.
  2. Member 3 can read this file as the contract: same paths, same field names.

Run (from the frontend folder):
    pip install fastapi "uvicorn[standard]" python-multipart
    uvicorn tools.stub_backend:app --port 8000 --reload

Routes have NO trailing slash on purpose (FastAPI would redirect "/trades/" to an
absolute URL and bypass the Next.js proxy).
"""

from datetime import datetime, timedelta, timezone
from typing import Literal

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel, Field

app = FastAPI(title="SkillBridge stub backend")
SEEKERS = {}
APPLICATIONS = []
NEXT_APPLICATION_ID = 1

TRADES = [
    # trade_id, trade, projected_demand, expected_graduates, employers_hiring
    (1, "CNC Operation", 410, 240, 12),
    (2, "EV Mechanic", 260, 120, 8),
    (3, "Solar Technician", 220, 110, 9),
    (4, "Electrician", 300, 270, 14),
    (5, "Fitter", 280, 420, 10),
    (6, "Turner", 180, 300, 6),
]
MONTHS = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"]


def label_for(sgs: float) -> str:
    return "shortage" if sgs > 0.2 else "surplus" if sgs < -0.2 else "balanced"


@app.get("/health")
def health():
    return {"status": "ok"}


# ---- Job seeker ---------------------------------------------------------------------------

@app.post("/seekers/cv")
async def upload_cv(file: UploadFile = File(...)):
    data = await file.read()
    if not data.startswith(b"%PDF"):
        raise HTTPException(422, "That file is not a readable PDF.")
    name = (file.filename or "candidate").rsplit(".", 1)[0]
    profile = {
        "seeker_id": 7,
        "name": f"Stub {name}",
        "trade_id": 1,
        "detected_trade": "CNC Operation",
        "skills": ["G-code programming", "Lathe operation"],
        "confidence": 0.91,
    }
    SEEKERS[profile["seeker_id"]] = profile
    return profile


class MatchRequest(BaseModel):
    trade_id: int
    skills: list[str]
    lat: float
    lon: float
    radius_km: float


@app.post("/jobs/match")
def match_jobs(req: MatchRequest):
    jobs = [
        {
            "vacancy_id": 1, "title": "CNC operator (stub)", "employer": "Stub Works", "score": 0.9,
            "distance_km": 5.0, "is_formal": True, "wage_min": 16000, "wage_max": 20000,
            "matched_skills": req.skills, "missing_skills": ["Tool offset setting"],
            "bridge_course": "Tool offset setting, 3 weeks",
        },
        {
            "vacancy_id": 2, "title": "Lathe hand (stub)", "employer": "Far Away Ltd", "score": 0.6,
            "distance_km": 70.0, "is_formal": False, "wage_min": 11000, "wage_max": 13000,
            "matched_skills": req.skills[:1], "missing_skills": [], "bridge_course": None,
        },
    ]
    return [j for j in jobs if j["distance_km"] <= req.radius_km]


# ---- Employer -------------------------------------------------------------------------------

class VacancyIn(BaseModel):
    employer_id: int
    employer_name: str
    title: str
    description: str
    openings: int = Field(ge=1)
    wage_min: int
    wage_max: int
    is_formal: bool
    location: str


@app.post("/employers/vacancies")
def post_vacancy(v: VacancyIn):
    if v.title.strip().lower() == "bad":
        raise HTTPException(422, "Job title is too vague. Describe the role.")
    return {
        "vacancy_id": 301, "detected_trade": "CNC Operation",
        "skills": ["G-code programming", "Tool offset setting"], "confidence": 0.88,
        "sgs_before": 0.41, "sgs_after": 0.44,
    }


class ApplicationIn(BaseModel):
    seeker_id: int
    vacancy_id: int


@app.post("/applications")
def submit_application(body: ApplicationIn):
    global NEXT_APPLICATION_ID
    seeker_id = body.seeker_id
    vacancy_id = body.vacancy_id
    seeker = SEEKERS.get(seeker_id)
    if not seeker or vacancy_id not in (1, 2):
        raise HTTPException(400, "Upload a CV and choose an available job before applying.")
    existing = next(
        (application for application in APPLICATIONS
         if application["seeker_id"] == seeker_id and application["vacancy_id"] == vacancy_id),
        None,
    )
    if existing:
        return existing

    job = (
        {
            "title": "CNC operator (stub)", "employer": "Stub Works", "score": 0.9,
            "distance_km": 5.0, "missing_skills": ["Tool offset setting"],
            "bridge_course": "Tool offset setting, 3 weeks",
        }
        if vacancy_id == 1
        else {
            "title": "Lathe hand (stub)", "employer": "Far Away Ltd", "score": 0.6,
            "distance_km": 70.0, "missing_skills": [], "bridge_course": None,
        }
    )
    application = {
        "application_id": NEXT_APPLICATION_ID,
        "employer_id": 1,
        "seeker_id": seeker_id,
        "vacancy_id": vacancy_id,
        "job_title": job["title"],
        "employer": job["employer"],
        "name": seeker["name"],
        "trade": seeker["detected_trade"],
        "score": job["score"],
        "distance_km": job["distance_km"],
        "skills": seeker["skills"],
        "missing_skills": job["missing_skills"],
        "bridge_course": job["bridge_course"],
        "status": "pending",
        "reject_reason": None,
    }
    NEXT_APPLICATION_ID += 1
    APPLICATIONS.append(application)
    return application


@app.get("/seekers/{seeker_id}/applications")
def seeker_applications(seeker_id: int):
    return [application for application in APPLICATIONS if application["seeker_id"] == seeker_id]


@app.get("/employers/{employer_id}/candidates")
def candidates(employer_id: int):
    return [application for application in APPLICATIONS if application["employer_id"] == employer_id]


class RejectIn(BaseModel):
    reason: Literal["skills_mismatch", "too_far", "salary_expectation", "experience", "other"]


@app.patch("/applications/{application_id}/hire")
def hire(application_id: int):
    for application in APPLICATIONS:
        if application["application_id"] == application_id:
            if application["status"] != "hired":
                application["status"] = "hired"
                application["interview_at"] = (
                    datetime.now(timezone.utc) + timedelta(days=3)
                ).isoformat()
            return application
    raise HTTPException(400, "Unknown application")


@app.patch("/applications/{application_id}/reject")
def reject(application_id: int, body: RejectIn):
    for application in APPLICATIONS:
        if application["application_id"] == application_id:
            application["status"], application["reject_reason"] = "rejected", body.reason
            application["interview_at"] = None
            return application
    raise HTTPException(400, "Unknown application")  # 400, not 404: 404 means "endpoint missing" to the frontend


# ---- District officer ---------------------------------------------------------------------------

@app.get("/district/summary")
def summary():
    return {"district": "Tiruchirappalli", "trades": len(TRADES), "itis": 8, "employers": 212, "open_vacancies": 1486}


@app.get("/trades")
def trades():
    out = []
    for tid, name, demand, grads, hiring in TRADES:
        sgs = round((demand - grads) / demand, 2)
        lab = label_for(sgs)
        seats = max(10, round((demand - grads) / 4 / 10) * 10) if lab == "shortage" else 0
        rec = (
            f"Add {seats} seats in {name}. {hiring} employers are hiring nearby." if lab == "shortage"
            else f"Review the {name} syllabus." if lab == "surplus" else f"Keep {name} seats as they are."
        )
        out.append({
            "trade_id": tid, "trade": name, "projected_demand": demand, "expected_graduates": grads,
            "sgs": sgs, "label": lab, "seats_to_add": seats, "employers_hiring": hiring, "recommendation": rec,
        })
    return out


@app.get("/district/heatmap")
def heatmap():
    cells = [
        {"trade": name, "month": m, "value": int(demand / 24 * (1 + 0.05 * mi) * 2)}
        for _, name, demand, _, _ in TRADES
        for mi, m in enumerate(MONTHS)
    ]
    return {"months": MONTHS, "trades": [t[1] for t in TRADES], "cells": cells}


@app.get("/dsdp/export")
def dsdp_export():
    rows = ["Trade,Projected demand,Expected graduates"] + [f"{n},{d},{g}" for _, n, d, g, _ in TRADES]
    return Response(
        "\n".join(rows),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="DSDP-Tiruchirappalli-2026.csv"'},
    )
