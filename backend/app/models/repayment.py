from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.session import Base

class Repayment(Base):
    __tablename__ = "repayments"

    id = Column(Integer, primary_key=True, index=True)
    loan_id = Column(Integer, ForeignKey("loans.id", ondelete="CASCADE"), nullable=False, index=True)
    installment_number = Column(Integer, nullable=False)
    due_date = Column(DateTime, nullable=False, index=True)
    payment_date = Column(DateTime, nullable=True, index=True)
    amount_due = Column(Float, nullable=False)
    amount_paid = Column(Float, default=0.0)
    principal_component = Column(Float, nullable=False)
    interest_component = Column(Float, nullable=False)
    days_past_due = Column(Integer, default=0, index=True)
    repayment_status = Column(String(50), default="Pending", index=True) # Paid_On_Time, Paid_Late, Missed, Pending

    loan = relationship("Loan", back_populates="repayments")

    __table_args__ = (
        Index("ix_repay_status_due", "repayment_status", "due_date"),
    )
