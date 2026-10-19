from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ExperimentCreate(BaseModel):
    experiment_name: str = Field(..., min_length=3, max_length=150)
    problem_statement: str
    hypothesis: str
    target_segment: str = Field("All", description="Salaried, Self-Employed, Gig Worker, or All")
    primary_metric: str = Field("Conversion Rate (%)")
    guardrail_metrics: Optional[str] = "First Payment Default < 2.0%, Verification TAT < 5m"

    # RICE scoring inputs
    reach_score: float = Field(1000.0, ge=1.0, description="Estimated monthly affected applicants")
    impact_score: float = Field(3.0, ge=1.0, le=5.0, description="1 (Minimal) to 5 (Massive)")
    confidence_score: float = Field(80.0, ge=10.0, le=100.0, description="Confidence in evidence %")
    effort_score: float = Field(2.0, ge=0.5, le=12.0, description="Engineering/Product effort in person-weeks")

    control_definition: Optional[str] = "Standard existing journey"
    treatment_definition: Optional[str] = "New optimized journey variant"
    experiment_status: Optional[str] = "Planned"
    owner: Optional[str] = "Associate Product Manager"

class ExperimentUpdate(BaseModel):
    experiment_name: Optional[str] = None
    problem_statement: Optional[str] = None
    hypothesis: Optional[str] = None
    target_segment: Optional[str] = None
    primary_metric: Optional[str] = None
    guardrail_metrics: Optional[str] = None

    reach_score: Optional[float] = None
    impact_score: Optional[float] = None
    confidence_score: Optional[float] = None
    effort_score: Optional[float] = None

    control_definition: Optional[str] = None
    treatment_definition: Optional[str] = None
    sample_size_control: Optional[int] = None
    sample_size_treatment: Optional[int] = None
    control_conversion_rate: Optional[float] = None
    treatment_conversion_rate: Optional[float] = None
    observed_lift_pct: Optional[float] = None
    p_value: Optional[float] = None

    experiment_status: Optional[str] = None
    owner: Optional[str] = None
    decision_learnings: Optional[str] = None

class ExperimentResponse(BaseModel):
    id: int
    experiment_name: str
    problem_statement: str
    hypothesis: str
    target_segment: str
    primary_metric: str
    guardrail_metrics: Optional[str]

    reach_score: float
    impact_score: float
    confidence_score: float
    effort_score: float
    rice_priority_score: float

    control_definition: Optional[str]
    treatment_definition: Optional[str]
    sample_size_control: int
    sample_size_treatment: int
    control_conversion_rate: float
    treatment_conversion_rate: float
    observed_lift_pct: float
    p_value: Optional[float]

    experiment_status: str
    owner: str
    decision_learnings: Optional[str]
    created_at: str
