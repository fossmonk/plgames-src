import tkinter as tk
from tkinter import messagebox
import json

# --- State ---
questions_list = []

def add_question():
    try:
        q_data = {
            "text": entry_q.get(),
            "options": [entry_o1.get(), entry_o2.get(), entry_o3.get(), entry_o4.get()],
            "correct_idx": int(entry_ans.get())
        }
        questions_list.append(q_data)
        
        # Update Preview Window
        preview_text.config(state=tk.NORMAL)
        preview_text.insert(tk.END, f"Q: {q_data['text']} (Ans: {q_data['correct_idx']})\n")
        preview_text.config(state=tk.DISABLED)
        
        # Clear fields
        entry_q.delete(0, tk.END)
        for e in [entry_o1, entry_o2, entry_o3, entry_o4, entry_ans]:
            e.delete(0, tk.END)
    except ValueError:
        messagebox.showerror("Error", "Correct Index must be a number (0-3)")

def save_to_json():
    if not questions_list:
        messagebox.showwarning("Empty", "No questions added!")
        return

    data = {
        "title"       : entry_title.get(),
        "description" : entry_desc.get(),
        "subtype"     : "mcq",
        "content"     : {"questions": questions_list}
    }

    filename = "new_simble_quiz.json"
    with open(filename, 'w') as f:
        json.dump(data, f, indent=4)
    print(f"Saved to {filename}")
    messagebox.showinfo("Success", f"Quiz '{entry_title.get()}' saved to {filename}!")
    root.destroy()

# --- GUI ---
root = tk.Tk()
root.title("PinkLungi Games Admin Tool - Simble Quiz")

# Input Section
tk.Label(root, text="Title:").pack(); entry_title = tk.Entry(root, width=50); entry_title.pack()
tk.Label(root, text="Description:").pack(); entry_desc = tk.Entry(root, width=50); entry_desc.pack()
tk.Label(root, text="\n--- Add Question ---").pack()
entry_q = tk.Entry(root, width=50); entry_q.pack()
entry_o1 = tk.Entry(root); entry_o1.pack()
entry_o2 = tk.Entry(root); entry_o2.pack()
entry_o3 = tk.Entry(root); entry_o3.pack()
entry_o4 = tk.Entry(root); entry_o4.pack()
tk.Label(root, text="Correct Index (0-3):").pack(); entry_ans = tk.Entry(root); entry_ans.pack()

tk.Button(root, text="Add Question", command=add_question).pack(pady=5)

# Preview Section
tk.Label(root, text="\n--- Preview List ---").pack()
preview_text = tk.Text(root, height=10, width=50, state=tk.DISABLED)
preview_text.pack(pady=5)

tk.Button(root, text="GENERATE JSON FILE", command=save_to_json, bg="green", fg="white").pack(pady=20)

root.mainloop()