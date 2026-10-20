# LendLens Product & Financial Metrics Glossary

This glossary documents exact mathematical formulas, numerators, denominators, cohort boundaries, and financial interpretations for all metrics on the LendLens platform.

---

## 1. Funnel & Customer Journey Metrics

### 1.1 Overall Funnel Conversion Rate
- **Definition:** The percentage of initiated loan applications that successfully reach disbursal.
- **Formula:**
  $$\text{Overall Conversion} = \left(\frac{\text{Total Loans Disbursed}}{\text{Total Applications Initiated in Cohort}}\right) \times 100$$
- **Denominator:** All applications created within the filtered time window and segment criteria.
- **Fintech Impact:** Primary macro efficiency metric measuring top-to-bottom funnel health.

### 1.2 Step-to-Step Conversion Rate
- **Definition:** Throughput efficiency between two adjacent funnel stages.
- **Formula:**
  $$\text{Step Conversion}_{i} = \left(\frac{\text{Applications Entering Stage } i}{\text{Applications Entering Stage } i-1}\right) \times 100$$
- **Caveat:** Does not mix distinct cohort denominators; strictly tracks progression of the selected cohort.

### 1.3 Stage Drop-Off Rate
- **Definition:** Percentage of users who exit the journey at a given stage without proceeding.
- **Formula:**
  $$\text{Drop-Off Rate} = 100\% - \text{Step Conversion Rate}$$

### 1.4 Median Processing Turnaround Time (TAT)
- **Definition:** Median duration in minutes/hours elapsed between `APPLICATION_STARTED` and a given milestone.
- **Calculation:** 50th percentile (median) of elapsed durations, eliminating distortions from extreme outliers.

---

## 2. Credit Risk & Underwriting Metrics

### 2.1 Probability of Default (PD)
- **Definition:** Statistical likelihood (0.0 to 1.0) that a borrower will experience 90+ Days Past Due (DPD) delinquency or write-off within 12 months post-disbursal.
- **Model:** Random Forest Classifier (`v1.0.0-rf`) using 15 application-time features.

### 2.2 Expected Credit Loss (ECL)
- **Definition:** Forward-looking risk provisioning required for credit losses.
- **Formula:**
  $$\text{ECL} = \text{Probability of Default (PD)} \times \text{Loss Given Default (LGD)} \times \text{Exposure at Default (EAD)}$$
- **Parameters:**
  - $\text{EAD} = \text{Disbursed Principal} \times 0.75$ (accounting for scheduled amortization).
  - $\text{LGD} = 45.0\%$ (unsecured retail personal loan benchmark recovery assumption).

### 2.3 Underwriting Trade-Off (Recall vs. Precision)
- **Rationale:** In digital retail lending, granting credit to a defaulting borrower (False Negative) causes a loss of principal + interest ($\sim$ ₹1.5 Lakhs), whereas rejecting a creditworthy borrower (False Positive) merely foregoes marginal interest spread ($\sim$ ₹18,000). The model is therefore tuned to achieve $>95\%$ Recall.

---

## 3. Lending Portfolio & Delinquency Metrics

### 3.1 Portfolio at Risk (PAR) Aging Buckets
- **PAR 30:** Percentage of outstanding principal with installments overdue between 31 and 60 days.
- **PAR 60:** Percentage of outstanding principal overdue between 61 and 90 days.
- **PAR 90+ (Default / Non-Performing Loan):** Principal overdue for 90+ days or classified as write-off.
- **Formula:**
  $$\text{PAR } X = \left(\frac{\text{Total Outstanding Principal in Overdue Bucket } X}{\text{Total Portfolio Outstanding Principal}}\right) \times 100$$

### 3.2 Collection Efficiency (On-Time Repayment Rate)
- **Definition:** The percentage of matured scheduled installments collected on or before the due date.
- **Formula:**
  $$\text{On-Time Repayment Rate} = \left(\frac{\text{Installments Paid On Time}}{\text{Total Scheduled Installments Past Due Date}}\right) \times 100$$

---

## 4. Strategy Lab Financial Calculations

### 4.1 Net P&L Contribution
- **Formula:**
  $$\text{Net Contribution} = \text{Gross Interest Income} + \text{Origination Fees} - \text{Funding Cost} - \text{Operating Costs} - \text{Expected Credit Loss}$$
- **Components:**
  - **Gross Interest:** $\text{Disbursed Principal} \times \text{APR} \times \text{Tenure Years}$
  - **Origination Fee:** $2.0\%$ upfront processing charge.
  - **Funding Cost:** $\text{Disbursed Principal} \times \text{Institutional Cost of Funds } (7.5\%) \times \text{Tenure Years}$
  - **Operating Costs:** Fixed implementation budget + variable per-applicant servicing costs.

### 4.2 Net Interest Margin (NIM %)
- **Formula:**
  $$\text{NIM} = \left(\frac{\text{Net Interest Spread}}{\text{Average Disbursed Principal}}\right) \times 100$$

---

## 5. Experiment Prioritization (RICE Framework)

- **Formula:**
  $$\text{RICE Priority Score} = \frac{\text{Reach} \times \text{Impact} \times (\text{Confidence} / 100)}{\text{Effort (Person-Weeks)}}$$
- **Scoring Scale:**
  - **Reach:** Estimated monthly affected user volume.
  - **Impact:** 1 (Minimal), 2 (Low), 3 (Medium), 4 (High), 5 (Massive).
  - **Confidence:** 50% (Low), 80% (Medium evidence), 100% (High statistical backing).
  - **Effort:** Total product/engineering time in person-weeks.
