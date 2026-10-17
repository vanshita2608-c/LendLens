import pytest
from app.db.session import SessionLocal
from app.simulations.risk_simulator import RiskSensitivitySimulator

def test_risk_cutoff_expansion():
    db = SessionLocal()
    try:
        sim = RiskSensitivitySimulator.simulate_cutoff_adjustment(
            db=db,
            baseline_cutoff_pd=0.10,
            proposed_cutoff_pd=0.15
        )

        assert sim["scenario_type"] == "risk_sensitivity"
        assert len(sim["risk_band_distribution"]) == 5
        
        impact = sim["eligibility_impact"]
        assert impact["proposed_eligible_count"] > impact["baseline_eligible_count"]
        assert impact["eligible_volume_change"] > 0
        assert impact["eligible_volume_change_pct"] > 0

        marginal = sim["marginal_portfolio_impact"]
        assert marginal["direction"] == "expansion"
        assert marginal["marginal_disbursals_count"] > 0
        assert marginal["marginal_expected_credit_loss_inr"] > 0
    finally:
        db.close()

def test_risk_cutoff_tightening():
    db = SessionLocal()
    try:
        sim = RiskSensitivitySimulator.simulate_cutoff_adjustment(
            db=db,
            baseline_cutoff_pd=0.12,
            proposed_cutoff_pd=0.08
        )
        impact = sim["eligibility_impact"]
        assert impact["proposed_eligible_count"] < impact["baseline_eligible_count"]
        assert impact["eligible_volume_change"] < 0
        assert sim["marginal_portfolio_impact"]["direction"] == "tightening"
    finally:
        db.close()
