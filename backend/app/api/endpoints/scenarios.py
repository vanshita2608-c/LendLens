import json
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.schemas.scenario import (
    SimulateRequest,
    ScenarioCreate,
    ScenarioUpdate,
    ScenarioResponse,
    ScenarioCompareRequest,
    ScenarioCompareResponse
)
from app.services.scenario_service import ScenarioService

router = APIRouter()

@router.post("/simulate", tags=["Strategy Lab"])
def simulate_scenario(request: SimulateRequest, db: Session = Depends(get_db)):
    """
    Executes real-time simulation without saving to database.
    Supports funnel improvement, risk cutoff adjustment, TAT reduction, and channel reallocation.
    """
    try:
        assumptions = request.model_dump(exclude_unset=True)
        results = ScenarioService.run_simulation(db, assumptions, request.scenario_type)
        return results
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Simulation error: {str(e)}")

@router.post("", response_model=ScenarioResponse, status_code=status.HTTP_201_CREATED, tags=["Strategy Lab"])
def create_scenario(request: ScenarioCreate, db: Session = Depends(get_db)):
    """
    Saves a hypothetical product strategy scenario into the relational database.
    """
    try:
        scenario = ScenarioService.create_scenario(
            db=db,
            name=request.scenario_name,
            scenario_type=request.scenario_type,
            assumptions=request.assumptions,
            description=request.description
        )
        return ScenarioResponse(
            id=scenario.id,
            scenario_name=scenario.scenario_name,
            description=scenario.description,
            scenario_type=scenario.scenario_type,
            assumptions=json.loads(scenario.assumptions_json),
            calculated_results=json.loads(scenario.calculated_results_json),
            created_at=scenario.created_at.isoformat() if scenario.created_at else "",
            updated_at=scenario.updated_at.isoformat() if scenario.updated_at else ""
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("", response_model=List[ScenarioResponse], tags=["Strategy Lab"])
def list_scenarios(scenario_type: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """
    Retrieves all persisted Strategy Lab scenarios.
    """
    scenarios = ScenarioService.list_scenarios(db=db, scenario_type=scenario_type)
    return [
        ScenarioResponse(
            id=s.id,
            scenario_name=s.scenario_name,
            description=s.description,
            scenario_type=s.scenario_type,
            assumptions=json.loads(s.assumptions_json),
            calculated_results=json.loads(s.calculated_results_json),
            created_at=s.created_at.isoformat() if s.created_at else "",
            updated_at=s.updated_at.isoformat() if s.updated_at else ""
        )
        for s in scenarios
    ]

@router.get("/{scenario_id}", response_model=ScenarioResponse, tags=["Strategy Lab"])
def get_scenario(scenario_id: int, db: Session = Depends(get_db)):
    """
    Fetches details of a single saved scenario.
    """
    scenario = ScenarioService.get_scenario(db=db, scenario_id=scenario_id)
    if not scenario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Scenario with ID {scenario_id} not found.")
    return ScenarioResponse(
        id=scenario.id,
        scenario_name=scenario.scenario_name,
        description=scenario.description,
        scenario_type=scenario.scenario_type,
        assumptions=json.loads(scenario.assumptions_json),
        calculated_results=json.loads(scenario.calculated_results_json),
        created_at=scenario.created_at.isoformat() if scenario.created_at else "",
        updated_at=scenario.updated_at.isoformat() if scenario.updated_at else ""
    )

@router.patch("/{scenario_id}", response_model=ScenarioResponse, tags=["Strategy Lab"])
def update_scenario(scenario_id: int, request: ScenarioUpdate, db: Session = Depends(get_db)):
    """
    Modifies an existing scenario and automatically recalculates simulation outcomes.
    """
    scenario = ScenarioService.update_scenario(
        db=db,
        scenario_id=scenario_id,
        name=request.scenario_name,
        description=request.description,
        assumptions=request.assumptions
    )
    if not scenario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Scenario with ID {scenario_id} not found.")
    return ScenarioResponse(
        id=scenario.id,
        scenario_name=scenario.scenario_name,
        description=scenario.description,
        scenario_type=scenario.scenario_type,
        assumptions=json.loads(scenario.assumptions_json),
        calculated_results=json.loads(scenario.calculated_results_json),
        created_at=scenario.created_at.isoformat() if scenario.created_at else "",
        updated_at=scenario.updated_at.isoformat() if scenario.updated_at else ""
    )

@router.delete("/{scenario_id}", tags=["Strategy Lab"])
def delete_scenario(scenario_id: int, db: Session = Depends(get_db)):
    """
    Deletes a saved scenario from the database.
    """
    deleted = ScenarioService.delete_scenario(db=db, scenario_id=scenario_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Scenario with ID {scenario_id} not found.")
    return {"status": "deleted", "scenario_id": scenario_id}

from app.services.decision_brief_generator import DecisionBriefGenerator

@router.post("/compare", response_model=ScenarioCompareResponse, tags=["Strategy Lab"])
def compare_scenarios(request: ScenarioCompareRequest, db: Session = Depends(get_db)):
    """
    Compares two or more scenarios side-by-side with standardized KPI comparison matrices.
    """
    return ScenarioService.compare_scenarios(db=db, scenario_ids=request.scenario_ids)

@router.get("/{scenario_id}/decision-brief", tags=["Strategy Lab"])
@router.post("/{scenario_id}/decision-brief", tags=["Strategy Lab"])
def get_decision_brief(scenario_id: int, db: Session = Depends(get_db)):
    """
    Generates an evidence-based 12-section Product Decision Brief formatted in Markdown.
    Includes business problem, assumptions, simulated P&L, risks, guardrails, and APM recommendation.
    """
    scenario = ScenarioService.get_scenario(db=db, scenario_id=scenario_id)
    if not scenario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Scenario with ID {scenario_id} not found.")
    return DecisionBriefGenerator.generate_brief(scenario)
