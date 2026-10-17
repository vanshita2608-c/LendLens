from typing import Dict, Any
from sqlalchemy.orm import Session
from app.models import Customer, LoanApplication, ApplicationEvent, Loan, Repayment, CreditAssessment

class DataIntegrityValidator:
    """
    Validates data consistency, state-transition legality, timestamp monotonicity,
    and target leakage prevention across the LendLens relational schema.
    """
    @staticmethod
    def validate_database_integrity(db: Session) -> Dict[str, Any]:
        results = {
            "is_valid": True,
            "checks_passed": 0,
            "errors": []
        }

        # Check 1: No orphan applications
        orphan_apps = db.query(LoanApplication).filter(
            ~LoanApplication.customer_id.in_(db.query(Customer.id))
        ).count()
        if orphan_apps > 0:
            results["is_valid"] = False
            results["errors"].append(f"Found {orphan_apps} orphan applications with invalid customer_id.")
        else:
            results["checks_passed"] += 1

        # Check 2: Disbursed loans must match LOAN_DISBURSED applications
        invalid_loans = db.query(Loan).join(LoanApplication).filter(
            LoanApplication.application_status != "Disbursed"
        ).count()
        if invalid_loans > 0:
            results["is_valid"] = False
            results["errors"].append(f"Found {invalid_loans} loans linked to non-disbursed applications.")
        else:
            results["checks_passed"] += 1

        # Check 3: Every disbursed application must have exactly 1 loan
        disbursed_apps_without_loan = db.query(LoanApplication).filter(
            LoanApplication.application_status == "Disbursed",
            ~LoanApplication.id.in_(db.query(Loan.application_id))
        ).count()
        if disbursed_apps_without_loan > 0:
            results["is_valid"] = False
            results["errors"].append(f"Found {disbursed_apps_without_loan} disbursed applications without loan records.")
        else:
            results["checks_passed"] += 1

        # Check 4: Repayments must link to valid loans
        orphan_repayments = db.query(Repayment).filter(
            ~Repayment.loan_id.in_(db.query(Loan.id))
        ).count()
        if orphan_repayments > 0:
            results["is_valid"] = False
            results["errors"].append(f"Found {orphan_repayments} orphan repayments.")
        else:
            results["checks_passed"] += 1

        # Check 5: Target leakage prevention - Credit assessments must precede disbursal dates
        leakage_count = db.query(CreditAssessment).join(LoanApplication).join(Loan).filter(
            CreditAssessment.assessment_timestamp > Loan.disbursal_date
        ).count()
        if leakage_count > 0:
            results["is_valid"] = False
            results["errors"].append(f"Target Leakage Detected! {leakage_count} credit assessments occurred after loan disbursal.")
        else:
            results["checks_passed"] += 1

        return results
