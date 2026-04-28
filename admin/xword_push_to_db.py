import json
import os
import sys
from sqlalchemy import create_engine, Column, Integer, String, JSON
from sqlalchemy.orm import sessionmaker, declarative_base

# 1. Database Configuration
# Default to local sqlite if DATABASE_URL is not set
DB_URL = os.getenv("DATABASE_URL", "sqlite:///./plgames.db")
engine = create_engine(DB_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# 2. Define the Game Model
class Game(Base):
    __tablename__ = 'games'
    id = Column(Integer, primary_key=True)
    title = Column(String)
    category = Column(String)
    game_type = Column(String)
    game_subtype = Column(String)
    description = Column(String)
    content = Column(JSON)

def push_to_db(filepath):
    """
    Reads a crossword JSON and pushes it to the database.
    Expected JSON format:
    {
        "title": "Morning Coffee",
        "description": "A quick 5x5 break",
        "content": {
            "gridSize": 5,
            "grid": [...],
            "clues": {...}
        }
    }
    """
    if not os.path.exists(filepath):
        print(f"Error: File '{filepath}' not found.")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    session = SessionLocal()
    try:
        new_game = Game(
            title=data['title'],
            category='Puzzles',      # Crosswords live in the Puzzles category
            game_type='puzzle',      # The general type
            game_subtype='minixword',# The specific component subtype
            description=data.get('description', 'A fun mini crossword'),
            content=data['content']
        )
        session.add(new_game)
        session.commit()
        print(f"--- SUCCESS ---")
        print(f"Pushed '{data['title']}' to database.")
        print(f"Game ID: {new_game.id}")
    except Exception as e:
        session.rollback()
        print(f"Error pushing to DB: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python xword_push_to_db.py path/to/your_xword.json")
        
        # Create a template if it doesn't exist
        template = {
            "title": "Example Crossword",
            "description": "A simple 5x5 grid",
            "content": {
                "gridSize": 5,
                "grid": [
                    ["S", "L", "A", "N", "G"],
                    ["T", None, "G", None, "O"],
                    ["A", "L", "E", "R", "T"],
                    ["R", None, "D", None, "T"],
                    ["S", "W", "E", "P", "T"]
                ],
                "clues": {
                    "across": [
                        { "number": 1, "row": 0, "col": 0, "text": "Informal vocabulary", "answer": "SLANG" },
                        { "number": 6, "row": 2, "col": 0, "text": "Warning signal", "answer": "ALERT" },
                        { "number": 7, "row": 4, "col": 0, "text": "Cleaned with a broom", "answer": "SWEPT" }
                    ],
                    "down": [
                        { "number": 1, "row": 0, "col": 0, "text": "Celestial bodies", "answer": "STARS" },
                        { "number": 2, "row": 0, "col": 2, "text": "Sticking together", "answer": "AGED" },
                        { "number": 3, "row": 0, "col": 4, "text": "Finished or moved on", "answer": "GOT" }
                    ]
                }
            }
        }
        with open("template_xword.json", "w", encoding='utf-8') as f:
            json.dump(template, f, indent=2)
        print("Created 'template_xword.json' for you to edit.")
    else:
        push_to_db(sys.argv[1])
