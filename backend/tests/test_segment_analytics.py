import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.analytics.segment_service import SegmentAnalyticsService

client = TestClient(app)

def test_channel_performance_calculation():
    db = SessionLocal()
    try:
        channels = SegmentAnalyticsService.get_channel_performance(db)
        assert len(channels) > 0
        total_share = sum(ch["share_of_volume_pct"] for ch in channels)
        assert abs(total_share - 100.0) < 1.0

        for ch in channels:
            assert ch["total_applications"] > 0
            assert ch["unit_cac_inr"] > 0
            assert 0.0 <= ch["disbursal_conversion_rate_pct"] <= 100.0
            assert 0.0 <= ch["par30_delinquency_rate_pct"] <= 100.0
    finally:
        db.close()

def test_segment_performance_calculation():
    db = SessionLocal()
    try:
        segments = SegmentAnalyticsService.get_segment_performance(db)
        assert len(segments) == 4 # Salaried, Self-Employed, New-to-Credit, Gig Worker
        
        for seg in segments:
            assert seg["segment"] in ["Salaried", "Self-Employed", "New-to-Credit", "Gig Worker"]
            assert seg["total_applications"] > 0
            assert seg["avg_monthly_income_inr"] > 0
            assert 0.0 <= seg["par30_delinquency_rate_pct"] <= 100.0
    finally:
        db.close()

def test_channel_and_segment_api_endpoints():
    res1 = client.get("/api/funnel/channels")
    assert res1.status_code == 200
    data1 = res1.json()
    assert isinstance(data1, list)
    assert len(data1) > 0
    assert "channel" in data1[0]
    assert "blended_cac_per_disbursal_inr" in data1[0]

    res2 = client.get("/api/funnel/segments")
    assert res2.status_code == 200
    data2 = res2.json()
    assert isinstance(data2, list)
    assert len(data2) == 4
    assert "segment" in data2[0]
    assert "avg_credit_score" in data2[0]
