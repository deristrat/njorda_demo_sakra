from fastapi import APIRouter

from src.data.mock import kpis

router = APIRouter(prefix="/api/dashboard")


@router.get("/kpis")
def get_kpis():
    return kpis
