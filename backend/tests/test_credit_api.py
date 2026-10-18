import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_credit_model_metrics():
    response = client.get("/api/credit/model-metrics")
    assert response.status_code == 200
    data = response.json()
    assert data["version"] == "v1.0.0-rf"
    assert "baseline_model" in data
    assert "champion_model" in data
    assert data["champion_model"]["roc_auc"] >= 0.85
    assert len(data["feature_importances"]) > 0

def test_post_credit_predict_valid():
    payload = {
        "monthly_income": 85000,
        "credit_score": 740,
        "debt_to_income_ratio": 0.22,
        "requested_amount": 150000,
        "requested_tenure_months": 24,
        "customer_segment": "Salaried",
        "acquisition_channel": "Organic"
    }
    response = client.post("/api/credit/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "predicted_probability_of_default" in data
    assert 0.0 <= data["predicted_probability_of_default"] <= 1.0
    assert "risk_tier" in data
    assert "recommended_action" in data
    assert "disclaimer" in data
    assert len(data["all_feature_attributions"]) == 15

def test_post_credit_predict_invalid_input():
    # Negative income & invalid credit score
    payload = {
        "monthly_income": -1000,
        "credit_score": 150,
        "debt_to_income_ratio": 0.22,
        "requested_amount": 150000,
        "requested_tenure_months": 24,
        "customer_segment": "Salaried",
        "acquisition_channel": "Organic"
    }
    response = client.post("/api/credit/predict", json=payload)
    assert response.status_code == 422

def test_post_credit_explain():
    payload = {
        "monthly_income": 40000,
        "credit_score": 580,
        "debt_to_income_ratio": 0.55,
        "requested_amount": 250000,
        "requested_tenure_months": 36,
        "customer_segment": "Self-Employed",
        "acquisition_channel": "Paid Search"
    }
    response = client.post("/api/credit/explain", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["top_risk_increasing_factors"]) > 0
    assert "shap_impact" in data["top_risk_increasing_factors"][0]
