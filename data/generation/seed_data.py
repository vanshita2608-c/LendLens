import argparse
import json
import logging
from datetime import datetime, timezone, timedelta
from app.db.session import engine, SessionLocal, Base
from app.models import (
    Customer,
    LoanApplication,
    ApplicationEvent,
    CreditAssessment,
    LoanOffer,
    Loan,
    Repayment,
    Scenario,
    Experiment,
)
from data.generation.customer_generator import CustomerGenerator
from data.generation.application_generator import ApplicationGenerator
from data.generation.event_generator import EventGenerator
from data.generation.credit_and_loan_generator import CreditAndLoanGenerator
from data.generation.repayment_generator import RepaymentGenerator
from data.generation.integrity_validator import DataIntegrityValidator

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("seed_data")

def seed_database(num_customers: int = 10000, seed: int = 42, reset: bool = True):
    logger.info(f"Starting database seed: {num_customers} customers, seed={seed}, reset={reset}")
    
    if reset:
        logger.info("Dropping existing tables and recreating schema...")
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Time window: past 12 months up to current date (offset-naive UTC for DB cross-compatibility)
        as_of_date = datetime(2026, 10, 1, 0, 0)
        start_date = as_of_date - timedelta(days=365)

        cust_gen = CustomerGenerator(seed=seed)
        app_gen = ApplicationGenerator(seed=seed)
        event_gen = EventGenerator(seed=seed)
        credit_gen = CreditAndLoanGenerator(seed=seed)
        repay_gen = RepaymentGenerator(seed=seed)

        logger.info(f"Generating {num_customers} synthetic customer records...")
        raw_customers = cust_gen.generate_batch(num_customers, start_date, as_of_date - timedelta(days=15))
        
        # Batch insert customers
        customer_objs = [Customer(**c) for c in raw_customers]
        db.bulk_save_objects(customer_objs, return_defaults=True)
        db.commit()
        logger.info(f"Successfully inserted {len(customer_objs)} customers.")

        # Reload customers with IDs
        customers = db.query(Customer).order_by(Customer.id).all()
        
        logger.info("Simulating application funnels, credit assessments, offers, loans, and repayments...")
        
        applications_to_insert = []
        events_to_insert = []
        credits_to_insert = []
        offers_to_insert = []
        loans_to_insert = []
        repayments_to_insert = []

        app_idx = 1
        for cust in customers:
            # 1 customer -> 1 application for clear cohort tracking
            cust_dict = {
                "customer_segment": cust.customer_segment,
                "monthly_income": cust.monthly_income,
                "created_at": cust.created_at,
                "credit_score": cust.credit_score,
                "debt_to_income_ratio": cust.debt_to_income_ratio
            }
            app_raw = app_gen.generate_application_for_customer(app_idx, cust.id, cust_dict)
            
            # Simulate Funnel Journey
            events, final_status, drop_stage, drop_reason = event_gen.simulate_application_journey(
                application_id=app_idx,
                start_time=app_raw["created_at"],
                channel=app_raw["acquisition_channel"],
                credit_score=cust.credit_score,
                dti=cust.debt_to_income_ratio
            )
            
            app_raw["application_status"] = final_status
            app_raw["drop_off_stage"] = drop_stage
            app_raw["drop_off_reason"] = drop_reason
            app_raw["updated_at"] = events[-1]["event_timestamp"] if events else app_raw["created_at"]
            
            applications_to_insert.append(LoanApplication(**app_raw))
            for ev in events:
                events_to_insert.append(ApplicationEvent(**ev))

            # Did application reach credit assessment stage?
            has_credit_event = any(e["stage_name"] == "CREDIT_ASSESSED" for e in events)
            if has_credit_event:
                credit_time = next(e["event_timestamp"] for e in events if e["stage_name"] == "CREDIT_ASSESSED")
                credit_raw = credit_gen.assess_credit_risk(cust_dict, app_raw, credit_time)
                credit_raw["application_id"] = app_idx
                credits_to_insert.append(CreditAssessment(**credit_raw))

                # Did it reach approved stage or offer?
                has_offer_event = any(e["stage_name"] == "OFFER_ACCEPTED" for e in events)
                is_disbursed = (final_status == "Disbursed")
                
                if has_offer_event or is_disbursed:
                    offer_time = next(e["event_timestamp"] for e in events if e["stage_name"] in ["LOAN_APPROVED", "OFFER_ACCEPTED"])
                    disbursal_time = next((e["event_timestamp"] for e in events if e["stage_name"] == "LOAN_DISBURSED"), offer_time + timedelta(hours=2))
                    
                    offer_raw, loan_raw = credit_gen.generate_loan_offer_and_loan(
                        application_id=app_idx,
                        customer_id=cust.id,
                        requested_amount=app_raw["requested_amount"],
                        requested_tenure=app_raw["requested_tenure_months"],
                        pd=credit_raw["predicted_probability_of_default"],
                        offer_time=offer_time,
                        disbursal_time=disbursal_time,
                        is_disbursed=is_disbursed
                    )
                    offers_to_insert.append(LoanOffer(**offer_raw))

                    if loan_raw:
                        loan_raw["id"] = len(loans_to_insert) + 1
                        
                        # Generate Repayments for disbursed loan
                        loan_repayments, loan_status, outstanding = repay_gen.generate_loan_repayments(
                            loan_id=loan_raw["id"],
                            principal=loan_raw["principal_amount"],
                            annual_rate_pct=loan_raw["annual_interest_rate"],
                            tenure_months=loan_raw["tenure_months"],
                            monthly_emi=loan_raw["monthly_emi"],
                            disbursal_date=disbursal_time,
                            as_of_date=as_of_date,
                            customer_pd=credit_raw["predicted_probability_of_default"]
                        )
                        loan_raw["loan_status"] = loan_status
                        loan_raw["outstanding_principal"] = outstanding
                        loans_to_insert.append(Loan(**loan_raw))

                        for rep in loan_repayments:
                            repayments_to_insert.append(Repayment(**rep))

            app_idx += 1

        logger.info(f"Persisting {len(applications_to_insert)} applications, {len(events_to_insert)} events...")
        db.bulk_save_objects(applications_to_insert)
        db.commit()

        logger.info(f"Persisting {len(events_to_insert)} events...")
        db.bulk_save_objects(events_to_insert)
        db.commit()

        logger.info(f"Persisting {len(credits_to_insert)} credit assessments...")
        db.bulk_save_objects(credits_to_insert)
        db.commit()

        logger.info(f"Persisting {len(offers_to_insert)} offers, {len(loans_to_insert)} loans...")
        db.bulk_save_objects(offers_to_insert)
        db.bulk_save_objects(loans_to_insert)
        db.commit()

        logger.info(f"Persisting {len(repayments_to_insert)} repayments...")
        # Chunk repayments insert for SQLite efficiency
        chunk_size = 5000
        for i in range(0, len(repayments_to_insert), chunk_size):
            db.bulk_save_objects(repayments_to_insert[i:i + chunk_size])
            db.commit()

        # Seed sample baseline Scenarios
        logger.info("Seeding baseline Scenarios and Experiments...")
        seed_sample_scenarios_and_experiments(db)

        # Run integrity validation
        logger.info("Running Data Integrity Validator...")
        val_results = DataIntegrityValidator.validate_database_integrity(db)
        if val_results["is_valid"]:
            logger.info(f"Data Integrity Check PASSED! All {val_results['checks_passed']} checks verified.")
        else:
            logger.error(f"Data Integrity Check FAILED: {val_results['errors']}")
            raise ValueError(f"Integrity check failed: {val_results['errors']}")

        logger.info("Database seeding successfully completed!")

    finally:
        db.close()

