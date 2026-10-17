from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.db.session import get_db
from app.analytics.dashboard_service import DashboardAnalyticsService

router = APIRouter()

@router.get("/summary", tags=["Dashboard"])
def get_dashboard_summary(
    start_date: Optional[str] = Query(None, description="ISO formatted start date"),
    end_date: Optional[str] = Query(None, description="ISO formatted end date"),
    channel: Optional[str] = Query(None, description="Filter by acquisition channel"),
    segment: Optional[str] = Query(None, description="Filter by customer segment"),
    db: Session = Depends(get_db)
):
    start_dt = datetime.fromisoformat(start_date) if start_date else None
    end_dt = datetime.fromisoformat(end_date) if end_date else None
    
    return DashboardAnalyticsService.get_executive_summary(
        db=db,
        start_date=start_dt,
        end_date=end_dt,
        channel=channel,
        segment=segment
    )

@router.get("/trends", tags=["Dashboard"])
def get_dashboard_trends(db: Session = Depends(get_db)):
    return DashboardAnalyticsService.get_monthly_trends(db=db)
