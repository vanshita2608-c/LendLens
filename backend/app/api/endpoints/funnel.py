from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.db.session import get_db
from app.analytics.funnel_service import FunnelAnalyticsService
from app.analytics.dropoff_service import DropoffAnalyticsService

router = APIRouter()

@router.get("/overview", tags=["Funnel"])
def get_funnel_overview(
    start_date: Optional[str] = Query(None, description="ISO formatted start date"),
    end_date: Optional[str] = Query(None, description="ISO formatted end date"),
    channel: Optional[str] = Query(None, description="Filter by acquisition channel"),
    segment: Optional[str] = Query(None, description="Filter by customer segment"),
    db: Session = Depends(get_db)
):
    start_dt = datetime.fromisoformat(start_date) if start_date else None
    end_dt = datetime.fromisoformat(end_date) if end_date else None
    
    return FunnelAnalyticsService.get_funnel_overview(
        db=db,
        start_date=start_dt,
        end_date=end_dt,
        channel=channel,
        segment=segment
    )

@router.get("/stages", tags=["Funnel"])
def get_funnel_stages():
    """Returns the ordered default configuration of funnel stages."""
    return [
        {"order": idx, "key": key, "label": label}
        for idx, (key, label) in enumerate(FunnelAnalyticsService.ORDERED_STAGES, start=1)
    ]

@router.get("/dropoffs", tags=["Funnel"])
def get_funnel_dropoffs(
    stage: Optional[str] = Query(None, description="Optional stage filter"),
    db: Session = Depends(get_db)
):
    return DropoffAnalyticsService.get_dropoff_reasons_summary(db=db, stage_name=stage)

@router.get("/stage-timing", tags=["Funnel"])
def get_stage_timing(db: Session = Depends(get_db)):
    return DropoffAnalyticsService.get_stage_latencies(db=db)

@router.get("/investigate/{stage_name}", tags=["Funnel"])
def get_stage_investigation(stage_name: str, db: Session = Depends(get_db)):
    return DropoffAnalyticsService.get_stage_investigation(db=db, stage_name=stage_name)

@router.get("/channels", tags=["Funnel"])
def get_channel_breakdown(db: Session = Depends(get_db)):
    from app.analytics.segment_service import SegmentAnalyticsService
    return SegmentAnalyticsService.get_channel_performance(db=db)

@router.get("/segments", tags=["Funnel"])
def get_segment_breakdown(db: Session = Depends(get_db)):
    from app.analytics.segment_service import SegmentAnalyticsService
    return SegmentAnalyticsService.get_segment_performance(db=db)


