import numpy as np
from typing import Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from app.models import Customer, LoanApplication, ApplicationEvent, Loan, Repayment, CreditAssessment

class DashboardAnalyticsService:
    """
    Computes executive overview KPIs, funnel conversion rates, turnaround times,
    delinquency rates, and volume trends with dynamic filtering.
    """
    @staticmethod
    def get_executive_summary(
        db: Session,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        channel: Optional[str] = None,
        segment: Optional[str] = None
    ) -> Dict[str, Any]:
        # Base query for applications with customer join
        app_query = db.query(LoanApplication).join(Customer)
        if start_date:
            app_query = app_query.filter(LoanApplication.created_at >= start_date)
        if end_date:
            app_query = app_query.filter(LoanApplication.created_at <= end_date)
        if channel and channel != "All":
            app_query = app_query.filter(LoanApplication.acquisition_channel == channel)
        if segment and segment != "All":
            app_query = app_query.filter(Customer.customer_segment == segment)

        total_applications = app_query.count()
        if total_applications == 0:
            return DashboardAnalyticsService._get_empty_summary()

        # Funnel stage completion counts
        stage_counts = {}
        events_query = db.query(
            ApplicationEvent.stage_name, 
            func.count(func.distinct(ApplicationEvent.application_id))
        ).join(LoanApplication).join(Customer)

        if start_date:
            events_query = events_query.filter(LoanApplication.created_at >= start_date)
        if end_date:
            events_query = events_query.filter(LoanApplication.created_at <= end_date)
        if channel and channel != "All":
            events_query = events_query.filter(LoanApplication.acquisition_channel == channel)
        if segment and segment != "All":
            events_query = events_query.filter(Customer.customer_segment == segment)

        for stage, count in events_query.group_by(ApplicationEvent.stage_name).all():
            stage_counts[stage] = count

        started = total_applications
        details = stage_counts.get("DETAILS_SUBMITTED", 0)
        kyc = stage_counts.get("KYC_COMPLETED", 0)
        assessed = stage_counts.get("CREDIT_ASSESSED", 0)
        approved = stage_counts.get("LOAN_APPROVED", 0)
        accepted = stage_counts.get("OFFER_ACCEPTED", 0)
        disbursed = stage_counts.get("LOAN_DISBURSED", 0)

        # Rate calculations with zero-division protection
        completion_rate = (details / started * 100.0) if started > 0 else 0.0
        kyc_rate = (kyc / details * 100.0) if details > 0 else 0.0
        approval_rate = (approved / assessed * 100.0) if assessed > 0 else 0.0
        offer_acceptance_rate = (accepted / approved * 100.0) if approved > 0 else 0.0
        disbursal_conversion_rate = (disbursed / started * 100.0) if started > 0 else 0.0

        # Disbursal loan financial metrics
        loans_query = db.query(Loan).join(LoanApplication).join(Customer)
        if start_date:
            loans_query = loans_query.filter(LoanApplication.created_at >= start_date)
        if end_date:
            loans_query = loans_query.filter(LoanApplication.created_at <= end_date)
        if channel and channel != "All":
            loans_query = loans_query.filter(LoanApplication.acquisition_channel == channel)
        if segment and segment != "All":
            loans_query = loans_query.filter(Customer.customer_segment == segment)

        loans = loans_query.all()
        total_disbursed_amount = sum(l.principal_amount for l in loans)
        total_outstanding_amount = sum(l.outstanding_principal for l in loans)
        avg_loan_amount = (total_disbursed_amount / len(loans)) if loans else 0.0

        # Delinquency PAR30 and Expected Credit Loss (ECL)
        # PAR30 = Outstanding principal on loans with status Delinquent_30, Delinquent_60, or Defaulted / Total Outstanding
        delinquent_loans = [l for l in loans if l.loan_status in ["Delinquent_30", "Delinquent_60", "Defaulted"]]
        par30_principal = sum(l.outstanding_principal for l in delinquent_loans)
        par30_rate = (par30_principal / total_outstanding_amount * 100.0) if total_outstanding_amount > 0 else 0.0

        # Expected Credit Loss (ECL = PD * LGD * EAD)
        # Standard retail banking assumption: LGD = 45% (Loss Given Default for unsecured personal lending)
        lgd = 0.45
        ecl_total = 0.0
        
        # Join with credit assessment to get predicted PD
        for l in loans:
            if l.application and l.application.credit_assessment:
                pd = l.application.credit_assessment.predicted_probability_of_default
                ead = l.outstanding_principal # Exposure at Default
                ecl_total += (pd * lgd * ead)

        # Median Turnaround Time (TAT) in seconds from started to disbursed
        tat_durations = []
        for l in loans:
            if l.application and l.application.events:
                evs = l.application.events
                started_ev = next((e for e in evs if e.stage_name == "APPLICATION_STARTED"), None)
                disbursed_ev = next((e for e in evs if e.stage_name == "LOAN_DISBURSED"), None)
                if started_ev and disbursed_ev:
                    diff = (disbursed_ev.event_timestamp - started_ev.event_timestamp).total_seconds()
                    if diff > 0:
                        tat_durations.append(diff)

        median_tat_hours = round(float(np.median(tat_durations)) / 3600.0, 2) if tat_durations else 0.0

        return {
            "total_applications": total_applications,
            "disbursed_loans_count": len(loans),
            "completion_rate_pct": round(completion_rate, 2),
            "kyc_rate_pct": round(kyc_rate, 2),
            "approval_rate_pct": round(approval_rate, 2),
            "offer_acceptance_rate_pct": round(offer_acceptance_rate, 2),
            "disbursal_conversion_rate_pct": round(disbursal_conversion_rate, 2),
            "total_disbursed_amount_inr": round(total_disbursed_amount, 2),
            "total_outstanding_amount_inr": round(total_outstanding_amount, 2),
            "avg_loan_amount_inr": round(avg_loan_amount, 2),
            "par30_delinquency_rate_pct": round(par30_rate, 2),
            "expected_credit_loss_inr": round(ecl_total, 2),
            "median_turnaround_time_hours": median_tat_hours,
            "funnel_stage_counts": {
                "started": started,
                "details_submitted": details,
                "kyc_completed": kyc,
                "credit_assessed": assessed,
                "loan_approved": approved,
                "offer_accepted": accepted,
                "loan_disbursed": disbursed
            }
        }

    @staticmethod
    def _get_empty_summary() -> Dict[str, Any]:
        return {
            "total_applications": 0,
            "disbursed_loans_count": 0,
            "completion_rate_pct": 0.0,
            "kyc_rate_pct": 0.0,
            "approval_rate_pct": 0.0,
            "offer_acceptance_rate_pct": 0.0,
            "disbursal_conversion_rate_pct": 0.0,
            "total_disbursed_amount_inr": 0.0,
            "total_outstanding_amount_inr": 0.0,
            "avg_loan_amount_inr": 0.0,
            "par30_delinquency_rate_pct": 0.0,
            "expected_credit_loss_inr": 0.0,
            "median_turnaround_time_hours": 0.0,
            "funnel_stage_counts": {
                "started": 0,
                "details_submitted": 0,
                "kyc_completed": 0,
                "credit_assessed": 0,
                "loan_approved": 0,
                "offer_accepted": 0,
                "loan_disbursed": 0
            }
        }

    @staticmethod
    def get_monthly_trends(db: Session) -> list:
        """Returns monthly application, disbursal, and volume trends for charts."""
        apps = db.query(
            func.strftime("%Y-%m", LoanApplication.created_at).label("month"),
            func.count(LoanApplication.id).label("total_apps"),
            func.sum(case((LoanApplication.application_status == "Disbursed", 1), else_=0)).label("disbursals")
        ).group_by("month").order_by("month").all()

        results = []
        for a in apps:
            month_str, total_apps, disbursals = a
            # Query disbursed volume for this month
            vol = db.query(func.sum(Loan.principal_amount)).join(LoanApplication).filter(
                func.strftime("%Y-%m", LoanApplication.created_at) == month_str
            ).scalar() or 0.0

            results.append({
                "month": month_str,
                "applications": total_apps or 0,
                "disbursals": disbursals or 0,
                "disbursed_volume_inr": round(float(vol), 2),
                "conversion_rate_pct": round((disbursals / total_apps * 100.0), 2) if total_apps else 0.0
            })
        return results
