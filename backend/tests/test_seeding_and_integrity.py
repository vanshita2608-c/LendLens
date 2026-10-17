import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.session import Base
from data.generation.seed_data import seed_database
from data.generation.integrity_validator import DataIntegrityValidator
from app.models import Customer, LoanApplication, Loan, Repayment, Scenario, Experiment

def test_seeding_and_integrity_validation():
    # Run test seed of 100 records
    seed_database(num_customers=100, seed=42, reset=True)
    
    from app.db.session import SessionLocal
    db = SessionLocal()
    try:
        # Check counts
        assert db.query(Customer).count() == 100
        assert db.query(LoanApplication).count() == 100
        assert db.query(Scenario).count() >= 2
        assert db.query(Experiment).count() >= 2

        # Disbursed loans must have repayments
        disbursed_loans = db.query(Loan).all()
        assert len(disbursed_loans) > 0
        for loan in disbursed_loans:
            repayments = db.query(Repayment).filter_by(loan_id=loan.id).all()
            assert len(repayments) == loan.tenure_months

        # Validate integrity
        val = DataIntegrityValidator.validate_database_integrity(db)
        assert val["is_valid"] is True
        assert val["checks_passed"] == 5
        assert len(val["errors"]) == 0
    finally:
        db.close()
