from enum import StrEnum

from pydantic import BaseModel, Field


class TaskStatus(StrEnum):
    PENDING = "pending"
    PARSING = "parsing"
    GENERATING = "generating"
    EDITING = "editing"
    FORMATTING = "formatting"
    REVIEWING = "reviewing"
    REWORKING = "reworking"
    COMPLETED = "completed"
    FAILED = "failed"


class AgentRole(StrEnum):
    GENERATOR = "content-generator"
    EDITOR = "content-editor"
    FORMATTER = "format-designer"
    REVIEWER = "quality-reviewer"


class AgentStatus(StrEnum):
    PENDING = "pending"
    WORKING = "working"
    IDLE = "idle"
    COMPLETED = "completed"
    FAILED = "failed"


class GenerateRequest(BaseModel):
    description: str = Field(..., min_length=1, max_length=2000)
    format: str = Field(default="docx", pattern="^(docx|pptx|xlsx|pdf)$")
    style_dna_id: str | None = None


class UploadResponse(BaseModel):
    task_id: str
    filename: str
    format: str
    size_bytes: int


class GenerateResponse(BaseModel):
    task_id: str
    status: TaskStatus


class DiffEntry(BaseModel):
    location: str
    original: str
    modified: str
    reason: str
    agent: AgentRole


class ScoreResult(BaseModel):
    vocabulary_naturalness: float = Field(ge=0, le=10)
    sentence_diversity: float = Field(ge=0, le=10)
    format_humanity: float = Field(ge=0, le=10)
    logical_coherence: float = Field(ge=0, le=10)
    domain_adaptation: float = Field(ge=0, le=10)
    total: float = Field(ge=0, le=10)
    passed: bool


class ReportData(BaseModel):
    task_id: str
    created_at: str
    input_format: str
    output_format: str
    rounds: int = 1
    scores: ScoreResult | None = None
    team_lead_summary: str = ""
    original_text: str = ""
    output_text: str = ""
    is_generation_mode: bool = False


class WSMessage(BaseModel):
    type: str
    task_id: str
    data: dict
