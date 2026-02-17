from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List
from datetime import datetime

from ..db import get_db
from .. import DATABASE, Pshemas
from ..authLOGIK import get_current_user

def get_chat_between_users(db: Session, user1_id: int, user2_id: int):
    return db.query(DATABASE.Chat).filter(
        or_(
            and_(DATABASE.Chat.user1_id == user1_id, DATABASE.Chat.user2_id == user2_id),
            and_(DATABASE.Chat.user1_id == user2_id, DATABASE.Chat.user2_id == user1_id)
        )
    ).first()


chat = APIRouter(prefix="/api/chats", tags=["chats"])

@chat.get("/my", response_model=List[Pshemas.ChatResponse])
def get_my_chats(
    db: Session = Depends(get_db),
    current_user: DATABASE.User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):

    chats = db.query(DATABASE.Chat).filter(
        or_(
            DATABASE.Chat.user1_id == current_user.id,
            DATABASE.Chat.user2_id == current_user.id
        )
    ).order_by(
        DATABASE.Chat.updated_at.desc()
    ).offset(skip).limit(limit).all()

    result = []
    for chat in chats:
        other_user = chat.user2 if chat.user1_id == current_user.id else chat.user1

        unread_count = db.query(DATABASE.Letter).filter(
            DATABASE.Letter.chat_id == chat.id,
            DATABASE.Letter.author_id != current_user.id,
            DATABASE.Letter.is_read == False
        ).count()

        last_letter = chat.letters[-1] if chat.letters else None

        result.append({
            "id": chat.id,
            "user1": chat.user1,
            "user2": chat.user2,
            "created_at": chat.created_at,
            "updated_at": chat.updated_at,
            "last_letter": last_letter,
            "unread_count": unread_count
        })

    return result


@chat.get("/with/{other_user_id}", response_model=Pshemas.ChatDetailResponse)
def get_or_create_chat(
    other_user_id: int,
    db: Session = Depends(get_db),
    current_user: DATABASE.User = Depends(get_current_user)
):

    if current_user.id == other_user_id:
        raise HTTPException(
            status_code=400,
            detail="Cannot create chat with yourself"
        )

    other_user = db.query(DATABASE.User).filter(DATABASE.User.id == other_user_id).first()
    if not other_user:
        raise HTTPException(status_code=404, detail="User not found")

    chat = get_chat_between_users(db, current_user.id, other_user_id)

    if not chat:
        chat = DATABASE.Chat(
            user1_id=current_user.id,
            user2_id=other_user_id
        )
        db.add(chat)
        db.commit()
        db.refresh(chat)

    letters = db.query(DATABASE.Letter).filter(
        DATABASE.Letter.chat_id == chat.id
    ).order_by(DATABASE.Letter.created_at.asc()).all()

    return {
        "id": chat.id,
        "user1": chat.user1,
        "user2": chat.user2,
        "created_at": chat.created_at,
        "updated_at": chat.updated_at,
        "letters": letters,
        "unread_count": 0
    }



@chat.delete("/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_chat(
    chat_id: int,
    db: Session = Depends(get_db),
    current_user: DATABASE.User = Depends(get_current_user)
):
    chat = db.query(DATABASE.Chat).filter(DATABASE.Chat.id == chat_id).first()

    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    if chat.user1_id != current_user.id and chat.user2_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You are not a participant of this chat"
        )

    db.delete(chat)
    db.commit()

    return None



letter = APIRouter(prefix="/api/chats/{chat_id}/letters", tags=["letter"])

@letter.get("/", response_model=List[Pshemas.LetterResponse])
def get_letters(
    chat_id: int,
    db: Session = Depends(get_db),
    current_user: DATABASE.User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):

    chat = db.query(DATABASE.Chat).filter(DATABASE.Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    if chat.user1_id != current_user.id and chat.user2_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You are not a participant of this chat"
        )

    letters = db.query(DATABASE.Letter).filter(
        DATABASE.Letter.chat_id == chat_id
    ).order_by(
        DATABASE.Letter.created_at.desc()
    ).offset(skip).limit(limit).all()

    for letter in letters:
        if letter.author_id != current_user.id and not letter.is_read:
            letter.is_read = True

    db.commit()

    return letters