def seed_sample_scenarios_and_experiments(db):
    """Seeds realistic default scenarios and product experiments."""
    scenario_1 = Scenario(
        scenario_name="KYC Drop-off Reduction (Instant Digilocker)",
        description="Simulates simplifying document upload with instant 1-click DigiLocker integration, targeting +8% KYC conversion.",
        scenario_type="funnel_improvement",
        assumptions_json=json.dumps({
            "target_stage": "KYC_COMPLETED",
            "conversion_uplift_pct": 8.0,
            "target_segment": "All",
            "implementation_cost_inr": 250000.0,
            "operational_cost_per_applicant": 45.0,
            "baseline_conversion_pct": 74.5
        }),
        calculated_results_json=json.dumps({
            "incremental_kyc_completed": 480,
            "incremental_disbursals": 268,
            "incremental_disbursed_principal": 53600000.0,
            "expected_interest_income": 6432000.0,
            "expected_funding_cost": 3752000.0,
            "expected_credit_losses": 1072000.0,
            "net_financial_contribution": 1358000.0,
            "roi_ratio": 5.43
        })
    )
    
    scenario_2 = Scenario(
        scenario_name="Salaried Segment Risk Threshold Expansion",
        description="Relaxing underwriting PD cutoff from 11% to 14% specifically for Salaried borrowers with DTI < 40%.",
        scenario_type="risk_sensitivity",
        assumptions_json=json.dumps({
            "risk_cutoff_pd": 0.14,
            "target_segment": "Salaried",
            "cost_of_funds_pct": 7.5,
            "operating_cost_pct": 2.0,
            "lgd_pct": 45.0
        }),
        calculated_results_json=json.dumps({
            "incremental_approved_volume": 340,
            "incremental_disbursal_amount": 78200000.0,
            "portfolio_ecl_increase": 2111400.0,
            "net_margin_pct": 3.82,
            "incremental_net_contribution": 2987240.0
        })
    )
    db.add(scenario_1)
    db.add(scenario_2)

    exp_1 = Experiment(
        experiment_name="DigiLocker Pre-fill vs Manual Upload",
        problem_statement="KYC completion drops by 24% when users are asked to upload physical Aadhaar PDF.",
        hypothesis="Prefilling identity details from DigiLocker API will increase KYC completion rate by at least 7 percentage points without elevating fraud.",
        target_segment="Salaried",
        primary_metric="kyc_completion_rate",
        guardrail_metrics="fraud_detection_rate, credit_approval_rate",
        reach_score=1800.0,
        impact_score=4.0,
        confidence_score=85.0,
        effort_score=2.0,
        rice_priority_score=3060.0,
        control_definition="Standard file upload for Aadhaar/PAN",
        treatment_definition="1-click DigiLocker OTP consent flow",
        sample_size_control=900,
        sample_size_treatment=900,
        control_conversion_rate=73.8,
        treatment_conversion_rate=81.2,
        observed_lift_pct=10.02,
        p_value=0.0012,
        experiment_status="Running",
        owner="Priya Sharma (Product)"
    )

    exp_2 = Experiment(
        experiment_name="Aggregator Rate Transparency Card",
        problem_statement="High drop-off at Offer Accepted (22%) among Aggregator channel leads due to late fee disclosure.",
        hypothesis="Displaying all-inclusive APR and zero hidden fee badge upfront on the offer card will increase offer acceptance by 5%.",
        target_segment="All",
        primary_metric="offer_acceptance_rate",
        guardrail_metrics="loan_disbursal_rate",
        reach_score=1200.0,
        impact_score=3.0,
        confidence_score=75.0,
        effort_score=1.5,
        rice_priority_score=1800.0,
        control_definition="Standard offer banner with monthly EMI only",
        treatment_definition="Transparent APR badge, breakdown of processing fee & net disbursal",
        sample_size_control=600,
        sample_size_treatment=600,
        control_conversion_rate=77.2,
        treatment_conversion_rate=82.6,
        observed_lift_pct=6.99,
        p_value=0.018,
        experiment_status="Planned",
        owner="Arjun Mehta (Risk/Product)"
    )
    db.add(exp_1)
    db.add(exp_2)
    db.commit()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="LendLens Synthetic Data Generator")
    parser.add_argument("--count", type=int, default=10000, help="Number of customers to generate (default: 10000)")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility (default: 42)")
    parser.add_argument("--no-reset", action="store_true", help="Do not drop existing tables")
    args = parser.parse_args()
    seed_database(num_customers=args.count, seed=args.seed, reset=not args.no_reset)
