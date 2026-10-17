import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.analytics.funnel_service import FunnelAnalyticsService

client = TestClient(app)

def test_funnel_overview_calculation():
    db = SessionLocal()
    try:
        overview = FunnelAnalyticsService.get_funnel_overview(db)
        assert overview["cohort_total_applications"] > 0
        assert overview["disbursed_loans_count"] > 0
        assert 0.0 < overview["overall_funnel_conversion_pct"] <= 100.0
        assert len(overview["stages"]) == 7

        # Verify monotonicity of funnel counts
        for i in range(1, len(overview["stages"])):
            prev_stage = overview["stages"][i - 1]
            curr_stage = overview["stages"][i]
            assert curr_stage["entered_count"] <= prev_stage["entered_count"]
            assert 0.0 <= curr_stage["step_conversion_rate_pct"] <= 100.0
            assert 0.0 <= curr_stage["drop_off_rate_pct"] <= 100.0
    finally:
        db.close()

def test_funnel_api_endpoint():
    res = client.get("/api/funnel/overview")
    assert res.status_code == 200
    data = res.json()
    assert "cohort_total_applications" in data
    assert "stages" in data
    assert len(data["stages"]) == 7
    assert data["primary_bottleneck"] is not None

    stages_res = client.get("/api/funnel/stages")
    assert stages_res.status_code == 200
    stages = stages_res.json()
    assert len(stages) == 7
    assert stages[0]["key"] == "APPLICATION_STARTED"
