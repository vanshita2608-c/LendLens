import json
from typing import Dict, Any
from app.models.scenario import Scenario

class DecisionBriefGenerator:
    """
    Generates an executive, evidence-based 12-section Product Decision Brief (PRD/RFC format)
    from saved Strategy Lab scenarios for APM and Credit Committee reviews.
    """

    @classmethod
    def generate_brief(cls, scenario: Scenario) -> Dict[str, Any]:
        assumptions = json.loads(scenario.assumptions_json)
        results = json.loads(scenario.calculated_results_json)
        sc_type = scenario.scenario_type

        # Extract financial and volume deltas based on scenario type
        if sc_type in ["funnel_improvement", "tat_optimization"]:
            fin = results.get("financial_impact", {})
            sc_data = results.get("scenario", {})
            base_data = results.get("baseline", {})
            
            incremental_disbursals = sc_data.get("incremental_disbursals_count", 0)
            incremental_volume = sc_data.get("incremental_disbursed_principal_inr", 0.0)
            net_contribution = fin.get("net_contribution", 0.0)
            ecl = fin.get("expected_credit_loss", 0.0)
            roi_ratio = fin.get("expected_roi_ratio", 0.0)
            target_stage = assumptions.get("target_stage", "KYC Completed")
            uplift_pct = assumptions.get("conversion_uplift_pct", assumptions.get("calculated_conversion_uplift_pct", 15.0))
            invest_cost = assumptions.get("implementation_cost_inr", 250000.0)

            problem_statement = (
                f"Applicant drop-off at the '{target_stage}' stage is currently suppressing top-of-funnel throughput, "
                f"resulting in unrecovered marketing acquisition spend and lower loan disbursal conversion."
            )
            proposed_intervention = (
                f"Deploy automated flow optimization and user friction reduction at '{target_stage}', "
                f"targeting an estimated relative conversion uplift of +{uplift_pct}% with a fixed development budget of ₹{invest_cost:,.0f}."
            )
            primary_metric = f"{target_stage} Stage Conversion Rate (%)"

        elif sc_type == "risk_cutoff":
            fin = results.get("marginal_financials", {})
            prop = results.get("proposed_policy", {})
            base = results.get("baseline_policy", {})
            
            incremental_disbursals = prop.get("disbursal_count", 0) - base.get("disbursal_count", 0)
            incremental_volume = prop.get("total_exposure_inr", 0.0) - base.get("total_exposure_inr", 0.0)
            net_contribution = fin.get("net_contribution", 0.0)
            ecl = prop.get("expected_credit_loss_inr", 0.0) - base.get("expected_credit_loss_inr", 0.0)
            roi_ratio = round(fin.get("net_interest_margin_pct", 0.0), 2)
            cutoff = assumptions.get("new_pd_threshold", 0.14)

            problem_statement = (
                f"Overly restrictive credit underwriting cutoffs exclude viable near-prime applicants, "
                f"limiting book expansion despite healthy collection performance across core cohorts."
            )
            proposed_intervention = (
                f"Calibrate underwriting risk policy by moving the maximum Probability of Default (PD) cutoff to "
                f"{(cutoff * 100):.1f}%, capturing marginal volume while actively monitoring loss given default."
            )
            primary_metric = "Disbursal Volume & Net Interest Margin (NIM)"

        else: # channel_mix
            fin = results.get("marginal_financials", {})
            deltas = results.get("deltas", {})
            incremental_disbursals = deltas.get("disbursals_delta", 0)
            incremental_volume = deltas.get("volume_delta_inr", 0.0)
            net_contribution = fin.get("net_contribution", 0.0)
            ecl = fin.get("expected_credit_loss", 0.0)
            roi_ratio = round(fin.get("net_interest_margin_pct", 0.0), 2)

            problem_statement = (
                "Sub-optimal customer acquisition channel mix results in high blended CAC and volatile cohort delinquency."
            )
            proposed_intervention = (
                "Rebalance acquisition budget toward high-LTV organic and partner referral channels while de-risking high-CAC aggregator volume."
            )
            primary_metric = "Blended Customer Acquisition Cost (CAC) & Disbursal Conversion"

        recommendation = "PROCEED WITH EXPERIMENTAL ROLLOUT" if net_contribution > 0 else "HOLD / RE-EVALUATE ASSUMPTIONS"

        markdown_doc = f"""# PRODUCT DECISION BRIEF
## Scenario: {scenario.scenario_name}
**Category:** `{sc_type}` | **Author:** Associate Product Manager (APM) | **Status:** Recommendation Ready

---

### 1. Business Problem
{problem_statement}

### 2. Strategic Objective
Optimize digital lending funnel unit economics to achieve sustainable portfolio expansion without violating credit risk tolerance or inflating operational cost structures.

### 3. Baseline Performance
- **Disbursals:** Current cohort run-rate based on active loan origination.
- **Conversion Efficiency:** Benchmarked against historical 7-stage application funnel data.
- **Credit Loss Proxy:** Modelled baseline Expected Credit Loss (ECL = PD × LGD × EAD).

### 4. Proposed Intervention
{proposed_intervention}

### 5. Scenario Assumptions & Model Parameters
```json
{json.dumps(assumptions, indent=2)}
```

### 6. Estimated Financial & Volume Impact (Simulated)
| Metric | Projected Impact | Interpretation |
| :--- | :--- | :--- |
| **Incremental Disbursals** | **+{incremental_disbursals:,} loans** | Additional approved and disbursed borrowers |
| **Incremental Principal** | **₹{incremental_volume:,.2f}** | Expansion in gross loan book exposure |
| **Net P&L Contribution** | **₹{net_contribution:,.2f}** | Bottom-line profit after funding, opex & risk |
| **Expected Credit Loss (ECL)** | **₹{ecl:,.2f}** | Provisioning requirement (PD × LGD × EAD) |
| **Expected ROI / Margin** | **{roi_ratio}x** | Return on scenario development investment |

### 7. Key Operational & Credit Risks
1. **Adverse Selection:** Increasing throughput or expanding credit risk cutoffs could attract higher latent delinquency.
2. **Third-Party SLA Dependencies:** Technical downtime or API latency in bureau or KYC verification engines.
3. **Operational Capacity Constraints:** Frontline operations and manual verification teams may face bottlenecking.

### 8. Customer Experience Implications
- Seamless, friction-free onboarding journey reduces drop-offs and improves Net Promoter Score (NPS).
- Transparent communication of document requirements prevents frustration.

### 9. Primary Success Metrics
- **North Star Metric:** `{primary_metric}`
- **Disbursal Conversion Rate (%):** Overall journey completion rate.
- **Net Contribution Margin (INR):** Net financial realization post-disbursal.

### 10. Guardrail Metrics
- **First Payment Default (FPD):** Must remain strictly below 2.0%.
- **PAR30 Delinquency:** Must not exceed portfolio threshold of 5.5%.
- **Verification TAT:** Stage processing time must not degrade beyond baseline SLA.

### 11. Validation Plan (A/B Test Design)
- **Target Population:** 50/50 randomized split across new incoming loan applicants.
- **Test Duration:** 4 weeks (sufficient to capture mature 30-day first installment repayment data).
- **Statistical Significance Threshold:** 95% confidence interval (p < 0.05).

### 12. Final APM Recommendation & Caveats
**Executive Decision:** **{recommendation}**

> **Educational Simulation Notice:** This brief was generated dynamically by the LendLens Strategy Lab simulation engine. All projections are derived from synthetic assumptions and historical behavioral proxies. Final implementation requires formal approval from the Credit Committee and Compliance Risk Officers.
"""

        return {
            "scenario_id": scenario.id,
            "scenario_name": scenario.scenario_name,
            "scenario_type": sc_type,
            "recommendation": recommendation,
            "primary_metric": primary_metric,
            "financial_summary": {
                "incremental_disbursals": incremental_disbursals,
                "incremental_volume_inr": incremental_volume,
                "net_contribution_inr": net_contribution,
                "expected_credit_loss_inr": ecl,
                "roi_ratio": roi_ratio
            },
            "markdown_content": markdown_doc
        }
