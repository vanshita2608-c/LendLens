from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.session import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    customer_reference = Column(String(50), unique=True, index=True, nullable=False)
    customer_segment = Column(String(50), index=True, nullable=False) # Salaried, Self-Employed, New-to-Credit, Gig Worker
    income_band = Column(String(50), nullable=False) # <25k, 25k-50k, 50k-100k, >100k
    monthly_income = Column(Float, nullable=False)
    employment_category = Column(String(100), nullable=False)
    credit_score = Column(Integer, index=True, nullable=False) # 300 - 850
    debt_to_income_ratio = Column(Float, nullable=False) # 0.10 - 0.70
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    applications = relationship("LoanApplication", back_populates="customer", cascade="all, delete-orphan")
    loans = relationship("Loan", back_populates="customer")
