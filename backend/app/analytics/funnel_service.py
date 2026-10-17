from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Customer, LoanApplication, ApplicationEvent

class FunnelAnalyticsService:
    """
    Computes rigorous customer journey funnel analytics, stage-to-stage conversion,
    cumulative drop-off, and cohort-consistent throughput.
    """
    ORDERED_STAGES = [
        ("APPLICATION_STARTED", "Application Started"),
        ("DETAILS_SUBMITTED", "Details Submitted"),
        ("KYC_COMPLETED", "KYC Completed"),
        ("CREDIT_ASSESSED", "Credit Assessed"),
        ("LOAN_APPROVED", "Loan Approved"),
        ("OFFER_ACCEPTED", "Offer Accepted"),
        ("LOAN_DISBURSED", "Loan Disbursed"),
    ]

    @classmethod
    def get_funnel_overview(
        cls,
        db: Session,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        channel: Optional[str] = None,
        segment: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Calculates cohort-based funnel conversion across all 7 stages.
        Denominator: All applications initiated within the cohort criteria.
        """
        # Base application cohort query
        cohort_query = db.query(LoanApplication.id).join(Customer)
        if start_date:
            cohort_query = cohort_query.filter(LoanApplication.created_at >= start_date)
        if end_date:
            cohort_query = cohort_query.filter(LoanApplication.created_at <= end_date)
        if channel and channel != "All":
            cohort_query = cohort_query.filter(LoanApplication.acquisition_channel == channel)
        if segment and segment != "All":
            cohort_query = cohort_query.filter(Customer.customer_segment == segment)

        cohort_app_ids = cohort_query.subquery()
        total_cohort_size = db.query(func.count(cohort_app_ids.c.id)).scalar() or 0

        if total_cohort_size == 0:
            return cls._get_empty_funnel()

        # Count distinct applications per stage for this cohort
        stage_counts_query = db.query(
            ApplicationEvent.stage_name,
            func.count(func.distinct(ApplicationEvent.application_id))
        ).filter(
            ApplicationEvent.application_id.in_(cohort_query)
        ).group_by(ApplicationEvent.stage_name).all()

        stage_counts_map = {stage: count for stage, count in stage_counts_query}

        stages_data = []
        prev_count = total_cohort_size

        for idx, (stage_key, stage_label) in enumerate(cls.ORDERED_STAGES, start=1):
            if stage_key == "APPLICATION_STARTED":
                count = total_cohort_size
            else:
                count = stage_counts_map.get(stage_key, 0)
                # Ensure logical consistency: subsequent stage count cannot exceed previous
                count = min(count, prev_count)

            step_conversion = (count / prev_count * 100.0) if prev_count > 0 else 0.0
            overall_conversion = (count / total_cohort_size * 100.0) if total_cohort_size > 0 else 0.0
            drop_off_count = max(0, prev_count - count) if idx > 1 else 0
            drop_off_rate = (drop_off_count / prev_count * 100.0) if prev_count > 0 and idx > 1 else 0.0

            stages_data.append({
                "stage_order": idx,
                "stage_key": stage_key,
                "stage_label": stage_label,
                "entered_count": count,
                "step_conversion_rate_pct": round(step_conversion, 2),
                "overall_conversion_rate_pct": round(overall_conversion, 2),
                "drop_off_count": drop_off_count,
                "drop_off_rate_pct": round(drop_off_rate, 2),
            })
            prev_count = count

        final_disbursed = stages_data[-1]["entered_count"]
        disbursal_rate = stages_data[-1]["overall_conversion_rate_pct"]

        # Identify biggest bottleneck stage
        bottleneck_stage = max(
            stages_data[1:], 
            key=lambda s: s["drop_off_count"], 
            default=stages_data[0]
        )

        return {
            "cohort_total_applications": total_cohort_size,
            "disbursed_loans_count": final_disbursed,
            "overall_funnel_conversion_pct": disbursal_rate,
            "primary_bottleneck": {
                "stage_label": bottleneck_stage["stage_label"],
                "drop_off_count": bottleneck_stage["drop_off_count"],
                "drop_off_rate_pct": bottleneck_stage["drop_off_rate_pct"]
            },
            "stages": stages_data
        }

    @staticmethod
    def _get_empty_funnel() -> Dict[str, Any]:
        return {
            "cohort_total_applications": 0,
            "disbursed_loans_count": 0,
            "overall_funnel_conversion_pct": 0.0,
            "primary_bottleneck": None,
            "stages": []
        }
