import pandas as pd
import numpy as np
from typing import Tuple, List, Dict, Any
from sqlalchemy.orm import Session
from app.models import Customer, LoanApplication, Loan, CreditAssessment
from data.generation.credit_and_loan_generator import CreditAndLoanGenerator

class CreditFeaturePipeline:
    """
    Prepares training features for credit-risk default prediction.
    Strictly enforces zero target leakage and temporal out-of-time (OOT) train/test splitting.
    """
    FEATURE_COLUMNS = [
        "monthly_income",
        "credit_score",
        "debt_to_income_ratio",
        "requested_amount",
        "requested_tenure_months",
        "loan_to_income_ratio",
        "estimated_emi_to_income_ratio",
        "is_salaried",
        "is_self_employed",
        "is_new_to_credit",
        "is_gig_worker",
        "channel_organic",
        "channel_paid_search",
        "channel_aggregators",
        "channel_partner_referral"
    ]

    @classmethod
    def extract_dataset_from_db(cls, db: Session) -> pd.DataFrame:
        """
        Extracts historical credit applicants with known loan outcomes.
        Target: Defaulted (1) vs Non-Defaulted (0).
        Applications without loans (or not matured) are assigned simulated ground-truth targets
        based on risk factors to avoid survivorship bias.
        """
        records = db.query(
            LoanApplication.id.label("application_id"),
            LoanApplication.created_at,
            LoanApplication.requested_amount,
            LoanApplication.requested_tenure_months,
            LoanApplication.acquisition_channel,
            LoanApplication.application_status,
            Customer.monthly_income,
            Customer.credit_score,
            Customer.debt_to_income_ratio,
            Customer.customer_segment,
            Loan.loan_status,
            CreditAssessment.predicted_probability_of_default
        ).join(Customer, LoanApplication.customer_id == Customer.id)\
         .outerjoin(Loan, LoanApplication.id == Loan.application_id)\
         .outerjoin(CreditAssessment, LoanApplication.id == CreditAssessment.application_id)\
         .all()

        rows = []
        for r in records:
            # Calculate application-time feature engineered variables
            annual_income = r.monthly_income * 12.0
            lti = r.requested_amount / annual_income if annual_income > 0 else 1.0
            
            # Estimated monthly EMI assuming benchmark rate
            emi = CreditAndLoanGenerator.calculate_monthly_emi(
                principal=r.requested_amount,
                annual_rate_pct=14.0,
                tenure_months=r.requested_tenure_months
            )
            emi_to_income = (emi / r.monthly_income) if r.monthly_income > 0 else 1.0

            # Target definition:
            # If loan was disbursed and defaulted -> 1
            # If loan was disbursed and active/closed without default -> 0
            # If not disbursed, derive target from latent credit profile (to preserve unbiased sample)
            if r.loan_status == "Defaulted" or r.loan_status == "Delinquent_60":
                target = 1
            elif r.loan_status in ["Active", "Closed"]:
                target = 0
            else:
                # Latent default outcome proxy based on risk PD
                pd_val = r.predicted_probability_of_default or 0.10
                target = 1 if pd_val > 0.18 else 0

            rows.append({
                "application_id": r.application_id,
                "created_at": r.created_at,
                "monthly_income": float(r.monthly_income),
                "credit_score": float(r.credit_score if r.credit_score > 0 else 610), # Impute blank bureau
                "debt_to_income_ratio": float(r.debt_to_income_ratio),
                "requested_amount": float(r.requested_amount),
                "requested_tenure_months": int(r.requested_tenure_months),
                "loan_to_income_ratio": float(lti),
                "estimated_emi_to_income_ratio": float(emi_to_income),
                "is_salaried": 1 if r.customer_segment == "Salaried" else 0,
                "is_self_employed": 1 if r.customer_segment == "Self-Employed" else 0,
                "is_new_to_credit": 1 if r.customer_segment == "New-to-Credit" else 0,
                "is_gig_worker": 1 if r.customer_segment == "Gig Worker" else 0,
                "channel_organic": 1 if r.acquisition_channel == "Organic" else 0,
                "channel_paid_search": 1 if r.acquisition_channel == "Paid Search" else 0,
                "channel_aggregators": 1 if r.acquisition_channel == "Aggregators" else 0,
                "channel_partner_referral": 1 if r.acquisition_channel == "Partner Referral" else 0,
                "target_default": target
            })

        df = pd.DataFrame(rows)
        # Sort chronologically by created_at for temporal split
        df = df.sort_values(by="created_at").reset_index(drop=True)
        return df

    @classmethod
    def temporal_train_test_split(
        cls, 
        df: pd.DataFrame, 
        train_ratio: float = 0.75
    ) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
        """
        Splits dataset chronologically into In-Time Training and Out-of-Time Testing sets.
        Prevents data leakage from future events into the past.
        """
        split_idx = int(len(df) * train_ratio)
        train_df = df.iloc[:split_idx]
        test_df = df.iloc[split_idx:]

        X_train = train_df[cls.FEATURE_COLUMNS]
        y_train = train_df["target_default"]

        X_test = test_df[cls.FEATURE_COLUMNS]
        y_test = test_df["target_default"]

        return X_train, X_test, y_train, y_test
