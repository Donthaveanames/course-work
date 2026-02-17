from pydantic import BaseModel, EmailStr, ConfigDict, Field
from datetime import datetime
from typing import Optional, List


# ---------- User Schemas ----------
class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    password: Optional[str] = Field(None, min_length=6)


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    username: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------- Token Schemas ----------
class TokenBase(BaseModel):
    token: str
    token_type: str


class TokenCreate(TokenBase):
    user_id: int
    expires_at: datetime


class TokenResponse(TokenBase):
    id: int
    user_id: int
    expires_at: datetime
    created_at: datetime
    is_revoked: bool

    model_config = ConfigDict(from_attributes=True)


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


# ---------- Watch History Schemas ----------
class WatchHistoryBase(BaseModel):
    video_id: int
    watch_duration: Optional[int] = None


class WatchHistoryCreate(BaseModel):
    video_id: int
    watch_duration: int = Field(..., ge=0)
    completed: bool = False


class WatchHistoryResponse(BaseModel):
    id: int
    video_id: int
    video_title: str
    watched_at: datetime
    watch_duration: int
    completed: bool

    model_config = ConfigDict(from_attributes=True)


# ---------- Video Schemas ----------
class VideoBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=5000)
    video_url: str
    thumbnail_url: Optional[str] = None
    duration: Optional[int] = Field(None, ge=0)


class VideoCreate(VideoBase):
    pass


class VideoUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=5000)
    thumbnail_url: Optional[str] = None
    video_url: Optional[str] = None
    duration: Optional[int] = Field(None, ge=0)


class VideoResponse(VideoBase):
    id: int
    uuid: str
    author_id: int
    author_name: str
    views_count: int
    likes_count: int
    created_at: datetime
    updated_at: datetime
    comments_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class VideoListResponse(BaseModel):
    id: int
    uuid: str
    title: str
    thumbnail_url: Optional[str]
    duration: Optional[int]
    author_name: str
    views_count: int
    created_at: datetime
    comments_count: int = 0


# ---------- Comment Schemas ----------
class CommentBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)


class CommentCreate(CommentBase):
    pass


class CommentUpdate(CommentBase):
    pass


class CommentResponse(CommentBase):
    id: int
    uuid: str
    video_id: int
    author_id: int
    author_name: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------- User Schemas (для чатов) ----------
class UserMinimal(BaseModel):
    id: int
    username: str

    model_config = ConfigDict(from_attributes=True)


# ---------- Letter Schemas ----------
class LetterBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)


class LetterCreate(LetterBase):
    pass


class LetterResponse(LetterBase):
    id: int
    chat_id: int
    author_id: int
    author: UserMinimal
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------- Chat Schemas ----------
class ChatBase(BaseModel):
    pass


class ChatCreate(BaseModel):
    user2_id: int  # ID второго пользователя


class ChatResponse(BaseModel):
    id: int
    user1: UserMinimal
    user2: UserMinimal
    created_at: datetime
    updated_at: datetime
    last_letter: Optional[LetterResponse] = None
    unread_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class ChatDetailResponse(ChatResponse):
    letters: List[LetterResponse] = []


