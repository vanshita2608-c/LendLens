from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class CreditPredictRequest(BaseModel):
    monthly_income: float = Field(..., gt=0, description="Monthly income in INR")
    credit_score: float = Field(..., ge=300, le=900, description="Bureau credit score (300-900)")
    debt_to_income_ratio: float = Field(..., ge=0.0, le=2.0, description="Existing debt obligations to monthly income")
    requested_amount: float = Field(..., gt=0, description="Loan principal amount in INR")
    requested_tenure_months: int = Field(..., ge=3, le=84, description="Requested tenure in months")
    customer_segment: str = Field("Salaried", description="Salaried, Self-Employed, Gig Worker, or New-to-Credit")
    acquisition_channel: str = Field("Organic", description="Organic, Paid Search, Aggregators, or Partner Referral")

class FeatureImpact(BaseModel):
    feature: str
    raw_value: float
    shap_impact: float
    direction: str

class CreditPredictResponse(BaseModel):
    model_version: str
    predicted_probability_of_default: float
    risk_tier: str
    recommended_action: str
    top_risk_increasing_factors: List[FeatureImpact]
    top_risk_decreasing_factors: List[FeatureImpact]
    all_feature_attributions: List[FeatureImpact]
    disclaimer: str

class ModelMetricsResponse(BaseModel):
    version: str
    training_sample_size: int
    test_sample_size: int
    split_methodology: str
    target_variable: str
    baseline_model: Dict[str, Any]
    champion_model: Dict[str, Any]
    feature_importances: List[Dict[str, Any]]
    decision_threshold_tradeoff: Dict[str, Any]
