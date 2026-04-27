from fastapi import FastAPI, Depends, Response
from .database import get_db
from sqlalchemy.orm import Session
from . import models
from fastapi.middleware.cors import CORSMiddleware
import uuid
import time
import base64
from pydantic import BaseModel
import json
import hmac
import hashlib
import os

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
    # Obfuscate the content before sending
    import json
    import base64
    content_str = json.dumps(game.content)
    encoded_content = base64.b64encode(content_str.encode('utf-8')).decode('utf-8')
    
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

SECRET_KEY = os.getenv("SECRET_KEY", "pinklungi_fallback_secret")

def create_signature(payload: str) -> str:
    return hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()

class TokenResponse(BaseModel):
    token: str

@app.post("/api/play/{game_id}/start_question/{q_index}", response_model=TokenResponse)
async def start_question(game_id: int, q_index: int):
    start_time = int(time.time())
    payload = f"{game_id}:{q_index}:{start_time}"
    signature = create_signature(payload)
    return {"token": f"{payload}:{signature}"}

@app.post("/api/play/{game_id}/finish", response_model=TokenResponse)
async def finish_session(game_id: int):
    payload = f"{game_id}:finished"
    signature = create_signature(payload)
    return {"token": f"{payload}:{signature}"}

@app.get("/api/image")
async def get_image(token: str, blur: int = 0, idx: int = -1, db: Session = Depends(get_db)):
    if not token:
        return {"error": "Missing token"}
        
    parts = token.split(":")
    if len(parts) == 4:
        # q_index format: game_id:q_index:start_time:signature
        game_id_str, q_index_str, start_time_str, signature = parts
        payload = f"{game_id_str}:{q_index_str}:{start_time_str}"
        is_finished = False
    elif len(parts) == 3 and parts[1] == "finished":
        # finish format: game_id:finished:signature
        game_id_str, _, signature = parts
        payload = f"{game_id_str}:finished"
        is_finished = True
        q_index_str = str(idx) # Must be provided in query param for finish token
    else:
        return {"error": "Invalid token format"}
        
    # Verify signature
    expected_sig = create_signature(payload)
    if not hmac.compare_digest(signature, expected_sig):
        return {"error": "Invalid signature"}
        
    try:
        game_id = int(game_id_str)
        q_index = int(q_index_str)
        if not is_finished:
            start_time = int(start_time_str)
    except ValueError:
        return {"error": "Invalid token data"}
        
    game = db.query(models.Game).filter(models.Game.id == game_id).first()
    if not game or not game.content or "questions" not in game.content:
        return {"error": "Game data not found"}
        
    questions = game.content["questions"]
    if q_index < 0 or q_index >= len(questions):
        return {"error": "Invalid question index"}
        
    question_data = questions[q_index]
    
    images_base64 = question_data.get("images_base64")
    if not images_base64:
        image_urls = question_data.get("image_urls")
        if image_urls:
            return {"error": "Legacy quiz, no protected image."}
        return {"error": "No image data found"}

    if is_finished:
        allowed_blur = 0
    else:
        GRACE_PERIOD = 5 # Allow pre-fetching 5s early
        elapsed = (time.time() - start_time) + GRACE_PERIOD
        
        if elapsed > 40:
            allowed_blur = 0
        elif elapsed > 30:
            allowed_blur = 5
        elif elapsed > 20:
            allowed_blur = 10
        elif elapsed > 10:
            allowed_blur = 15
        else:
            allowed_blur = 20
                
    final_blur = blur if blur >= allowed_blur else allowed_blur
    
    b64_str = images_base64.get(str(final_blur))
    if not b64_str:
        return {"error": "Requested blur level not found"}
        
    image_bytes = base64.b64decode(b64_str)
    return Response(
        content=image_bytes, 
        media_type="image/jpeg",
        headers={"Cache-Control": "public, max-age=20"}
    )
