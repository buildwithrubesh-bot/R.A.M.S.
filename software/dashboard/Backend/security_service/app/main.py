from datetime import datetime
from statistics import mean
from typing import List, Optional

from fastapi import FastAPI
from pydantic import BaseModel, Field


app = FastAPI(title="RAMS Security Service", version="1.0.0")


class AssessmentRequest(BaseModel):
    coach_no: str = Field(min_length=1, max_length=32, pattern=r"^[A-Za-z0-9_-]+$")
    axle_no: str = Field(min_length=1, max_length=32, pattern=r"^[A-Za-z0-9_-]+$")
    temperature: float = Field(ge=-40, le=200)
    recorded_at: Optional[datetime] = None
    recent_temperatures: List[float] = Field(default_factory=list, max_length=20)


class AssessmentResponse(BaseModel):
    accepted: bool
    risk_score: float
    reasons: List[str]


@app.get("/health")
def health():
    return {"status": "healthy", "service": "security", "timestamp": datetime.utcnow().isoformat()}


@app.post("/assess", response_model=AssessmentResponse)
def assess(payload: AssessmentRequest):
    risk = 0.0
    reasons: List[str] = []
    temperature = payload.temperature

    if temperature < -20 or temperature > 130:
        risk += 0.55
        reasons.append("temperature_outside_physical_operating_range")

    if temperature > 95:
        risk += 0.25
        reasons.append("extreme_temperature")

    recent = payload.recent_temperatures
    if recent:
        last = recent[0]
        spike = abs(temperature - last)
        if spike >= 20:
            risk += 0.35
            reasons.append("sudden_temperature_spike")

        baseline = mean(recent)
        if abs(temperature - baseline) >= 25:
            risk += 0.25
            reasons.append("deviation_from_recent_baseline")

    if payload.recorded_at:
        skew_seconds = abs((datetime.utcnow() - payload.recorded_at.replace(tzinfo=None)).total_seconds())
        if skew_seconds > 3600:
            risk += 0.15
            reasons.append("timestamp_skew_detected")

    risk_score = round(min(risk, 1.0), 2)
    accepted = risk_score < 0.75

    if not reasons:
        reasons.append("no_anomaly_detected")

    return AssessmentResponse(accepted=accepted, risk_score=risk_score, reasons=reasons)
