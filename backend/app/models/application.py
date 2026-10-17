from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.session import Base

class LoanApplication(Base):
    __tablename__ = "loan_applications"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    application_reference = Column(String(50), unique=True, index=True, nullable=False)
    requested_amount = Column(Float, nullable=False)
    requested_tenure_months = Column(Integer, nullable=False)
    acquisition_channel = Column(String(50), index=True, nullable=False) # Organic, Paid Search, Aggregators, Partner Referral, Direct Mail
    application_status = Column(String(50), index=True, nullable=False) # Started, Details Submitted, KYC Completed, Approved, Rejected, Abandoned, Disbursed
    drop_off_stage = Column(String(50), nullable=True) # e.g. kyc, offer_acceptance
    drop_off_reason = Column(String(100), nullable=True) # e.g. ID verification friction, high interest rate, session timeout
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    customer = relationship("Customer", back_populates="applications")
    events = relationship("ApplicationEvent", back_populates="application", cascade="all, delete-orphan", order_by="ApplicationEvent.event_timestamp")
    credit_assessment = relationship("CreditAssessment", back_populates="application", uselist=False, cascade="all, delete-orphan")
    offers = relationship("LoanOffer", back_populates="application", cascade="all, delete-orphan")
    loan = relationship("Loan", back_populates="application", uselist=False)

    __table_args__ = (
        Index("ix_app_channel_status", "acquisition_channel", "application_status"),
        Index("ix_app_created_status", "created_at", "application_status"),
    )
