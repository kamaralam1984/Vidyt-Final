# AI Systems Setup Guide (ViralBoost AI)

This document covers the two new AI systems:
1. Real Viral Prediction AI (Python FastAPI + ML model)
2. AI Support System (classification + auto-reply + chatbot endpoint)

## 1) Folder Structure

```txt
ai-services/
  viral_prediction/
    app/
      main.py
      model.py
      schemas.py
    models/
    requirements.txt
    README.md

app/api/
  ai/predict/route.ts
  ai/train/route.ts
  support/ai-reply/route.ts
  support/chat/route.ts
  support/tickets/route.ts

services/ai/
  viralPredictionService.ts
  supportAI.ts
  viralPredictor.ts

models/
  ViralPrediction.ts
  Ticket.ts
```

## 2) Environment Variables

Add to your runtime env:

```bash
VIRAL_AI_SERVICE_URL=http://127.0.0.1:8001
OPENAI_API_KEY=...
```

> `OPENAI_API_KEY` can also come from existing API config in DB.

## 3) Run Python AI Service

```bash
cd ai-services/viral_prediction
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

Health check:

```bash
curl http://127.0.0.1:8001/health
```

## 4) Train Model

### Option A - From Node API (recommended)

Use your existing app route:

```bash
POST /api/ai/train
```

This route now attempts Python service training first (using dataset from `ViralDataset`) and falls back to local trainer if Python service is unavailable.

### Option B - Direct Python service

```bash
POST http://127.0.0.1:8001/ai/train
```

Payload:
- `samples[]` with text + numeric fields + `viral_label`

## 5) Prediction Flow

### App API endpoint

```bash
POST /api/ai/predict
```

Expected input (high-level):
- title, description, hashtags
- duration, platform, category
- engagement (views/likes/comments)
- thumbnail/hook/title/trending scores

Response:
- `viralProbability` (0-100)
- `confidence` (0-100)
- `insights[]`
- `modelVersion`
- provider (`python_ml` or internal fallback)

## 6) Support AI Auto-reply

### New endpoint

```bash
POST /api/support/ai-reply
```

Flow:
1. Ticket text analyzed by OpenAI.
2. Classified into:
   - `billing`
   - `technical_issue`
   - `account`
   - `feature_request`
   - `other`
3. Confidence generated.
4. If confidence >= threshold, auto-reply saved.
5. Else ticket marked for admin handling.

### Automatic trigger on ticket creation

`POST /api/support/tickets` now:
- classifies ticket
- stores AI metadata
- auto replies if threshold met

### AI support toggle

Controlled via existing `PlatformControl` for `platform = "support"` with:
- `features.ai_auto_reply = true/false`

## 7) Optional Chatbot Endpoint

```bash
POST /api/support/chat
```

Simple context-aware support chat response backed by OpenAI classification/reply logic.

## 8) DB Schema Updates

### `Ticket`
- `category`
- `aiAutoReplied`
- `aiConfidence`
- `assignedToAdmin`
- `aiLastReplyAt`

### `ViralPrediction`
- optional metadata fields:
  - title/description/hashtags/platform/category/engagement
  - `sourceProvider`

## 9) Production Notes

- Run Python service as separate process/container.
- Keep `VIRAL_AI_SERVICE_URL` reachable from Node backend.
- Add retry/circuit-breaker at gateway level for high traffic.
- Schedule periodic retraining (cron/job queue) using `/api/ai/train`.
- Monitor:
  - prediction latency
  - support auto-reply precision
  - fallback rates to internal predictor
