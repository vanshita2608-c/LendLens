import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_list_experiments_and_seed_data():
    response = client.get("/api/experiments")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    # Verify sorted by RICE score descending
    scores = [e["rice_priority_score"] for e in data]
    assert scores == sorted(scores, reverse=True)

def test_experiment_crud_lifecycle_and_rice_calculation():
    # 1. Create Experiment
    # RICE = (2000 * 4 * 0.75) / 2.0 = 3000.0
    payload = {
        "experiment_name": "EXP-TEST: Dynamic Pre-Approval Banner",
        "problem_statement": "Users abandon before submitting salary details",
        "hypothesis": "Dynamic pre-approval banner increases intent",
        "target_segment": "Salaried",
        "primary_metric": "Details Submitted Rate (%)",
        "reach_score": 2000.0,
        "impact_score": 4.0,
        "confidence_score": 75.0,
        "effort_score": 2.0,
        "control_definition": "Standard text header",
        "treatment_definition": "Pre-approved amount banner",
        "experiment_status": "Planned"
    }
    create_res = client.post("/api/experiments", json=payload)
    assert create_res.status_code == 201
    exp = create_res.json()
    exp_id = exp["id"]
    assert exp["experiment_name"] == payload["experiment_name"]
    assert exp["rice_priority_score"] == 3000.0

    # 2. Get Experiment by ID
    get_res = client.get(f"/api/experiments/{exp_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == exp_id

    # 3. Update Experiment with test telemetry
    patch_payload = {
        "experiment_status": "Completed",
        "sample_size_control": 1000,
        "sample_size_treatment": 1000,
        "control_conversion_rate": 70.0,
        "treatment_conversion_rate": 84.0, # Lift = (84 - 70) / 70 = +20%
        "decision_learnings": "Significant uplift confirmed; promoting to production."
    }
    patch_res = client.patch(f"/api/experiments/{exp_id}", json=patch_payload)
    assert patch_res.status_code == 200
    patched_exp = patch_res.json()
    assert patched_exp["experiment_status"] == "Completed"
    assert patched_exp["observed_lift_pct"] == 20.0

    # 4. Delete Experiment
    del_res = client.delete(f"/api/experiments/{exp_id}")
    assert del_res.status_code == 200

    # 5. Verify 404
    after_res = client.get(f"/api/experiments/{exp_id}")
    assert after_res.status_code == 404
