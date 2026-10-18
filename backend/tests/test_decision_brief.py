import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_decision_brief_generation_end_to_end():
    # 1. Create a test scenario
    payload = {
        "scenario_name": "Decision Brief Test Scenario",
        "description": "Validation of 12-section brief export",
        "scenario_type": "funnel_improvement",
        "assumptions": {
            "target_stage": "KYC Completed",
            "relative_uplift_pct": 20.0,
            "implementation_cost_inr": 200000.0
        }
    }
    create_res = client.post("/api/scenarios", json=payload)
    assert create_res.status_code == 201
    sc_id = create_res.json()["id"]

    # 2. Fetch Decision Brief via API
    brief_res = client.get(f"/api/scenarios/{sc_id}/decision-brief")
    assert brief_res.status_code == 200
    brief_data = brief_res.json()

    assert brief_data["scenario_id"] == sc_id
    assert brief_data["scenario_name"] == payload["scenario_name"]
    assert "recommendation" in brief_data
    assert "markdown_content" in brief_data

    md = brief_data["markdown_content"]
    # Check all 12 required sections
    assert "1. Business Problem" in md
    assert "2. Strategic Objective" in md
    assert "3. Baseline Performance" in md
    assert "4. Proposed Intervention" in md
    assert "5. Scenario Assumptions" in md
    assert "6. Estimated Financial" in md
    assert "7. Key Operational & Credit Risks" in md
    assert "8. Customer Experience Implications" in md
    assert "9. Primary Success Metrics" in md
    assert "10. Guardrail Metrics" in md
    assert "11. Validation Plan" in md
    assert "12. Final APM Recommendation" in md
    assert "| **Incremental Disbursals** |" in md

    # Clean up test scenario
    client.delete(f"/api/scenarios/{sc_id}")
