# Viral Prediction AI Service

FastAPI-based ML service for viral prediction.

## Run locally

```bash
cd ai-services/viral_prediction
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

## Endpoints

- `GET /health`
- `POST /ai/train`
- `POST /ai/predict`

## Notes

- Model artifact is saved under `ai-services/viral_prediction/models/`.
- Node backend should call this service via `VIRAL_AI_SERVICE_URL`.
