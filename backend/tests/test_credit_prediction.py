import pytest
from app.ml.prediction_service import CreditPredictionService

def test_get_model_metrics():
    metrics = CreditPredictionService.get_model_metrics()
    assert "version" in metrics
    assert "baseline_model" in metrics
    assert "champion_model" in metrics
    assert "feature_importances" in metrics
    assert metrics["champion_model"]["roc_auc"] >= 0.85
    assert len(metrics["feature_importances"]) > 5

def test_predict_prime_applicant():
    res = CreditPredictionService.predict(
        monthly_income=120000,
        credit_score=780,
        debt_to_income_ratio=0.18,
        requested_amount=200000,
        requested_tenure_months=24,
        customer_segment="Salaried",
        acquisition_channel="Organic"
    )
    assert res["predicted_probability_of_default"] < 0.35
    assert "Prime" in res["risk_tier"]
    assert "disclaimer" in res
    assert len(res["all_feature_attributions"]) == 15

def test_predict_subprime_applicant():
    res = CreditPredictionService.predict(
        monthly_income=25000,
        credit_score=520,
        debt_to_income_ratio=0.65,
        requested_amount=350000,
        requested_tenure_months=36,
        customer_segment="Gig Worker",
        acquisition_channel="Aggregators"
    )
    assert res["predicted_probability_of_default"] > 0.50
    assert "High Risk" in res["risk_tier"]
    assert len(res["top_risk_increasing_factors"]) > 0
    # Credit score or DTI should be a top risk increasing factor
    top_feats = [f["feature"] for f in res["top_risk_increasing_factors"]]
    assert any(feat in top_feats for feat in ["credit_score", "debt_to_income_ratio", "estimated_emi_to_income_ratio", "loan_to_income_ratio"])
