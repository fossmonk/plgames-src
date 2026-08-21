from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, ForeignKey, DateTime, String
from sqlalchemy.sql import func
import base64
import json
import os
import hashlib
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from google.oauth2 import id_token
from google.auth.transport import requests
from typing import Optional

from ..database import get_db, engine
from ..models import Base, User

# Router Definition
router = APIRouter(prefix="/api/onam-2026", tags=["onam-2026"])

# --- Modular Database Model for the Seasonal Game ---
class OnamScore(Base):
    __tablename__ = 'onam_scores_2026'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    display_name = Column(String, nullable=True)
    level = Column(Integer, default=1)
    last_reached_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

# Create table if not exists (modular, no alembic needed)
OnamScore.__table__.create(bind=engine, checkfirst=True)

# --- Crypto Utilities for Session Token ---
CRYPTO_KEY_STR = os.getenv("PL_CRYPTO_KEY", "default_secret_key_for_dev_1234")
CRYPTO_KEY = hashlib.sha256(CRYPTO_KEY_STR.encode()).digest()

def encrypt_session(user_id: int) -> str:
    aesgcm = AESGCM(CRYPTO_KEY)
    nonce = os.urandom(12)
    data = json.dumps({"user_id": user_id}).encode('utf-8')
    ciphertext = aesgcm.encrypt(nonce, data, None)
    return base64.b64encode(nonce + ciphertext).decode('utf-8')

def decrypt_session(token: str) -> Optional[int]:
    try:
        aesgcm = AESGCM(CRYPTO_KEY)
        combined = base64.b64decode(token)
        nonce = combined[:12]
        ciphertext = combined[12:]
        decrypted = aesgcm.decrypt(nonce, ciphertext, None)
        data = json.loads(decrypted.decode('utf-8'))
        return data.get("user_id")
    except Exception:
        return None

# --- API Endpoints ---

GOOGLE_CLIENT_ID = os.getenv("VITE_GOOGLE_CLIENT_ID", "") # Provide via env var

class GoogleAuth(BaseModel):
    credential: str

@router.post("/auth/google")
async def google_auth(auth_data: GoogleAuth, db: Session = Depends(get_db)):
    try:
        if not GOOGLE_CLIENT_ID:
            # Fallback for local testing without proper CLIENT ID validation
            # DO NOT DO THIS IN PRODUCTION WITHOUT CLIENT_ID
            idinfo = id_token.verify_oauth2_token(auth_data.credential, requests.Request())
        else:
            idinfo = id_token.verify_oauth2_token(auth_data.credential, requests.Request(), GOOGLE_CLIENT_ID)
            
        google_id = idinfo['sub']
        email = idinfo.get('email')
        name = idinfo.get('name')
        
        # Get or create user
        user = db.query(User).filter(User.google_id == google_id).first()
        if not user:
            user = db.query(User).filter(User.email == email).first()
            if user:
                user.google_id = google_id
            else:
                user = User(email=email, google_id=google_id)
                db.add(user)
            db.commit()
            db.refresh(user)
            
        # Get or create score
        score = db.query(OnamScore).filter(OnamScore.user_id == user.id).first()
        if not score:
            score = OnamScore(user_id=user.id, level=1, display_name=name)
            db.add(score)
            db.commit()
        elif not score.display_name and name:
            score.display_name = name
            db.commit()
            
        token = encrypt_session(user.id)
        return {"token": token, "level": score.level}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid token: {e}")


@router.get("/state")
async def get_state(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization.split(" ")[1]
    user_id = decrypt_session(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    score = db.query(OnamScore).filter(OnamScore.user_id == user_id).first()
    if not score:
        score = OnamScore(user_id=user_id, level=1)
        db.add(score)
        db.commit()
        db.refresh(score)
        
        user = db.query(User).filter(User.id == user_id).first()
        fallback_name = user.email.split("@")[0] if user and user.email else f"Player_{user_id}"
        score.display_name = fallback_name
        db.commit()
        
    username = score.display_name if score.display_name else f"Player_{user_id}"
        
    return {"level": score.level, "username": username}

class UpdateProfile(BaseModel):
    display_name: str

@router.post("/update_profile")
async def update_profile(data: UpdateProfile, authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization.split(" ")[1]
    user_id = decrypt_session(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    score = db.query(OnamScore).filter(OnamScore.user_id == user_id).first()
    if not score:
        raise HTTPException(status_code=400, detail="State not found")
        
    if data.display_name and data.display_name.strip():
        score.display_name = data.display_name.strip()[:50] # Limit length
        db.commit()
        return {"success": True, "username": score.display_name}
    return {"success": False, "message": "Invalid name"}


class SubmitAnswer(BaseModel):
    answer: str

# Configurable level answers
LEVEL_ANSWERS = {
    1: "MAHABALI",
    2: "POOKALAM",
    3: "PAYASAM"
}

@router.post("/submit")
async def submit_answer(data: SubmitAnswer, authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401)
    token = authorization.split(" ")[1]
    user_id = decrypt_session(token)
    if not user_id:
        raise HTTPException(status_code=401)
        
    score = db.query(OnamScore).filter(OnamScore.user_id == user_id).first()
    if not score:
        raise HTTPException(status_code=400, detail="State not found")
        
    current_level = score.level
    expected_answer = LEVEL_ANSWERS.get(current_level)
    
    if not expected_answer:
        return {"correct": False, "message": "You have completed all available levels!"}
        
    if data.answer.strip().upper() == expected_answer.upper():
        score.level += 1
        db.commit()
        return {"correct": True, "level": score.level}
        
    return {"correct": False}


@router.get("/leaderboard")
async def get_leaderboard(db: Session = Depends(get_db)):
    # Order by level DESC, then last_reached_at ASC (earliest timestamp wins tie-breaker)
    scores = db.query(OnamScore, User).join(User, OnamScore.user_id == User.id).order_by(
        OnamScore.level.desc(), 
        OnamScore.last_reached_at.asc()
    ).limit(50).all()
    
    results = []
    for rank, (score, user) in enumerate(scores, 1):
        if score.display_name:
            username = score.display_name
        else:
            username = user.email.split("@")[0] if user.email else f"User_{user.id}"
            
        results.append({
            "rank": rank,
            "username": username,
            "level": score.level,
            "reached_at": score.last_reached_at.isoformat() if score.last_reached_at else None
        })
        
    return {"leaderboard": results}
