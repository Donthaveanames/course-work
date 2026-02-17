from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
import uuid
from datetime import datetime

from .. import DATABASE, Pshemas
from ..db import get_db
from ..authLOGIK import get_current_user

def create_id() -> str:
    return str(uuid.uuid4())


comment = APIRouter(prefix="/api/video/{video_id}/comments", tags=["comment"])


@comment.get("/", response_model=List[Pshemas.CommentResponse])
def get_video_lessen_comments(
        video_id: int,
        skip: int = Query(0, ge=0),
        limit: int = Query(50, ge=1, le=100),
        db: Session = Depends(get_db)
):

    video = db.query(DATABASE.Video).filter(DATABASE.Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    comments = db.query(DATABASE.Comment).filter(
        DATABASE.Comment.video_id == video_id
    ).order_by(
        DATABASE.Comment.created_at.desc()
    ).offset(skip).limit(limit).all()

    result = []
    for comment in comments:
        result.append({
            "id": comment.id,
            "uuid": comment.uuid,
            "content": comment.content,
            "video_id": comment.video_id,
            "author_id": comment.author_id,
            "author_name": comment.author.username,
            "created_at": comment.created_at,
            "updated_at": comment.updated_at
        })

    return result


@comment.post("/create_comment", response_model=Pshemas.CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    video_id: int,
    comment_data: Pshemas.CommentCreate,
    db: Session = Depends(get_db),
    current_user: DATABASE.User = Depends(get_current_user)
):

    video = db.query(DATABASE.Video).filter(DATABASE.Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    new_comment = DATABASE.Comment(
        uuid=create_id(),
        content=comment_data.content,
        video_id=video_id,
        author_id=current_user.id
    )

    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    return {
        "id": new_comment.id,
        "uuid": new_comment.uuid,
        "content": new_comment.content,
        "video_id": new_comment.video_id,
        "author_id": current_user.id,
        "author_name": current_user.username,
        "created_at": new_comment.created_at,
        "updated_at": new_comment.updated_at
    }


@comment.post("/{comment_id}", response_model=Pshemas.CommentResponse)
def update_comment(
    comment_id: int,
    comment_data: Pshemas.CommentUpdate,
    db: Session = Depends(get_db),
    current_user: DATABASE.User = Depends(get_current_user)
):
    comment = db.query(DATABASE.Comment).filter(DATABASE.Comment.id == comment_id).first()

    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment.author_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only edit your own comments"
        )

    comment.content = comment_data.content
    comment.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(comment)

    return {
        "id": comment.id,
        "uuid": comment.uuid,
        "content": comment.content,
        "video_id": comment.video_id,
        "author_id": comment.author_id,
        "author_name": comment.author.username,
        "created_at": comment.created_at,
        "updated_at": comment.updated_at
    }



@comment.delete("/delete_comment/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: DATABASE.User = Depends(get_current_user)
):
    comment = db.query(DATABASE.Comment).filter(DATABASE.Comment.id == comment_id).first()

    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment.author_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only delete your own comments"
        )

    db.delete(comment)
    db.commit()

    return None
