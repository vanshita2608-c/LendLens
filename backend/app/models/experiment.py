from sqlalchemy import Column, Integer, String, Text, Float, DateTime
from datetime import datetime, timezone
from app.db.session import Base

class Experiment(Base):
    __tablename__ = "experiments"

    id = Column(Integer, primary_key=True, index=True)
    experiment_name = Column(String(150), nullable=False, index=True)
    problem_statement = Column(Text, nullable=False)
    hypothesis = Column(Text, nullable=False)
    target_segment = Column(String(100), nullable=False)
    primary_metric = Column(String(100), nullable=False)
    guardrail_metrics = Column(Text, nullable=True) # JSON or comma-separated list
    
    # RICE Prioritization framework
    reach_score = Column(Float, default=500.0)
    impact_score = Column(Float, default=3.0) # 1 - 5
    confidence_score = Column(Float, default=80.0) # 0 - 100%
    effort_score = Column(Float, default=2.0) # 1 - 5 person-weeks
    rice_priority_score = Column(Float, index=True, default=0.0) # (R * I * C%) / E

    control_definition = Column(Text, nullable=True)
    treatment_definition = Column(Text, nullable=True)
    sample_size_control = Column(Integer, default=0)
    sample_size_treatment = Column(Integer, default=0)
    control_conversion_rate = Column(Float, default=0.0)
    treatment_conversion_rate = Column(Float, default=0.0)
    observed_lift_pct = Column(Float, default=0.0)
    p_value = Column(Float, nullable=True)

    experiment_status = Column(String(50), default="Planned", index=True) # Draft, Planned, Running, Completed, Paused
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    owner = Column(String(100), default="Product Team")
    decision_learnings = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
