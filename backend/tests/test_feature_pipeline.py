import pytest
from app.db.session import SessionLocal
from ml.training.feature_pipeline import CreditFeaturePipeline

def test_feature_pipeline_extraction_and_leakage():
    db = SessionLocal()
    try:
        df = CreditFeaturePipeline.extract_dataset_from_db(db)
        assert len(df) > 0
        assert "target_default" in df.columns
        assert set(CreditFeaturePipeline.FEATURE_COLUMNS).issubset(df.columns)

        # Check target distribution
        unique_targets = set(df["target_default"].unique())
        assert unique_targets.issubset({0, 1})

        # Check chronological ordering
        assert df["created_at"].is_monotonic_increasing
    finally:
        db.close()

def test_temporal_train_test_split():
    db = SessionLocal()
    try:
        df = CreditFeaturePipeline.extract_dataset_from_db(db)
        X_train, X_test, y_train, y_test = CreditFeaturePipeline.temporal_train_test_split(df, 0.70)
        
        assert len(X_train) == int(len(df) * 0.70)
        assert len(X_test) == len(df) - len(X_train)
        assert len(y_train) == len(X_train)
        assert len(y_test) == len(X_test)

        # Confirm non-empty features
        assert not X_train.isnull().any().any()
        assert not X_test.isnull().any().any()
    finally:
        db.close()
