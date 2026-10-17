from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.analytics.portfolio_service import PortfolioAnalyticsService

router = APIRouter()

@router.get("/summary", tags=["Portfolio"])
def get_portfolio_summary(db: Session = Depends(get_db)):
    return PortfolioAnalyticsService.get_portfolio_summary(db=db)

@router.get("/vintages", tags=["Portfolio"])
def get_vintage_analysis(db: Session = Depends(get_db)):
    return PortfolioAnalyticsService.get_vintage_analysis(db=db)

@router.get("/delinquency", tags=["Portfolio"])
def get_delinquency_buckets(db: Session = Depends(get_db)):
    summary = PortfolioAnalyticsService.get_portfolio_summary(db=db)
    return summary.get("delinquency_buckets", {})