@letter.post("/", response_model=Pshemas.LetterResponse, status_code=status.HTTP_201_CREATED)
def create_letter(
        chat_id: int,
        letter_data: Pshemas.LetterCreate,
        db: Session = Depends(get_db),
        current_user: DATABASE.User = Depends(get_current_user)
):
    chat = db.query(DATABASE.Chat).filter(DATABASE.Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    if chat.user1_id != current_user.id and chat.user2_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You are not a participant of this chat"
        )

    new_letter = DATABASE.Letter(
        chat_id=chat_id,
        author_id=current_user.id,
        content=letter_data.content
    )

    chat.updated_at = datetime.utcnow()

    db.add(new_letter)
    db.commit()
    db.refresh(new_letter)

    return new_letter


@letter.get("/{letter_id}", response_model=Pshemas.LetterResponse)
def get_letter(
        chat_id: int,
        letter_id: int,
        db: Session = Depends(get_db),
        current_user: DATABASE.User = Depends(get_current_user)
):
    chat = db.query(DATABASE.Chat).filter(DATABASE.Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    if chat.user1_id != current_user.id and chat.user2_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You are not a participant of this chat"
        )

    letter = db.query(DATABASE.Letter).filter(
        and_(
            DATABASE.Letter.id == letter_id,
            DATABASE.Letter.chat_id == chat_id
        )
    ).first()

    if not letter:
        raise HTTPException(status_code=404, detail="Letter not found")

    if letter.author_id != current_user.id and not letter.is_read:
        letter.is_read = True
        db.commit()

    return letter


@letter.put("/{letter_id}", response_model=Pshemas.LetterResponse)
def update_letter(
        chat_id: int,
        letter_id: int,
        letter_data: Pshemas.LetterCreate,
        db: Session = Depends(get_db),
        current_user: DATABASE.User = Depends(get_current_user)
):

    chat = db.query(DATABASE.Chat).filter(DATABASE.Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    letter = db.query(DATABASE.Letter).filter(
        and_(
            DATABASE.Letter.id == letter_id,
            DATABASE.Letter.chat_id == chat_id
        )
    ).first()

    if not letter:
        raise HTTPException(status_code=404, detail="Letter not found")

    if letter.author_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only edit your own messages"
        )

    letter.content = letter_data.content
    db.commit()
    db.refresh(letter)

    return letter


@letter.delete("/{letter_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_letter(
        chat_id: int,
        letter_id: int,
        db: Session = Depends(get_db),
        current_user: DATABASE.User = Depends(get_current_user)
):

    chat = db.query(DATABASE.Chat).filter(DATABASE.Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    letter = db.query(DATABASE.Letter).filter(
        and_(
            DATABASE.Letter.id == letter_id,
            DATABASE.Letter.chat_id == chat_id
        )
    ).first()

    if not letter:
        raise HTTPException(status_code=404, detail="Letter not found")

    if letter.author_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only delete your own messages"
        )

    db.delete(letter)
    db.commit()

    return None


@letter.post("/{letter_id}/read", response_model=Pshemas.LetterResponse)
def mark_as_read(
        chat_id: int,
        letter_id: int,
        db: Session = Depends(get_db),
        current_user: DATABASE.User = Depends(get_current_user)
):
    chat = db.query(DATABASE.Chat).filter(DATABASE.Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    letter = db.query(DATABASE.Letter).filter(
        and_(
            DATABASE.Letter.id == letter_id,
            DATABASE.Letter.chat_id == chat_id
        )
    ).first()

    if not letter:
        raise HTTPException(status_code=404, detail="Letter not found")

    if letter.author_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Cannot mark your own message as read"
        )

    letter.is_read = True
    db.commit()
    db.refresh(letter)

    return letter


@letter.get("/unread/count", response_model=int)
def get_unread_count(
        db: Session = Depends(get_db),
        current_user: DATABASE.User = Depends(get_current_user)
):

    chats = db.query(DATABASE.Chat).filter(
        or_(
            DATABASE.Chat.user1_id == current_user.id,
            DATABASE.Chat.user2_id == current_user.id
        )
    ).all()

    chat_ids = [chat.id for chat in chats]

    unread_count = db.query(DATABASE.Letter).filter(
        DATABASE.Letter.chat_id.in_(chat_ids),
        DATABASE.Letter.author_id != current_user.id,
        DATABASE.Letter.is_read == False
    ).count()

    return unread_count

