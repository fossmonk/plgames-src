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

# --- Game Session API (Gatekeeper) ---
active_sessions = {}

class SessionStartResponse(BaseModel):
    session_id: str

@app.post("/api/play/{game_id}/start_session", response_model=SessionStartResponse)
async def start_session(game_id: int):
    session_id = str(uuid.uuid4())
    active_sessions[session_id] = {
        "game_id": game_id,
        "questions": {},
        "finished": False
    }
    return {"session_id": session_id}

@app.post("/api/session/{session_id}/start_question/{q_index}")
async def start_question(session_id: str, q_index: int):
    if session_id not in active_sessions:
        return {"error": "Invalid session"}
    
    if q_index not in active_sessions[session_id]["questions"]:
        active_sessions[session_id]["questions"][q_index] = time.time()
        
    return {"status": "success"}

@app.post("/api/session/{session_id}/finish")
async def finish_session(session_id: str):
    if session_id not in active_sessions:
        return {"error": "Invalid session"}
    active_sessions[session_id]["finished"] = True
    return {"status": "success"}

@app.get("/api/session/{session_id}/image/{q_index}")
async def get_image(session_id: str, q_index: int, blur: int = 0, db: Session = Depends(get_db)):
    if session_id not in active_sessions:
        return {"error": "Invalid session"}
        
    session_data = active_sessions[session_id]
    
    game = db.query(models.Game).filter(models.Game.id == session_data["game_id"]).first()
    if not game or not game.content or "questions" not in game.content:
        return {"error": "Game data not found"}
        
    questions = game.content["questions"]
    if q_index < 0 or q_index >= len(questions):
        return {"error": "Invalid question index"}
        
    question_data = questions[q_index]
    
    images_base64 = question_data.get("images_base64")
    
    if not images_base64:
        # Fallback to legacy
        image_group_id = question_data.get("image_group_id")
        if image_group_id:
            return {"error": "This quiz uses the deprecated UUID file system. Please regenerate."}
        image_urls = question_data.get("image_urls")
        if image_urls:
            return {"error": "Legacy quiz, no protected image."}
        return {"error": "No image data found"}

    if session_data.get("finished"):
        allowed_blur = 0
    else:
        start_time = session_data["questions"].get(q_index)
        if not start_time:
            allowed_blur = 20
        else:
            elapsed = time.time() - start_time
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
                
    # Determine the final blur to return
    # If the user requested a specific blur and it's >= allowed_blur, we can serve it.
    # (Higher blur value means MORE blurry, so they are allowed to ask for blurrier images).
    # Otherwise, return the allowed_blur.
    final_blur = blur if blur >= allowed_blur else allowed_blur
    
    b64_str = images_base64.get(str(final_blur))
    if not b64_str:
        return {"error": "Requested blur level not found"}
        
    image_bytes = base64.b64decode(b64_str)
    return Response(content=image_bytes, media_type="image/jpeg")
