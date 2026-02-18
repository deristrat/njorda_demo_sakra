from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import settings as app_settings
from src.routers import (
    health,
    dashboard,
    clients,
    advisors,
    charts,
    documents,
    settings,
    compliance,
)

app = FastAPI(title="Njorda Advisor API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=app_settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(dashboard.router)
app.include_router(clients.router)
app.include_router(advisors.router)
app.include_router(charts.router)
app.include_router(documents.router)
app.include_router(settings.router)
app.include_router(compliance.router)
