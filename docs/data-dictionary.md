# LendLens Relational Data Dictionary

This document details all 9 database tables, schema constraints, field descriptions, and business logic for the LendLens platform.

---

## 1. `customers`
Stores synthetic demographic and financial baseline attributes for loan applicants.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY, AUTOINCREMENT` | Internal customer identifier |
| `customer_reference` | `VARCHAR(50)` | `UNIQUE, NOT NULL, INDEX` | Anonymized synthetic reference (e.g. `CUST-10492`) |
| `customer_segment` | `VARCHAR(50)` | `NOT NULL, INDEX` | `Salaried`, `Self-Employed`, `Gig Worker`, `New-to-Credit` |
| `income_band` | `VARCHAR(50)` | `NOT NULL` | Income bucket (e.g. `Tier 1 (Above ₹1.2L)`) |
| `monthly_income` | `FLOAT` | `NOT NULL` | Net monthly verified income in INR |
| `credit_score` | `INTEGER` | `NOT NULL, INDEX` | Bureau score (300 to 900; 0 for thin-file) |
| `debt_to_income_ratio` | `FLOAT` | `NOT NULL` | Ratio of existing monthly debt payments to income |
| `created_at` | `DATETIME` | `NOT NULL, INDEX` | Customer profile creation timestamp |

---

## 2. `loan_applications`
Tracks individual loan application submissions.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY, AUTOINCREMENT` | Internal application identifier |
| `customer_id` | `INTEGER` | `FOREIGN KEY(customers.id), NOT NULL` | Associated applicant |
| `requested_amount` | `FLOAT` | `NOT NULL` | Principal amount requested by applicant |
| `requested_tenure_months` | `INTEGER` | `NOT NULL` | Requested loan duration in months (6 - 60) |
| `acquisition_channel` | `VARCHAR(50)` | `NOT NULL, INDEX` | `Organic`, `Paid Search`, `Aggregators`, `Partner Referral` |
| `application_status` | `VARCHAR(50)` | `NOT NULL, INDEX` | `In_Progress`, `Approved`, `Rejected`, `Abandoned`, `Disbursed` |
| `created_at` | `DATETIME` | `NOT NULL, INDEX` | Application initiation timestamp |
| `updated_at` | `DATETIME` | `NOT NULL` | Last stage update timestamp |

---

## 3. `application_events`
Audit trail of timestamped customer journey events used for funnel analysis.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY, AUTOINCREMENT` | Internal event identifier |
| `application_id` | `INTEGER` | `FOREIGN KEY(loan_applications.id), NOT NULL` | Target application |
| `event_type` | `VARCHAR(50)` | `NOT NULL, INDEX` | Event enum: `APPLICATION_STARTED`, `DETAILS_SUBMITTED`, `KYC_COMPLETED`, etc. |
| `event_timestamp` | `DATETIME` | `NOT NULL, INDEX` | Exact UTC timestamp of event completion |
| `event_metadata` | `TEXT` | `NULLABLE` | JSON metadata (e.g. processing duration, device) |

---

## 4. `credit_assessments`
Stores algorithmic credit default estimates.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY, AUTOINCREMENT` | Assessment record identifier |
| `application_id` | `INTEGER` | `FOREIGN KEY(loan_applications.id), NOT NULL` | Assessed loan application |
| `model_version` | `VARCHAR(50)` | `NOT NULL` | ML model version tag (e.g. `v1.0.0-rf`) |
| `predicted_probability_of_default` | `FLOAT` | `NOT NULL, INDEX` | Estimated PD (0.0 to 1.0) |
| `assessment_timestamp` | `DATETIME` | `NOT NULL` | Model scoring timestamp |
| `assessment_metadata` | `TEXT` | `NULLABLE` | SHAP feature contributions JSON |

---

