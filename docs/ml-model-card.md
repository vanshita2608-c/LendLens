# Machine Learning Model Card: Credit Risk Default Prediction (v1.0.0-rf)

Conforms to standardized model card reporting practices (Mitchell et al.) for credit risk governance.

---

## 1. Model Details
- **Developer:** LendLens Product & Risk Intelligence Team
- **Model Architecture:** Random Forest Classifier (100 estimators, max depth 6, min samples split 10)
- **Baseline Model:** Logistic Regression (Standardized Features, L2 Regularization)
- **Version:** `v1.0.0-rf`
- **Trained Artifact:** `ml/artifacts/credit_model_v1.joblib`
- **Explainability Engine:** SHAP (SHapley Additive exPlanations) `TreeExplainer`

---

## 2. Intended Use & Governance
- **Primary Use:** Decision support signal for Associate Product Managers and retail credit underwriters to simulate credit loss exposure and risk cutoff adjustments.
- **Out-of-Scope / Prohibited Uses:**
  - Automated autonomous decline of retail consumers without human underwriting review.
  - Usage as a sole factor in adverse credit actions.
  - Application outside the retail unsecured personal loan domain.

---

## 3. Training & Evaluation Methodology
- **Dataset Size:** 10,000 synthetic retail credit applicants.
- **Split Strategy:** Strict **Temporal Out-of-Time (OOT)** split.
  - **In-Time Training:** 7,500 applications (first 75% chronologically).
  - **Out-of-Time Holdout:** 2,500 applications (subsequent 25% chronologically).
- **Zero Target Leakage Rule:** Only information available at application time (income, bureau score, existing DTI, requested loan size) is incorporated into the feature matrix. All repayment outcomes and delinquency records are excluded from training inputs.

---

## 4. Quantitative Performance Metrics

| Evaluation Metric | Logistic Regression (Baseline) | Random Forest (Champion) | Target Direction |
| :--- | :--- | :--- | :--- |
| **ROC-AUC** | 0.9256 | **0.9144** | Higher is better (Rank separation) |
| **Recall (Default Capture)** | 97.14% | **96.33%** | Higher is better (Loss prevention) |
| **Precision** | 21.60% | **25.08%** | Acceptable trade-off |
| **F1 Score** | 0.3534 | **0.3980** | Balanced harmonic mean |
| **Brier Score (Calibration)**| 0.2128 | **0.2094** | Lower is better (Probabilistic calibration) |

### Confusion Matrix (Out-of-Time Test Set: 2,500 Loans)
- **True Negatives (Non-defaults identified):** 1,550
- **False Positives (Good applicants flagged for review):** 705
- **False Negatives (Missed defaults):** 9 *(Only 9 out of 245 actual defaults missed)*
- **True Positives (Defaults caught):** 236

---

## 5. Global Feature Importance (Top Predictors)

```
1. credit_score                     [33.41%]  █████████████████████
2. debt_to_income_ratio             [17.06%]  ███████████
3. loan_to_income_ratio             [15.02%]  ██████████
4. estimated_emi_to_income_ratio     [8.37%]  █████
5. requested_amount                  [7.02%]  ████
6. monthly_income                    [6.41%]  ████
7. requested_tenure_months           [4.25%]  ███
8. customer_segment dummified        [4.82%]  ███
9. acquisition_channel dummified     [3.65%]  ██
```

---

## 6. Ethical Fairness & Demographic Safeguards
- **Protected Attributes:** Age, gender, religion, caste, marital status, and home address are **strictly omitted** from the training schema to prevent algorithmic disparate impact.
- **Fair Lending Principle:** Risk estimation is solely predicated on objective creditworthiness indicators (income, leverage, debt servicing capacity, and repayment track record).
