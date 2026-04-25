import json
import os
from sqlalchemy import create_engine, Column, Integer, String, JSON
from sqlalchemy.orm import sessionmaker, declarative_base

engine = create_engine(os.getenv("DATABASE_URL"))
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

class Game(Base):
    __tablename__ = 'games'
    id = Column(Integer, primary_key=True)
    title = Column(String)
    category = Column(String)
    game_type = Column(String)
    game_subtype = Column(String)
    description = Column(String)
    content = Column(JSON)

def import_json(filepath):
    with open(filepath, 'r') as f:
        data = json.load(f)
    
    session = SessionLocal()
    new_game = Game(
        title=data['title'],
        category='Puzzles',
        game_type='puzzle',
        game_subtype=data['subtype'],
        description="Connections Puzzle in Malayalam",
        content=data['data']
    )
    session.add(new_game)
    session.commit()
    session.close()
    print(f"Successfully imported {data['title']} into DB!")

def update_game(filepath, game_id):
    with open(filepath, 'r') as f:
        data = json.load(f)
    
    session = SessionLocal()
    # Find the existing game
    game = session.query(Game).filter(Game.id == game_id).first()
    
    if game:
        # Update the content field with the new JSON data
        game.content = data['data']
        session.commit()
        print(f"Successfully updated Game ID: {game_id}")
    else:
        print(f"Error: Game with ID {game_id} not found.")
    
    session.close()

if __name__ == "__main__":
    import sys
    update_db = False
    if (len(sys.argv) > 2):
        update_db = True
    if not update_db:
        import_json(sys.argv[1])
    else:
        update_game(sys.argv[1], sys.argv[2])