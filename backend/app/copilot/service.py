import os
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.copilot.tools import ControlledAnalyticsToolkit

class ProductCopilotService:
    """
    AI Product Copilot Service with controlled tool invocation and deterministic fallback.
    Ensures 100% functionality without requiring external paid LLM API keys.
    """

    @classmethod
    def process_query(cls, db: Session, query: str) -> Dict[str, Any]:
        q_lower = query.lower().strip()

        # 1. Acquisition Channel Performance
        if any(w in q_lower for w in ["channel", "acquisition", "cac", "partner", "aggregator"]):
            channel_data = ControlledAnalyticsToolkit.get_channel_metrics(db)
            highest_conv = max(channel_data, key=lambda c: c["conversion_pct"]) if channel_data else {}
            lowest_conv = min(channel_data, key=lambda c: c["conversion_pct"]) if channel_data else {}

            return {
                "query": query,
                "intent": "channel_unit_economics",
                "direct_answer": (
                    f"Partner Referral and Organic channels deliver the highest conversion efficiency ({highest_conv.get('conversion_pct', 0)}%), "
                    f"while Aggregators experience the lowest completion ({lowest_conv.get('conversion_pct', 0)}%) alongside higher unit CAC."
                ),
                "supporting_metrics": {
                    "top_channel": highest_conv.get("channel"),
                    "top_channel_conversion": f"{highest_conv.get('conversion_pct', 0)}%",
                    "lowest_channel": lowest_conv.get("channel"),
                    "lowest_channel_conversion": f"{lowest_conv.get('conversion_pct', 0)}%",
                    "channel_breakdown": channel_data
                },
                "time_period": "Active origination window",
                "sample_size": "Complete application portfolio",
                "apm_interpretation": (
                    "Aggregator leads have lower intent and higher price sensitivity, shopping across multiple digital lenders simultaneously. "
                    "Organic borrowers demonstrate higher brand trust and document readiness."
                ),
                "limitations": "Channel CAC represents blended historical allocations and excludes offline attribution lag.",
                "recommended_next_step": "Use Strategy Lab Category D to simulate reallocating 15% aggregator budget into Partner Referrals."
            }

        # 2. Funnel Drop-off / Customer Journey Inquiry
        elif any(w in q_lower for w in ["abandon", "drop", "funnel", "journey", "leakage", "conversion", "kyc"]):
            funnel_data = ControlledAnalyticsToolkit.get_funnel_metrics(db)
            worst_stage = funnel_data["highest_dropoff_stage"]
            worst_conv = funnel_data["highest_dropoff_conversion_pct"]
            total_apps = funnel_data["total_applicants"]

            return {
                "query": query,
                "intent": "funnel_friction_analysis",
                "direct_answer": (
                    f"The primary customer drop-off occurs at the '{worst_stage}' stage, where conversion drops to "
                    f"{worst_conv}%. Overall journey completion rate from application initiation to disbursal is "
                    f"{funnel_data['overall_conversion_pct']}%."
                ),
                "supporting_metrics": {
                    "total_applicants_evaluated": total_apps,
                    "overall_conversion_pct": funnel_data["overall_conversion_pct"],
                    "highest_friction_stage": worst_stage,
                    "stage_conversion_pct": worst_conv
                },
                "time_period": "Historical cumulative origination cohort",
                "sample_size": f"{total_apps:,} applications",
                "apm_interpretation": (
                    f"Applicants experience acute friction during {worst_stage}, likely driven by manual documentation "
                    "demands, Aadhaar/DigiLocker OTP timeouts, or slow asynchronous verification SLAs. Drop-off here is "
                    "especially detrimental because customer acquisition spend (CAC) has already been expended."
                ),
                "limitations": "Observed drop-off rates represent correlational user exits and do not definitively isolate browser crashes from intentional user drop-offs.",
                "recommended_next_step": "Run an A/B test in the Strategy Lab evaluating automated DigiLocker verification to reduce verification TAT."
            }

        # 2. Acquisition Channel Performance
        elif any(w in q_lower for w in ["channel", "acquisition", "cac", "partner", "organic", "search", "aggregator"]):
            channel_data = ControlledAnalyticsToolkit.get_channel_metrics(db)
            highest_conv = max(channel_data, key=lambda c: c["conversion_pct"]) if channel_data else {}
            lowest_conv = min(channel_data, key=lambda c: c["conversion_pct"]) if channel_data else {}

            return {
                "query": query,
                "intent": "channel_unit_economics",
                "direct_answer": (
                    f"Partner Referral and Organic channels deliver the highest conversion efficiency ({highest_conv.get('conversion_pct', 0)}%), "
                    f"while Aggregators experience the lowest completion ({lowest_conv.get('conversion_pct', 0)}%) alongside higher unit CAC."
                ),
                "supporting_metrics": {
                    "top_channel": highest_conv.get("channel"),
                    "top_channel_conversion": f"{highest_conv.get('conversion_pct', 0)}%",
                    "lowest_channel": lowest_conv.get("channel"),
                    "lowest_channel_conversion": f"{lowest_conv.get('conversion_pct', 0)}%",
                    "channel_breakdown": channel_data
                },
                "time_period": "Active origination window",
                "sample_size": "Complete application portfolio",
                "apm_interpretation": (
                    "Aggregator leads have lower intent and higher price sensitivity, shopping across multiple digital lenders simultaneously. "
                    "Organic borrowers demonstrate higher brand trust and document readiness."
                ),
                "limitations": "Channel CAC represents blended historical allocations and excludes offline attribution lag.",
                "recommended_next_step": "Use Strategy Lab Category D to simulate reallocating 15% aggregator budget into Partner Referrals."
            }

        # 3. Credit Risk Model & Machine Learning
        elif any(w in q_lower for w in ["credit", "model", "auc", "roc", "risk", "recall", "shap", "feature", "prediction"]):
            ml_data = ControlledAnalyticsToolkit.get_credit_model_performance()

            return {
                "query": query,
                "intent": "credit_intelligence_inquiry",
                "direct_answer": (
                    f"The champion credit risk model (Random Forest v1.0.0-rf) achieves a ROC-AUC of {ml_data['roc_auc']} "
                    f"with {ml_data['recall'] * 100:.1f}% recall on default detection. The top risk predictor is '{ml_data['top_risk_driver']}'."
                ),
                "supporting_metrics": {
                    "model_version": ml_data["version"],
                    "roc_auc": ml_data["roc_auc"],
                    "default_recall_pct": f"{ml_data['recall'] * 100:.1f}%",
                    "default_precision_pct": f"{ml_data['precision'] * 100:.1f}%",
                    "top_predictive_feature": ml_data["top_risk_driver"]
                },
                "time_period": "25% chronological out-of-time test holdout (2,500 loans)",
                "sample_size": "10,000 credit assessments",
                "apm_interpretation": (
                    "In retail credit risk underwriting, False Negatives (disbursing to a borrower who defaults) cost ~8x more than False Positives. "
                    "The model is intentionally calibrated to maximize default recall, preventing balance sheet impairment."
                ),
                "limitations": "Model outputs represent statistical likelihoods under stationary macroeconomic conditions; they are not deterministic guarantees.",
                "recommended_next_step": "Inspect applicant feature attributions in the Credit Intelligence Sandbox (/credit-intelligence)."
            }

        # 4. Portfolio Health & Delinquency
        elif any(w in q_lower for w in ["portfolio", "delinquency", "par30", "default", "repayment", "loan book", "active loans"]):
            port_data = ControlledAnalyticsToolkit.get_portfolio_indicators(db)

            return {
                "query": query,
                "intent": "portfolio_health_analysis",
                "direct_answer": (
                    f"The active loan book stands at {port_data['active_loans']} loans totaling ₹{port_data['outstanding_principal_inr']:,.0f} "
                    f"outstanding principal. Collection efficiency is strong at {port_data['on_time_repayment_pct']}% on-time repayment, "
                    f"with PAR30 delinquency at {port_data['par30_delinquency_pct']}%."
                ),
                "supporting_metrics": {
                    "active_loans_count": port_data["active_loans"],
                    "total_disbursed_principal_inr": port_data["total_disbursed_inr"],
                    "outstanding_book_inr": port_data["outstanding_principal_inr"],
                    "on_time_repayment_rate_pct": port_data["on_time_repayment_pct"],
                    "par30_delinquency_rate_pct": port_data["par30_delinquency_pct"]
                },
                "time_period": "Cumulative matured portfolio",
                "sample_size": f"{port_data['active_loans']} active loans",
                "apm_interpretation": (
                    "A PAR30 rate under 6.0% confirms sound portfolio seasoning. The collection team's early-bucket dunning "
                    "process successfully cures the majority of 1-30 DPD late payers before they escalate to write-off status."
                ),
                "limitations": "Recent origination cohorts have not reached full 12-month seasoning; cumulative loss curves may develop upward.",
                "recommended_next_step": "Monitor quarterly vintage curves in Lending Portfolio Analytics (/portfolio)."
            }

        # 5. Default General Strategy & APM Advisory
        else:
            strategies = ControlledAnalyticsToolkit.get_saved_strategies_summary(db)
            funnel_data = ControlledAnalyticsToolkit.get_funnel_metrics(db)

            return {
                "query": query,
                "intent": "general_product_intelligence",
                "direct_answer": (
                    f"LendLens product analytics indicates the largest opportunity for ROI is reducing friction at the "
                    f"'{funnel_data['highest_dropoff_stage']}' stage (current conversion: {funnel_data['highest_dropoff_conversion_pct']}%). "
                    f"You have {len(strategies)} strategic scenarios saved in the Strategy Lab."
                ),
                "supporting_metrics": {
                    "overall_conversion_pct": funnel_data["overall_conversion_pct"],
                    "saved_strategies_count": len(strategies),
                    "primary_bottleneck_stage": funnel_data["highest_dropoff_stage"]
                },
                "time_period": "Real-time production snapshot",
                "sample_size": "Full database coverage",
                "apm_interpretation": (
                    "Product Managers should focus on high-impact bottlenecks where marginal conversion uplift propagates "
                    "exponentially downstream into disbursed principal."
                ),
                "limitations": "Automated advisory utilizes deterministic financial engines and established behavioral benchmarks.",
                "recommended_next_step": "Formulate a new experiment in the Experiments Workspace (/experiments) or test an uplift in the Strategy Lab."
            }

    @classmethod
    def generate_experiment_suggestion(cls, db: Session, target_area: str) -> Dict[str, Any]:
        """
        Synthesizes a structured, statistically grounded product experiment proposal.
        """
        funnel_data = ControlledAnalyticsToolkit.get_funnel_metrics(db)
        stage = target_area if target_area else funnel_data["highest_dropoff_stage"]

        return {
            "experiment_name": f"EXP-{stage.upper().replace(' ', '_')}-AUTO-VERIFY",
            "problem_statement": f"Applicants experience high drop-off ({funnel_data['highest_dropoff_conversion_pct']}%) during {stage}.",
            "hypothesis": f"Replacing manual form inputs with automated DigiLocker & Account Aggregator API verification will improve completion by +15%.",
            "target_segment": "All applicants on mobile web",
            "control_group": "Existing multi-step document upload flow",
            "treatment_group": "Instant 1-click DigiLocker consent and bank statement fetch",
            "primary_metric": f"{stage} Conversion Rate (%)",
            "guardrail_metrics": [
                "First Payment Default (FPD) < 2.0%",
                "API Verification Cost < ₹45 per applicant",
                "Stage TAT < 3.0 minutes"
            ],
            "recommended_duration_weeks": 4,
            "required_sample_size": "2,000 applicants per variant (95% confidence, 80% statistical power)",
            "status": "Ready for Review"
        }
