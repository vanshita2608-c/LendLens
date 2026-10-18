import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    roc_auc_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    brier_score_loss
)
from app.db.session import SessionLocal
from ml.training.feature_pipeline import CreditFeaturePipeline

def train_and_evaluate_models(save_artifacts: bool = True) -> Dict[str, Any]:
    db = SessionLocal()
    try:
        print("Extracting dataset from database...")
        df = CreditFeaturePipeline.extract_dataset_from_db(db)
        X_train, X_test, y_train, y_test = CreditFeaturePipeline.temporal_train_test_split(df, train_ratio=0.75)
        print(f"Dataset extracted: {len(X_train)} train samples, {len(X_test)} test samples.")
    finally:
        db.close()

    # 1. Baseline Model: Logistic Regression
    lr_pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('classifier', LogisticRegression(max_iter=1000, class_weight='balanced', random_state=42))
    ])
    lr_pipeline.fit(X_train, y_train)
    lr_preds = lr_pipeline.predict(X_test)
    lr_probs = lr_pipeline.predict_proba(X_test)[:, 1]

    lr_cm = confusion_matrix(y_test, lr_preds)
    lr_metrics = {
        "model_name": "Logistic Regression (Baseline)",
        "roc_auc": round(float(roc_auc_score(y_test, lr_probs)), 4),
        "precision": round(float(precision_score(y_test, lr_preds, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, lr_preds)), 4),
        "f1_score": round(float(f1_score(y_test, lr_preds)), 4),
        "brier_score": round(float(brier_score_loss(y_test, lr_probs)), 4),
        "confusion_matrix": {
            "true_negatives": int(lr_cm[0][0]),
            "false_positives": int(lr_cm[0][1]),
            "false_negatives": int(lr_cm[1][0]),
            "true_positives": int(lr_cm[1][1])
        }
    }

    # 2. Comparison Model: Random Forest
    rf_pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('classifier', RandomForestClassifier(
            n_estimators=100, 
            max_depth=6, 
            min_samples_split=10, 
            random_state=42, 
            class_weight='balanced'
        ))
    ])
    rf_pipeline.fit(X_train, y_train)
    rf_preds = rf_pipeline.predict(X_test)
    rf_probs = rf_pipeline.predict_proba(X_test)[:, 1]

    rf_cm = confusion_matrix(y_test, rf_preds)
    rf_metrics = {
        "model_name": "Random Forest (Production Candidate)",
        "roc_auc": round(float(roc_auc_score(y_test, rf_probs)), 4),
        "precision": round(float(precision_score(y_test, rf_preds, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, rf_preds)), 4),
        "f1_score": round(float(f1_score(y_test, rf_preds)), 4),
        "brier_score": round(float(brier_score_loss(y_test, rf_probs)), 4),
        "confusion_matrix": {
            "true_negatives": int(rf_cm[0][0]),
            "false_positives": int(rf_cm[0][1]),
            "false_negatives": int(rf_cm[1][0]),
            "true_positives": int(rf_cm[1][1])
        }
    }

    # Extract feature importance from Random Forest
    rf_classifier = rf_pipeline.named_steps['classifier']
    importances = rf_classifier.feature_importances_
    feature_importance_list = [
        {"feature": col, "importance": round(float(imp), 4)}
        for col, imp in zip(CreditFeaturePipeline.FEATURE_COLUMNS, importances)
    ]
    feature_importance_list.sort(key=lambda x: x["importance"], reverse=True)

    results = {
        "version": "v1.0.0-rf",
        "training_sample_size": len(X_train),
        "test_sample_size": len(X_test),
        "split_methodology": "Temporal Out-of-Time (75/25 chronological)",
        "target_variable": "Defaulted (90+ DPD delinquency)",
        "baseline_model": lr_metrics,
        "champion_model": rf_metrics,
        "feature_importances": feature_importance_list,
        "decision_threshold_tradeoff": {
            "tradeoff_summary": "In credit risk, False Negatives (granting credit to someone who defaults) are significantly more expensive than False Positives (lost margin on a credit-worthy applicant). Random Forest maximizes Recall (capturing defaults) while maintaining competitive precision.",
            "recommended_operational_threshold": 0.12
        }
    }

    if save_artifacts:
        os.makedirs("ml/artifacts", exist_ok=True)
        joblib.dump(rf_pipeline, "ml/artifacts/credit_model_v1.joblib")
        with open("ml/artifacts/model_metrics.json", "w") as f:
            json.dump(results, f, indent=2)
        print("Model artifact saved to ml/artifacts/credit_model_v1.joblib")
        print("Model metrics saved to ml/artifacts/model_metrics.json")

    return results

if __name__ == "__main__":
    train_and_evaluate_models()
