from datetime import datetime
from typing import Dict

from fastapi import FastAPI


app: FastAPI = FastAPI(title="EduTech AI Backend", version="0.1.0")
started_at: str = datetime.utcnow().isoformat() + "Z"


@app.get("/", summary="Root", tags=["system"])  # type: ignore[call-arg]
def read_root() -> Dict[str, str]:
    return {
        "message": "API is running",
        "started_at": started_at,
    }


@app.get("/health", summary="Health check", tags=["system"])  # type: ignore[call-arg]
def health_check() -> Dict[str, str]:
    return {"status": "ok"}


