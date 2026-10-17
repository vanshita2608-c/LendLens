from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime, timezone
from app.db.session import Base

class Scenario(Base):
    __tablename__ = "scenarios"

    id = Column(Integer, primary_key=True, index=True)
    scenario_name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    scenario_type = Column(String(50), nullable=False, index=True) # funnel_improvement, risk_sensitivity, tat_optimization, channel_mix
    assumptions_json = Column(Text, nullable=False) # JSON encoded assumption parameters
    calculated_results_json = Column(Text, nullable=False) # JSON encoded outputs
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class StrategyComparison(Base):
    __tablename__ = "strategy_comparisons"

    id = Column(Integer, primary_key=True, index=True)
    comparison_name = Column(String(100), nullable=False)
    scenario_ids_json = Column(Text, nullable=False) # JSON array of scenario IDs
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
