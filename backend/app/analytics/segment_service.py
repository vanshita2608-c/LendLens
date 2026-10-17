from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from app.models import Customer, LoanApplication, Loan

class SegmentAnalyticsService:
    """
    Computes multidimensional performance metrics by acquisition channel
    and synthetic customer segment (approval rates, ticket size, CAC, and delinquency).
    """
    ESTIMATED_CAC_MAP = {
        "Organic": 250.0,
        "Partner Referral": 1100.0,
        "Direct Mail": 850.0,
        "Paid Search": 1850.0,
        "Aggregators": 2400.0,
    }

    @classmethod
    def get_channel_performance(cls, db: Session) -> List[Dict[str, Any]]:
        total_apps_all = db.query(func.count(LoanApplication.id)).scalar() or 1

        channels_query = db.query(
            LoanApplication.acquisition_channel,
            func.count(LoanApplication.id).label("total_apps"),
            func.sum(case((LoanApplication.application_status == "Disbursed", 1), else_=0)).label("disbursals")
        ).group_by(LoanApplication.acquisition_channel).all()

        results = []
        for ch, total_apps, disbursals in channels_query:
            total_apps = total_apps or 0
            disbursals = disbursals or 0
            
            # Loans for this channel
            loans = db.query(Loan).join(LoanApplication).filter(
                LoanApplication.acquisition_channel == ch
            ).all()

            total_volume = sum(l.principal_amount for l in loans)
            total_outstanding = sum(l.outstanding_principal for l in loans)
            avg_ticket = (total_volume / len(loans)) if loans else 0.0

            # PAR30 calculation
            delinquent_loans = [l for l in loans if l.loan_status in ["Delinquent_30", "Delinquent_60", "Defaulted"]]
            delinquent_outstanding = sum(l.outstanding_principal for l in delinquent_loans)
            par30_pct = (delinquent_outstanding / total_outstanding * 100.0) if total_outstanding > 0 else 0.0

            cac = cls.ESTIMATED_CAC_MAP.get(ch, 1500.0)
            total_cac_spend = total_apps * cac
            cac_per_disbursal = (total_cac_spend / disbursals) if disbursals > 0 else 0.0

            results.append({
                "channel": ch,
                "total_applications": total_apps,
                "share_of_volume_pct": round(total_apps / total_apps_all * 100.0, 2),
                "disbursed_loans_count": disbursals,
                "disbursal_conversion_rate_pct": round(disbursals / total_apps * 100.0, 2) if total_apps > 0 else 0.0,
                "total_disbursed_volume_inr": round(total_volume, 2),
                "avg_loan_ticket_inr": round(avg_ticket, 2),
                "unit_cac_inr": cac,
                "blended_cac_per_disbursal_inr": round(cac_per_disbursal, 2),
                "par30_delinquency_rate_pct": round(par30_pct, 2)
            })

        return sorted(results, key=lambda x: x["total_applications"], reverse=True)

    @classmethod
    def get_segment_performance(cls, db: Session) -> List[Dict[str, Any]]:
        total_apps_all = db.query(func.count(LoanApplication.id)).scalar() or 1

        segments_query = db.query(
            Customer.customer_segment,
            func.count(LoanApplication.id).label("total_apps"),
            func.sum(case((LoanApplication.application_status == "Disbursed", 1), else_=0)).label("disbursals"),
            func.avg(Customer.monthly_income).label("avg_income"),
            func.avg(Customer.credit_score).label("avg_credit_score"),
            func.avg(Customer.debt_to_income_ratio).label("avg_dti")
        ).join(LoanApplication, Customer.id == LoanApplication.customer_id)\
         .group_by(Customer.customer_segment).all()

        results = []
        for seg, total_apps, disbursals, avg_inc, avg_score, avg_dti in segments_query:
            total_apps = total_apps or 0
            disbursals = disbursals or 0

            loans = db.query(Loan).join(Customer).filter(
                Customer.customer_segment == seg
            ).all()

            total_volume = sum(l.principal_amount for l in loans)
            total_outstanding = sum(l.outstanding_principal for l in loans)
            avg_ticket = (total_volume / len(loans)) if loans else 0.0

            delinquent_loans = [l for l in loans if l.loan_status in ["Delinquent_30", "Delinquent_60", "Defaulted"]]
            delinquent_outstanding = sum(l.outstanding_principal for l in delinquent_loans)
            par30_pct = (delinquent_outstanding / total_outstanding * 100.0) if total_outstanding > 0 else 0.0

            results.append({
                "segment": seg,
                "total_applications": total_apps,
                "share_of_volume_pct": round(total_apps / total_apps_all * 100.0, 2),
                "disbursed_loans_count": disbursals,
                "disbursal_conversion_rate_pct": round(disbursals / total_apps * 100.0, 2) if total_apps > 0 else 0.0,
                "avg_monthly_income_inr": round(float(avg_inc or 0), 2),
                "avg_credit_score": round(float(avg_score or 0), 1),
                "avg_debt_to_income_ratio": round(float(avg_dti or 0), 4),
                "total_disbursed_volume_inr": round(total_volume, 2),
                "avg_loan_ticket_inr": round(avg_ticket, 2),
                "par30_delinquency_rate_pct": round(par30_pct, 2)
            })

        return sorted(results, key=lambda x: x["total_applications"], reverse=True)
