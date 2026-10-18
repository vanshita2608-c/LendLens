from fastapi import APIRouter
from datetime import datetime, timezone
from app.api.endpoints import dashboard, funnel, portfolio, credit, scenarios, copilot

api_router = APIRouter()

@api_router.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "ok",
        "service": "lendlens-backend",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0",
        "environment": "development",
        "database": "connected",
    }

api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(funnel.router, prefix="/funnel", tags=["Funnel"])
api_router.include_router(portfolio.router, prefix="/portfolio", tags=["Portfolio"])
api_router.include_router(credit.router, prefix="/credit", tags=["Credit Intelligence"])
api_router.include_router(scenarios.router, prefix="/scenarios", tags=["Strategy Lab"])
api_router.include_router(copilot.router, prefix="/copilot", tags=["AI Copilot"])
