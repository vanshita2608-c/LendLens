from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from app.db.session import get_db
from app.copilot.service import ProductCopilotService

router = APIRouter()

class CopilotQueryRequest(BaseModel):
    query: str = Field(..., min_length=2, description="Natural language question about lending funnel, risk, channels, or portfolio")

class ExperimentSuggestionRequest(BaseModel):
    problem_area: Optional[str] = Field(None, description="Optional funnel stage or business friction point")

@router.post("/query", tags=["AI Copilot"])
def query_copilot(request: CopilotQueryRequest, db: Session = Depends(get_db)):
    """
    Answers product intelligence queries using controlled analytics tools with a deterministic fallback.
    Never executes arbitrary LLM-generated SQL; queries parameterized analytics services.
    """
    return ProductCopilotService.process_query(db=db, query=request.query)

@router.post("/experiment-suggestions", tags=["AI Copilot"])
def get_experiment_suggestions(request: ExperimentSuggestionRequest, db: Session = Depends(get_db)):
    """
    Suggests structured product experiments with hypotheses, sample sizes, and guardrail metrics.
    """
    return ProductCopilotService.generate_experiment_suggestion(db=db, target_area=request.problem_area)
