from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from datetime import datetime

class SimulateRequest(BaseModel):
    scenario_type: str = Field(..., description="funnel_improvement, risk_cutoff, tat_optimization, or channel_mix")
    
    # Funnel Uplift fields
    target_stage: Optional[str] = Field("KYC Completed", description="Target funnel stage to improve")
    relative_uplift_pct: Optional[float] = Field(15.0, description="Percentage conversion uplift")
    implementation_cost_inr: Optional[float] = Field(250000.0, description="Fixed project cost in INR")
    operational_capacity_limit: Optional[int] = Field(None, description="Max applications that can be handled")
    target_segment: Optional[str] = Field(None, description="Optional customer segment filter")

    # Risk Cutoff fields
    new_pd_threshold: Optional[float] = Field(0.18, description="Maximum Probability of Default threshold")

    # TAT fields
    tat_reduction_hours: Optional[float] = Field(6.0, description="Processing time reduction in hours")
    assumed_elasticity_uplift_pct: Optional[float] = Field(5.0, description="Hypothetical conversion uplift")

    # Channel mix fields
    channel_share_shifts: Optional[Dict[str, float]] = Field(None, description="Channel volume percentage adjustments")
    channel_cacs: Optional[Dict[str, float]] = Field(None, description="Customer acquisition costs per channel")

    # Financial underwriting parameters
    borrowing_rate_pct: Optional[float] = Field(7.5, description="Institutional cost of capital / funding rate %")
    loss_given_default_pct: Optional[float] = Field(65.0, description="LGD percentage assumption")

class ScenarioCreate(BaseModel):
    scenario_name: str = Field(..., max_length=100)
    description: Optional[str] = None
    scenario_type: str = Field(..., description="funnel_improvement, risk_cutoff, tat_optimization, or channel_mix")
    assumptions: Dict[str, Any]

class ScenarioUpdate(BaseModel):
    scenario_name: Optional[str] = None
    description: Optional[str] = None
    assumptions: Optional[Dict[str, Any]] = None

class ScenarioResponse(BaseModel):
    id: int
    scenario_name: str
    description: Optional[str]
    scenario_type: str
    assumptions: Dict[str, Any]
    calculated_results: Dict[str, Any]
    created_at: str
    updated_at: str

class ScenarioCompareRequest(BaseModel):
    scenario_ids: List[int]

class ScenarioCompareResponse(BaseModel):
    scenarios: List[ScenarioResponse]
    comparison_summary: List[Dict[str, Any]]
