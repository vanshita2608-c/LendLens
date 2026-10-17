import pytest
from sqlalchemy import create_engine, inspect
from app.db.session import Base
from app.models import (
    Customer,
    LoanApplication,
    ApplicationEvent,
    CreditAssessment,
    LoanOffer,
    Loan,
    Repayment,
    Scenario,
    StrategyComparison,
    Experiment,
)

def test_database_initialization_creates_all_tables():
    test_engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=test_engine)
    
    inspector = inspect(test_engine)
    tables = inspector.get_table_names()
    
    expected_tables = [
        "customers",
        "loan_applications",
        "application_events",
        "credit_assessments",
        "loan_offers",
        "loans",
        "repayments",
        "scenarios",
        "strategy_comparisons",
        "experiments",
    ]
    
    for table in expected_tables:
        assert table in tables, f"Expected table '{table}' was not created."

def test_foreign_key_and_indexes_exist():
    test_engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=test_engine)
    
    inspector = inspect(test_engine)
    
    # Check loan_applications foreign keys
    fks = inspector.get_foreign_keys("loan_applications")
    referred_tables = [fk["referred_table"] for fk in fks]
    assert "customers" in referred_tables
    
    # Check repayments foreign keys
    repay_fks = inspector.get_foreign_keys("repayments")
    repay_referred = [fk["referred_table"] for fk in repay_fks]
    assert "loans" in repay_referred
