from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.session import Base

class LoanOffer(Base):
    __tablename__ = "loan_offers"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("loan_applications.id", ondelete="CASCADE"), nullable=False, index=True)
    offered_amount = Column(Float, nullable=False)
    offered_tenure_months = Column(Integer, nullable=False)
    illustrative_annual_interest_rate = Column(Float, nullable=False) # e.g. 14.5%
    processing_fee = Column(Float, default=1000.0)
    offer_status = Column(String(50), default="Pending", index=True) # Pending, Accepted, Rejected, Expired
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    application = relationship("LoanApplication", back_populates="offers")

class Loan(Base):
    __tablename__ = "loans"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("loan_applications.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    principal_amount = Column(Float, nullable=False)
    annual_interest_rate = Column(Float, nullable=False) # e.g. 14.5
    tenure_months = Column(Integer, nullable=False)
    monthly_emi = Column(Float, nullable=False)
    disbursal_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    loan_status = Column(String(50), default="Active", index=True) # Active, Closed, Delinquent_30, Delinquent_60, Defaulted
    outstanding_principal = Column(Float, nullable=False)

    application = relationship("LoanApplication", back_populates="loan")
    customer = relationship("Customer", back_populates="loans")
    repayments = relationship("Repayment", back_populates="loan", cascade="all, delete-orphan", order_by="Repayment.installment_number")

    __table_args__ = (
        Index("ix_loan_status_disbursal", "loan_status", "disbursal_date"),
    )
