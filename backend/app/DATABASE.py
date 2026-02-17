from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, Index, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from .db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    videos = relationship("Video", back_populates="author", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="author", cascade="all, delete-orphan")
    watch_history = relationship("WatchHistory", back_populates="user", cascade="all, delete-orphan")

    chats_as_user1 = relationship("Chat", foreign_keys="Chat.user1_id", back_populates="user1",
                                  cascade="all, delete-orphan")
    chats_as_user2 = relationship("Chat", foreign_keys="Chat.user2_id", back_populates="user2",
                                  cascade="all, delete-orphan")
    letters = relationship("Letter", back_populates="author", cascade="all, delete-orphan")


class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String, unique=True, index=True, nullable=False)  # UUID для публичных ссылок
    title = Column(String, nullable=False)
    description = Column(Text)
    video_url = Column(String, nullable=False)  # URL или путь к видео
    thumbnail_url = Column(String)  # Превью
    duration = Column(Integer)  # Длительность в секундах
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    views_count = Column(Integer, default=0)
    likes_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    author = relationship("User", back_populates="videos")
    comments = relationship("Comment", back_populates="video", cascade="all, delete-orphan")
    watch_history = relationship("WatchHistory", back_populates="video")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String, unique=True, index=True, nullable=False)
    content = Column(Text, nullable=False)
    video_id = Column(Integer, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Связи
    video = relationship("Video", back_populates="comments")
    author = relationship("User", back_populates="comments")


class WatchHistory(Base):
    __tablename__ = "watch_history"
    __table_args__ = (
        Index('idx_watch_history_user_video', 'user_id', 'video_id'),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    video_id = Column(Integer, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
    watched_at = Column(DateTime, default=datetime.utcnow)
    watch_duration = Column(Integer, default=0)  # сколько секунд просмотрено
    completed = Column(Boolean, default=False)  # досмотрел ли до конца

    user = relationship("User", back_populates="watch_history")
    video = relationship("Video", back_populates="watch_history")


class Token(Base):
    __tablename__ = "tokens"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, index=True, nullable=False)
    token_type = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_revoked = Column(Boolean, default=False)

    user = relationship("User", back_populates="tokens")


class Chat(Base):
    __tablename__ = "chats"
    __table_args__ = (
        UniqueConstraint('user1_id', 'user2_id', name='unique_chat_pair'),
        Index('idx_chat_users', 'user1_id', 'user2_id'),
    )

    id = Column(Integer, primary_key=True, index=True)
    user1_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    user2_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)

    user1 = relationship("User", foreign_keys=[user1_id], back_populates="chats_as_user1")
    user2 = relationship("User", foreign_keys=[user2_id], back_populates="chats_as_user2")
    letters = relationship("Letter", back_populates="chat", cascade="all, delete-orphan", order_by="Letter.created_at")

    @property
    def last_letter(self):
        if self.letters:
            return self.letters[-1]
        return None


class Letter(Base):
    __tablename__ = "letters"
    __table_args__ = (
        Index('idx_letter_chat_created', 'chat_id', 'created_at'),
    )

    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(Integer, ForeignKey("chats.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)  # прочитано ли сообщение
    created_at = Column(DateTime, default=datetime.utcnow)

    chat = relationship("Chat", back_populates="letters")
    author = relationship("User", back_populates="letters")
