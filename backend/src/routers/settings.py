"""Application settings endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.auth import TokenInfo, get_effective_user
from src.database import get_db
from src.extraction.cli import MODELS
from src.models.app_settings import get_setting, set_setting

router = APIRouter(prefix="/api/settings", tags=["settings"])

SETTING_KEY = "extractor_model"
DEFAULT_MODEL = "claude-sonnet"
ALLOWED_MODELS = {m[0] for m in MODELS}


def _require_compliance_or_admin(user: TokenInfo) -> None:
    if user.effective_role not in ("compliance", "njorda_admin"):
        raise HTTPException(403, "Åtkomst nekad")


class ExtractorModelRequest(BaseModel):
    model: str


@router.get("/extractor-models")
def list_extractor_models(user: TokenInfo = Depends(get_effective_user)):
    _require_compliance_or_admin(user)
    return [
        {"name": name, "provider": provider, "model_id": model_id}
        for name, provider, model_id in MODELS
    ]


@router.get("/extractor-model")
def get_extractor_model(
    db: Session = Depends(get_db),
    user: TokenInfo = Depends(get_effective_user),
):
    _require_compliance_or_admin(user)
    current = get_setting(db, SETTING_KEY, DEFAULT_MODEL)
    return {"model": current}


@router.put("/extractor-model")
def put_extractor_model(
    body: ExtractorModelRequest,
    db: Session = Depends(get_db),
    user: TokenInfo = Depends(get_effective_user),
):
    _require_compliance_or_admin(user)
    if body.model not in ALLOWED_MODELS:
        raise HTTPException(
            400,
            f"Unknown model '{body.model}'. Allowed: {sorted(ALLOWED_MODELS)}",
        )
    set_setting(db, SETTING_KEY, body.model)
    return {"model": body.model}
