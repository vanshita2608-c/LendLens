import pytest
from datetime import datetime, timezone
from data.generation.credit_and_loan_generator import CreditAndLoanGenerator

def test_emi_calculation_formula():
    # Benchmark: ₹100,000 at 12.0% per annum for 12 months
    # Formula: EMI = 100000 * 0.01 * (1.01)^12 / ((1.01)^12 - 1) = 8884.88
    emi = CreditAndLoanGenerator.calculate_monthly_emi(100000.0, 12.0, 12)
    assert abs(emi - 8884.88) < 0.5

    # Zero interest edge case
    assert CreditAndLoanGenerator.calculate_monthly_emi(12000.0, 0.0, 12) == 1000.0
    # Zero principal
    assert CreditAndLoanGenerator.calculate_monthly_emi(0.0, 15.0, 12) == 0.0

def test_credit_assessment_logic():
    generator = CreditAndLoanGenerator(seed=42)
    now = datetime(2025, 6, 1, 12, 0, tzinfo=timezone.utc)
    
    # Prime customer
    prime_cust = {
        "credit_score": 790,
        "debt_to_income_ratio": 0.20,
        "monthly_income": 120000.0,
        "customer_segment": "Salaried"
    }
    app = {"requested_amount": 200000.0}
    
    assessment_prime = generator.assess_credit_risk(prime_cust, app, now)
    assert assessment_prime["predicted_probability_of_default"] < 0.08
    assert assessment_prime["risk_tier"] in ["Low", "Medium"]
    assert assessment_prime["underwriting_decision"] == "Approve"

    # Subprime customer
    subprime_cust = {
        "credit_score": 560,
        "debt_to_income_ratio": 0.58,
        "monthly_income": 30000.0,
        "customer_segment": "Gig Worker"
    }
    app_large = {"requested_amount": 500000.0}
    assessment_subprime = generator.assess_credit_risk(subprime_cust, app_large, now)
    assert assessment_subprime["predicted_probability_of_default"] > assessment_prime["predicted_probability_of_default"]
    assert assessment_subprime["risk_tier"] in ["High", "Extreme"]

def test_loan_offer_and_disbursal():
    generator = CreditAndLoanGenerator(seed=42)
    now = datetime(2025, 6, 1, 12, 0, tzinfo=timezone.utc)
    disbursal_time = datetime(2025, 6, 1, 14, 0, tzinfo=timezone.utc)

    # Offer accepted and disbursed
    offer, loan = generator.generate_loan_offer_and_loan(
        application_id=101,
        customer_id=501,
        requested_amount=150000.0,
        requested_tenure=24,
        pd=0.035,
        offer_time=now,
        disbursal_time=disbursal_time,
        is_disbursed=True
    )

    assert offer["offer_status"] == "Accepted"
    assert loan is not None
    assert loan["principal_amount"] == 150000.0
    assert loan["monthly_emi"] > 0
    assert loan["loan_status"] == "Active"

    # Offer not disbursed
    offer_rej, loan_rej = generator.generate_loan_offer_and_loan(
        application_id=102,
        customer_id=502,
        requested_amount=150000.0,
        requested_tenure=24,
        pd=0.035,
        offer_time=now,
        disbursal_time=disbursal_time,
        is_disbursed=False
    )
    assert offer_rej["offer_status"] == "Rejected"
    assert loan_rej is None
