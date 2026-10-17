import math
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.analytics.funnel_service import FunnelAnalyticsService
from app.analytics.dashboard_service import DashboardAnalyticsService
from app.simulations.financial_engine import FinancialContributionEngine

class FunnelImprovementSimulator:
    """
    Simulates hypothetical product optimizations at specific funnel stages
    and calculates downstream volume propagation, unit economics, and ROI.
    """
    @classmethod
    def simulate_stage_improvement(
        cls,
        db: Session,
        target_stage: str,
        conversion_uplift_pct: float,
        target_segment: Optional[str] = None,
        target_channel: Optional[str] = None,
        implementation_cost_inr: float = 250000.0,
        operational_cost_per_applicant: float = 50.0
    ) -> Dict[str, Any]:
        """
        Calculates baseline vs scenario funnel performance.
        Ensures downstream stages use realistic conversion probabilities.
        """
        # 1. Fetch real baseline funnel
        baseline_funnel = FunnelAnalyticsService.get_funnel_overview(
            db=db,
            segment=target_segment,
            channel=target_channel
        )
        stages = baseline_funnel["stages"]
        if not stages:
            return {"error": "Insufficient data for simulation"}

        # Fetch baseline financial metrics for this cohort
        summary = DashboardAnalyticsService.get_executive_summary(
            db=db,
            segment=target_segment,
            channel=target_channel
        )
        avg_ticket = summary.get("avg_loan_amount_inr", 150000.0) or 150000.0

        target_idx = -1
        for idx, s in enumerate(stages):
            if s["stage_key"] == target_stage:
                target_idx = idx
                break

        if target_idx == -1:
            return {"error": f"Invalid stage '{target_stage}'"}

        # Simulate stage progression
        scenario_stages = []
        incremental_volume_at_disbursal = 0
        incremental_applicants_at_target = 0
        
        # Up to target stage, volumes remain baseline
        for i in range(target_idx):
            scenario_stages.append({
                **stages[i],
                "scenario_entered_count": stages[i]["entered_count"],
                "incremental_volume": 0
            })

        # At target stage: apply uplift
        target_s = stages[target_idx]
        baseline_rate = target_s["step_conversion_rate_pct"]
        new_rate = min(100.0, baseline_rate + conversion_uplift_pct)
        prev_entered = scenario_stages[target_idx - 1]["scenario_entered_count"] if target_idx > 0 else target_s["entered_count"]
        
        new_entered = int(round(prev_entered * (new_rate / 100.0)))
        incremental_at_target = max(0, new_entered - target_s["entered_count"])
        incremental_applicants_at_target = incremental_at_target

        scenario_stages.append({
            **target_s,
            "scenario_entered_count": new_entered,
            "scenario_step_conversion_rate_pct": round(new_rate, 2),
            "incremental_volume": incremental_at_target
        })

        # Downstream propagation through remaining stages
        current_scenario_count = new_entered
        for i in range(target_idx + 1, len(stages)):
            s = stages[i]
            # Downstream conversion rate remains at empirical baseline
            step_rate = s["step_conversion_rate_pct"]
            next_count = int(round(current_scenario_count * (step_rate / 100.0)))
            inc = max(0, next_count - s["entered_count"])
            
            scenario_stages.append({
                **s,
                "scenario_entered_count": next_count,
                "scenario_step_conversion_rate_pct": step_rate,
                "incremental_volume": inc
            })
            current_scenario_count = next_count

        baseline_disbursals = stages[-1]["entered_count"]
        scenario_disbursals = scenario_stages[-1]["scenario_entered_count"]
        incremental_disbursals = max(0, scenario_disbursals - baseline_disbursals)

        incremental_disbursed_principal = incremental_disbursals * avg_ticket
        total_variable_operational_cost = incremental_applicants_at_target * operational_cost_per_applicant
        total_costs = implementation_cost_inr + total_variable_operational_cost

        # Financial contribution on incremental disbursed volume
        # Average assumptions: 14.5% annual rate, 24 mo tenure, 3.5% PD, 7.5% CoF
        financials = FinancialContributionEngine.calculate_financial_contribution(
            disbursed_principal=incremental_disbursed_principal,
            annual_interest_rate_pct=14.5,
            avg_tenure_months=24,
            probability_of_default=0.035,
            cost_of_funds_pct=7.5,
            origination_fee_pct=2.0,
            operating_cost_inr=total_costs,
            loss_given_default_pct=45.0
        )

        roi_ratio = round(financials["net_contribution"] / implementation_cost_inr, 2) if implementation_cost_inr > 0 else 0.0

        return {
            "scenario_type": "funnel_improvement",
            "assumptions": {
                "target_stage": target_stage,
                "conversion_uplift_pct": conversion_uplift_pct,
                "target_segment": target_segment or "All",
                "implementation_cost_inr": implementation_cost_inr,
                "operational_cost_per_applicant": operational_cost_per_applicant
            },
            "baseline": {
                "total_applications": baseline_funnel["cohort_total_applications"],
                "disbursals_count": baseline_disbursals,
                "overall_conversion_pct": baseline_funnel["overall_funnel_conversion_pct"],
            },
            "scenario": {
                "disbursals_count": scenario_disbursals,
                "overall_conversion_pct": round(scenario_disbursals / baseline_funnel["cohort_total_applications"] * 100.0, 2) if baseline_funnel["cohort_total_applications"] > 0 else 0.0,
                "incremental_disbursals_count": incremental_disbursals,
                "incremental_disbursed_principal_inr": round(incremental_disbursed_principal, 2),
                "stages_comparison": scenario_stages
            },
            "financial_impact": {
                **financials,
                "implementation_cost_inr": implementation_cost_inr,
                "variable_operating_cost_inr": round(total_variable_operational_cost, 2),
                "total_scenario_investment_inr": round(total_costs, 2),
                "expected_roi_ratio": roi_ratio
            }
        }

class ProcessingTimeSimulator:
    """
    Simulates operational processing turnaround time (TAT) reduction,
    friction elasticity, and recovered application volume.
    """
    @classmethod
    def simulate_tat_reduction(
        cls,
        db: Session,
        target_stage: str,
        tat_reduction_pct: float,
        elasticity: float = 0.20,
        automation_investment_inr: float = 300000.0
    ) -> Dict[str, Any]:
        """
        Elasticity: e.g. 10% TAT reduction leads to (10 * 0.20) = 2.0% conversion uplift.
        """
        calculated_uplift = round(tat_reduction_pct * elasticity, 2)
        
        funnel_sim = FunnelImprovementSimulator.simulate_stage_improvement(
            db=db,
            target_stage=target_stage,
            conversion_uplift_pct=calculated_uplift,
            implementation_cost_inr=automation_investment_inr
        )
        
        funnel_sim["scenario_type"] = "tat_optimization"
        funnel_sim["assumptions"]["tat_reduction_pct"] = tat_reduction_pct
        funnel_sim["assumptions"]["elasticity_factor"] = elasticity
        funnel_sim["assumptions"]["calculated_conversion_uplift_pct"] = calculated_uplift
        return funnel_sim
