import base64
import json
import os
import tkinter as tk
from tkinter import filedialog, messagebox

# --- State ---
dialogs_list = []
selected_file_path = ""

def select_file():
    global selected_file_path
    path = filedialog.askopenfilename(
        title="Select Dialog MP3",
        filetypes=[("Audio Files", "*.mp3 *.wav *.ogg")]
    )
    if path:
        selected_file_path = path
        label_file.config(text=f"Selected: {os.path.basename(path)}", fg="green")

def add_to_list():
    global selected_file_path
    if not selected_file_path:
        messagebox.showwarning("No File", "Please select an MP3 file first!")
        return
    
    if not entry_ans.get().strip():
        messagebox.showwarning("No Answer", "Please enter at least one valid answer!")
        return

    try:
        with open(selected_file_path, "rb") as f:
            encoded_str = base64.b64encode(f.read()).decode("utf-8")
        
        d_data = {
            "audio_base64": encoded_str,
            "valid_answers": [ans.strip() for ans in entry_ans.get().split(",")],
            "hint": entry_hint.get()
        }
        dialogs_list.append(d_data)
        
        # Update Preview
        preview_text.config(state=tk.NORMAL)
        preview_text.insert(tk.END, f"Added: {os.path.basename(selected_file_path)} ({d_data['valid_answers'][0]})\n")
        preview_text.config(state=tk.DISABLED)
        
        # Reset current selection
        selected_file_path = ""
        label_file.config(text="No file selected", fg="red")
        entry_ans.delete(0, tk.END)
        entry_hint.delete(0, tk.END)
    except Exception as e:
        messagebox.showerror("Error", f"Could not process audio: {e}")

def save_to_json():
    if not dialogs_list:
        messagebox.showwarning("Empty", "No dialogs added!")
        return

    data = {
        "title": entry_title.get(),
        "description": entry_desc.get(),
        "subtype": "dialog_guess",
        "content": {"questions": dialogs_list}
    }

    filename = "new_dialog_quiz.json"
    with open(filename, 'w') as f:
        json.dump(data, f, indent=4)
    
    messagebox.showinfo("Success", f"Quiz saved to {filename}!")
    root.destroy()

# --- GUI ---
root = tk.Tk()
root.title("PinkLungi Games - Dialog Quiz Creator")
root.geometry("500x700")

# Metadata
tk.Label(root, text="Step 1: Game Metadata", font=('Arial', 10, 'bold')).pack(pady=(10,0))
tk.Label(root, text="Title:").pack(); entry_title = tk.Entry(root, width=50); entry_title.pack()
entry_title.insert(0, "Guess the Movie Dialog")
tk.Label(root, text="Description:").pack(); entry_desc = tk.Entry(root, width=50); entry_desc.pack()
entry_desc.insert(0, "Listen to the clip and name the movie!")

# Add Section
tk.Label(root, text="\nStep 2: Add Dialogues", font=('Arial', 10, 'bold')).pack(pady=(10,0))

tk.Button(root, text="1. SELECT MP3 FILE", command=select_file, bg="#2196F3", fg="white", width=30).pack(pady=5)
label_file = tk.Label(root, text="No file selected", fg="red")
label_file.pack()

tk.Label(root, text="2. Enter Valid Answers (comma separated):").pack()
entry_ans = tk.Entry(root, width=50); entry_ans.pack()
tk.Label(root, text="3. Enter Hint (Optional):").pack()
entry_hint = tk.Entry(root, width=50); entry_hint.pack()

tk.Button(root, text="ADD TO LIST", command=add_to_list, bg="#4CAF50", fg="white", width=30, height=2).pack(pady=15)

# Preview
tk.Label(root, text="--- Current List ---", font=('Arial', 8, 'italic')).pack()
preview_text = tk.Text(root, height=10, width=55, state=tk.DISABLED)
preview_text.pack(pady=5)

# Final Save
tk.Button(root, text="GENERATE JSON FILE", command=save_to_json, bg="black", fg="white", width=40, height=2).pack(pady=20)

root.mainloop()
