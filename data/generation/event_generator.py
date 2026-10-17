import json
import random
from typing import List, Dict, Any, Tuple
from datetime import datetime, timedelta

class EventGenerator:
    """
    Generates realistic sequential funnel events for loan applications,
    tracking timestamps, stage latencies, conversion drops, and drop-off diagnostics.
    """
    STAGES = [
        "APPLICATION_STARTED",
        "DETAILS_SUBMITTED",
        "KYC_COMPLETED",
        "CREDIT_ASSESSED",
        "LOAN_APPROVED",
        "OFFER_ACCEPTED",
        "LOAN_DISBURSED"
    ]

    STAGE_LATENCY_RANGES = {
        "DETAILS_SUBMITTED": (120, 900),     # 2 to 15 mins
        "KYC_COMPLETED": (300, 2700),        # 5 to 45 mins
        "CREDIT_ASSESSED": (60, 600),        # 1 to 10 mins (automated risk engine)
        "LOAN_APPROVED": (120, 1800),        # 2 to 30 mins
        "OFFER_ACCEPTED": (900, 86400),      # 15 mins to 24 hrs
        "LOAN_DISBURSED": (300, 14400),      # 5 mins to 4 hrs
    }

    DROP_OFF_REASONS = {
        "DETAILS_SUBMITTED": [
            "Session timeout during form fill",
            "Complex documentation requirement",
            "Found alternative lender rate",
            "Inadvertent exit"
        ],
        "KYC_COMPLETED": [
            "Aadhaar OTP verification timeout",
            "Liveness check selfie mismatch",
            "Document scan illegible",
            "Customer abandoned verification step"
        ],
        "CREDIT_ASSESSED": [
            "Credit policy rejection: high DTI",
            "Bureau score below underwriting minimum",
            "Negative bureau delinquency remarks"
        ],
        "LOAN_APPROVED": [
            "Offered amount below requirement",
            "Offered interest rate too high",
            "Found better loan offer elsewhere"
        ],
        "OFFER_ACCEPTED": [
            "E-mandate / NACH bank authentication failure",
            "Bank account Penny-drop validation failure",
            "Customer cancelled prior to disbursal"
        ]
    }

    def __init__(self, seed: int = 42):
        self.seed = seed
        self.rng = random.Random(seed)

    def simulate_application_journey(
        self, 
        application_id: int, 
        start_time: datetime,
        channel: str,
        credit_score: int,
        dti: float
    ) -> Tuple[List[Dict[str, Any]], str, str, str]:
        """
        Simulates the full funnel progression for an application.
        Returns: (events_list, final_status, drop_off_stage, drop_off_reason)
        """
        events = []
        current_time = start_time
        
        # 1. APPLICATION_STARTED
        events.append({
            "application_id": application_id,
            "stage_name": "APPLICATION_STARTED",
            "event_timestamp": current_time,
            "duration_seconds_from_prev": 0,
            "event_metadata_json": json.dumps({"channel": channel, "device": "mobile_app"})
        })

        # Stage 1 -> 2: Details Submitted
        # Channel-influenced conversion: Organic & Partner convert better
        p_details = 0.88 if channel in ["Organic", "Partner Referral"] else 0.78
        if self.rng.random() > p_details:
            reason = self.rng.choice(self.DROP_OFF_REASONS["DETAILS_SUBMITTED"])
            return events, "Abandoned", "DETAILS_SUBMITTED", reason

        sec = self.rng.randint(*self.STAGE_LATENCY_RANGES["DETAILS_SUBMITTED"])
        current_time += timedelta(seconds=sec)
        events.append({
            "application_id": application_id,
            "stage_name": "DETAILS_SUBMITTED",
            "event_timestamp": current_time,
            "duration_seconds_from_prev": sec,
            "event_metadata_json": json.dumps({"fields_completed": 12})
        })

        # Stage 2 -> 3: KYC Completed
        p_kyc = 0.76 # KYC is an industry-wide friction point
        if self.rng.random() > p_kyc:
            reason = self.rng.choice(self.DROP_OFF_REASONS["KYC_COMPLETED"])
            return events, "Abandoned", "KYC_COMPLETED", reason

        sec = self.rng.randint(*self.STAGE_LATENCY_RANGES["KYC_COMPLETED"])
        current_time += timedelta(seconds=sec)
        events.append({
            "application_id": application_id,
            "stage_name": "KYC_COMPLETED",
            "event_timestamp": current_time,
            "duration_seconds_from_prev": sec,
            "event_metadata_json": json.dumps({"kyc_mode": "video_kyc_and_digilocker"})
        })

        # Stage 3 -> 4: Credit Assessed
        sec = self.rng.randint(*self.STAGE_LATENCY_RANGES["CREDIT_ASSESSED"])
        current_time += timedelta(seconds=sec)
        events.append({
            "application_id": application_id,
            "stage_name": "CREDIT_ASSESSED",
            "event_timestamp": current_time,
            "duration_seconds_from_prev": sec,
            "event_metadata_json": json.dumps({"risk_engine": "ml_underwriting_v1"})
        })

        # Stage 4 -> 5: Loan Approved (Underwriting cutoff)
        # Low credit score or extreme DTI causes policy rejection
        is_credit_worthy = (credit_score >= 650 and dti <= 0.50) or (credit_score >= 600 and dti <= 0.35) or (credit_score == 0 and dti <= 0.25)
        if not is_credit_worthy or (self.rng.random() < 0.12): # occasional policy decline
            reason = self.rng.choice(self.DROP_OFF_REASONS["CREDIT_ASSESSED"])
            return events, "Rejected", "CREDIT_ASSESSED", reason

        sec = self.rng.randint(*self.STAGE_LATENCY_RANGES["LOAN_APPROVED"])
        current_time += timedelta(seconds=sec)
        events.append({
            "application_id": application_id,
            "stage_name": "LOAN_APPROVED",
            "event_timestamp": current_time,
            "duration_seconds_from_prev": sec,
            "event_metadata_json": json.dumps({"approval_tier": "Standard"})
        })

        # Stage 5 -> 6: Offer Accepted
        p_offer = 0.82
        if self.rng.random() > p_offer:
            reason = self.rng.choice(self.DROP_OFF_REASONS["LOAN_APPROVED"])
            return events, "Abandoned", "OFFER_ACCEPTED", reason

        sec = self.rng.randint(*self.STAGE_LATENCY_RANGES["OFFER_ACCEPTED"])
        current_time += timedelta(seconds=sec)
        events.append({
            "application_id": application_id,
            "stage_name": "OFFER_ACCEPTED",
            "event_timestamp": current_time,
            "duration_seconds_from_prev": sec,
            "event_metadata_json": json.dumps({"terms_accepted": True})
        })

        # Stage 6 -> 7: Loan Disbursed
        p_disbursal = 0.94
        if self.rng.random() > p_disbursal:
            reason = self.rng.choice(self.DROP_OFF_REASONS["OFFER_ACCEPTED"])
            return events, "Abandoned", "LOAN_DISBURSED", reason

        sec = self.rng.randint(*self.STAGE_LATENCY_RANGES["LOAN_DISBURSED"])
        current_time += timedelta(seconds=sec)
        events.append({
            "application_id": application_id,
            "stage_name": "LOAN_DISBURSED",
            "event_timestamp": current_time,
            "duration_seconds_from_prev": sec,
            "event_metadata_json": json.dumps({"disbursal_rail": "IMPS/NEFT"})
        })

        return events, "Disbursed", None, None
