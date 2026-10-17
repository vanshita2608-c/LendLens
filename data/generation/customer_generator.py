import numpy as np
import random
from typing import List, Dict, Any
from datetime import datetime, timedelta, timezone

class CustomerGenerator:
    """
    Generates synthetic borrower profiles with realistic distributions
    for credit score, monthly income, employment category, and debt-to-income.
    Uses localized RandomState for 100% reproducible isolation.
    """
    def __init__(self, seed: int = 42):
        self.seed = seed
        self.rng = random.Random(seed)
        self.np_rng = np.random.RandomState(seed)
        
        self.segments = ["Salaried", "Self-Employed", "New-to-Credit", "Gig Worker"]
        self.segment_weights = [0.45, 0.30, 0.15, 0.10]
        
        self.employment_by_segment = {
            "Salaried": ["IT & Tech", "Banking & Finance", "Healthcare", "Education", "Manufacturing", "Retail Operations"],
            "Self-Employed": ["Retail Trade", "Consulting", "Contractor", "E-commerce Merchant", "Transport & Logistics"],
            "New-to-Credit": ["Junior Associate", "Entry-level Sales", "Customer Support", "Freelance Creative"],
            "Gig Worker": ["Rideshare Driver", "Delivery Fleet", "Platform Tasker", "Food Delivery"]
        }

    def generate_customer(self, index: int, base_time: datetime) -> Dict[str, Any]:
        segment = self.rng.choices(self.segments, weights=self.segment_weights)[0]
        employment = self.rng.choice(self.employment_by_segment[segment])
        
        # Segment-specific income and credit score logic
        if segment == "Salaried":
            monthly_income = float(self.np_rng.lognormal(mean=11.1, sigma=0.5))
            monthly_income = max(25000.0, min(monthly_income, 350000.0))
            credit_score = int(self.np_rng.normal(loc=725, scale=45))
            dti = float(self.np_rng.uniform(0.15, 0.45))
        elif segment == "Self-Employed":
            monthly_income = float(self.np_rng.lognormal(mean=11.3, sigma=0.7))
            monthly_income = max(30000.0, min(monthly_income, 500000.0))
            credit_score = int(self.np_rng.normal(loc=695, scale=55))
            dti = float(self.np_rng.uniform(0.20, 0.55))
        elif segment == "New-to-Credit":
            monthly_income = float(self.np_rng.uniform(20000.0, 55000.0))
            has_bureau = self.rng.random() > 0.4
            credit_score = int(self.np_rng.normal(loc=630, scale=35)) if has_bureau else 0
            dti = float(self.np_rng.uniform(0.10, 0.35))
        else: # Gig Worker
            monthly_income = float(self.np_rng.uniform(18000.0, 65000.0))
            credit_score = int(self.np_rng.normal(loc=660, scale=40))
            dti = float(self.np_rng.uniform(0.20, 0.60))
            
        credit_score = max(300, min(credit_score, 850)) if credit_score > 0 else 0
        
        # Categorize income band
        if monthly_income < 30000:
            income_band = "<30k"
        elif monthly_income <= 60000:
            income_band = "30k-60k"
        elif monthly_income <= 120000:
            income_band = "60k-120k"
        else:
            income_band = ">120k"
            
        return {
            "customer_reference": f"CUST-{index:06d}",
            "customer_segment": segment,
            "income_band": income_band,
            "monthly_income": round(monthly_income, 2),
            "employment_category": employment,
            "credit_score": credit_score,
            "debt_to_income_ratio": round(dti, 4),
            "created_at": base_time
        }

    def generate_batch(self, count: int, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        total_seconds = int((end_date - start_date).total_seconds())
        customers = []
        for i in range(1, count + 1):
            random_offset = self.rng.randint(0, total_seconds)
            created_at = start_date + timedelta(seconds=random_offset)
            customers.append(self.generate_customer(i, created_at))
        return customers
