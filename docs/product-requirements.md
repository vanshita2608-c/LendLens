# LendLens — Product Requirements Document (PRD)

**Document Version:** 1.0.0  
**Status:** Approved for Implementation  
**Product Category:** FinTech Product Intelligence & Digital Lending Analytics  
**Tagline:** *Turning Lending Data Into Smarter Product Decisions*

---

## 1. Executive Summary & Problem Statement

Digital lending organizations face a perpetual tension across five critical business vectors:
1. **Application Funnel Completion:** Maximizing the throughput of high-intent, eligible borrowers.
2. **Onboarding Friction:** Minimizing customer drop-off at document upload and KYC steps.
3. **Credit Risk Management:** Accurately predicting default probability without causing unnecessary rejections.
4. **Portfolio Performance:** Ensuring on-time repayments, controlling PAR30/PAR90 delinquency, and maximizing net interest margins.
5. **Sustainable Business Growth:** Balancing loan book expansion against operating costs, customer acquisition costs (CAC), and Expected Credit Losses (ECL).

Traditional business intelligence dashboards are backward-looking; they report historical metrics (e.g., drop-off rate, NPL percentage) but fail to connect these metrics to actionable product interventions or simulate their downstream financial consequences.

**LendLens** bridges this gap. It serves as an integrated decision-support platform designed to take a Product Manager or Risk Analyst through an evidence-based loop:
$$\text{Identify Friction} \longrightarrow \text{Investigate Root Cause} \longrightarrow \text{Simulate Intervention} \longrightarrow \text{Compare Strategies} \longrightarrow \text{Launch Controlled Experiment}$$

---

## 2. Target Personas & Jobs-To-Be-Done (JTBD)

| Persona | Role & Focus | Core JTBD |
| :--- | :--- | :--- |
| **Priya Sharma** | Senior Digital Lending PM | *"When funnel drop-off increases at KYC, I want to diagnose whether it's latency or UX friction, so I can launch an experiment to recover drop-offs without lowering approval quality."* |
| **Arjun Mehta** | Credit Risk & Underwriting Analyst | *"When adjusting the credit score cutoff or risk threshold, I want to simulate the trade-off between higher disbursal volume and incremental Expected Credit Loss (ECL)."* |
| **Rohan Verma** | VP of Lending / Product Leadership | *"When allocating quarterly marketing and product budgets, I want to compare alternative channel strategies and unit economics before committing capital."* |
| **Sneha Iyer** | Lending Operations Manager | *"When processing turnaround time (TAT) spikes, I want to isolate the operational bottlenecks across channels to manage verification capacity."* |

---

## 3. Product Architecture & Modules

### Module 1: Executive Overview (`/dashboard`)
- **Key Metrics:** Total Applications, Completion Rate, KYC Rate, Approval Rate, Offer Acceptance Rate, Disbursal Rate, Total Disbursed (INR), Median TAT, Delinquency (PAR30), Estimated ECL.
- **Visualizations:** Funnel summary, volume trends, channel performance, cohort delinquency.
- **Dynamic Filters:** Date range, acquisition channel (Organic, Paid Search, Aggregators, Partner Referrals), customer segments (Salaried, Self-Employed, New-to-Credit).
- **Proactive Insights:** Automated detection of anomalous conversion drops or processing time spikes.

### Module 2: Customer Journey & Funnel Intelligence (`/customer-journey`)
- **Configurable Funnel Stages:**
  1. *Application Started*
  2. *Details Submitted*
  3. *KYC Completed*
  4. *Credit Assessment Completed*
  5. *Loan Approved*
  6. *Offer Accepted*
  7. *Loan Disbursed*
- **Analytics:** Stage-to-stage conversion, cumulative drop-off, median duration per stage, drop-off reasons analysis.
- **Opportunity Workflow:** Ability to save an identified bottleneck directly as a product opportunity/hypothesis for experimentation.

### Module 3: Credit Intelligence & Model Explainability (`/credit-intelligence`)
- **Model Pipeline:** Logistic Regression baseline vs. Random Forest classifier predicting Default Probability ($PD$).
- **Diagnostics:** ROC-AUC, Precision-Recall, F1, Confusion Matrix, Brier calibration score.
- **Explainability:** Global feature importance and local SHAP explanations (income stability, debt-to-income, bureau inquiries, employment tenure).
- **Interactive Risk Assessor:** Simulated loan applicant scoring with real-time risk classification and risk factor breakdown.
- **Governance:** Explicit model card, limitations disclosure, and fairness considerations.

### Module 4: Lending Portfolio Analytics (`/portfolio`)
- **Metrics:** Active loans, outstanding balance, average ticket size, average tenure, on-time collection rate, PAR30/PAR60/PAR90 delinquency rates, realized loss rate.
- **Vintage Analysis:** Cohort-based delinquency curves by disbursal month.
- **Segment Exposure:** Portfolio concentration by customer segment, risk tier, and acquisition channel.

### Module 5: Strategy Lab — The Core Differentiator (`/strategy-lab`)
Interactive scenario modeling engine backed by deterministic financial mathematics:
- **Scenario Types:**
  1. *Funnel Improvement Simulation:* Model stage conversion uplift, operational workload impact, incremental disbursals, and implementation ROI.
  2. *Lending Risk Cutoff Sensitivity:* Adjust risk score cutoffs to evaluate the trade-off between volume expansion and Expected Credit Loss ($ECL = PD \times LGD \times EAD$).
  3. *Processing-Time Optimization:* Model TAT reduction elasticity on drop-off recovery.
  4. *Acquisition Channel Mix Optimization:* Shift channel allocations and simulate blended CAC and credit quality.
- **Financial Model Engine:**
  $$\text{Net Contribution} = \text{Expected Interest Income} - \text{Funding Cost} - \text{Acquisition/Operating Cost} - \text{Expected Credit Loss (ECL)}$$
- **Comparison & Brief:** Side-by-side scenario comparison, sensitivity sliders, and automated generation of structured Product Decision Briefs.

### Module 6: AI Product Copilot (`/copilot`)
- Natural-language query interface for querying lending metrics, funnel diagnostics, and strategy comparisons.
- **Security & Integrity:** Parameterized tool execution over approved analytics functions. No raw SQL generation.
- **Deterministic Fallback:** 100% operational when no LLM API key is present.

### Module 7: Product Experimentation (`/experiments`)
- Lifecycle tracking: Draft $\rightarrow$ Planned $\rightarrow$ Running $\rightarrow$ Completed $\rightarrow$ Evaluated.
- **Prioritization Framework:** RICE-based scoring (Reach, Impact, Confidence, Effort).
- Statistical hypothesis tracking with primary and guardrail metrics.

---

## 4. Non-Functional Requirements
- **Latency:** API responses under 150ms for analytical queries with indexed database tables.
- **Data Integrity:** Strict foreign keys, valid state transition constraints, zero target leakage in ML pipelines.
- **Aesthetics & UX:** Professional fintech palette (deep navy `#0B192C`, subtle slate borders `#E2E8F0`, responsive desktop/tablet layouts, INR currency formatting).
- **Privacy & Safety:** Strictly synthetic data. No PII. Clear educational disclaimers.