## 5. `loan_offers`
Generated formal credit offers presented to eligible applicants.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY, AUTOINCREMENT` | Offer identifier |
| `application_id` | `INTEGER` | `FOREIGN KEY(loan_applications.id), NOT NULL` | Target application |
| `offered_amount` | `FLOAT` | `NOT NULL` | Sanctioned loan principal (INR) |
| `offered_tenure_months` | `INTEGER` | `NOT NULL` | Approved tenure duration |
| `annual_interest_rate` | `FLOAT` | `NOT NULL` | Annual Percentage Rate (APR %) |
| `monthly_emi` | `FLOAT` | `NOT NULL` | Monthly installment calculated via reducing balance |
| `offer_status` | `VARCHAR(50)` | `NOT NULL` | `Generated`, `Accepted`, `Declined`, `Expired` |
| `created_at` | `DATETIME` | `NOT NULL` | Offer creation timestamp |

---

## 6. `loans`
Active and matured disbursed personal loans.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY, AUTOINCREMENT` | Loan account identifier |
| `application_id` | `INTEGER` | `FOREIGN KEY(loan_applications.id), NOT NULL` | Originating application |
| `principal_amount` | `FLOAT` | `NOT NULL` | Disbursed loan amount (INR) |
| `annual_interest_rate` | `FLOAT` | `NOT NULL` | Fixed interest rate APR % |
| `tenure_months` | `INTEGER` | `NOT NULL` | Loan tenure in months |
| `disbursal_date` | `DATETIME` | `NOT NULL, INDEX` | Loan disbursement date |
| `loan_status` | `VARCHAR(50)` | `NOT NULL, INDEX` | `Active`, `Delinquent_30`, `Delinquent_60`, `Defaulted`, `Closed` |
| `outstanding_principal` | `FLOAT` | `NOT NULL` | Remaining unpaid principal balance |

---

## 7. `repayments`
Repayment schedule and historical collection outcomes.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY, AUTOINCREMENT` | Installment record identifier |
| `loan_id` | `INTEGER` | `FOREIGN KEY(loans.id), NOT NULL` | Associated loan |
| `installment_number` | `INTEGER` | `NOT NULL` | Installment index (1 to N) |
| `due_date` | `DATETIME` | `NOT NULL, INDEX` | Scheduled payment due date |
| `payment_date` | `DATETIME` | `NULLABLE` | Actual date customer paid |
| `amount_due` | `FLOAT` | `NOT NULL` | Monthly installment amount (INR) |
| `amount_paid` | `FLOAT` | `NOT NULL` | Actual amount received (INR) |
| `repayment_status` | `VARCHAR(50)` | `NOT NULL, INDEX` | `Paid_On_Time`, `Paid_Late`, `Missed`, `Pending` |

---

## 8. `scenarios`
Persisted Strategy Lab simulation models.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY, AUTOINCREMENT` | Scenario identifier |
| `scenario_name` | `VARCHAR(100)` | `NOT NULL, INDEX` | User-defined scenario title |
| `description` | `TEXT` | `NULLABLE` | Strategic hypothesis and objectives |
| `scenario_type` | `VARCHAR(50)` | `NOT NULL, INDEX` | `funnel_improvement`, `risk_cutoff`, `tat_optimization`, `channel_mix` |
| `assumptions_json` | `TEXT` | `NOT NULL` | Serialized input parameter assumptions |
| `calculated_results_json` | `TEXT` | `NOT NULL` | Serialized simulation outcomes & P&L metrics |
| `created_at` | `DATETIME` | `NOT NULL, INDEX` | Creation timestamp |
| `updated_at` | `DATETIME` | `NOT NULL` | Recalculation timestamp |

---

## 9. `experiments`
Product growth opportunities, A/B testing definitions, and RICE priority rankings.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY, AUTOINCREMENT` | Experiment identifier |
| `experiment_name` | `VARCHAR(150)` | `NOT NULL, INDEX` | Experiment title |
| `problem_statement` | `TEXT` | `NOT NULL` | Observed friction or drop-off problem |
| `hypothesis` | `TEXT` | `NOT NULL` | Structured testable hypothesis |
| `target_segment` | `VARCHAR(100)` | `NOT NULL` | Customer segment target |
| `primary_metric` | `VARCHAR(100)` | `NOT NULL` | North Star success KPI |
| `guardrail_metrics` | `TEXT` | `NULLABLE` | Credit and operational safety boundaries |
| `reach_score` | `FLOAT` | `DEFAULT 500.0` | R: Monthly eligible user volume |
| `impact_score` | `FLOAT` | `DEFAULT 3.0` | I: Expected metric multiplier (1 - 5) |
| `confidence_score` | `FLOAT` | `DEFAULT 80.0` | C: Confidence in evidence (10% - 100%) |
| `effort_score` | `FLOAT` | `DEFAULT 2.0` | E: Person-weeks to build (0.5 - 12) |
| `rice_priority_score` | `FLOAT` | `NOT NULL, INDEX` | Score: `(R * I * C%) / E` |
| `experiment_status` | `VARCHAR(50)` | `DEFAULT 'Planned'` | `Draft`, `Planned`, `Running`, `Completed` |
