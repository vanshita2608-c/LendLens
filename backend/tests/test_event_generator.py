import pytest
from datetime import datetime, timezone
from data.generation.event_generator import EventGenerator

def test_event_chronological_ordering():
    generator = EventGenerator(seed=42)
    start_time = datetime(2025, 6, 1, 10, 0, tzinfo=timezone.utc)
    
    events, status, drop_stage, drop_reason = generator.simulate_application_journey(
        application_id=1,
        start_time=start_time,
        channel="Organic",
        credit_score=750,
        dti=0.25
    )
    
    assert len(events) >= 1
    assert events[0]["stage_name"] == "APPLICATION_STARTED"
    
    # Check monotonic timestamp progression
    for i in range(1, len(events)):
        prev_t = events[i - 1]["event_timestamp"]
        curr_t = events[i]["event_timestamp"]
        assert curr_t > prev_t
        duration = events[i]["duration_seconds_from_prev"]
        assert duration > 0
        assert int((curr_t - prev_t).total_seconds()) == duration

def test_disbursed_journey_has_all_seven_stages():
    generator = EventGenerator(seed=10) # Seed selected for successful journey
    start_time = datetime(2025, 6, 1, 10, 0, tzinfo=timezone.utc)
    
    for seed in range(20):
        gen = EventGenerator(seed=seed)
        events, status, drop_stage, drop_reason = gen.simulate_application_journey(
            application_id=seed,
            start_time=start_time,
            channel="Organic",
            credit_score=780,
            dti=0.20
        )
        if status == "Disbursed":
            assert len(events) == 7
            stages = [e["stage_name"] for e in events]
            assert stages == EventGenerator.STAGES
            assert drop_stage is None
            assert drop_reason is None
            break

def test_abandoned_journey_records_reason():
    generator = EventGenerator(seed=1)
    start_time = datetime(2025, 6, 1, 10, 0, tzinfo=timezone.utc)
    
    # Intentionally low score to test dropoff/rejection
    events, status, drop_stage, drop_reason = generator.simulate_application_journey(
        application_id=999,
        start_time=start_time,
        channel="Paid Search",
        credit_score=520,
        dti=0.60
    )
    
    assert status in ["Abandoned", "Rejected"]
    assert drop_stage is not None
    assert drop_reason is not None
    assert len(drop_reason) > 5
