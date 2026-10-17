import logging
from app.db.session import engine, Base
from app.models import (
    Customer,
    LoanApplication,
    ApplicationEvent,
    CreditAssessment,
    LoanOffer,
    Loan,
    Repayment,
    Scenario,
    StrategyComparison,
    Experiment,
)

logger = logging.getLogger(__name__)

def init_db():
    """Initializes the database by creating all declared tables."""
    logger.info("Creating all database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    init_db()
