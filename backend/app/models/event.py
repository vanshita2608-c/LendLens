from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.session import Base

class ApplicationEvent(Base):
    __tablename__ = "application_events"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("loan_applications.id", ondelete="CASCADE"), nullable=False, index=True)
    stage_name = Column(String(50), index=True, nullable=False) # e.g. APPLICATION_STARTED, DETAILS_SUBMITTED, KYC_COMPLETED, CREDIT_ASSESSED, LOAN_APPROVED, OFFER_ACCEPTED, LOAN_DISBURSED, APPLICATION_ABANDONED
    event_timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True, nullable=False)
    duration_seconds_from_prev = Column(Integer, nullable=True) # Elapsed seconds from prior stage
    event_metadata_json = Column(Text, nullable=True) # JSON details, client device, failure codes

    application = relationship("LoanApplication", back_populates="events")

    __table_args__ = (
        Index("ix_event_app_stage", "application_id", "stage_name"),
        Index("ix_event_stage_time", "stage_name", "event_timestamp"),
    )
