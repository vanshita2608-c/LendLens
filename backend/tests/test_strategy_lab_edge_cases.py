import json
import pytest
from app.db.session import SessionLocal
from app.simulations.funnel_simulator import FunnelImprovementSimulator, ProcessingTimeSimulator
from app.simulations.risk_simulator import RiskSensitivitySimulator
from app.simulations.channel_simulator import ChannelMixSimulator

def test_funnel_zero_uplift_edge_case():
    db = SessionLocal()
    try:
        # Zero uplift should yield 0 incremental disbursals
        sim = FunnelImprovementSimulator.simulate_stage_improvement(
            db=db,
            target_stage="KYC_COMPLETED",
            conversion_uplift_pct=0.0,
            implementation_cost_inr=100000.0
        )
        assert sim["scenario"]["incremental_disbursals_count"] == 0
        assert sim["scenario"]["incremental_disbursed_principal_inr"] == 0.0
        # Net contribution should reflect loss of implementation cost
        assert sim["financial_impact"]["net_contribution"] <= -100000.0
    finally:
        db.close()

def test_risk_simulator_boundary_cutoffs():
    db = SessionLocal()
    try:
        # Extreme low cutoff: 0.001 PD -> almost 0 eligible
        sim_low = RiskSensitivitySimulator.simulate_cutoff_adjustment(
            db=db,
            baseline_cutoff_pd=0.10,
            proposed_cutoff_pd=0.001
        )
        assert sim_low["eligibility_impact"]["proposed_eligible_count"] <= 5

        # Extreme high cutoff: 0.99 PD -> virtually all eligible
        sim_high = RiskSensitivitySimulator.simulate_cutoff_adjustment(
            db=db,
            baseline_cutoff_pd=0.10,
            proposed_cutoff_pd=0.99
        )
        total = sim_high["eligibility_impact"]["total_assessed_applications"]
        assert sim_high["eligibility_impact"]["proposed_eligible_count"] == total
    finally:
        db.close()

def test_json_serializability_of_all_simulators():
    db = SessionLocal()
    try:
        sim1 = FunnelImprovementSimulator.simulate_stage_improvement(
            db=db, target_stage="KYC_COMPLETED", conversion_uplift_pct=5.0
        )
        json_str1 = json.dumps(sim1)
        assert len(json_str1) > 100

        sim2 = RiskSensitivitySimulator.simulate_cutoff_adjustment(
            db=db, proposed_cutoff_pd=0.14
        )
        json_str2 = json.dumps(sim2)
        assert len(json_str2) > 100

        sim3 = ChannelMixSimulator.simulate_channel_reallocation(
            db=db, proposed_shares={"Organic": 50.0, "Paid Search": 50.0}
        )
        json_str3 = json.dumps(sim3)
        assert len(json_str3) > 100
    finally:
        db.close()
