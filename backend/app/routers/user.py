from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from .. import DATABASE, Pshemas
from ..db import get_db
from ..authLOGIK import (
    authenticate_user, create_access_token, create_refresh_token,
    save_token, revoke_token,
    get_password_hash, SECRET_KEY, ALGORITHM, get_current_user
)

users = APIRouter(prefix="/api/users", tags=["users"])


@users.get("/", response_model=List[Pshemas.UserResponse])
def get_all_users(
        course: Optional[int] = Query(None, description="Фильтр по курсу (если нужно)"),
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=100),
        db: Session = Depends(get_db),
        current_user: DATABASE.User = Depends(get_current_user)
):
    query = db.query(DATABASE.User)

    users = query.offset(skip).limit(limit).all()
    return users

@users.get("/{user_id}", response_model=Pshemas.UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: DATABASE.User = Depends(get_current_user)
):
    user = db.query(DATABASE.User).filter(DATABASE.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@users.get("/{user_id}/history", response_model=List[Pshemas.WatchHistoryResponse])
def get_user_history(
    user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: DATABASE.User = Depends(get_current_user)
):
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    history = db.query(DATABASE.WatchHistory).filter(
        DATABASE.WatchHistory.user_id == user_id
    ).order_by(
        DATABASE.WatchHistory.watched_at.desc()
    ).offset(skip).limit(limit).all()

    return history


#------------auth-------------

from jose import JWTError, jwt
from datetime import datetime

@users.post("/auth/login", response_model=Pshemas.TokenPair)
def login(
    login_data: Pshemas.LoginRequest,
    db: Session = Depends(get_db)
):
    user = authenticate_user(db, login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )

    access_token, access_expires = create_access_token({"sub": str(user.id)})
    refresh_token, refresh_expires = create_refresh_token({"sub": str(user.id)})

    save_token(db, access_token, "access", user.id, access_expires)
    save_token(db, refresh_token, "refresh", user.id, refresh_expires)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@users.post("/auth/refresh", response_model=Pshemas.TokenPair)
def refresh(
    refresh_data: Pshemas.RefreshRequest,
    db: Session = Depends(get_db)
):
    refresh_token = refresh_data.refresh_token

    db_token = db.query(DATABASE.Token).filter(
        DATABASE.Token.token == refresh_token,
        DATABASE.Token.token_type == "refresh",
        DATABASE.Token.is_revoked == False
    ).first()

    if not db_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    if db_token.expires_at < datetime.utcnow():
        db_token.is_revoked = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired"
        )

    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    old_access_tokens = db.query(DATABASE.Token).filter(
        DATABASE.Token.user_id == user_id,
        DATABASE.Token.token_type == "access",
        DATABASE.Token.is_revoked == False
    ).all()

    for token in old_access_tokens:
        token.is_revoked = True

    access_token, access_expires = create_access_token({"sub": user_id})
    new_refresh_token, refresh_expires = create_refresh_token({"sub": user_id})

    save_token(db, access_token, "access", int(user_id), access_expires)
    save_token(db, new_refresh_token, "refresh", int(user_id), refresh_expires)

    db_token.is_revoked = True
    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }

@users.post("/auth/logout")
def logout_user(refresh_data: Pshemas.RefreshRequest,
    db: Session = Depends(get_db)
):
    revoke_token(db, refresh_data.refresh_token)
    return {"message": "Successfully logged out"}

@users.get("/auth/me", response_model=Pshemas.UserResponse)
def get_me(
    current_user: DATABASE.User = Depends(get_current_user)
):
    return current_user


@users.post("/register", response_model=Pshemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register(
        user_data: Pshemas.UserCreate,
        db: Session = Depends(get_db)
):
    existing_email = db.query(DATABASE.User).filter(
        DATABASE.User.email == user_data.email
    ).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    existing_username = db.query(DATABASE.User).filter(
        DATABASE.User.username == user_data.username
    ).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")

    hashed_password = get_password_hash(user_data.password)
    db_user = DATABASE.User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user