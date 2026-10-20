import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_complete_lendlens_apm_workflow():
    """
    End-to-end integration test validating the entire digital lending product intelligence lifecycle:
    1. System Health Verification
    2. Executive Overview KPIs
    3. Funnel Drop-off Identification
    4. Credit Risk Scoring & Explainable AI
    5. Portfolio Health & Delinquency Aging
    6. Strategy Lab Simulation & Persistence
    7. Automated 12-Section Product Decision Brief
    8. AI Copilot Natural Language Advisory
    9. Product Opportunity & Experiment Prioritization (RICE)
    10. Resource Teardown
    """
    # 1. Health Verification
    health_res = client.get("/api/health")
    assert health_res.status_code == 200
    assert health_res.json()["status"] == "ok"
    assert health_res.json()["database"] == "connected"

    # 2. Executive Overview
    dash_res = client.get("/api/dashboard/summary")
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["total_applications"] > 0
    assert dash_data["disbursed_loans_count"] > 0
    assert dash_data["total_disbursed_amount_inr"] > 0

    # 3. Funnel Overview
    funnel_res = client.get("/api/funnel/overview")
    assert funnel_res.status_code == 200
    funnel_data = funnel_res.json()
    assert len(funnel_data["stages"]) == 7
    assert funnel_data["overall_funnel_conversion_pct"] > 0

    # 4. Credit Risk Model Assessment
    credit_model_res = client.get("/api/credit/model-metrics")
    assert credit_model_res.status_code == 200
    assert credit_model_res.json()["champion_model"]["roc_auc"] >= 0.85

    predict_res = client.post("/api/credit/predict", json={
        "monthly_income": 95000,
        "credit_score": 750,
        "debt_to_income_ratio": 0.20,
        "requested_amount": 250000,
        "requested_tenure_months": 24,
        "customer_segment": "Salaried",
        "acquisition_channel": "Organic"
    })
    assert predict_res.status_code == 200
    predict_data = predict_res.json()
    assert "predicted_probability_of_default" in predict_data
    assert "risk_tier" in predict_data
    assert len(predict_data["top_risk_increasing_factors"]) > 0

    # 5. Portfolio Indicators
    port_res = client.get("/api/portfolio/summary")
    assert port_res.status_code == 200
    port_data = port_res.json()
    assert port_data["active_loans_count"] > 0
    assert port_data["on_time_repayment_rate_pct"] > 0

    # 6. Strategy Lab Simulation & Persistence
    sim_res = client.post("/api/scenarios/simulate", json={
        "scenario_type": "funnel_improvement",
        "target_stage": "KYC Completed",
        "relative_uplift_pct": 20.0,
        "implementation_cost_inr": 200000.0
    })
    assert sim_res.status_code == 200
    sim_data = sim_res.json()
    assert sim_data["scenario"]["incremental_disbursals_count"] > 0

    create_sc_res = client.post("/api/scenarios", json={
        "scenario_name": "E2E Automated KYC Strategy",
        "description": "Validation scenario for full end-to-end pipeline test",
        "scenario_type": "funnel_improvement",
        "assumptions": {
            "target_stage": "KYC Completed",
            "relative_uplift_pct": 20.0,
            "implementation_cost_inr": 200000.0
        }
    })
    assert create_sc_res.status_code == 201
    sc_id = create_sc_res.json()["id"]

    # 7. Automated Decision Brief
    brief_res = client.get(f"/api/scenarios/{sc_id}/decision-brief")
    assert brief_res.status_code == 200
    assert "1. Business Problem" in brief_res.json()["markdown_content"]
    assert "12. Final APM Recommendation" in brief_res.json()["markdown_content"]

    # 8. AI Copilot Natural Language Advisory
    copilot_res = client.post("/api/copilot/query", json={
        "query": "Where are customers abandoning the loan journey?"
    })
    assert copilot_res.status_code == 200
    copilot_data = copilot_res.json()
    assert "highest_friction_stage" in copilot_data["supporting_metrics"]

    # 9. Product Experiment Prioritization
    exp_res = client.post("/api/experiments", json={
        "experiment_name": "EXP-E2E: Instant Decisioning Engine",
        "problem_statement": "Manual underwriting delays TAT by 48 hours",
        "hypothesis": "Real-time decisioning increases offer acceptance by 15%",
        "target_segment": "All",
        "primary_metric": "Offer Acceptance Rate (%)",
        "reach_score": 3000.0,
        "impact_score": 4.0,
        "confidence_score": 80.0,
        "effort_score": 2.0
    })
    assert exp_res.status_code == 201
    exp_id = exp_res.json()["id"]
    assert exp_res.json()["rice_priority_score"] == 4800.0

    # 10. Resource Teardown
    del_sc = client.delete(f"/api/scenarios/{sc_id}")
    assert del_sc.status_code == 200
    del_exp = client.delete(f"/api/experiments/{exp_id}")
    assert del_exp.status_code == 200
