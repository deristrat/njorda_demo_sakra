from fastapi import APIRouter

from src.data.mock import portfolio_allocation, aum_trend, meetings_per_week

router = APIRouter(prefix="/api/charts")


@router.get("/portfolio-allocation")
def get_portfolio_allocation():
    return portfolio_allocation


@router.get("/aum-trend")
def get_aum_trend():
    return aum_trend


@router.get("/meetings")
def get_meetings():
    return meetings_per_week
