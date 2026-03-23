import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

logging.basicConfig(level=logging.INFO)
from fastapi.middleware.cors import CORSMiddleware

from src.config import settings as app_settings
from src.routers import (
    auth,
    health,
    dashboard,
    clients,
    advisors,
    charts,
    documents,
    settings,
    compliance,
    chat,
    audit,
    reports,
    messages,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Seed users on startup
    from src.seed import seed
    try:
        seed()
    except Exception as e:
        print(f"Seed warning: {e}")
    yield


app = FastAPI(title="Säkra API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=app_settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(health.router)
app.include_router(dashboard.router)
app.include_router(clients.router)
app.include_router(advisors.router)
app.include_router(charts.router)
app.include_router(documents.router)
app.include_router(settings.router)
app.include_router(compliance.router)
app.include_router(chat.router)
app.include_router(audit.router)
app.include_router(reports.router)
app.include_router(messages.router)
