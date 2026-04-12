# ViralBoost AI - Production Upgrade Architecture

## Architecture Diagram (text)

```txt
Client Apps
   |
   v
Next.js API Layer (Node.js)
   |-- /api/ai/predict -----------+
   |-- /api/ai/train              |
   |-- /api/support/*             |
   |-- /api/admin/super/ai-monitoring
   |                              v
   |                      Redis + BullMQ Queue
   |                       (ai-jobs queue)
   |                              |
   +------------------------------+
                                  v
                           AI Worker (ts-node)
                                  |
              +-------------------+-------------------+
              |                                       |
              v                                       v
  Python FastAPI ML Service                    OpenAI APIs
  (/ai/predict, /ai/train)             (chat + embeddings + support AI)
              |
              v
           MongoDB
  (predictions, metrics, tickets, chat memory, job logs, model versions)
```

---

## Folder Structure Added

```txt
ai-services/viral_prediction/
  app/main.py
  app/model.py
  app/schemas.py
  requirements.txt
  README.md

app/api/
  ai/metrics/route.ts
  cron/ai-retrain/route.ts
  support/ai-reply/route.ts
  support/chat/route.ts
  support/chat/history/route.ts
  admin/super/ai-monitoring/route.ts
  admin/ai/models/rollback/route.ts

lib/
  redis.ts
  queue.ts
  cache.ts
  observability.ts

models/
  AIJobLog.ts
  ChatSession.ts
  ChatMessage.ts
  (updated) Ticket.ts, TicketReply.ts, ViralPrediction.ts, AIModelVersion.ts

workers/
  aiWorker.ts
```

---

## Implemented Systems Mapping

1. **AI Accuracy Tracking**
   - API: `GET /api/ai/metrics`
   - Outputs:
     - total predictions
     - MAE
     - RMSE
     - trend by date
     - model/provider breakdown

2. **AI Monitoring Dashboard Backend**
   - API: `GET /api/admin/super/ai-monitoring`
   - Data:
     - active model version
     - total predictions
     - queue state
     - support auto-replied vs escalated
     - confidence distribution
   - UI page:
     - `/admin/super/ai-monitoring`

3. **Auto Retraining**
   - Cron endpoint: `POST /api/cron/ai-retrain`
   - Weekly scheduler enqueue in `lib/jobScheduler.ts`
   - Model version activation + rollback:
     - `POST /api/admin/ai/models/rollback`

4. **Queue System (Redis + BullMQ)**
   - Queue: `ai-jobs`
   - Job types:
     - prediction
     - training
     - support_ai
   - Worker:
     - `workers/aiWorker.ts`
   - Retries + exponential backoff + failure logs

5. **Advanced NLP Upgrade**
   - Support AI uses:
     - OpenAI embeddings for semantic category prior
     - OpenAI chat response for final reply
   - Python viral service upgraded from TF-IDF to embedding-based text features
     (OpenAI embedding + deterministic fallback vector)

6. **Chatbot Memory**
   - Chat models:
     - `ChatSession`
     - `ChatMessage`
   - APIs:
     - `POST /api/support/chat`
     - `GET /api/support/chat/history`
   - Stores full conversation context + token usage

7. **AI Security and Rate Limiting**
   - Added per-user/IP rate limits on:
     - `/api/ai/predict`
     - `/api/ai/train`
     - `/api/ai/metrics`
     - `/api/support/ai-reply`
     - `/api/support/chat`
     - `/api/support/tickets`

8. **Observability**
   - Structured logging via `pino` (`lib/observability.ts`)
   - Queue/job failures persisted in `AIJobLog`
   - Monitoring APIs expose failure/success states

9. **Performance**
   - Redis cache for:
     - AI metrics
     - super admin AI monitoring payload
   - Pagination-ready architecture and bounded limits added to metrics route

10. **Testing**
   - Node built-in test harness added:
     - `npm test`
     - `tests/ai-systems.test.js`

---

## Integration Guide

### 1) Environment Variables

```bash
REDIS_URL=redis://127.0.0.1:6379
VIRAL_AI_SERVICE_URL=http://127.0.0.1:8001
OPENAI_API_KEY=...
AI_SUPPORT_QUEUE_ENABLED=true
AI_PREDICTION_QUEUE_ENABLED=true
CRON_SECRET=...
LOG_LEVEL=info
```

### 2) Run Services

```bash
# Next app
npm run dev

# AI worker
npm run dev:worker

# Python AI service
cd ai-services/viral_prediction
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### 3) Train + Verify

```bash
# Async training enqueue
POST /api/ai/train  { "async": true }

# Retrain by cron endpoint
POST /api/cron/ai-retrain (Authorization: Bearer CRON_SECRET)

# Check metrics
GET /api/ai/metrics

# Check admin monitoring
GET /api/admin/super/ai-monitoring
```

### 4) Rollback Model

```bash
POST /api/admin/ai/models/rollback
{
  "version": "model_v12"
}
```

---

## Backward Compatibility

- Existing APIs remain functional.
- Prediction route still provides internal fallback when Python service is unavailable.
- Ticket creation still works even when AI/queue is down.
- Queue and cache failures are non-blocking.
