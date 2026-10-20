# Risk, Limitations & Methodological Disclaimers

This document discloses known analytical assumptions, methodological limitations, and governance boundaries of the LendLens platform.

---

## 1. Educational Prototype Status
LendLens is an educational portfolio prototype developed to demonstrate senior product management, data science, financial modeling, and full-stack engineering proficiency.
- It **does not represent a commercial banking system** or store real customer personally identifiable information (PII).
- All records (customers, loan applications, bureau scores, bank accounts, and repayments) are synthetically generated using parameterized Monte Carlo stochastic generators (`data/generation/`).
- Outputs must not be used to conduct real-world credit underwriting or adverse credit actions.

---

## 2. Machine Learning Limitations

### 2.1 Stationarity & Macroeconomic Regime Shifts
The credit risk model (`v1.0.0-rf`) is trained on a generated cross-sectional synthetic dataset. In real-world banking environments, credit risk models experience distribution drift when macroeconomic conditions change (e.g. interest rate hikes, inflation spikes, systemic unemployment). The model must undergo regular population stability index (PSI) monitoring.

### 2.2 Survivorship Bias in Bureau Files
New-to-credit (thin-file) applicants who lack bureau histories have simulated proxy scores (default 610) assigned by the feature pipeline. In production underwriting, alternative credit scoring (utility payments, device telemetry, bank statement transaction cash flow) should be introduced.

### 2.3 Non-Causal Nature of Predictive Signals
Features identified as high importance (such as `debt_to_income_ratio` or `acquisition_channel`) represent predictive associations rather than guaranteed causal levers. Artificially forcing a user's DTI lower through debt restructuring does not guarantee immediate default risk reduction.

---

## 3. Strategy Lab Simulation Assumptions

### 3.1 Linear vs. Non-Linear Friction Elasticity
The Processing Time (TAT) simulator employs an assumed elasticity factor ($\epsilon = 0.20$), where each 10% reduction in processing TAT results in a 2.0% conversion uplift. In real product environments, friction reduction exhibits diminishing marginal returns beyond a certain threshold.

### 3.2 Fixed Cost of Capital Assumption
The financial contribution engine assumes a fixed institutional borrowing rate of 7.5% per annum and an origination fee of 2.0%. Real treasury funding costs fluctuate according to interbank benchmark rates and debt tenures.

### 3.3 Static Competitive Landscape
Strategy simulations assume market demand and competitor pricing remain unchanged when LendLens adjusts credit cutoffs or marketing channel budgets. In reality, loosening cutoffs may attract adverse selection from subprime borrowers rejected by competing digital lenders.
