from fastapi import FastAPI, Depends
from .database import get_db
from sqlalchemy.orm import Session
from . import models
from fastapi.middleware.cors import CORSMiddleware

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
        {"id": g.id, "title": g.title, "type": g.category, "desc": g.description} 
        for g in games
    ]}

@app.get("/api/play/{game_id}")
async def get_game_data(game_id: int, db: Session = Depends(get_db)):
    game = db.query(models.Game).filter(models.Game.id == game_id).first()
    if not game:
        return {"error": "Game not found"}, 404
    return {
        "id": game.id,
        "title": game.title,
        "type": game.game_type,
        "data": game.content 
    }

@app.get("/")
async def root():
    return {"message": "PINKLUNGI GAMES"}