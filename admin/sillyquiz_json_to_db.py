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
    description = Column(String)
    content = Column(JSON)

def import_json(filepath):
    with open(filepath, 'r') as f:
        data = json.load(f)
    
    session = SessionLocal()
    new_game = Game(
        title=data['title'],
        category='Silly Quizzes',
        game_type='silly_quiz',
        description=data['description'],
        content=data['content']
    )
    session.add(new_game)
    session.commit()
    session.close()
    print(f"Successfully imported {data['title']} into DB!")

if __name__ == "__main__":
    # Just run: python db_loader.py your_quiz.json
    import sys
    import_json(sys.argv[1])