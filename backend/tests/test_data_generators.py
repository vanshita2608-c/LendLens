import pytest
from datetime import datetime, timezone, timedelta
from data.generation.customer_generator import CustomerGenerator
from data.generation.application_generator import ApplicationGenerator

def test_customer_generator_reproducibility():
    gen1 = CustomerGenerator(seed=123)
    gen2 = CustomerGenerator(seed=123)
    
    start = datetime(2025, 1, 1, tzinfo=timezone.utc)
    end = datetime(2026, 1, 1, tzinfo=timezone.utc)
    
    batch1 = gen1.generate_batch(50, start, end)
    batch2 = gen2.generate_batch(50, start, end)
    
    assert len(batch1) == 50
    assert batch1[0]["customer_reference"] == batch2[0]["customer_reference"]
    assert batch1[0]["monthly_income"] == batch2[0]["monthly_income"]
    assert batch1[0]["credit_score"] == batch2[0]["credit_score"]

def test_customer_generator_attributes():
    gen = CustomerGenerator(seed=42)
    start = datetime(2025, 1, 1, tzinfo=timezone.utc)
    end = datetime(2026, 1, 1, tzinfo=timezone.utc)
    batch = gen.generate_batch(200, start, end)
    
    segments = {c["customer_segment"] for c in batch}
    assert "Salaried" in segments
    assert "Self-Employed" in segments
    
    for c in batch:
        assert c["monthly_income"] >= 18000
        assert 0.05 <= c["debt_to_income_ratio"] <= 0.85
        assert c["income_band"] in ["<30k", "30k-60k", "60k-120k", ">120k"]

def test_application_generator():
    cust_gen = CustomerGenerator(seed=42)
    app_gen = ApplicationGenerator(seed=42)
    start = datetime(2025, 1, 1, tzinfo=timezone.utc)
    
    cust = cust_gen.generate_customer(1, start)
    app = app_gen.generate_application_for_customer(1, 1, cust)
    
    assert app["application_reference"] == "APP-000001"
    assert app["requested_amount"] >= 25000
    assert app["acquisition_channel"] in ["Organic", "Paid Search", "Aggregators", "Partner Referral", "Direct Mail"]
    assert app["created_at"] >= cust["created_at"]
