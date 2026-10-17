import pytest
from app.db.session import SessionLocal
from app.simulations.channel_simulator import ChannelMixSimulator

def test_channel_mix_reallocation():
    db = SessionLocal()
    try:
        # Shift volume toward Organic and Partner Referral (lower CAC, high conversion)
        proposed = {
            "Organic": 40.0,
            "Partner Referral": 30.0,
            "Paid Search": 15.0,
            "Aggregators": 10.0,
            "Direct Mail": 5.0
        }
        sim = ChannelMixSimulator.simulate_channel_reallocation(db, proposed)

        assert sim["scenario_type"] == "channel_mix"
        base = sim["baseline_summary"]
        scen = sim["scenario_summary"]

        assert scen["total_applications"] > 0
        assert scen["disbursals_count"] > 0
        assert len(scen["channel_breakdown"]) > 0

        # Since we shifted heavily to Organic and Partner Referral, CAC should be lower
        assert scen["blended_cac_per_disbursal_inr"] < base["blended_cac_per_disbursal_inr"]
        assert scen["cac_savings_inr"] > 0
        assert scen["net_contribution_inr"] > 0
    finally:
        db.close()
