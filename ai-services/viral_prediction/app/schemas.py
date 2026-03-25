from pydantic import BaseModel, Field
from typing import List, Optional, Literal


class EngagementData(BaseModel):
    views: float = 0
    likes: float = 0
    comments: float = 0


class PredictRequest(BaseModel):
    title: str = ""
    description: str = ""
    hashtags: List[str] = Field(default_factory=list)
    duration: float = 0
    platform: str = "youtube"
    category: str = "general"
    engagement: EngagementData = Field(default_factory=EngagementData)
    thumbnail_score: float = 50
    hook_score: float = 50
    title_score: float = 50
    trending_score: float = 50


class TrainSample(BaseModel):
    title: str = ""
    description: str = ""
    hashtags: List[str] = Field(default_factory=list)
    duration: float = 0
    platform: str = "youtube"
    category: str = "general"
    views: float = 0
    likes: float = 0
    comments: float = 0
    thumbnail_score: float = 50
    hook_score: float = 50
    title_score: float = 50
    trending_score: float = 50
    viral_label: Optional[int] = None


class TrainRequest(BaseModel):
    samples: List[TrainSample]
    min_samples: int = 100


class PredictResponse(BaseModel):
    viral_probability: float
    confidence: float
    suggestions: List[str]
    model_version: str
    provider: Literal["python_ml"] = "python_ml"
