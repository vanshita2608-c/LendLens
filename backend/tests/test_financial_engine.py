import pytest
from app.simulations.financial_engine import FinancialContributionEngine

def test_expected_credit_loss_formula():
    # EAD = 1,000,000, PD = 4% (0.04), LGD = 45% (0.45)
    # Expected: 1,000,000 * 0.04 * 0.45 = 18,000.0
    ecl = FinancialContributionEngine.calculate_expected_credit_loss(1000000.0, 0.04, 0.45)
    assert ecl == 18000.0

    # Zero cases
    assert FinancialContributionEngine.calculate_expected_credit_loss(0.0, 0.05, 0.45) == 0.0
    assert FinancialContributionEngine.calculate_expected_credit_loss(500000.0, 0.0, 0.45) == 0.0

def test_financial_contribution_breakdown():
    res = FinancialContributionEngine.calculate_financial_contribution(
        disbursed_principal=10000000.0, # ₹1 Crore
        annual_interest_rate_pct=14.0,
        avg_tenure_months=24, # 2 years
        probability_of_default=0.035, # 3.5%
        cost_of_funds_pct=7.0,
        origination_fee_pct=2.0,
        operating_cost_inr=150000.0,
        loss_given_default_pct=45.0
    )

    assert res["disbursed_principal"] == 10000000.0
    assert res["gross_interest_income"] > 0
    assert res["fee_income"] == 200000.0 # 2% of 10M
    assert res["funding_cost"] > 0
    assert res["expected_credit_loss"] > 0
    assert res["total_revenue"] > res["total_expenses"]
    assert res["net_contribution"] > 0
    assert res["net_interest_margin_pct"] == 7.0 # 14% - 7%
    assert res["return_on_disbursed_capital_pct"] > 0
