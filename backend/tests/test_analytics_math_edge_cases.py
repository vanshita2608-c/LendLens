import pytest
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.session import Base
from app.analytics.dashboard_service import DashboardAnalyticsService
from app.analytics.funnel_service import FunnelAnalyticsService
from app.analytics.portfolio_service import PortfolioAnalyticsService
from data.generation.credit_and_loan_generator import CreditAndLoanGenerator
from data.generation.repayment_generator import RepaymentGenerator

@pytest.fixture
def empty_db():
    """Provides a totally blank, empty database to test zero-division resistance."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)

def test_zero_division_guard_on_empty_db(empty_db):
    # Dashboard on empty db
    summary = DashboardAnalyticsService.get_executive_summary(empty_db)
    assert summary["total_applications"] == 0
    assert summary["completion_rate_pct"] == 0.0
    assert summary["kyc_rate_pct"] == 0.0
    assert summary["approval_rate_pct"] == 0.0
    assert summary["disbursal_conversion_rate_pct"] == 0.0
    assert summary["par30_delinquency_rate_pct"] == 0.0
    assert summary["expected_credit_loss_inr"] == 0.0

    # Funnel on empty db
    funnel = FunnelAnalyticsService.get_funnel_overview(empty_db)
    assert funnel["cohort_total_applications"] == 0
    assert funnel["overall_funnel_conversion_pct"] == 0.0
    assert funnel["stages"] == []

    # Portfolio on empty db
    portfolio = PortfolioAnalyticsService.get_portfolio_summary(empty_db)
    assert portfolio["active_loans_count"] == 0
    assert portfolio["on_time_repayment_rate_pct"] == 0.0
    assert portfolio["weighted_avg_interest_rate_pct"] == 0.0

def test_financial_formulas_and_boundaries():
    # 1. Zero principal
    assert CreditAndLoanGenerator.calculate_monthly_emi(0.0, 15.0, 12) == 0.0
    
    # 2. Zero interest rate (simple division)
    assert CreditAndLoanGenerator.calculate_monthly_emi(120000.0, 0.0, 12) == 10000.0

    # 3. High interest rate (e.g. 36% microfinance / payday)
    emi_high = CreditAndLoanGenerator.calculate_monthly_emi(50000.0, 36.0, 12)
    assert emi_high > (50000.0 / 12) # must be greater than principal repayment alone
    assert emi_high < 6500.0

    # 4. Zero tenure edge case
    assert CreditAndLoanGenerator.calculate_monthly_emi(10000.0, 12.0, 0) == 0.0

def test_repayment_schedule_conservation():
    repay_gen = RepaymentGenerator(seed=42)
    principal = 200000.0
    rate = 15.0
    tenure = 24
    emi = CreditAndLoanGenerator.calculate_monthly_emi(principal, rate, tenure)
    
    disbursal = datetime(2025, 1, 1)
    as_of = datetime(2025, 7, 1)
    
    repayments, status, outstanding = repay_gen.generate_loan_repayments(
        loan_id=1,
        principal=principal,
        annual_rate_pct=rate,
        tenure_months=tenure,
        monthly_emi=emi,
        disbursal_date=disbursal,
        as_of_date=as_of,
        customer_pd=0.01 # Very safe borrower
    )

    # Verify each installment satisfies: principal_component + interest_component == amount_due
    for r in repayments:
        component_sum = round(r["principal_component"] + r["interest_component"], 2)
        assert abs(component_sum - r["amount_due"]) <= 0.02
        assert r["amount_due"] > 0
