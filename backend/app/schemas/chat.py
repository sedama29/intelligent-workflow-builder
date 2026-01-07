"""
Chat Pydantic schemas
"""
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class ChatMessageCreate(BaseModel):
    """Schema for creating a chat message"""
    workflow_id: int
    session_id: str
    message: str
    role: str = "user"


class ChatMessageResponse(BaseModel):
    """Schema for chat message response"""
    id: int
    workflow_id: Optional[int]
    session_id: str
    role: str
    message: str
    metadata: Optional[Dict[str, Any]]
    created_at: datetime
    
    class Config:
        from_attributes = True

