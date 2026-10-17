from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.analytics.segment_service import SegmentAnalyticsService
from app.simulations.financial_engine import FinancialContributionEngine

class ChannelMixSimulator:
    """
    Simulates marketing channel budget reallocations and acquisition mix shifts,
    estimating changes in blended Customer Acquisition Cost (CAC), disbursals, and credit losses.
    """
    @classmethod
    def simulate_channel_reallocation(
        cls,
        db: Session,
        proposed_shares: Dict[str, float],
        total_target_applications: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        proposed_shares: e.g. {"Organic": 35.0, "Partner Referral": 25.0, "Aggregators": 15.0, "Paid Search": 20.0, "Direct Mail": 5.0}
        """
        baseline_channels = SegmentAnalyticsService.get_channel_performance(db)
        if not baseline_channels:
            return {"error": "No baseline channel data available."}

        total_baseline_apps = sum(c["total_applications"] for c in baseline_channels)
        total_apps = total_target_applications if total_target_applications else total_baseline_apps

        # Normalize proposed shares if needed
        share_sum = sum(proposed_shares.values())
        normalized_shares = {
            k: (v / share_sum * 100.0) if share_sum > 0 else 0.0 
            for k, v in proposed_shares.items()
        }

        baseline_map = {c["channel"]: c for c in baseline_channels}
        
        baseline_disbursals = sum(c["disbursed_loans_count"] for c in baseline_channels)
        baseline_volume = sum(c["total_disbursed_volume_inr"] for c in baseline_channels)
        baseline_cac_spend = sum(c["total_applications"] * c["unit_cac_inr"] for c in baseline_channels)
        baseline_blended_cac = (baseline_cac_spend / baseline_disbursals) if baseline_disbursals > 0 else 0.0

        scenario_channel_breakdown = []
        scenario_disbursals = 0
        scenario_volume = 0.0
        scenario_cac_spend = 0.0
        scenario_weighted_pd_sum = 0.0

        for ch, base_data in baseline_map.items():
            new_share = normalized_shares.get(ch, base_data["share_of_volume_pct"])
            new_apps = int(round(total_apps * (new_share / 100.0)))
            
            conv_rate = base_data["disbursal_conversion_rate_pct"] / 100.0
            new_disb = int(round(new_apps * conv_rate))
            new_vol = new_disb * base_data["avg_loan_ticket_inr"]
            new_cac = new_apps * base_data["unit_cac_inr"]

            # Channel PD proxy based on delinquency rate
            pd_proxy = max(0.02, min(0.15, base_data["par30_delinquency_rate_pct"] / 100.0 * 1.5))
            scenario_weighted_pd_sum += (new_vol * pd_proxy)

            scenario_disbursals += new_disb
            scenario_volume += new_vol
            scenario_cac_spend += new_cac

            scenario_channel_breakdown.append({
                "channel": ch,
                "baseline_applications": base_data["total_applications"],
                "scenario_applications": new_apps,
                "baseline_share_pct": base_data["share_of_volume_pct"],
                "scenario_share_pct": round(new_share, 2),
                "scenario_disbursals": new_disb,
                "scenario_disbursed_volume_inr": round(new_vol, 2),
                "scenario_cac_spend_inr": round(new_cac, 2),
            })

        scenario_blended_cac = (scenario_cac_spend / scenario_disbursals) if scenario_disbursals > 0 else 0.0
        scenario_avg_pd = (scenario_weighted_pd_sum / scenario_volume) if scenario_volume > 0 else 0.04

        # Financial contribution
        financials = FinancialContributionEngine.calculate_financial_contribution(
            disbursed_principal=scenario_volume,
            annual_interest_rate_pct=14.5,
            avg_tenure_months=24,
            probability_of_default=scenario_avg_pd,
            cost_of_funds_pct=7.5,
            origination_fee_pct=2.0,
            operating_cost_inr=scenario_cac_spend,
            loss_given_default_pct=45.0
        )

        return {
            "scenario_type": "channel_mix",
            "assumptions": {
                "total_target_applications": total_apps,
                "proposed_shares_pct": normalized_shares
            },
            "baseline_summary": {
                "total_applications": total_baseline_apps,
                "disbursals_count": baseline_disbursals,
                "disbursed_volume_inr": round(baseline_volume, 2),
                "total_cac_spend_inr": round(baseline_cac_spend, 2),
                "blended_cac_per_disbursal_inr": round(baseline_blended_cac, 2)
            },
            "scenario_summary": {
                "total_applications": total_apps,
                "disbursals_count": scenario_disbursals,
                "disbursed_volume_inr": round(scenario_volume, 2),
                "total_cac_spend_inr": round(scenario_cac_spend, 2),
                "blended_cac_per_disbursal_inr": round(scenario_blended_cac, 2),
                "cac_savings_inr": round(baseline_cac_spend - scenario_cac_spend, 2),
                "net_contribution_inr": round(financials["net_contribution"], 2),
                "channel_breakdown": scenario_channel_breakdown
            }
        }
