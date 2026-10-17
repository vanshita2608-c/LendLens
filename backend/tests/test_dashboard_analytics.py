import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.analytics.dashboard_service import DashboardAnalyticsService

client = TestClient(app)

def test_dashboard_summary_service_calculation():
    db = SessionLocal()
    try:
        summary = DashboardAnalyticsService.get_executive_summary(db)
        assert summary["total_applications"] > 0
        assert summary["disbursed_loans_count"] > 0
        assert summary["total_disbursed_amount_inr"] > 0
        assert 0.0 <= summary["completion_rate_pct"] <= 100.0
        assert 0.0 <= summary["kyc_rate_pct"] <= 100.0
        assert 0.0 <= summary["approval_rate_pct"] <= 100.0
        assert 0.0 <= summary["par30_delinquency_rate_pct"] <= 100.0
        assert summary["expected_credit_loss_inr"] > 0
        assert summary["median_turnaround_time_hours"] > 0
    finally:
        db.close()

def test_dashboard_summary_filter_isolation():
    db = SessionLocal()
    try:
        summary_all = DashboardAnalyticsService.get_executive_summary(db)
        summary_salaried = DashboardAnalyticsService.get_executive_summary(db, segment="Salaried")
        summary_organic = DashboardAnalyticsService.get_executive_summary(db, channel="Organic")

        assert summary_salaried["total_applications"] < summary_all["total_applications"]
        assert summary_organic["total_applications"] < summary_all["total_applications"]
    finally:
        db.close()

def test_dashboard_api_endpoints():
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_applications" in data
    assert "total_disbursed_amount_inr" in data
    assert "funnel_stage_counts" in data

    trends_res = client.get("/api/dashboard/trends")
    assert trends_res.status_code == 200
    trends = trends_res.json()
    assert isinstance(trends, list)
    assert len(trends) > 0
    assert "month" in trends[0]
    assert "applications" in trends[0]
