import tkinter as tk
from tkinter import messagebox
from tkinter import filedialog
import json
import os
from PIL import Image, ImageFilter

# --- State ---
questions_list = []

def process_image(local_path):
    # Ensure dir exists
    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "images", "movies"))
    os.makedirs(out_dir, exist_ok=True)
    
    base_name = os.path.splitext(os.path.basename(local_path))[0]
    
    img = Image.open(local_path).convert("RGB")
    
    blurs = [20, 15, 10, 5, 0]
    urls = []
    
    for b in blurs:
        if b > 0:
            blurred = img.filter(ImageFilter.GaussianBlur(b))
        else:
            blurred = img
        
        out_name = f"{base_name}_blur{b}.jpg"
        out_path = os.path.join(out_dir, out_name)
        blurred.save(out_path, "JPEG", quality=85)
        
        urls.append(f"/images/movies/{out_name}")
        
    return urls

def browse_file():
    filepath = filedialog.askopenfilename(filetypes=[("Image Files", "*.jpg *.jpeg *.png *.webp")])
    if filepath:
        entry_file.delete(0, tk.END)
        entry_file.insert(0, filepath)

def add_question():
    try:
        local_path = entry_file.get().strip()
        ans_raw = entry_ans.get().strip()
        hint = entry_hint.get().strip()
        
        if not local_path or not ans_raw:
            messagebox.showerror("Error", "Local Image Path and Valid Answers are required!")
            return
            
        # Split by comma and clean up whitespace
        valid_answers = [ans.strip() for ans in ans_raw.split(',') if ans.strip()]
        
        # Process images and get the 5 urls
        image_urls = process_image(local_path)
        
        q_data = {
            "image_urls": image_urls,
            "valid_answers": valid_answers,
            "hint": hint
        }
        questions_list.append(q_data)
        
        # Update Preview Window
        preview_text.config(state=tk.NORMAL)
        preview_text.insert(tk.END, f"Q: {os.path.basename(local_path)} | Ans: {valid_answers}\n")
        preview_text.config(state=tk.DISABLED)
        
        # Clear fields
        entry_file.delete(0, tk.END)
        entry_ans.delete(0, tk.END)
        entry_hint.delete(0, tk.END)
    except Exception as e:
        messagebox.showerror("Error", str(e))

def save_to_json():
    if not questions_list:
        messagebox.showwarning("Empty", "No questions added!")
        return

    data = {
        "title"       : entry_title.get(),
        "subtype"     : "guess_movie",
        "description" : entry_desc.get(),
        "content"     : {"questions": questions_list}
    }

    filename = "new_guess_movie.json"
    with open(filename, 'w') as f:
        json.dump(data, f, indent=4)
    print(f"Saved to {filename}")
    messagebox.showinfo("Success", f"Quiz '{entry_title.get()}' saved to {filename}!")
    root.destroy()

# --- GUI ---
root = tk.Tk()
root.title("PinkLungi Games Admin Tool - Guess The Movie")

# Input Section
tk.Label(root, text="Title:").pack(); entry_title = tk.Entry(root, width=50); entry_title.pack()
tk.Label(root, text="Description:").pack(); entry_desc = tk.Entry(root, width=50); entry_desc.pack()

tk.Label(root, text="\n--- Add Question ---").pack()

# File Picker
frame_file = tk.Frame(root)
frame_file.pack()
tk.Label(frame_file, text="Local Image File:").pack(side=tk.LEFT)
entry_file = tk.Entry(frame_file, width=40)
entry_file.pack(side=tk.LEFT, padx=5)
tk.Button(frame_file, text="Browse", command=browse_file).pack(side=tk.LEFT)

tk.Label(root, text="Valid Answers (comma separated, e.g. The Matrix, Matrix):").pack()
entry_ans = tk.Entry(root, width=50); entry_ans.pack()

tk.Label(root, text="Hint (Optional):").pack()
entry_hint = tk.Entry(root, width=50); entry_hint.pack()

tk.Button(root, text="Add Question", command=add_question).pack(pady=10)

# Preview Section
tk.Label(root, text="\n--- Preview List ---").pack()
preview_text = tk.Text(root, height=10, width=50, state=tk.DISABLED)
preview_text.pack(pady=5)

tk.Button(root, text="GENERATE JSON FILE", command=save_to_json, bg="green", fg="white").pack(pady=20)

root.mainloop()
