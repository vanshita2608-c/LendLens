from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Customer, LoanApplication, CreditAssessment, LoanOffer, Loan
from app.simulations.financial_engine import FinancialContributionEngine

class RiskSensitivitySimulator:
    """
    Simulates changes to credit-risk underwriting thresholds (cutoff Probability of Default).
    Evaluates applicant volume trade-offs, marginal portfolio composition, and Expected Credit Loss (ECL).
    """
    RISK_BANDS = [
        {"key": "tier_1", "label": "Low Risk (< 5% PD)", "min_pd": 0.0, "max_pd": 0.05},
        {"key": "tier_2", "label": "Moderate Risk (5% - 10% PD)", "min_pd": 0.05, "max_pd": 0.10},
        {"key": "tier_3", "label": "Elevated Risk (10% - 15% PD)", "min_pd": 0.10, "max_pd": 0.15},
        {"key": "tier_4", "label": "High Risk (15% - 20% PD)", "min_pd": 0.15, "max_pd": 0.20},
        {"key": "tier_5", "label": "Very High Risk (>= 20% PD)", "min_pd": 0.20, "max_pd": 1.00},
    ]

    @classmethod
    def simulate_cutoff_adjustment(
        cls,
        db: Session,
        proposed_cutoff_pd: float,
        baseline_cutoff_pd: float = 0.11,
        target_segment: Optional[str] = None,
        cost_of_funds_pct: float = 7.5,
        loss_given_default_pct: float = 45.0
    ) -> Dict[str, Any]:
        # Fetch all assessed applications
        query = db.query(CreditAssessment, LoanApplication, Customer).join(
            LoanApplication, CreditAssessment.application_id == LoanApplication.id
        ).join(
            Customer, LoanApplication.customer_id == Customer.id
        )

        if target_segment and target_segment != "All":
            query = query.filter(Customer.customer_segment == target_segment)

        assessed_records = query.all()
        total_assessed = len(assessed_records)
        if total_assessed == 0:
            return {"error": "No credit assessment records available for simulation."}

        # 1. Distribute into risk bands
        band_distribution = []
        for band in cls.RISK_BANDS:
            count = sum(
                1 for ca, app, cust in assessed_records 
                if band["min_pd"] <= ca.predicted_probability_of_default < band["max_pd"]
            )
            band_distribution.append({
                "band_key": band["key"],
                "band_label": band["label"],
                "applicant_count": count,
                "share_pct": round(count / total_assessed * 100.0, 2)
            })

        # 2. Baseline eligibility vs Proposed eligibility
        baseline_eligible = [
            (ca, app, cust) for ca, app, cust in assessed_records 
            if ca.predicted_probability_of_default <= baseline_cutoff_pd
        ]
        proposed_eligible = [
            (ca, app, cust) for ca, app, cust in assessed_records 
            if ca.predicted_probability_of_default <= proposed_cutoff_pd
        ]

        # 3. Marginal cohort (newly eligible or removed)
        is_expansion = proposed_cutoff_pd >= baseline_cutoff_pd
        if is_expansion:
            marginal_cohort = [
                (ca, app, cust) for ca, app, cust in assessed_records
                if baseline_cutoff_pd < ca.predicted_probability_of_default <= proposed_cutoff_pd
            ]
        else:
            marginal_cohort = [
                (ca, app, cust) for ca, app, cust in assessed_records
                if proposed_cutoff_pd < ca.predicted_probability_of_default <= baseline_cutoff_pd
            ]

        # Downstream conversion factors
        # Typical conversion from Approval -> Disbursal: ~75% offer accept * 92% disbursal = ~69%
        approval_to_disbursal_rate = 0.69
        avg_ticket = sum(app.requested_amount for ca, app, cust in assessed_records) / total_assessed

        marginal_eligible_count = len(marginal_cohort)
        marginal_disbursals_count = int(round(marginal_eligible_count * approval_to_disbursal_rate))
        marginal_disbursed_principal = marginal_disbursals_count * avg_ticket

        # Calculate incremental Expected Credit Loss (ECL = EAD * PD * LGD)
        marginal_pds = [ca.predicted_probability_of_default for ca, app, cust in marginal_cohort]
        avg_marginal_pd = (sum(marginal_pds) / len(marginal_pds)) if marginal_pds else 0.0

        marginal_ecl = FinancialContributionEngine.calculate_expected_credit_loss(
            exposure_at_default=marginal_disbursed_principal * 0.75,
            probability_of_default=avg_marginal_pd,
            loss_given_default=loss_given_default_pct / 100.0
        )

        # Marginal Financial P&L
        marginal_financials = FinancialContributionEngine.calculate_financial_contribution(
            disbursed_principal=marginal_disbursed_principal,
            annual_interest_rate_pct=16.5, # Slightly higher rate for marginal risk band
            avg_tenure_months=24,
            probability_of_default=avg_marginal_pd,
            cost_of_funds_pct=cost_of_funds_pct,
            origination_fee_pct=2.0,
            operating_cost_inr=marginal_disbursals_count * 250.0,
            loss_given_default_pct=loss_given_default_pct
        )

        return {
            "scenario_type": "risk_sensitivity",
            "assumptions": {
                "baseline_cutoff_pd": baseline_cutoff_pd,
                "proposed_cutoff_pd": proposed_cutoff_pd,
                "target_segment": target_segment or "All",
                "cost_of_funds_pct": cost_of_funds_pct,
                "loss_given_default_pct": loss_given_default_pct
            },
            "risk_band_distribution": band_distribution,
            "eligibility_impact": {
                "total_assessed_applications": total_assessed,
                "baseline_eligible_count": len(baseline_eligible),
                "proposed_eligible_count": len(proposed_eligible),
                "eligible_volume_change": (marginal_eligible_count if is_expansion else -marginal_eligible_count),
                "eligible_volume_change_pct": round(
                    ((len(proposed_eligible) - len(baseline_eligible)) / len(baseline_eligible) * 100.0) 
                    if len(baseline_eligible) > 0 else 0.0, 2
                )
            },
            "marginal_portfolio_impact": {
                "direction": "expansion" if is_expansion else "tightening",
                "marginal_disbursals_count": marginal_disbursals_count,
                "marginal_disbursed_principal_inr": round(marginal_disbursed_principal, 2),
                "avg_marginal_pd_pct": round(avg_marginal_pd * 100.0, 2),
                "marginal_expected_credit_loss_inr": round(marginal_ecl, 2),
                "marginal_net_contribution_inr": round(marginal_financials["net_contribution"], 2),
                "is_economically_viable": (marginal_financials["net_contribution"] > 0)
            }
        }
