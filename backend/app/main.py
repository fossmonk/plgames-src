from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio

# Initialize FastAPI
app = FastAPI()

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://www.pinklungigames.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GAMES_DB = [
    {"id": 1, "title": "Absurd Trivia", "type": "Silly Quizzes", "desc": "Questionable facts."},
    {"id": 2, "title": "Who Said That?", "type": "Silly Quizzes", "desc": "Identify the chaotic quote."},
    {"id": 3, "title": "Logic Grid", "type": "Puzzles", "desc": "Connect the dots."},
    {"id": 4, "title": "Sudoku Pro", "type": "Puzzles", "desc": "Numbers, numbers everywhere."},
    {"id": 5, "title": "Live Showdown", "type": "Live Quizzes", "desc": "Compete live!"},
    {"id": 6, "title": "Onam Showdown", "type": "Live Quizzes", "desc": "The Ultimate Onam Quiz"},
]

QUIZ_CONTENT = {
    6: {  # Onam Showdown
        "title": "Onam Showdown",
        "questions": [
            {"id": 1, "text": "What is the name of the floral carpet laid during Onam?", "options": ["Pookalam", "Rangoli", "Kolam", "Alpana"], "correct": 0},
            {"id": 2, "text": "Which legendary King is welcomed during Onam?", "options": ["Mahabali", "Vikramaditya", "Ashoka", "Harishchandra"], "correct": 0},
            {"id": 3, "text": "What is the traditional boat race called?", "options": ["Vallam Kali", "Boat Dance", "Onam Race", "Kerala Cup"], "correct": 0}
        ]
    }
}

@app.get("/api/games")
async def get_games():
    return {"games": GAMES_DB}

@app.get("/api/quiz/{game_id}")
async def get_quiz(game_id: int):
    quiz = QUIZ_CONTENT.get(game_id)
    if not quiz:
        return {"error": "Quiz not found"}, 404
    return quiz

@app.get("/")
async def root():
    return {"message": "Game Portal API Running"}