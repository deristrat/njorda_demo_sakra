from fastapi import APIRouter

from src.data.mock import clients

router = APIRouter(prefix="/api")


@router.get("/clients")
def get_clients():
    return clients
