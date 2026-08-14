# Ponytail: basic schema for mock VC & Crowdfunding doc application flow. Upgrade to full DB models later.
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime

class DocumentTemplate(BaseModel):
    id: str
    name: str
    category: str
    description: str
    required_by: List[str]
    ai_validation_rule: str
    sample_format: str

class UploadedFile(BaseModel):
    id: str
    template_id: str
    file_name: str
    file_path: str
    status: Literal["pending", "validating", "rejected", "approved"] = "pending"
    ai_feedback: Optional[str] = None
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

class FundingPlatform(BaseModel):
    id: str
    name: str
    type: Literal["vc", "crowdfunding"]
    logo: str
    required_doc_ids: List[str]

class Application(BaseModel):
    id: str
    startup_name: str
    platforms: List[str] # ids of platforms
    status: Literal["draft", "validating", "ready", "submitted"] = "draft"
    files: List[UploadedFile] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
