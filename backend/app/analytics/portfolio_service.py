from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from app.models import Loan, Repayment, Customer, LoanApplication, CreditAssessment

class PortfolioAnalyticsService:
    """
    Computes loan book portfolio indicators, delinquency aging buckets (PAR30/60/90),
    collection efficiency, and monthly disbursal vintage performance.
    """
    @staticmethod
    def get_portfolio_summary(db: Session) -> Dict[str, Any]:
        loans = db.query(Loan).all()
        if not loans:
            return {
                "active_loans_count": 0,
                "closed_loans_count": 0,
                "defaulted_loans_count": 0,
                "total_disbursed_principal_inr": 0.0,
                "total_outstanding_principal_inr": 0.0,
                "avg_loan_amount_inr": 0.0,
                "avg_tenure_months": 0.0,
                "weighted_avg_interest_rate_pct": 0.0,
                "on_time_repayment_rate_pct": 0.0,
                "late_repayment_rate_pct": 0.0,
                "missed_repayment_rate_pct": 0.0,
                "delinquency_buckets": {}
            }

        active_loans = [l for l in loans if l.loan_status in ["Active", "Delinquent_30", "Delinquent_60"]]
        closed_loans = [l for l in loans if l.loan_status == "Closed"]
        defaulted_loans = [l for l in loans if l.loan_status == "Defaulted"]

        total_disbursed = sum(l.principal_amount for l in loans)
        total_outstanding = sum(l.outstanding_principal for l in loans)
        avg_amount = total_disbursed / len(loans)
        avg_tenure = sum(l.tenure_months for l in loans) / len(loans)
        
        # Weighted interest rate
        weighted_rate = sum(l.principal_amount * l.annual_interest_rate for l in loans) / total_disbursed if total_disbursed > 0 else 0.0

        # Repayment statistics (past due only)
        past_repayments = db.query(Repayment).filter(Repayment.repayment_status != "Pending").all()
        total_past_repay = len(past_repayments)
        
        on_time = sum(1 for r in past_repayments if r.repayment_status == "Paid_On_Time")
        late = sum(1 for r in past_repayments if r.repayment_status == "Paid_Late")
        missed = sum(1 for r in past_repayments if r.repayment_status == "Missed")

        on_time_pct = (on_time / total_past_repay * 100.0) if total_past_repay > 0 else 0.0
        late_pct = (late / total_past_repay * 100.0) if total_past_repay > 0 else 0.0
        missed_pct = (missed / total_past_repay * 100.0) if total_past_repay > 0 else 0.0

        # Delinquency buckets by outstanding balance
        current_bal = sum(l.outstanding_principal for l in loans if l.loan_status in ["Active", "Closed"])
        par30_bal = sum(l.outstanding_principal for l in loans if l.loan_status == "Delinquent_30")
        par60_bal = sum(l.outstanding_principal for l in loans if l.loan_status == "Delinquent_60")
        par90_bal = sum(l.outstanding_principal for l in loans if l.loan_status == "Defaulted")

        denom = total_outstanding if total_outstanding > 0 else 1.0

        return {
            "active_loans_count": len(active_loans),
            "closed_loans_count": len(closed_loans),
            "defaulted_loans_count": len(defaulted_loans),
            "total_disbursed_principal_inr": round(total_disbursed, 2),
            "total_outstanding_principal_inr": round(total_outstanding, 2),
            "avg_loan_amount_inr": round(avg_amount, 2),
            "avg_tenure_months": round(avg_tenure, 1),
            "weighted_avg_interest_rate_pct": round(weighted_rate, 2),
            "on_time_repayment_rate_pct": round(on_time_pct, 2),
            "late_repayment_rate_pct": round(late_pct, 2),
            "missed_repayment_rate_pct": round(missed_pct, 2),
            "delinquency_buckets": {
                "current": {"outstanding_inr": round(current_bal, 2), "pct": round(current_bal / denom * 100.0, 2)},
                "par30": {"outstanding_inr": round(par30_bal, 2), "pct": round(par30_bal / denom * 100.0, 2)},
                "par60": {"outstanding_inr": round(par60_bal, 2), "pct": round(par60_bal / denom * 100.0, 2)},
                "par90_default": {"outstanding_inr": round(par90_bal, 2), "pct": round(par90_bal / denom * 100.0, 2)},
            }
        }

    @staticmethod
    def get_vintage_analysis(db: Session) -> List[Dict[str, Any]]:
        """
        Calculates monthly disbursal cohorts and tracks PAR30 / Default rates over aging periods.
        """
        cohorts = db.query(
            func.strftime("%Y-%m", Loan.disbursal_date).label("disbursal_cohort"),
            func.count(Loan.id).label("loans_count"),
            func.sum(Loan.principal_amount).label("disbursed_principal")
        ).group_by("disbursal_cohort").order_by("disbursal_cohort").all()

        results = []
        for cohort_str, count, principal in cohorts:
            loans = db.query(Loan).filter(
                func.strftime("%Y-%m", Loan.disbursal_date) == cohort_str
            ).all()

            delinquent_loans = [l for l in loans if l.loan_status in ["Delinquent_30", "Delinquent_60", "Defaulted"]]
            defaulted_loans = [l for l in loans if l.loan_status == "Defaulted"]

            delinquency_rate = (len(delinquent_loans) / len(loans) * 100.0) if loans else 0.0
            default_rate = (len(defaulted_loans) / len(loans) * 100.0) if loans else 0.0

            results.append({
                "cohort": cohort_str,
                "disbursed_loans_count": count,
                "disbursed_principal_inr": round(float(principal or 0), 2),
                "delinquency_rate_pct": round(delinquency_rate, 2),
                "default_rate_pct": round(default_rate, 2),
                "current_repayment_health": "Healthy" if delinquency_rate < 5.0 else ("Moderate" if delinquency_rate < 10.0 else "High Risk")
            })

        return results
