from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import List
import hashlib
import os

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from openai import OpenAI

from .schemas import PredictRequest, TrainSample


MODEL_DIR = Path(__file__).resolve().parent.parent / "models"
MODEL_PATH = MODEL_DIR / "viral_model.pkl"
META_PATH = MODEL_DIR / "meta.pkl"
EMBED_DIM = 64


def _hashtags_to_text(hashtags: List[str]) -> str:
    return " ".join([h.replace("#", "").strip().lower() for h in hashtags if h.strip()])


def _build_text(title: str, description: str, hashtags: List[str]) -> str:
    return f"{title} {description} {_hashtags_to_text(hashtags)}".strip()


def _fallback_embedding(text: str) -> List[float]:
    # deterministic pseudo-embedding when external embedding API is unavailable
    digest = hashlib.sha256(text.encode("utf-8")).digest()
    seed = int.from_bytes(digest[:8], byteorder="big", signed=False)
    rng = np.random.default_rng(seed)
    vec = rng.normal(0, 1, EMBED_DIM)
    norm = np.linalg.norm(vec) or 1.0
    return (vec / norm).tolist()


def _openai_embedding(text: str) -> List[float] | None:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return None
    try:
        client = OpenAI(api_key=api_key)
        res = client.embeddings.create(model="text-embedding-3-small", input=text[:8000])
        emb = res.data[0].embedding if res.data else None
        if not emb:
            return None
        emb_np = np.array(emb[:EMBED_DIM], dtype=np.float32)
        if emb_np.shape[0] < EMBED_DIM:
            emb_np = np.pad(emb_np, (0, EMBED_DIM - emb_np.shape[0]), mode="constant")
        norm = np.linalg.norm(emb_np) or 1.0
        return (emb_np / norm).tolist()
    except Exception:
        return None


def _embedding(text: str) -> List[float]:
    emb = _openai_embedding(text)
    if emb is not None:
        return emb
    return _fallback_embedding(text)


def _engagement_rate(views: float, likes: float, comments: float) -> float:
    if views <= 0:
        return 0.0
    return ((likes + comments) / views) * 100.0


def _feature_row_from_request(payload: PredictRequest) -> dict:
    views = float(payload.engagement.views or 0)
    likes = float(payload.engagement.likes or 0)
    comments = float(payload.engagement.comments or 0)
    text = _build_text(payload.title, payload.description, payload.hashtags)
    row = {
        "duration": float(payload.duration or 0),
        "platform": str(payload.platform or "unknown").lower(),
        "category": str(payload.category or "general").lower(),
        "views": views,
        "likes": likes,
        "comments": comments,
        "engagement_rate": _engagement_rate(views, likes, comments),
        "thumbnail_score": float(payload.thumbnail_score or 0),
        "hook_score": float(payload.hook_score or 0),
        "title_score": float(payload.title_score or 0),
        "trending_score": float(payload.trending_score or 0),
    }
    emb = _embedding(text)
    for i in range(EMBED_DIM):
        row[f"emb_{i}"] = float(emb[i])
    return row


def _feature_row_from_sample(sample: TrainSample) -> dict:
    views = float(sample.views or 0)
    likes = float(sample.likes or 0)
    comments = float(sample.comments or 0)
    text = _build_text(sample.title, sample.description, sample.hashtags)
    row = {
        "duration": float(sample.duration or 0),
        "platform": str(sample.platform or "unknown").lower(),
        "category": str(sample.category or "general").lower(),
        "views": views,
        "likes": likes,
        "comments": comments,
        "engagement_rate": _engagement_rate(views, likes, comments),
        "thumbnail_score": float(sample.thumbnail_score or 0),
        "hook_score": float(sample.hook_score or 0),
        "title_score": float(sample.title_score or 0),
        "trending_score": float(sample.trending_score or 0),
    }
    emb = _embedding(text)
    for i in range(EMBED_DIM):
        row[f"emb_{i}"] = float(emb[i])
    return row


def _label_from_sample(sample: TrainSample) -> int:
    if sample.viral_label is not None:
        return int(sample.viral_label)
    # fallback heuristic label from engagement and views
    views = float(sample.views or 0)
    er = _engagement_rate(views, float(sample.likes or 0), float(sample.comments or 0))
    return int(views >= 10000 and er >= 3.0)


def _build_pipeline() -> Pipeline:
    numeric_cols = [
        "duration",
        "views",
        "likes",
        "comments",
        "engagement_rate",
        "thumbnail_score",
        "hook_score",
        "title_score",
        "trending_score",
    ] + [f"emb_{i}" for i in range(EMBED_DIM)]
    categorical_cols = ["platform", "category"]

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), numeric_cols),
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_cols),
        ],
        remainder="drop",
    )

    model = RandomForestClassifier(
        n_estimators=350,
        max_depth=22,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
    )

    return Pipeline([("preprocess", preprocessor), ("model", model)])


def train_model(samples: List[TrainSample]) -> dict:
    if len(samples) < 20:
        raise ValueError("At least 20 samples are required for training.")

    rows = [_feature_row_from_sample(s) for s in samples]
    labels = [_label_from_sample(s) for s in samples]

    df = pd.DataFrame(rows)
    y = np.array(labels)

    pipeline = _build_pipeline()
    pipeline.fit(df, y)

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH)

    model_version = f"rf_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    meta = {"model_version": model_version, "trained_at": datetime.utcnow().isoformat(), "samples": len(samples)}
    joblib.dump(meta, META_PATH)
    return meta


@dataclass
class PredictionResult:
    viral_probability: float
    confidence: float
    suggestions: List[str]
    model_version: str


def _confidence_from_prob(prob: float) -> float:
    # farther from 0.5 => higher confidence
    return round(min(0.99, abs(prob - 0.5) * 2 + 0.35), 4)


def _suggestions(payload: PredictRequest, probability: float) -> List[str]:
    out: List[str] = []
    if payload.hook_score < 55:
        out.append("Improve first 3 seconds hook with stronger opening statement.")
    if payload.thumbnail_score < 60:
        out.append("Increase thumbnail contrast and add focal subject for better CTR.")
    if payload.title_score < 60:
        out.append("Use clearer title intent with high-intent keywords.")
    if len(payload.hashtags) < 5:
        out.append("Use 8-15 relevant hashtags matching category and audience intent.")
    if payload.duration > 180:
        out.append("Try a tighter cut; shorter videos can increase retention.")
    if probability >= 0.75:
        out.append("Strong viral potential detected. Publish during peak audience window.")
    if probability < 0.45:
        out.append("Low viral potential. Rework title, hook, and packaging before publishing.")
    return out[:5]


def predict(payload: PredictRequest) -> PredictionResult:
    if not MODEL_PATH.exists():
        raise FileNotFoundError("Model not trained. Run train endpoint first.")

    pipeline: Pipeline = joblib.load(MODEL_PATH)
    meta = joblib.load(META_PATH) if META_PATH.exists() else {"model_version": "unknown"}
    model_version = str(meta.get("model_version", "unknown"))

    row = _feature_row_from_request(payload)
    df = pd.DataFrame([row])
    prob = float(pipeline.predict_proba(df)[0][1])

    return PredictionResult(
        viral_probability=round(prob * 100, 2),
        confidence=round(_confidence_from_prob(prob) * 100, 2),
        suggestions=_suggestions(payload, prob),
        model_version=model_version,
    )


def health() -> dict:
    return {
        "model_exists": MODEL_PATH.exists(),
        "meta_exists": META_PATH.exists(),
    }
