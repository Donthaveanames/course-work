from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import engine
from . import DATABASE

from fastapi.responses import JSONResponse
from .routers import user, video, letter, comment

DATABASE.Base.metadata.create_all(bind=engine)

dwfu = FastAPI(title="DWFU")

# CORS
dwfu.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


dwfu.include_router(user.users)
dwfu.include_router(video.video)
dwfu.include_router(letter.chat)
dwfu.include_router(letter.letter)
dwfu.include_router(comment.comment)

@dwfu.get("/")
def root():
    return {"message": "API is running"}



