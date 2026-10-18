import os
import json
import joblib
import pytest

def test_model_artifact_and_metrics_files_exist():
    assert os.path.exists("ml/artifacts/credit_model_v1.joblib"), "Model artifact joblib not found"
    assert os.path.exists("ml/artifacts/model_metrics.json"), "Model metrics JSON not found"

def test_model_artifact_loading_and_prediction():
    model = joblib.load("ml/artifacts/credit_model_v1.joblib")
    assert model is not None
    assert hasattr(model, "predict_proba")

    # Test single prediction vector
    # 15 features matching FEATURE_COLUMNS
    sample_features = [[
        75000.0, # monthly_income
        740.0,   # credit_score
        0.28,    # debt_to_income_ratio
        250000.0,# requested_amount
        24,      # requested_tenure_months
        0.27,    # loan_to_income_ratio
        0.16,    # estimated_emi_to_income_ratio
        1, 0, 0, 0, # segment one-hot (Salaried)
        1, 0, 0, 0  # channel one-hot (Organic)
    ]]
    probs = model.predict_proba(sample_features)
    assert len(probs) == 1
    pd = probs[0][1]
    assert 0.0 <= pd <= 1.0

def test_model_metrics_contents():
    with open("ml/artifacts/model_metrics.json", "r") as f:
        metrics = json.load(f)

    assert metrics["version"] == "v1.0.0-rf"
    assert "baseline_model" in metrics
    assert "champion_model" in metrics
    assert "feature_importances" in metrics

    champ = metrics["champion_model"]
    assert 0.70 <= champ["roc_auc"] <= 1.0
    assert 0.0 <= champ["brier_score"] <= 1.0
    assert len(metrics["feature_importances"]) > 5
