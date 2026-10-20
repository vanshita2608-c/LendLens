# Product & Engineering Decision Log (ADR)

This log documents major product and technical trade-offs evaluated during the engineering of LendLens.

---

## Decision 01: Next.js App Router Monorepo vs. Multi-Repo Microservices
- **Context:** The platform requires tightly synchronized frontend interfaces, financial calculation services, and database seed pipelines.
- **Decision:** Adopt a clean monorepo structure (`frontend/` + `backend/` + `ml/` + `data/` + `docs/`).
- **Trade-off:** Avoided premature microservice complexity and distributed network latency. Enabled rapid end-to-end integration testing and shared data contracts while keeping deployment independent.

---

## Decision 02: Strict Temporal Out-of-Time Train/Test Splitting
- **Context:** Standard random K-Fold cross-validation leaks macroeconomic future events into historical credit scoring models.
- **Decision:** Enforce a 75/25 chronological out-of-time (OOT) holdout split in `CreditFeaturePipeline`.
- **Trade-off:** Evaluates models on realistic prospective cohorts, preventing overly optimistic validation metrics.

---

## Decision 03: Prioritizing Recall Over Precision in Credit Scoring
- **Context:** Defaulting borrowers result in catastrophic unrecovered capital loss ($\sim$ ₹1.5L per loan), while rejecting a viable applicant only forfeits marginal interest spread.
- **Decision:** Calibrate the Random Forest classifier to achieve 96.3% default recall.
- **Trade-off:** Accepted a lower precision rate (25.1%) to prevent balance sheet default impairment.

---

## Decision 04: Controlled Tools Architecture for AI Copilot (Zero LLM SQL)
- **Context:** Free-form text-to-SQL LLMs hallucinate metrics and introduce SQL injection vulnerabilities.
- **Decision:** Confine the AI Copilot to an internal `ControlledAnalyticsToolkit` with parameterized service calls and deterministic fallback.
- **Trade-off:** Guaranteed zero metric hallucination and eliminated third-party API key dependencies.

---

## Decision 05: Native RICE Prioritization with Guardrail Metrics
- **Context:** Feature roadmaps frequently become subjective or biased by internal stakeholder influence.
- **Decision:** Institutionalize a standardized formula: `(Reach * Impact * Confidence%) / Effort` paired with explicit credit guardrail metrics (e.g. First Payment Default < 2.0%).
- **Trade-off:** Replaced arbitrary intuition with quantitative, evidence-grounded product prioritization.
