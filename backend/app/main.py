from fastapi import FastAPI, Depends
from .database import get_db
from sqlalchemy.orm import Session
from . import models
from fastapi.middleware.cors import CORSMiddleware
import base64
import json
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import hashlib

# Initialize FastAPI
app = FastAPI()

# CORS configuration
origins = [
    "http://localhost:5173",
    "https://www.pinklungigames.com",
    "https://pinklungigames.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/games")
async def get_games(db: Session = Depends(get_db)):
    games = db.query(models.Game).all()
    return {"games": [
        {"id": g.id, "title": g.title, "type": g.category, "desc": g.description, "subtype": g.game_subtype} 
        for g in games
    ]}

@app.get("/api/play/{game_id}")
async def get_game_data(game_id: int, db: Session = Depends(get_db)):
    game = db.query(models.Game).filter(models.Game.id == game_id).first()
    if not game:
        return {"error": "Game not found"}, 404
    # Encrypt the content before sending
    encoded_content = encrypt_content(game.content)
    
    return {
        "id": game.id,
        "title": game.title,
        "type": game.game_type,
        "data": encoded_content,
        "subtype": game.game_subtype
    }

@app.get("/")
async def root():
    return {"message": "PINKLUNGI GAMES"}

# AES-GCM Encryption Logic
CRYPTO_KEY_STR = os.getenv("PL_CRYPTO_KEY")
# Ensure key is 32 bytes
CRYPTO_KEY = hashlib.sha256(CRYPTO_KEY_STR.encode()).digest()

def encrypt_content(content_dict: dict) -> str:
    aesgcm = AESGCM(CRYPTO_KEY)
    nonce = os.urandom(12)
    data = json.dumps(content_dict).encode('utf-8')
    ciphertext = aesgcm.encrypt(nonce, data, None)
    # Combine nonce and ciphertext then base64 encode
    return base64.b64encode(nonce + ciphertext).decode('utf-8')
