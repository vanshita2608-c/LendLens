from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.schemas.experiment import ExperimentCreate, ExperimentUpdate, ExperimentResponse
from app.services.experiment_service import ExperimentService

router = APIRouter()

@router.post("", response_model=ExperimentResponse, status_code=status.HTTP_201_CREATED, tags=["Product Experiments"])
def create_experiment(payload: ExperimentCreate, db: Session = Depends(get_db)):
    """
    Creates a new product experiment with automatic RICE priority calculation.
    """
    exp = ExperimentService.create_experiment(db, payload)
    return ExperimentResponse(
        id=exp.id,
        experiment_name=exp.experiment_name,
        problem_statement=exp.problem_statement,
        hypothesis=exp.hypothesis,
        target_segment=exp.target_segment,
        primary_metric=exp.primary_metric,
        guardrail_metrics=exp.guardrail_metrics,
        reach_score=exp.reach_score,
        impact_score=exp.impact_score,
        confidence_score=exp.confidence_score,
        effort_score=exp.effort_score,
        rice_priority_score=exp.rice_priority_score,
        control_definition=exp.control_definition,
        treatment_definition=exp.treatment_definition,
        sample_size_control=exp.sample_size_control,
        sample_size_treatment=exp.sample_size_treatment,
        control_conversion_rate=exp.control_conversion_rate,
        treatment_conversion_rate=exp.treatment_conversion_rate,
        observed_lift_pct=exp.observed_lift_pct,
        p_value=exp.p_value,
        experiment_status=exp.experiment_status,
        owner=exp.owner,
        decision_learnings=exp.decision_learnings,
        created_at=exp.created_at.isoformat() if exp.created_at else ""
    )

@router.get("", response_model=List[ExperimentResponse], tags=["Product Experiments"])
def list_experiments(
    status: Optional[str] = Query(None),
    sort_by: str = Query("rice", description="Sort by 'rice' or 'recent'"),
    db: Session = Depends(get_db)
):
    """
    Lists product opportunities and experiments sorted by RICE score or creation date.
    """
    experiments = ExperimentService.list_experiments(db=db, status=status, sort_by=sort_by)
    return [
        ExperimentResponse(
            id=e.id,
            experiment_name=e.experiment_name,
            problem_statement=e.problem_statement,
            hypothesis=e.hypothesis,
            target_segment=e.target_segment,
            primary_metric=e.primary_metric,
            guardrail_metrics=e.guardrail_metrics,
            reach_score=e.reach_score,
            impact_score=e.impact_score,
            confidence_score=e.confidence_score,
            effort_score=e.effort_score,
            rice_priority_score=e.rice_priority_score,
            control_definition=e.control_definition,
            treatment_definition=e.treatment_definition,
            sample_size_control=e.sample_size_control,
            sample_size_treatment=e.sample_size_treatment,
            control_conversion_rate=e.control_conversion_rate,
            treatment_conversion_rate=e.treatment_conversion_rate,
            observed_lift_pct=e.observed_lift_pct,
            p_value=e.p_value,
            experiment_status=e.experiment_status,
            owner=e.owner,
            decision_learnings=e.decision_learnings,
            created_at=e.created_at.isoformat() if e.created_at else ""
        )
        for e in experiments
    ]

@router.get("/{experiment_id}", response_model=ExperimentResponse, tags=["Product Experiments"])
def get_experiment(experiment_id: int, db: Session = Depends(get_db)):
    """
    Fetches details and telemetry for a single experiment.
    """
    exp = ExperimentService.get_experiment(db, experiment_id)
    if not exp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Experiment {experiment_id} not found.")
    return ExperimentResponse(
        id=exp.id,
        experiment_name=exp.experiment_name,
        problem_statement=exp.problem_statement,
        hypothesis=exp.hypothesis,
        target_segment=exp.target_segment,
        primary_metric=exp.primary_metric,
        guardrail_metrics=exp.guardrail_metrics,
        reach_score=exp.reach_score,
        impact_score=exp.impact_score,
        confidence_score=exp.confidence_score,
        effort_score=exp.effort_score,
        rice_priority_score=exp.rice_priority_score,
        control_definition=exp.control_definition,
        treatment_definition=exp.treatment_definition,
        sample_size_control=exp.sample_size_control,
        sample_size_treatment=exp.sample_size_treatment,
        control_conversion_rate=exp.control_conversion_rate,
        treatment_conversion_rate=exp.treatment_conversion_rate,
        observed_lift_pct=exp.observed_lift_pct,
        p_value=exp.p_value,
        experiment_status=exp.experiment_status,
        owner=exp.owner,
        decision_learnings=exp.decision_learnings,
        created_at=exp.created_at.isoformat() if exp.created_at else ""
    )

@router.patch("/{experiment_id}", response_model=ExperimentResponse, tags=["Product Experiments"])
def update_experiment(experiment_id: int, payload: ExperimentUpdate, db: Session = Depends(get_db)):
    """
    Updates experiment parameters, status, or statistical results.
    """
    exp = ExperimentService.update_experiment(db, experiment_id, payload)
    if not exp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Experiment {experiment_id} not found.")
    return ExperimentResponse(
        id=exp.id,
        experiment_name=exp.experiment_name,
        problem_statement=exp.problem_statement,
        hypothesis=exp.hypothesis,
        target_segment=exp.target_segment,
        primary_metric=exp.primary_metric,
        guardrail_metrics=exp.guardrail_metrics,
        reach_score=exp.reach_score,
        impact_score=exp.impact_score,
        confidence_score=exp.confidence_score,
        effort_score=exp.effort_score,
        rice_priority_score=exp.rice_priority_score,
        control_definition=exp.control_definition,
        treatment_definition=exp.treatment_definition,
        sample_size_control=exp.sample_size_control,
        sample_size_treatment=exp.sample_size_treatment,
        control_conversion_rate=exp.control_conversion_rate,
        treatment_conversion_rate=exp.treatment_conversion_rate,
        observed_lift_pct=exp.observed_lift_pct,
        p_value=exp.p_value,
        experiment_status=exp.experiment_status,
        owner=exp.owner,
        decision_learnings=exp.decision_learnings,
        created_at=exp.created_at.isoformat() if exp.created_at else ""
    )

@router.delete("/{experiment_id}", tags=["Product Experiments"])
def delete_experiment(experiment_id: int, db: Session = Depends(get_db)):
    """
    Deletes an experiment record from the database.
    """
    deleted = ExperimentService.delete_experiment(db, experiment_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Experiment {experiment_id} not found.")
    return {"status": "deleted", "experiment_id": experiment_id}
