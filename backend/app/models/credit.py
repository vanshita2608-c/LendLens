from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.session import Base

class CreditAssessment(Base):
    __tablename__ = "credit_assessments"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("loan_applications.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    model_version = Column(String(50), nullable=False, default="v1.0.0-rf")
    predicted_probability_of_default = Column(Float, nullable=False, index=True) # 0.00 to 1.00
    risk_tier = Column(String(50), index=True, nullable=False) # Low, Medium, High, Extreme
    underwriting_decision = Column(String(50), index=True, nullable=False) # Approve, Reject, Manual Review
    feature_contributions_json = Column(Text, nullable=True) # JSON of SHAP / key driver weights
    assessment_timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    application = relationship("LoanApplication", back_populates="credit_assessment")
