import json
import math
import random
from typing import Dict, Any, Tuple
from datetime import datetime

class CreditAndLoanGenerator:
    """
    Simulates credit risk assessment, risk-based pricing, loan offers,
    and loan creation with exact financial EMI calculations.
    """
    def __init__(self, seed: int = 42):
        self.seed = seed
        self.rng = random.Random(seed)

    @staticmethod
    def calculate_monthly_emi(principal: float, annual_rate_pct: float, tenure_months: int) -> float:
        """
        Calculates monthly reducing balance Equated Monthly Installment (EMI).
        Formula: EMI = [P * r * (1+r)^n] / [(1+r)^n - 1]
        """
        if principal <= 0 or tenure_months <= 0:
            return 0.0
        if annual_rate_pct <= 0:
            return round(principal / tenure_months, 2)
            
        monthly_rate = (annual_rate_pct / 100.0) / 12.0
        factor = math.pow(1.0 + monthly_rate, tenure_months)
        emi = principal * monthly_rate * factor / (factor - 1.0)
        return round(emi, 2)

    def assess_credit_risk(
        self, 
        customer: Dict[str, Any], 
        application: Dict[str, Any],
        assessment_time: datetime
    ) -> Dict[str, Any]:
        """
        Calculates a realistic Probability of Default (PD) proxy based on:
        Bureau credit score, Debt-To-Income (DTI), Income stability, and Loan-to-Income ratio.
        """
        score = customer.get("credit_score", 0)
        dti = customer.get("debt_to_income_ratio", 0.3)
        income = customer.get("monthly_income", 50000.0)
        requested_amount = application.get("requested_amount", 100000.0)

        # Base log-odds default model
        # Higher score -> lower default
        # Higher DTI -> higher default
        # Higher loan-to-annual-income -> higher default
        lti = requested_amount / (income * 12.0)
        
        # Calibration logit:
        score_val = score if score > 0 else 610 # imputed for new-to-credit
        z = -2.2 - (score_val - 680) * 0.009 + (dti - 0.3) * 3.5 + (lti - 0.4) * 1.8
        
        # Add slight natural variance
        z += self.rng.gauss(0, 0.15)
        
        # Logistic sigmoid
        pd = 1.0 / (1.0 + math.exp(-z))
        pd = max(0.012, min(pd, 0.48)) # Bound between 1.2% and 48%

        if pd < 0.045:
            tier = "Low"
            decision = "Approve"
        elif pd < 0.11:
            tier = "Medium"
            decision = "Approve"
        elif pd < 0.20:
            tier = "High"
            decision = "Manual Review" if score >= 640 else "Reject"
        else:
            tier = "Extreme"
            decision = "Reject"

        # Explainability feature contributions
        contributions = {
            "credit_score_impact": round(-(score_val - 680) * 0.009, 4),
            "debt_to_income_impact": round((dti - 0.3) * 3.5, 4),
            "loan_to_income_impact": round((lti - 0.4) * 1.8, 4),
            "segment_baseline": customer.get("customer_segment", "Salaried")
        }

        return {
            "model_version": "v1.0.0-rf",
            "predicted_probability_of_default": round(pd, 4),
            "risk_tier": tier,
            "underwriting_decision": decision,
            "feature_contributions_json": json.dumps(contributions),
            "assessment_timestamp": assessment_time
        }

    def generate_loan_offer_and_loan(
        self,
        application_id: int,
        customer_id: int,
        requested_amount: float,
        requested_tenure: int,
        pd: float,
        offer_time: datetime,
        disbursal_time: datetime,
        is_disbursed: bool
    ) -> Tuple[Dict[str, Any], Dict[str, Any] | None]:
        """
        Creates loan offer with risk-based pricing, and if disbursed, creates active Loan record.
        """
        # Risk-based pricing: Base 10.5% + risk spread (e.g. 5x - 20x PD)
        rate = 10.5 + (pd * 35.0)
        rate = round(min(26.0, max(11.0, rate)), 2)

        # High risk may receive slightly pruned amount
        offered_amount = requested_amount
        if pd > 0.12:
            offered_amount = round(requested_amount * 0.85, -3)

        processing_fee = round(offered_amount * 0.02, 2)
        offer_status = "Accepted" if is_disbursed else "Rejected"

        offer = {
            "application_id": application_id,
            "offered_amount": float(offered_amount),
            "offered_tenure_months": requested_tenure,
            "illustrative_annual_interest_rate": rate,
            "processing_fee": processing_fee,
            "offer_status": offer_status,
            "created_at": offer_time
        }

        loan = None
        if is_disbursed:
            emi = self.calculate_monthly_emi(offered_amount, rate, requested_tenure)
            loan = {
                "application_id": application_id,
                "customer_id": customer_id,
                "principal_amount": float(offered_amount),
                "annual_interest_rate": rate,
                "tenure_months": requested_tenure,
                "monthly_emi": emi,
                "disbursal_date": disbursal_time,
                "loan_status": "Active",
                "outstanding_principal": float(offered_amount)
            }

        return offer, loan
