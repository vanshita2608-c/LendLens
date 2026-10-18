from fastapi import APIRouter, HTTPException, status
from app.schemas.credit import CreditPredictRequest, CreditPredictResponse, ModelMetricsResponse
from app.ml.prediction_service import CreditPredictionService

router = APIRouter()

@router.get("/model-metrics", response_model=ModelMetricsResponse)
async def get_model_metrics():
    """
    Returns champion and baseline model performance metrics,
    ROC-AUC, confusion matrices, and global feature importance.
    """
    try:
        return CreditPredictionService.get_model_metrics()
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve model metrics: {str(e)}"
        )

@router.post("/predict", response_model=CreditPredictResponse)
async def predict_credit_risk(request: CreditPredictRequest):
    """
    Assesses credit risk for a loan applicant using the trained Random Forest model.
    Returns:
    - Probability of Default (PD)
    - Risk Tier
    - Recommended Underwriting Action
    - Local SHAP Feature Importance Explanations
    - Responsible AI Disclaimer
    """
    try:
        result = CreditPredictionService.predict(
            monthly_income=request.monthly_income,
            credit_score=request.credit_score,
            debt_to_income_ratio=request.debt_to_income_ratio,
            requested_amount=request.requested_amount,
            requested_tenure_months=request.requested_tenure_months,
            customer_segment=request.customer_segment,
            acquisition_channel=request.acquisition_channel
        )
        return result
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Credit model artifact unavailable: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {str(e)}"
        )

@router.post("/explain", response_model=CreditPredictResponse)
async def explain_credit_risk(request: CreditPredictRequest):
    """
    Dedicated endpoint for credit decision explainability and SHAP waterfall attributions.
    Matches /predict for consistent decision support.
    """
    return await predict_credit_risk(request)
