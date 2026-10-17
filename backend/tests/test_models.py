import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.session import Base
from app.models import Customer, LoanApplication, ApplicationEvent, CreditAssessment, LoanOffer, Loan, Repayment, Scenario, Experiment

TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture
def db_session():
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)

def test_models_creation_and_relationships(db_session):
    # Create customer
    customer = Customer(
        customer_reference="CUST-TEST-001",
        customer_segment="Salaried",
        income_band="50k-100k",
        monthly_income=75000.0,
        employment_category="Software Engineering",
        credit_score=760,
        debt_to_income_ratio=0.28
    )
    db_session.add(customer)
    db_session.commit()
    assert customer.id is not None

    # Create application
    application = LoanApplication(
        customer_id=customer.id,
        application_reference="APP-TEST-001",
        requested_amount=300000.0,
        requested_tenure_months=24,
        acquisition_channel="Organic",
        application_status="Disbursed"
    )
    db_session.add(application)
    db_session.commit()
    assert application.id is not None

    # Create application event
    event = ApplicationEvent(
        application_id=application.id,
        stage_name="APPLICATION_STARTED",
        duration_seconds_from_prev=0
    )
    db_session.add(event)

    # Create credit assessment
    credit = CreditAssessment(
        application_id=application.id,
        model_version="v1.0.0-rf",
        predicted_probability_of_default=0.035,
        risk_tier="Low",
        underwriting_decision="Approve"
    )
    db_session.add(credit)

    # Create loan offer
    offer = LoanOffer(
        application_id=application.id,
        offered_amount=300000.0,
        offered_tenure_months=24,
        illustrative_annual_interest_rate=13.5,
        offer_status="Accepted"
    )
    db_session.add(offer)

    # Create loan
    loan = Loan(
        application_id=application.id,
        customer_id=customer.id,
        principal_amount=300000.0,
        annual_interest_rate=13.5,
        tenure_months=24,
        monthly_emi=14332.0,
        loan_status="Active",
        outstanding_principal=300000.0
    )
    db_session.add(loan)
    db_session.commit()

    # Create repayment
    repayment = Repayment(
        loan_id=loan.id,
        installment_number=1,
        due_date=customer.created_at,
        amount_due=14332.0,
        amount_paid=14332.0,
        principal_component=10957.0,
        interest_component=3375.0,
        days_past_due=0,
        repayment_status="Paid_On_Time"
    )
    db_session.add(repayment)

    # Create scenario
    scenario = Scenario(
        scenario_name="Test Funnel Uplift",
        scenario_type="funnel_improvement",
        assumptions_json="{}",
        calculated_results_json="{}"
    )
    db_session.add(scenario)

    # Create experiment
    experiment = Experiment(
        experiment_name="KYC Form Simplification",
        problem_statement="Dropoff at KYC is high",
        hypothesis="Removing redundant fields will improve KYC rate",
        target_segment="Salaried",
        primary_metric="kyc_conversion_rate"
    )
    db_session.add(experiment)

    db_session.commit()

    # Query back and verify relationships
    cust = db_session.query(Customer).filter_by(customer_reference="CUST-TEST-001").first()
    assert len(cust.applications) == 1
    assert cust.applications[0].application_reference == "APP-TEST-001"
    assert cust.applications[0].credit_assessment.risk_tier == "Low"
    assert len(cust.loans) == 1
    assert len(cust.loans[0].repayments) == 1
    assert cust.loans[0].repayments[0].repayment_status == "Paid_On_Time"
