import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.analytics.dropoff_service import DropoffAnalyticsService

client = TestClient(app)

def test_dropoff_reasons_summary():
    db = SessionLocal()
    try:
        dropoffs = DropoffAnalyticsService.get_dropoff_reasons_summary(db)
        assert len(dropoffs) > 0
        for stage_drop in dropoffs:
            assert "stage_name" in stage_drop
            assert stage_drop["total_dropoffs"] > 0
            assert len(stage_drop["reasons"]) > 0
            # Check percentage sums to ~100
            total_pct = sum(r["pct_of_stage_dropoff"] for r in stage_drop["reasons"])
            assert abs(total_pct - 100.0) < 1.0
    finally:
        db.close()

def test_stage_latencies():
    db = SessionLocal()
    try:
        latencies = DropoffAnalyticsService.get_stage_latencies(db)
        assert len(latencies) > 0
        for lat in latencies:
            assert lat["median_minutes"] > 0
            assert lat["min_minutes"] <= lat["median_minutes"] <= lat["max_minutes"]
    finally:
        db.close()

def test_dropoff_api_endpoints():
    res1 = client.get("/api/funnel/dropoffs")
    assert res1.status_code == 200
    assert isinstance(res1.json(), list)

    res2 = client.get("/api/funnel/stage-timing")
    assert res2.status_code == 200
    assert isinstance(res2.json(), list)

    res3 = client.get("/api/funnel/investigate/KYC_COMPLETED")
    assert res3.status_code == 200
    data = res3.json()
    assert data["stage_name"] == "KYC_COMPLETED"
    assert "product_opportunity" in data
    assert "problem" in data["product_opportunity"]
