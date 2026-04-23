import tkinter as tk
from tkinter import messagebox
from sqlalchemy import create_engine, Column, Integer, String, JSON
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# --- Database Setup ---
# Use the same connection string you use in your backend .env
DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

class Game(Base):
    __tablename__ = 'games'
    id = Column(Integer, primary_key=True)
    title = Column(String)
    category = Column(String)
    game_type = Column(String, default='silly_quiz')
    content = Column(JSON)

# --- State ---
questions_list = []

def add_question():
    """Adds current form data to the local list and clears inputs."""
    try:
        q_data = {
            "text": entry_q.get(),
            "options": [entry_o1.get(), entry_o2.get(), entry_o3.get(), entry_o4.get()],
            "correct_idx": int(entry_ans.get())
        }
        questions_list.append(q_data)
        
        # Clear fields
        entry_q.delete(0, tk.END)
        entry_o1.delete(0, tk.END); entry_o2.delete(0, tk.END)
        entry_o3.delete(0, tk.END); entry_o4.delete(0, tk.END)
        entry_ans.delete(0, tk.END)
        
        lbl_status.config(text=f"Added {len(questions_list)} questions...")
    except ValueError:
        messagebox.showerror("Error", "Check that Index is a number (0-3)")

def save_to_db():
    """Commits the title, category, and all questions to the DB."""
    if not questions_list:
        messagebox.showwarning("Empty", "No questions added yet!")
        return

    session = SessionLocal()
    new_game = Game(
        title=entry_title.get(),
        category=entry_cat.get(),
        game_type='silly_quiz',
        content={"questions": questions_list}
    )
    session.add(new_game)
    session.commit()
    session.close()
    messagebox.showinfo("Success", f"Quiz '{entry_title.get()}' saved with {len(questions_list)} questions!")
    root.destroy()

# --- GUI ---
root = tk.Tk()
root.title("PinkLungi Games Silly Quiz Creator")

tk.Label(root, text="Game Title:").pack(); entry_title = tk.Entry(root); entry_title.pack()
tk.Label(root, text="Category:").pack(); entry_cat = tk.Entry(root); entry_cat.pack()

tk.Label(root, text="--- Question ---").pack(pady=10)
entry_q = tk.Entry(root, width=50); entry_q.pack()
entry_o1 = tk.Entry(root); entry_o1.pack(placeholder="Option 0")
entry_o2 = tk.Entry(root); entry_o2.pack(placeholder="Option 1")
entry_o3 = tk.Entry(root); entry_o3.pack(placeholder="Option 2")
entry_o4 = tk.Entry(root); entry_o4.pack(placeholder="Option 3")
tk.Label(root, text="Correct Index (0-3):").pack(); entry_ans = tk.Entry(root); entry_ans.pack()

tk.Button(root, text="Add Question", command=add_question).pack(pady=5)
lbl_status = tk.Label(root, text="0 questions added"); lbl_status.pack()

tk.Button(root, text="SAVE ALL TO DATABASE", command=save_to_db, bg="green", fg="white").pack(pady=20)

root.mainloop()