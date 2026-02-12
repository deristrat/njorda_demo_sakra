from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.routers import health, dashboard, clients, charts

app = FastAPI(title="Njorda Advisor API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:21000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(dashboard.router)
app.include_router(clients.router)
app.include_router(charts.router)
