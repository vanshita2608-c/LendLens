import pytest
from datetime import datetime, timezone, timedelta
from data.generation.repayment_generator import RepaymentGenerator
from data.generation.credit_and_loan_generator import CreditAndLoanGenerator

def test_repayment_schedule_counts_and_components():
    generator = RepaymentGenerator(seed=42)
    principal = 120000.0
    rate = 14.0
    tenure = 12
    emi = CreditAndLoanGenerator.calculate_monthly_emi(principal, rate, tenure)
    
    disbursal = datetime(2025, 1, 1)
    as_of = datetime(2025, 4, 15) # ~3.5 months later
    
    repayments, status, outstanding = generator.generate_loan_repayments(
        loan_id=1,
        principal=principal,
        annual_rate_pct=rate,
        tenure_months=tenure,
        monthly_emi=emi,
        disbursal_date=disbursal,
        as_of_date=as_of,
        customer_pd=0.02
    )

    assert len(repayments) == tenure
    # First 3 installments are in the past, rest are Pending
    past_installments = [r for r in repayments if r["due_date"] <= as_of]
    future_installments = [r for r in repayments if r["due_date"] > as_of]
    
    assert len(past_installments) == 3
    assert len(future_installments) == 9
    assert all(r["repayment_status"] == "Pending" for r in future_installments)
    assert outstanding < principal

def test_delinquency_classification():
    generator = RepaymentGenerator(seed=99)
    principal = 50000.0
    rate = 18.0
    tenure = 6
    emi = CreditAndLoanGenerator.calculate_monthly_emi(principal, rate, tenure)
    
    disbursal = datetime(2024, 1, 1)
    as_of = datetime(2024, 10, 1) # 9 months later, long matured
    
    # Very high PD should trigger delinquency or default
    repayments, status, outstanding = generator.generate_loan_repayments(
        loan_id=2,
        principal=principal,
        annual_rate_pct=rate,
        tenure_months=tenure,
        monthly_emi=emi,
        disbursal_date=disbursal,
        as_of_date=as_of,
        customer_pd=0.45
    )

    assert status in ["Defaulted", "Delinquent_60", "Delinquent_30", "Closed", "Active"]
    # Check DPD consistency
    for r in repayments:
        if r["repayment_status"] == "Missed":
            assert r["days_past_due"] > 0
            assert r["amount_paid"] == 0.0
        elif r["repayment_status"] == "Paid_On_Time":
            assert r["days_past_due"] == 0
            assert r["amount_paid"] > 0
