import json
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.scenario import Scenario, StrategyComparison
from app.simulations.funnel_simulator import FunnelImprovementSimulator, ProcessingTimeSimulator
from app.simulations.risk_simulator import RiskSensitivitySimulator
from app.simulations.channel_simulator import ChannelMixSimulator

class ScenarioService:
    """
    Manages scenario simulation execution, database persistence, updates,
    and comparative scenario analytics.
    """
    @classmethod
    def run_simulation(cls, db: Session, assumptions: Dict[str, Any], scenario_type: str) -> Dict[str, Any]:
        """
        Executes real analytical calculation using the corresponding simulation engine.
        """
        if scenario_type == "funnel_improvement":
            target_stage = assumptions.get("target_stage", "KYC Completed")
            uplift = float(assumptions.get("relative_uplift_pct", 15.0))
            cost = float(assumptions.get("implementation_cost_inr", 250000.0))
            segment = assumptions.get("target_segment")
            return FunnelImprovementSimulator.simulate_stage_improvement(
                db=db,
                target_stage=target_stage,
                conversion_uplift_pct=uplift,
                target_segment=segment,
                implementation_cost_inr=cost
            )

        elif scenario_type == "risk_cutoff":
            proposed_cutoff = float(assumptions.get("new_pd_threshold", 0.12))
            baseline_cutoff = float(assumptions.get("baseline_cutoff_pd", 0.11))
            segment = assumptions.get("target_segment")
            cost_of_funds = float(assumptions.get("cost_of_funds_pct", 7.5))
            lgd = float(assumptions.get("loss_given_default_pct", 45.0))
            return RiskSensitivitySimulator.simulate_cutoff_adjustment(
                db=db,
                proposed_cutoff_pd=proposed_cutoff,
                baseline_cutoff_pd=baseline_cutoff,
                target_segment=segment,
                cost_of_funds_pct=cost_of_funds,
                loss_given_default_pct=lgd
            )

        elif scenario_type == "tat_optimization":
            target_stage = assumptions.get("target_stage", "Credit Assessment Completed")
            reduction_pct = float(assumptions.get("tat_reduction_pct", 20.0))
            elasticity = float(assumptions.get("elasticity_factor", 0.20))
            cost = float(assumptions.get("implementation_cost_inr", 300000.0))
            return ProcessingTimeSimulator.simulate_tat_reduction(
                db=db,
                target_stage=target_stage,
                tat_reduction_pct=reduction_pct,
                elasticity=elasticity,
                automation_investment_inr=cost
            )

        elif scenario_type == "channel_mix":
            shares = assumptions.get("channel_shares", {
                "Organic": 35.0,
                "Partner Referral": 25.0,
                "Aggregators": 15.0,
                "Paid Search": 20.0,
                "Direct Mail": 5.0
            })
            total_apps = assumptions.get("total_target_applications")
            return ChannelMixSimulator.simulate_channel_reallocation(
                db=db,
                proposed_shares=shares,
                total_target_applications=int(total_apps) if total_apps else None
            )

        else:
            raise ValueError(f"Unknown scenario type: '{scenario_type}'")

    @classmethod
    def create_scenario(
        cls, 
        db: Session, 
        name: str, 
        scenario_type: str, 
        assumptions: Dict[str, Any], 
        description: Optional[str] = None
    ) -> Scenario:
        # Calculate results via engine
        calculated_results = cls.run_simulation(db, assumptions, scenario_type)

        scenario = Scenario(
            scenario_name=name,
            description=description,
            scenario_type=scenario_type,
            assumptions_json=json.dumps(assumptions),
            calculated_results_json=json.dumps(calculated_results)
        )
        db.add(scenario)
        db.commit()
        db.refresh(scenario)
        return scenario

    @classmethod
    def list_scenarios(cls, db: Session, scenario_type: Optional[str] = None) -> List[Scenario]:
        query = db.query(Scenario)
        if scenario_type:
            query = query.filter(Scenario.scenario_type == scenario_type)
        return query.order_by(Scenario.created_at.desc()).all()

    @classmethod
    def get_scenario(cls, db: Session, scenario_id: int) -> Optional[Scenario]:
        return db.query(Scenario).filter(Scenario.id == scenario_id).first()

    @classmethod
    def update_scenario(
        cls,
        db: Session,
        scenario_id: int,
        name: Optional[str] = None,
        description: Optional[str] = None,
        assumptions: Optional[Dict[str, Any]] = None
    ) -> Optional[Scenario]:
        scenario = cls.get_scenario(db, scenario_id)
        if not scenario:
            return None

        if name is not None:
            scenario.scenario_name = name
        if description is not None:
            scenario.description = description
        if assumptions is not None:
            scenario.assumptions_json = json.dumps(assumptions)
            # Re-run simulation with updated assumptions
            new_results = cls.run_simulation(db, assumptions, scenario.scenario_type)
            scenario.calculated_results_json = json.dumps(new_results)

        db.commit()
        db.refresh(scenario)
        return scenario

    @classmethod
    def delete_scenario(cls, db: Session, scenario_id: int) -> bool:
        scenario = cls.get_scenario(db, scenario_id)
        if not scenario:
            return False
        db.delete(scenario)
        db.commit()
        return True

    @classmethod
    def compare_scenarios(cls, db: Session, scenario_ids: List[int]) -> Dict[str, Any]:
        scenarios = db.query(Scenario).filter(Scenario.id.in_(scenario_ids)).all()
        if not scenarios:
            return {"scenarios": [], "comparison_summary": []}

        summary_rows = []
        for sc in scenarios:
            res = json.loads(sc.calculated_results_json)
            # Standardize comparative metrics across all scenario categories
            if sc.scenario_type in ["funnel_improvement", "tat_optimization"]:
                fin = res.get("financial_impact", {})
                sc_data = res.get("scenario", {})
                summary_rows.append({
                    "scenario_id": sc.id,
                    "scenario_name": sc.scenario_name,
                    "scenario_type": sc.scenario_type,
                    "incremental_disbursals": sc_data.get("incremental_disbursals_count", 0),
                    "incremental_volume_inr": sc_data.get("incremental_disbursed_principal_inr", 0.0),
                    "net_contribution_inr": fin.get("net_contribution", 0.0),
                    "roi_ratio": fin.get("expected_roi_ratio", 0.0),
                    "expected_credit_loss_inr": fin.get("expected_credit_loss", 0.0)
                })
            elif sc.scenario_type == "risk_cutoff":
                fin = res.get("marginal_financials", {})
                prop = res.get("proposed_policy", {})
                summary_rows.append({
                    "scenario_id": sc.id,
                    "scenario_name": sc.scenario_name,
                    "scenario_type": sc.scenario_type,
                    "incremental_disbursals": prop.get("disbursal_count", 0) - res.get("baseline_policy", {}).get("disbursal_count", 0),
                    "incremental_volume_inr": prop.get("total_exposure_inr", 0.0) - res.get("baseline_policy", {}).get("total_exposure_inr", 0.0),
                    "net_contribution_inr": fin.get("net_contribution", 0.0),
                    "roi_ratio": fin.get("net_interest_margin_pct", 0.0),
                    "expected_credit_loss_inr": prop.get("expected_credit_loss_inr", 0.0)
                })
            elif sc.scenario_type == "channel_mix":
                fin = res.get("marginal_financials", {})
                deltas = res.get("deltas", {})
                summary_rows.append({
                    "scenario_id": sc.id,
                    "scenario_name": sc.scenario_name,
                    "scenario_type": sc.scenario_type,
                    "incremental_disbursals": deltas.get("disbursals_delta", 0),
                    "incremental_volume_inr": deltas.get("volume_delta_inr", 0.0),
                    "net_contribution_inr": fin.get("net_contribution", 0.0),
                    "roi_ratio": fin.get("net_interest_margin_pct", 0.0),
                    "expected_credit_loss_inr": fin.get("expected_credit_loss", 0.0)
                })

        return {
            "scenarios": [
                {
                    "id": s.id,
                    "scenario_name": s.scenario_name,
                    "description": s.description,
                    "scenario_type": s.scenario_type,
                    "assumptions": json.loads(s.assumptions_json),
                    "calculated_results": json.loads(s.calculated_results_json),
                    "created_at": s.created_at.isoformat() if s.created_at else "",
                    "updated_at": s.updated_at.isoformat() if s.updated_at else ""
                }
                for s in scenarios
            ],
            "comparison_summary": summary_rows
        }
