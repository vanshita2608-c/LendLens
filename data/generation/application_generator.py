import numpy as np
import random
from typing import List, Dict, Any
from datetime import datetime, timedelta

class ApplicationGenerator:
    """
    Generates loan applications corresponding to synthetic customers,
    incorporating channel distribution, requested ticket sizes, and initial statuses.
    Uses localized RandomState for isolated reproducibility.
    """
    def __init__(self, seed: int = 42):
        self.seed = seed
        self.rng = random.Random(seed)
        self.np_rng = np.random.RandomState(seed)

        self.channels = ["Organic", "Paid Search", "Aggregators", "Partner Referral", "Direct Mail"]
        self.channel_weights = [0.25, 0.30, 0.25, 0.15, 0.05]
        self.tenures = [6, 12, 18, 24, 36, 48, 60]

    def generate_application_for_customer(
        self, 
        app_index: int, 
        customer_id: int, 
        customer_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        income = customer_data["monthly_income"]
        segment = customer_data["customer_segment"]
        created_at = customer_data["created_at"] + timedelta(minutes=self.rng.randint(5, 120))
        channel = self.rng.choices(self.channels, weights=self.channel_weights)[0]

        # Ticket size is realistically bound to income capacity:
        multiplier = float(self.np_rng.uniform(2.5, 8.0))
        requested_amount = round(min(1500000.0, max(25000.0, income * multiplier)), -3)

        # Tenure preference by segment
        if segment in ["Salaried", "Self-Employed"]:
            tenure = self.rng.choice([12, 24, 36, 48])
        else:
            tenure = self.rng.choice([6, 12, 18, 24])

        return {
            "application_reference": f"APP-{app_index:06d}",
            "customer_id": customer_id,
            "requested_amount": float(requested_amount),
            "requested_tenure_months": tenure,
            "acquisition_channel": channel,
            "application_status": "Started",
            "drop_off_stage": None,
            "drop_off_reason": None,
            "created_at": created_at,
            "updated_at": created_at
        }
