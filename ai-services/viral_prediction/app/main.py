from fastapi import FastAPI, HTTPException

from .model import predict, train_model, health
from .schemas import PredictRequest, PredictResponse, TrainRequest


app = FastAPI(title="ViralBoost AI Prediction Service", version="1.0.0")


@app.get("/health")
def get_health():
    return {"ok": True, **health()}


@app.post("/ai/predict", response_model=PredictResponse)
def post_predict(payload: PredictRequest):
    try:
        result = predict(payload)
        return PredictResponse(
            viral_probability=result.viral_probability,
            confidence=result.confidence,
            suggestions=result.suggestions,
            model_version=result.model_version,
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")


@app.post("/ai/train")
def post_train(payload: TrainRequest):
    if len(payload.samples) < payload.min_samples:
        raise HTTPException(
            status_code=400,
            detail=f"Need at least {payload.min_samples} samples, received {len(payload.samples)}",
        )
    try:
        meta = train_model(payload.samples)
        return {"success": True, **meta}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {e}")
