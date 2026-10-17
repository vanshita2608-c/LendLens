import random
from typing import List, Dict, Any, Tuple
from datetime import datetime, timedelta

class RepaymentGenerator:
    """
    Generates exact amortization schedules and realistic repayment outcomes
    (on-time, late, missed/delinquent, pending) for disbursed loans.
    """
    def __init__(self, seed: int = 42):
        self.seed = seed
        self.rng = random.Random(seed)

    def generate_loan_repayments(
        self,
        loan_id: int,
        principal: float,
        annual_rate_pct: float,
        tenure_months: int,
        monthly_emi: float,
        disbursal_date: datetime,
        as_of_date: datetime,
        customer_pd: float
    ) -> Tuple[List[Dict[str, Any]], str, float]:
        """
        Generates month-by-month repayment schedule for a loan.
        Returns: (repayments_list, updated_loan_status, remaining_outstanding_principal)
        """
        repayments = []
        monthly_rate = (annual_rate_pct / 100.0) / 12.0
        remaining_balance = principal
        max_dpd = 0
        total_principal_paid = 0.0

        for installment in range(1, tenure_months + 1):
            # Due date is approximately 30 days * installment after disbursal
            due_date = disbursal_date + timedelta(days=30 * installment)
            
            # Interest and principal components of reducing balance
            interest_comp = round(remaining_balance * monthly_rate, 2)
            principal_comp = round(min(remaining_balance, monthly_emi - interest_comp), 2)
            amount_due = round(principal_comp + interest_comp, 2)

            if due_date > as_of_date:
                # Future installment: Pending
                repayments.append({
                    "loan_id": loan_id,
                    "installment_number": installment,
                    "due_date": due_date,
                    "payment_date": None,
                    "amount_due": amount_due,
                    "amount_paid": 0.0,
                    "principal_component": principal_comp,
                    "interest_component": interest_comp,
                    "days_past_due": 0,
                    "repayment_status": "Pending"
                })
            else:
                # Past installment: evaluate payment behavior based on customer PD
                # High PD -> elevated delinquency probability
                p_miss = min(0.35, max(0.015, customer_pd * 1.5))
                p_late = min(0.30, max(0.04, customer_pd * 1.8))
                
                roll = self.rng.random()
                if roll < p_miss:
                    # Missed payment
                    dpd = int((as_of_date - due_date).days)
                    max_dpd = max(max_dpd, dpd)
                    repayments.append({
                        "loan_id": loan_id,
                        "installment_number": installment,
                        "due_date": due_date,
                        "payment_date": None,
                        "amount_due": amount_due,
                        "amount_paid": 0.0,
                        "principal_component": principal_comp,
                        "interest_component": interest_comp,
                        "days_past_due": dpd,
                        "repayment_status": "Missed"
                    })
                elif roll < (p_miss + p_late):
                    # Late payment (settled within 1-28 days late)
                    late_days = self.rng.randint(2, 28)
                    payment_date = due_date + timedelta(days=late_days)
                    total_principal_paid += principal_comp
                    remaining_balance = max(0.0, remaining_balance - principal_comp)
                    repayments.append({
                        "loan_id": loan_id,
                        "installment_number": installment,
                        "due_date": due_date,
                        "payment_date": payment_date,
                        "amount_due": amount_due,
                        "amount_paid": amount_due,
                        "principal_component": principal_comp,
                        "interest_component": interest_comp,
                        "days_past_due": late_days,
                        "repayment_status": "Paid_Late"
                    })
                else:
                    # Paid on time
                    early_days = self.rng.randint(0, 3)
                    payment_date = due_date - timedelta(days=early_days)
                    total_principal_paid += principal_comp
                    remaining_balance = max(0.0, remaining_balance - principal_comp)
                    repayments.append({
                        "loan_id": loan_id,
                        "installment_number": installment,
                        "due_date": due_date,
                        "payment_date": payment_date,
                        "amount_due": amount_due,
                        "amount_paid": amount_due,
                        "principal_component": principal_comp,
                        "interest_component": interest_comp,
                        "days_past_due": 0,
                        "repayment_status": "Paid_On_Time"
                    })

        # Determine loan status based on delinquency and maturity
        outstanding_principal = round(max(0.0, principal - total_principal_paid), 2)
        if outstanding_principal <= 0.0 and len(repayments) == tenure_months and repayments[-1]["due_date"] <= as_of_date:
            status = "Closed"
        elif max_dpd >= 90:
            status = "Defaulted"
        elif max_dpd >= 60:
            status = "Delinquent_60"
        elif max_dpd >= 30:
            status = "Delinquent_30"
        else:
            status = "Active"

        return repayments, status, outstanding_principal
