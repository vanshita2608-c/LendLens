import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_copilot_funnel_dropoff_query():
    response = client.post("/api/copilot/query", json={"query": "Where are customers abandoning the loan journey?"})
    assert response.status_code == 200
    data = response.json()
    assert data["intent"] == "funnel_friction_analysis"
    assert "direct_answer" in data
    assert "supporting_metrics" in data
    assert "apm_interpretation" in data
    assert "limitations" in data
    assert "recommended_next_step" in data
    assert "time_period" in data
    assert "sample_size" in data

def test_copilot_channel_query():
    response = client.post("/api/copilot/query", json={"query": "Which acquisition channels have the lowest conversion?"})
    assert response.status_code == 200
    data = response.json()
    assert data["intent"] == "channel_unit_economics"
    assert "channel_breakdown" in data["supporting_metrics"]

def test_copilot_credit_risk_query():
    response = client.post("/api/copilot/query", json={"query": "What is the ROC-AUC and recall of our credit risk model?"})
    assert response.status_code == 200
    data = response.json()
    assert data["intent"] == "credit_intelligence_inquiry"
    assert "roc_auc" in data["supporting_metrics"]

def test_copilot_portfolio_query():
    response = client.post("/api/copilot/query", json={"query": "What is our current portfolio delinquency and PAR30?"})
    assert response.status_code == 200
    data = response.json()
    assert data["intent"] == "portfolio_health_analysis"
    assert "par30_delinquency_rate_pct" in data["supporting_metrics"]

def test_copilot_experiment_suggestion():
    response = client.post("/api/copilot/experiment-suggestions", json={"problem_area": "KYC Completed"})
    assert response.status_code == 200
    data = response.json()
    assert "experiment_name" in data
    assert "hypothesis" in data
    assert "primary_metric" in data
    assert len(data["guardrail_metrics"]) > 0
    assert "required_sample_size" in data
