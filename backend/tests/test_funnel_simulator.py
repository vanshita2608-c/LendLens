import pytest
from app.db.session import SessionLocal
from app.simulations.funnel_simulator import FunnelImprovementSimulator, ProcessingTimeSimulator

def test_funnel_improvement_simulation():
    db = SessionLocal()
    try:
        sim = FunnelImprovementSimulator.simulate_stage_improvement(
            db=db,
            target_stage="KYC_COMPLETED",
            conversion_uplift_pct=8.0,
            implementation_cost_inr=200000.0
        )

        assert sim["scenario_type"] == "funnel_improvement"
        assert sim["scenario"]["incremental_disbursals_count"] > 0
        assert sim["scenario"]["incremental_disbursed_principal_inr"] > 0
        
        # Verify downstream conversion dampening:
        # Incremental disbursals must be LESS than incremental KYC completed
        stages = sim["scenario"]["stages_comparison"]
        kyc_stage = next(s for s in stages if s["stage_key"] == "KYC_COMPLETED")
        disbursed_stage = next(s for s in stages if s["stage_key"] == "LOAN_DISBURSED")
        
        assert kyc_stage["incremental_volume"] > disbursed_stage["incremental_volume"]

        # Financial impact
        fin = sim["financial_impact"]
        assert fin["total_scenario_investment_inr"] >= 200000.0
        assert fin["gross_interest_income"] > 0
        assert fin["expected_credit_loss"] > 0
    finally:
        db.close()

def test_tat_reduction_simulation():
    db = SessionLocal()
    try:
        sim = ProcessingTimeSimulator.simulate_tat_reduction(
            db=db,
            target_stage="DETAILS_SUBMITTED",
            tat_reduction_pct=30.0,
            elasticity=0.20
        )
        assert sim["scenario_type"] == "tat_optimization"
        assert sim["assumptions"]["calculated_conversion_uplift_pct"] == 6.0 # 30 * 0.20
        assert sim["scenario"]["incremental_disbursals_count"] > 0
    finally:
        db.close()
