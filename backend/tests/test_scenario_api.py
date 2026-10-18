import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_simulate_funnel_improvement():
    payload = {
        "scenario_type": "funnel_improvement",
        "target_stage": "KYC Completed",
        "relative_uplift_pct": 20.0,
        "implementation_cost_inr": 200000.0
    }
    response = client.post("/api/scenarios/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["scenario_type"] == "funnel_improvement"
    assert "scenario" in data
    assert "financial_impact" in data
    assert data["scenario"]["incremental_disbursals_count"] > 0
    assert "net_contribution" in data["financial_impact"]

def test_simulate_risk_cutoff():
    payload = {
        "scenario_type": "risk_cutoff",
        "new_pd_threshold": 0.15,
        "baseline_cutoff_pd": 0.11
    }
    response = client.post("/api/scenarios/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["scenario_type"] in ["risk_cutoff", "risk_sensitivity"]
    assert "risk_band_distribution" in data
    assert "marginal_portfolio_impact" in data

def test_scenario_lifecycle_crud_and_compare():
    # 1. Create Scenario A
    payload_a = {
        "scenario_name": "Test KYC Optimization 2024",
        "description": "Simulated drop-off mitigation via DigiLocker automated KYC",
        "scenario_type": "funnel_improvement",
        "assumptions": {
            "target_stage": "KYC Completed",
            "relative_uplift_pct": 18.0,
            "implementation_cost_inr": 150000.0
        }
    }
    create_res = client.post("/api/scenarios", json=payload_a)
    assert create_res.status_code == 201
    sc_a = create_res.json()
    sc_a_id = sc_a["id"]
    assert sc_a["scenario_name"] == payload_a["scenario_name"]
    assert "calculated_results" in sc_a

    # 2. Create Scenario B
    payload_b = {
        "scenario_name": "Test Risk Cutoff Expansion",
        "description": "Expanding PD cutoff to 14% to capture near-prime volume",
        "scenario_type": "risk_cutoff",
        "assumptions": {
            "new_pd_threshold": 0.14,
            "baseline_cutoff_pd": 0.11
        }
    }
    create_b_res = client.post("/api/scenarios", json=payload_b)
    assert create_b_res.status_code == 201
    sc_b = create_b_res.json()
    sc_b_id = sc_b["id"]

    # 3. List scenarios
    list_res = client.get("/api/scenarios")
    assert list_res.status_code == 200
    items = list_res.json()
    assert any(s["id"] == sc_a_id for s in items)
    assert any(s["id"] == sc_b_id for s in items)

    # 4. Get scenario by ID
    get_res = client.get(f"/api/scenarios/{sc_a_id}")
    assert get_res.status_code == 200
    assert get_res.json()["scenario_name"] == payload_a["scenario_name"]

    # 5. Patch scenario
    patch_res = client.patch(f"/api/scenarios/{sc_a_id}", json={
        "scenario_name": "Updated KYC Optimization",
        "assumptions": {
            "target_stage": "KYC Completed",
            "relative_uplift_pct": 25.0,
            "implementation_cost_inr": 180000.0
        }
    })
    assert patch_res.status_code == 200
    assert patch_res.json()["scenario_name"] == "Updated KYC Optimization"
    assert patch_res.json()["assumptions"]["relative_uplift_pct"] == 25.0

    # 6. Compare Scenarios
    compare_res = client.post("/api/scenarios/compare", json={"scenario_ids": [sc_a_id, sc_b_id]})
    assert compare_res.status_code == 200
    comp_data = compare_res.json()
    assert len(comp_data["scenarios"]) == 2
    assert len(comp_data["comparison_summary"]) == 2

    # 7. Delete Scenarios
    del_a = client.delete(f"/api/scenarios/{sc_a_id}")
    assert del_a.status_code == 200
    del_b = client.delete(f"/api/scenarios/{sc_b_id}")
    assert del_b.status_code == 200

    # Verify 404 after deletion
    get_after = client.get(f"/api/scenarios/{sc_a_id}")
    assert get_after.status_code == 404
