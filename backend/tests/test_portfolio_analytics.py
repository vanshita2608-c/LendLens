import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.analytics.portfolio_service import PortfolioAnalyticsService

client = TestClient(app)

def test_portfolio_summary_calculation():
    db = SessionLocal()
    try:
        summary = PortfolioAnalyticsService.get_portfolio_summary(db)
        assert summary["active_loans_count"] > 0
        assert summary["total_disbursed_principal_inr"] > 0
        assert summary["total_outstanding_principal_inr"] > 0
        assert 0.0 < summary["weighted_avg_interest_rate_pct"] <= 35.0
        assert 0.0 <= summary["on_time_repayment_rate_pct"] <= 100.0
        
        buckets = summary["delinquency_buckets"]
        assert "current" in buckets
        assert "par30" in buckets
        assert "par60" in buckets
        assert "par90_default" in buckets
    finally:
        db.close()

def test_vintage_analysis_cohorts():
    db = SessionLocal()
    try:
        vintages = PortfolioAnalyticsService.get_vintage_analysis(db)
        assert isinstance(vintages, list)
        assert len(vintages) > 0
        for v in vintages:
            assert "cohort" in v
            assert v["disbursed_loans_count"] > 0
            assert 0.0 <= v["delinquency_rate_pct"] <= 100.0
            assert v["current_repayment_health"] in ["Healthy", "Moderate", "High Risk"]
    finally:
        db.close()

def test_portfolio_api_endpoints():
    res1 = client.get("/api/portfolio/summary")
    assert res1.status_code == 200
    data1 = res1.json()
    assert "total_disbursed_principal_inr" in data1
    assert "on_time_repayment_rate_pct" in data1

    res2 = client.get("/api/portfolio/vintages")
    assert res2.status_code == 200
    assert isinstance(res2.json(), list)

    res3 = client.get("/api/portfolio/delinquency")
    assert res3.status_code == 200
    assert "par30" in res3.json()
