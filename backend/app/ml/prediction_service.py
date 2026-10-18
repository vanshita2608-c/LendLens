import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
import shap

from ml.training.feature_pipeline import CreditFeaturePipeline
from data.generation.credit_and_loan_generator import CreditAndLoanGenerator

class CreditPredictionService:
    """
    Production-grade inference and explainability service for credit risk default prediction.
    Features:
    - Zero target leakage feature engineering
    - Random Forest probability of default (PD) inference
    - Risk tier classification and underwriting recommendation
    - Local SHAP attribution explainer for individual loan applicants
    - Global feature importance & model card metadata retrieval
    - Clear disclaimers adhering to responsible AI principles
    """
    _model = None
    _metrics = None
    _explainer = None

    MODEL_PATH = "ml/artifacts/credit_model_v1.joblib"
    METRICS_PATH = "ml/artifacts/model_metrics.json"

    @classmethod
    def get_model(cls):
        if cls._model is None:
            if not os.path.exists(cls.MODEL_PATH):
                raise FileNotFoundError(f"Credit risk model artifact not found at {cls.MODEL_PATH}. Run train_models.py first.")
            cls._model = joblib.load(cls.MODEL_PATH)
        return cls._model

    @classmethod
    def get_explainer(cls):
        if cls._explainer is None:
            model = cls.get_model()
            rf_classifier = model.named_steps['classifier']
            cls._explainer = shap.TreeExplainer(rf_classifier)
        return cls._explainer

    @classmethod
    def get_model_metrics(cls) -> Dict[str, Any]:
        if cls._metrics is None:
            if not os.path.exists(cls.METRICS_PATH):
                raise FileNotFoundError(f"Model metrics artifact not found at {cls.METRICS_PATH}.")
            with open(cls.METRICS_PATH, "r") as f:
                cls._metrics = json.load(f)
        return cls._metrics

    @classmethod
    def prepare_input_dataframe(
        cls,
        monthly_income: float,
        credit_score: float,
        debt_to_income_ratio: float,
        requested_amount: float,
        requested_tenure_months: int,
        customer_segment: str,
        acquisition_channel: str
    ) -> pd.DataFrame:
        annual_income = monthly_income * 12.0
        lti = requested_amount / annual_income if annual_income > 0 else 1.0

        estimated_emi = CreditAndLoanGenerator.calculate_monthly_emi(
            principal=requested_amount,
            annual_rate_pct=14.0,
            tenure_months=requested_tenure_months
        )
        emi_to_income = (estimated_emi / monthly_income) if monthly_income > 0 else 1.0

        data = {
            "monthly_income": [float(monthly_income)],
            "credit_score": [float(credit_score if credit_score > 0 else 610.0)],
            "debt_to_income_ratio": [float(debt_to_income_ratio)],
            "requested_amount": [float(requested_amount)],
            "requested_tenure_months": [int(requested_tenure_months)],
            "loan_to_income_ratio": [float(lti)],
            "estimated_emi_to_income_ratio": [float(emi_to_income)],
            "is_salaried": [1 if customer_segment == "Salaried" else 0],
            "is_self_employed": [1 if customer_segment == "Self-Employed" else 0],
            "is_new_to_credit": [1 if customer_segment == "New-to-Credit" else 0],
            "is_gig_worker": [1 if customer_segment == "Gig Worker" else 0],
            "channel_organic": [1 if acquisition_channel == "Organic" else 0],
            "channel_paid_search": [1 if acquisition_channel == "Paid Search" else 0],
            "channel_aggregators": [1 if acquisition_channel == "Aggregators" else 0],
            "channel_partner_referral": [1 if acquisition_channel == "Partner Referral" else 0]
        }

        return pd.DataFrame(data)[CreditFeaturePipeline.FEATURE_COLUMNS]

    @classmethod
    def predict(
        cls,
        monthly_income: float,
        credit_score: float,
        debt_to_income_ratio: float,
        requested_amount: float,
        requested_tenure_months: int,
        customer_segment: str,
        acquisition_channel: str
    ) -> Dict[str, Any]:
        """
        Calculates predicted default probability and returns local SHAP feature explanations.
        """
        model = cls.get_model()
        df_features = cls.prepare_input_dataframe(
            monthly_income=monthly_income,
            credit_score=credit_score,
            debt_to_income_ratio=debt_to_income_ratio,
            requested_amount=requested_amount,
            requested_tenure_months=requested_tenure_months,
            customer_segment=customer_segment,
            acquisition_channel=acquisition_channel
        )

        scaler = model.named_steps['scaler']
        rf = model.named_steps['classifier']

        # Scale features using pipeline scaler
        scaled_features = scaler.transform(df_features)
        scaled_features_df = pd.DataFrame(scaled_features, columns=CreditFeaturePipeline.FEATURE_COLUMNS)

        # Predict probability of default (class 1)
        probabilities = model.predict_proba(df_features)[0]
        pd_value = round(float(probabilities[1]), 4)

        # Risk tiering aligned with the 0.50 operational decision boundary
        if pd_value < 0.35:
            risk_tier = "Low Risk (Prime)"
            recommended_action = "Fast-Track Approval"
        elif pd_value <= 0.50:
            risk_tier = "Medium Risk (Near-Prime)"
            recommended_action = "Standard Underwriting & Income Verification"
        else:
            risk_tier = "High Risk (Sub-Prime)"
            recommended_action = "Enhanced Underwriting / High Collateral Requirement"

        # Local SHAP explanations
        explainer = cls.get_explainer()
        shap_vals = explainer.shap_values(scaled_features_df)
        
        # In multi-class or binary TreeExplainer:
        # If shape is (1, n_features, 2), index 1 is class 1 (default)
        if isinstance(shap_vals, list):
            class1_shap = shap_vals[1][0]
        elif len(np.shape(shap_vals)) == 3:
            class1_shap = shap_vals[0, :, 1]
        else:
            class1_shap = shap_vals[0]

        factors = []
        for feat_name, shap_score in zip(CreditFeaturePipeline.FEATURE_COLUMNS, class1_shap):
            raw_val = df_features[feat_name].iloc[0]
            factors.append({
                "feature": feat_name,
                "raw_value": float(raw_val),
                "shap_impact": round(float(shap_score), 4),
                "direction": "Risk Increasing" if shap_score > 0 else "Risk Decreasing"
            })

        # Sort factors by absolute SHAP impact
        factors.sort(key=lambda x: abs(x["shap_impact"]), reverse=True)

        top_risk_increasing = [f for f in factors if f["shap_impact"] > 0][:3]
        top_risk_decreasing = [f for f in factors if f["shap_impact"] < 0][:3]

        return {
            "model_version": "v1.0.0-rf",
            "predicted_probability_of_default": pd_value,
            "risk_tier": risk_tier,
            "recommended_action": recommended_action,
            "top_risk_increasing_factors": top_risk_increasing,
            "top_risk_decreasing_factors": top_risk_decreasing,
            "all_feature_attributions": factors,
            "disclaimer": "LendLens educational credit risk model (v1.0.0-rf). This output is an experimental risk estimate and decision-support signal, not an automated or final credit approval/rejection decision."
        }
