from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.experiment import Experiment
from app.schemas.experiment import ExperimentCreate, ExperimentUpdate

class ExperimentService:
    """
    Manages product experiments, A/B testing variations, RICE priority scoring,
    and post-experiment evaluation.
    """

    @staticmethod
    def calculate_rice_score(reach: float, impact: float, confidence: float, effort: float) -> float:
        """
        RICE = (Reach * Impact * Confidence%) / Effort
        """
        conf_ratio = confidence / 100.0
        eff = max(0.5, effort)
        return round((reach * impact * conf_ratio) / eff, 1)

    @classmethod
    def create_experiment(cls, db: Session, payload: ExperimentCreate) -> Experiment:
        rice = cls.calculate_rice_score(
            reach=payload.reach_score,
            impact=payload.impact_score,
            confidence=payload.confidence_score,
            effort=payload.effort_score
        )

        exp = Experiment(
            experiment_name=payload.experiment_name,
            problem_statement=payload.problem_statement,
            hypothesis=payload.hypothesis,
            target_segment=payload.target_segment,
            primary_metric=payload.primary_metric,
            guardrail_metrics=payload.guardrail_metrics,
            reach_score=payload.reach_score,
            impact_score=payload.impact_score,
            confidence_score=payload.confidence_score,
            effort_score=payload.effort_score,
            rice_priority_score=rice,
            control_definition=payload.control_definition,
            treatment_definition=payload.treatment_definition,
            experiment_status=payload.experiment_status or "Planned",
            owner=payload.owner or "Associate Product Manager"
        )
        db.add(exp)
        db.commit()
        db.refresh(exp)
        return exp

    @classmethod
    def list_experiments(
        cls, 
        db: Session, 
        status: Optional[str] = None, 
        sort_by: str = "rice"
    ) -> List[Experiment]:
        # Check if table is empty, seed 4 realistic default experiments
        count = db.query(Experiment).count()
        if count == 0:
            cls._seed_default_experiments(db)

        query = db.query(Experiment)
        if status and status != "All":
            query = query.filter(Experiment.experiment_status == status)

        if sort_by == "rice":
            query = query.order_by(Experiment.rice_priority_score.desc())
        else:
            query = query.order_by(Experiment.created_at.desc())

        return query.all()

    @classmethod
    def get_experiment(cls, db: Session, experiment_id: int) -> Optional[Experiment]:
        return db.query(Experiment).filter(Experiment.id == experiment_id).first()

    @classmethod
    def update_experiment(cls, db: Session, experiment_id: int, payload: ExperimentUpdate) -> Optional[Experiment]:
        exp = cls.get_experiment(db, experiment_id)
        if not exp:
            return None

        update_data = payload.model_dump(exclude_unset=True)

        # Recalculate RICE if scoring parameters changed
        reach = update_data.get("reach_score", exp.reach_score)
        impact = update_data.get("impact_score", exp.impact_score)
        conf = update_data.get("confidence_score", exp.confidence_score)
        effort = update_data.get("effort_score", exp.effort_score)

        if any(k in update_data for k in ["reach_score", "impact_score", "confidence_score", "effort_score"]):
            exp.rice_priority_score = cls.calculate_rice_score(reach, impact, conf, effort)

        # Calculate lift if control and treatment conversion are updated
        if "control_conversion_rate" in update_data or "treatment_conversion_rate" in update_data:
            ctrl = update_data.get("control_conversion_rate", exp.control_conversion_rate)
            treat = update_data.get("treatment_conversion_rate", exp.treatment_conversion_rate)
            if ctrl > 0:
                update_data["observed_lift_pct"] = round(((treat - ctrl) / ctrl) * 100.0, 2)

        for key, value in update_data.items():
            setattr(exp, key, value)

        db.commit()
        db.refresh(exp)
        return exp

    @classmethod
    def delete_experiment(cls, db: Session, experiment_id: int) -> bool:
        exp = cls.get_experiment(db, experiment_id)
        if not exp:
            return False
        db.delete(exp)
        db.commit()
        return True

    @classmethod
    def _seed_default_experiments(cls, db: Session):
        """
        Seeds 4 realistic banking fintech experiments for portfolio demonstration.
        """
        seeds = [
            {
                "experiment_name": "EXP-01: Instant DigiLocker 1-Click KYC",
                "problem_statement": "34.2% drop-off at KYC verification due to manual upload of PAN and Aadhaar images.",
                "hypothesis": "Implementing instant DigiLocker authentication will reduce KYC drop-off by 18% and cut stage TAT to under 60 seconds.",
                "target_segment": "Salaried & New-to-Credit",
                "primary_metric": "KYC Stage Completion Rate (%)",
                "guardrail_metrics": "First Payment Default (FPD) < 1.8%, KYC API unit cost < ₹25",
                "reach_score": 3200.0,
                "impact_score": 4.0,
                "confidence_score": 85.0,
                "effort_score": 2.5,
                "control_definition": "Manual photo upload of Aadhaar card front/back and PAN card",
                "treatment_definition": "OTP-verified DigiLocker integration directly fetching verified XML document",
                "sample_size_control": 1600,
                "sample_size_treatment": 1600,
                "control_conversion_rate": 65.8,
                "treatment_conversion_rate": 78.4,
                "observed_lift_pct": 19.15,
                "p_value": 0.0012,
                "experiment_status": "Completed",
                "owner": "Kavya Patel (APM)",
                "decision_learnings": "Statistically significant win (p < 0.01). Rolled out to 100% of mobile web applicants. Generated +₹1.4 Cr in incremental disbursed principal."
            },
            {
                "experiment_name": "EXP-02: Pre-Bureau Income Estimation Slider",
                "problem_statement": "Applicants drop off during Details Submission when asked to manually enter net monthly income and existing EMIs.",
                "hypothesis": "Providing a suggested income bracket slider with auto-calculated eligible loan amounts will increase details submission by 12%.",
                "target_segment": "Gig Worker & Self-Employed",
                "primary_metric": "Details Submitted Completion Rate (%)",
                "guardrail_metrics": "Underwriting Rejection Rate at Stage 4 < 28%",
                "reach_score": 2500.0,
                "impact_score": 3.0,
                "confidence_score": 75.0,
                "effort_score": 1.5,
                "control_definition": "Numeric text input fields for exact monthly salary and loan tenure",
                "treatment_definition": "Interactive slider showing real-time monthly EMI preview based on chosen principal",
                "sample_size_control": 1250,
                "sample_size_treatment": 1250,
                "control_conversion_rate": 81.2,
                "treatment_conversion_rate": 88.5,
                "observed_lift_pct": 8.99,
                "p_value": 0.034,
                "experiment_status": "Running",
                "owner": "Rohan Mehta (Product Lead)",
                "decision_learnings": "Early telemetry shows positive lift across mobile users. Awaiting full 30-day default seasoning."
            },
            {
                "experiment_name": "EXP-03: Near-Prime Credit Cutoff Expansion (PD 11% to 14%)",
                "problem_statement": "Conservative underwriting rejects creditworthy borrowers with bureau scores between 660-700.",
                "hypothesis": "Expanding credit cutoff to 14% PD will capture +250 monthly loan disbursals with acceptable risk-adjusted contribution.",
                "target_segment": "Self-Employed",
                "primary_metric": "Approved-to-Disbursed Volume (₹ Lakhs)",
                "guardrail_metrics": "PAR30 Delinquency < 6.0%, Net Interest Margin > 4.5%",
                "reach_score": 1800.0,
                "impact_score": 5.0,
                "confidence_score": 70.0,
                "effort_score": 3.0,
                "control_definition": "Strict maximum cutoff at 11% Probability of Default",
                "treatment_definition": "Tiered approval cutoff up to 14% PD with risk-based pricing (+1.5% APR)",
                "sample_size_control": 0,
                "sample_size_treatment": 0,
                "control_conversion_rate": 0.0,
                "treatment_conversion_rate": 0.0,
                "observed_lift_pct": 0.0,
                "p_value": None,
                "experiment_status": "Planned",
                "owner": "Priya Sharma (Risk Analytics)",
                "decision_learnings": "Simulated in Strategy Lab. Pending Credit Committee sign-off."
            },
            {
                "experiment_name": "EXP-04: Aggregator Dynamic APR Personalization",
                "problem_statement": "Aggregator channel conversion is low (18%) and blended CAC is high (₹1,200).",
                "hypothesis": "Displaying personalized pre-qualified APR badges on aggregator listing will increase applicant intent and conversion.",
                "target_segment": "All Aggregator Leads",
                "primary_metric": "Offer Acceptance Rate (%)",
                "guardrail_metrics": "Channel PAR30 Delinquency < 7.0%",
                "reach_score": 4000.0,
                "impact_score": 3.0,
                "confidence_score": 60.0,
                "effort_score": 4.0,
                "control_definition": "Generic benchmark APR (14.0%) shown on aggregator partner card",
                "treatment_definition": "Dynamic pre-qualified APR banner based on soft bureau check",
                "sample_size_control": 0,
                "sample_size_treatment": 0,
                "control_conversion_rate": 0.0,
                "treatment_conversion_rate": 0.0,
                "observed_lift_pct": 0.0,
                "p_value": None,
                "experiment_status": "Draft",
                "owner": "Kavya Patel (APM)",
                "decision_learnings": "Technical feasibility review underway with third-party aggregator API teams."
            }
        ]

        for s in seeds:
            rice = cls.calculate_rice_score(
                reach=s["reach_score"],
                impact=s["impact_score"],
                confidence=s["confidence_score"],
                effort=s["effort_score"]
            )
            exp = Experiment(
                experiment_name=s["experiment_name"],
                problem_statement=s["problem_statement"],
                hypothesis=s["hypothesis"],
                target_segment=s["target_segment"],
                primary_metric=s["primary_metric"],
                guardrail_metrics=s["guardrail_metrics"],
                reach_score=s["reach_score"],
                impact_score=s["impact_score"],
                confidence_score=s["confidence_score"],
                effort_score=s["effort_score"],
                rice_priority_score=rice,
                control_definition=s["control_definition"],
                treatment_definition=s["treatment_definition"],
                sample_size_control=s["sample_size_control"],
                sample_size_treatment=s["sample_size_treatment"],
                control_conversion_rate=s["control_conversion_rate"],
                treatment_conversion_rate=s["treatment_conversion_rate"],
                observed_lift_pct=s["observed_lift_pct"],
                p_value=s["p_value"],
                experiment_status=s["experiment_status"],
                owner=s["owner"],
                decision_learnings=s["decision_learnings"]
            )
            db.add(exp)
        db.commit()
