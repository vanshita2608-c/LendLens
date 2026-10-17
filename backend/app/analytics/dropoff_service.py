import numpy as np
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import LoanApplication, ApplicationEvent, Customer

class DropoffAnalyticsService:
    """
    Computes stage-level drop-off reason distributions, processing turnaround times,
    and stage investigation diagnostic briefs.
    """
    STAGE_OPPORTUNITY_TEMPLATES = {
        "DETAILS_SUBMITTED": {
            "problem": "High form abandonment during initial details submission.",
            "hypothesis": "Implementing autofill via SMS/device verification and reducing input fields will recover 15% of abandoned applicants.",
            "proposed_intervention": "Smart 3-field progressive profiling on mobile.",
            "primary_metric": "details_submitted_conversion_rate",
            "guardrails": "application_fraud_rate, details_completeness"
        },
        "KYC_COMPLETED": {
            "problem": "KYC verification friction causing severe drop-off.",
            "hypothesis": "Integrating DigiLocker with instant OTP consent will increase KYC completion rate by 8-12 percentage points.",
            "proposed_intervention": "1-click DigiLocker identity verification + automated face match fallback.",
            "primary_metric": "kyc_completion_rate",
            "guardrails": "kyc_fraud_rejection_rate, processing_cost_per_applicant"
        },
        "CREDIT_ASSESSED": {
            "problem": "Rule-based rejections for thin-file or gig-economy borrowers.",
            "hypothesis": "Incorporating alternate banking cashflow signals will safely expand approval eligibility by 6%.",
            "proposed_intervention": "Cash-flow underwriting model for New-to-Credit and Gig Worker segments.",
            "primary_metric": "credit_approval_rate",
            "guardrails": "par30_delinquency_rate, expected_credit_loss"
        },
        "OFFER_ACCEPTED": {
            "problem": "Loan offer drop-off due to perceived high interest rate or loan ticket mismatch.",
            "hypothesis": "Dynamic tenure sliders and transparent all-inclusive APR breakdown will increase offer acceptance by 5%.",
            "proposed_intervention": "Interactive loan customizer allowing tenure extension to reduce monthly EMI.",
            "primary_metric": "offer_acceptance_rate",
            "guardrails": "net_interest_margin, early_default_rate"
        },
        "LOAN_DISBURSED": {
            "problem": "Drop-off during bank account Penny-drop and E-mandate setup.",
            "hypothesis": "Adding UPI AutoPay alongside netbanking NACH will reduce e-mandate registration failures by 60%.",
            "proposed_intervention": "UPI AutoPay mandate authorization.",
            "primary_metric": "disbursal_completion_rate",
            "guardrails": "mandate_bounce_rate, mandate_registration_time"
        }
    }

    @staticmethod
    def get_dropoff_reasons_summary(
        db: Session,
        stage_name: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Calculates drop-off reason distributions across stages."""
        query = db.query(
            LoanApplication.drop_off_stage,
            LoanApplication.drop_off_reason,
            func.count(LoanApplication.id).label("count")
        ).filter(
            LoanApplication.drop_off_stage.isnot(None),
            LoanApplication.drop_off_reason.isnot(None)
        )

        if stage_name:
            query = query.filter(LoanApplication.drop_off_stage == stage_name)

        rows = query.group_by(LoanApplication.drop_off_stage, LoanApplication.drop_off_reason).all()
        
        # Group by stage
        stages_map: Dict[str, List[Dict[str, Any]]] = {}
        stage_totals: Dict[str, int] = {}

        for stage, reason, count in rows:
            if stage not in stages_map:
                stages_map[stage] = []
                stage_totals[stage] = 0
            stages_map[stage].append({"reason": reason, "count": count})
            stage_totals[stage] += count

        results = []
        for stage, reasons in stages_map.items():
            total = stage_totals[stage]
            sorted_reasons = sorted(reasons, key=lambda x: x["count"], reverse=True)
            for r in sorted_reasons:
                r["pct_of_stage_dropoff"] = round(r["count"] / total * 100.0, 2) if total > 0 else 0.0

            results.append({
                "stage_name": stage,
                "total_dropoffs": total,
                "reasons": sorted_reasons
            })

        return results

    @staticmethod
    def get_stage_latencies(db: Session) -> List[Dict[str, Any]]:
        """Calculates duration percentiles (median, p75, p90) in minutes for each funnel stage."""
        events = db.query(
            ApplicationEvent.stage_name,
            ApplicationEvent.duration_seconds_from_prev
        ).filter(
            ApplicationEvent.duration_seconds_from_prev > 0
        ).all()

        stage_durations: Dict[str, List[float]] = {}
        for stage, dur in events:
            if stage not in stage_durations:
                stage_durations[stage] = []
            stage_durations[stage].append(dur / 60.0) # Convert to minutes

        results = []
        for stage, durs in stage_durations.items():
            arr = np.array(durs)
            results.append({
                "stage_name": stage,
                "sample_size": len(durs),
                "min_minutes": round(float(np.min(arr)), 1),
                "median_minutes": round(float(np.median(arr)), 1),
                "p75_minutes": round(float(np.percentile(arr, 75)), 1),
                "p90_minutes": round(float(np.percentile(arr, 90)), 1),
                "max_minutes": round(float(np.max(arr)), 1),
            })
        return results

    @classmethod
    def get_stage_investigation(cls, db: Session, stage_name: str) -> Dict[str, Any]:
        """Provides a deep-dive diagnostic brief with hypothesis and opportunity outline."""
        dropoffs = cls.get_dropoff_reasons_summary(db, stage_name=stage_name)
        stage_drop_info = dropoffs[0] if dropoffs else {"total_dropoffs": 0, "reasons": []}
        
        template = cls.STAGE_OPPORTUNITY_TEMPLATES.get(stage_name, {
            "problem": f"Friction observed at {stage_name}.",
            "hypothesis": f"Optimizing {stage_name} will reduce customer dropoff.",
            "proposed_intervention": "UX and latency optimization.",
            "primary_metric": "conversion_rate",
            "guardrails": "credit_quality"
        })

        return {
            "stage_name": stage_name,
            "dropoff_diagnostics": stage_drop_info,
            "product_opportunity": template
        }
