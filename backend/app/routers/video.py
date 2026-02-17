from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import uuid
from datetime import datetime


from .. import DATABASE, Pshemas
from ..db import get_db
from ..authLOGIK import get_current_user

def create_id() -> str:
    return str(uuid.uuid4())

video = APIRouter(prefix="/api/video", tags=["video"])

@video.get("/", response_model=List[Pshemas.VideoListResponse])
def get_list_video_lessen(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    sort_by: str = Query("created_at", regex="^(created_at|views_count|title)$"),
    order: str = Query("desc", regex="^(asc|desc)$"),
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(
        DATABASE.Video,
        func.count(DATABASE.Comment.id).label('comments_count')
    ).outerjoin(
        DATABASE.Comment, DATABASE.Comment.video_id == DATABASE.Video.id
    ).group_by(DATABASE.Video.id)

    if search:
        query = query.filter(DATABASE.Video.title.ilike(f"%{search}%"))

    if order == "desc":
        query = query.order_by(getattr(DATABASE.Video, sort_by).desc())
    else:
        query = query.order_by(getattr(DATABASE.Video, sort_by).asc())

    results = query.offset(skip).limit(limit).all()

    videos = []
    for video, comments_count in results:
        video_dict = {
            "id": video.id,
            "uuid": video.uuid,
            "title": video.title,
            "thumbnail_url": video.thumbnail_url,
            "duration": video.duration,
            "author_name": video.author.username,
            "views_count": video.views_count,
            "created_at": video.created_at,
            "comments_count": comments_count
        }
        videos.append(video_dict)

    return videos

@video.get("/{video_id}", response_model=Pshemas.VideoResponse)
def get_video_lessen(
    video_id: int,
    db: Session = Depends(get_db)
):
    video = db.query(DATABASE.Video).filter(DATABASE.Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    video.views_count += 1
    db.commit()

    comments_count = db.query(DATABASE.Comment).filter(
        DATABASE.Comment.video_id == video_id
    ).count()

    response = Pshemas.VideoResponse(
        id=video.id,
        uuid=video.uuid,
        title=video.title,
        description=video.description,
        video_url=video.video_url,
        thumbnail_url=video.thumbnail_url,
        duration=video.duration,
        author_id=video.author_id,
        author_name=video.author.username,
        views_count=video.views_count,
        likes_count=video.likes_count,
        created_at=video.created_at,
        updated_at=video.updated_at,
        comments_count=comments_count
    )

    return response


#Импортировать видео (сохранить ссылку на существующее видео)
@video.post("/import", response_model=Pshemas.VideoResponse, status_code=status.HTTP_201_CREATED)
def import_video_lessen(
    video_data: Pshemas.VideoCreate,
    db: Session = Depends(get_db),
    current_user: DATABASE.User = Depends(get_current_user)
):

    new_video = DATABASE.Video(
        uuid=create_id(),
        title=video_data.title,
        description=video_data.description,
        video_url=video_data.video_url,
        thumbnail_url=video_data.thumbnail_url,
        duration=video_data.duration,
        author_id=current_user.id
    )

    db.add(new_video)
    db.commit()
    db.refresh(new_video)

    return Pshemas.VideoResponse(
        id=new_video.id,
        uuid=new_video.uuid,
        title=new_video.title,
        description=new_video.description,
        video_url=new_video.video_url,
        thumbnail_url=new_video.thumbnail_url,
        duration=new_video.duration,
        author_id=current_user.id,
        author_name=current_user.username,
        views_count=0,
        likes_count=0,
        created_at=new_video.created_at,
        updated_at=new_video.updated_at,
        comments_count=0
    )


@video.post("/upload", response_model=Pshemas.VideoResponse, status_code=status.HTTP_201_CREATED)
def upload_video_lessen(
    video_data: Pshemas.VideoCreate,
    db: Session = Depends(get_db),
    current_user: DATABASE.User = Depends(get_current_user)
):
    # Здесь будет логика загрузки файлов, я бы хотела загружать файлы прямо с личного компьютера
    new_video = DATABASE.Video(
        uuid=create_id(),
        title=video_data.title,
        description=video_data.description,
        video_url=video_data.video_url,  # Это будет URL загруженного файла
        thumbnail_url=video_data.thumbnail_url,
        duration=video_data.duration,
        author_id=current_user.id
    )

    db.add(new_video)
    db.commit()
    db.refresh(new_video)

    return Pshemas.VideoResponse(
        id=new_video.id,
        uuid=new_video.uuid,
        title=new_video.title,
        description=new_video.description,
        video_url=new_video.video_url,
        thumbnail_url=new_video.thumbnail_url,
        duration=new_video.duration,
        author_id=current_user.id,
        author_name=current_user.username,
        views_count=0,
        likes_count=0,
        created_at=new_video.created_at,
        updated_at=new_video.updated_at,
        comments_count=0
    )

@video.delete("/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_video_lessen(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: DATABASE.User = Depends(get_current_user)
):
    video = db.query(DATABASE.Video).filter(DATABASE.Video.id == video_id).first()

    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    if video.author_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to delete this video"
        )

    db.delete(video)
    db.commit()

    return None

@video.put("/update", response_model=Pshemas.VideoResponse)
def update_video_lessen(
    video_id: int,
    video_data: Pshemas.VideoUpdate,
    db: Session = Depends(get_db),
    current_user: DATABASE.User = Depends(get_current_user)
):
    video = db.query(DATABASE.Video).filter(DATABASE.Video.id == video_id).first()

    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    if video.author_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to update this video"
        )

    update_data = video_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(video, field, value)

    video.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(video)

    comments_count = db.query(DATABASE.Comment).filter(
        DATABASE.Comment.video_id == video_id
    ).count()

    return Pshemas.VideoResponse(
        id=video.id,
        uuid=video.uuid,
        title=video.title,
        description=video.description,
        video_url=video.video_url,
        thumbnail_url=video.thumbnail_url,
        duration=video.duration,
        author_id=video.author_id,
        author_name=video.author.username,
        views_count=video.views_count,
        likes_count=video.likes_count,
        created_at=video.created_at,
        updated_at=video.updated_at,
        comments_count=comments_count
    )


@video.post("/{video_id}/watch", status_code=status.HTTP_200_OK)
def track_watch(
        video_id: int,
        watch_data: Pshemas.WatchHistoryCreate,
        db: Session = Depends(get_db),
        current_user: DATABASE.User = Depends(get_current_user)
):
    video = db.query(DATABASE.Video).filter(DATABASE.Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    existing = db.query(DATABASE.WatchHistory).filter(
        DATABASE.WatchHistory.user_id == current_user.id,
        DATABASE.WatchHistory.video_id == video_id
    ).first()

    if existing:
        existing.watch_duration = watch_data.watch_duration
        existing.completed = watch_data.completed
        existing.watched_at = datetime.utcnow()
    else:
        history = DATABASE.WatchHistory(
            user_id=current_user.id,
            video_id=video_id,
            watch_duration=watch_data.watch_duration,
            completed=watch_data.completed
        )
        db.add(history)

    db.commit()

    return {"message": "Watch history updated"}