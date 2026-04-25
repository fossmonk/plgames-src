import tkinter as tk
from tkinter import messagebox
import json

def save_json():
    groups = []
    for i in range(4):
        cat = entries[i]['cat'].get()
        diff = int(entries[i]['diff'].get())
        items = [e.get().strip() for e in entries[i]['items']]
        
        if cat and all(items):
            # Storing difficulty as 0-3 to match your color array index
            groups.append({
                "category": cat, 
                "items": items,
                "difficulty": diff - 1 
            })
    
    if len(groups) < 4:
        messagebox.showerror("Error", "Need 4 groups!")
        return

    data = {"subtype": "connections", "data": {"groups": groups}}
    with open("connection_data.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    messagebox.showinfo("Success", "Saved to connection_data.json")

root = tk.Tk()
root.title("Connections Generator (with Difficulty)")
entries = []

for i in range(4):
    frame = tk.LabelFrame(root, text=f"Group {i+1}")
    frame.pack(fill="x", padx=5, pady=5)
    
    # Category and Difficulty Selection
    top_row = tk.Frame(frame)
    top_row.pack(fill="x")
    cat_entry = tk.Entry(top_row)
    cat_entry.pack(side="left", fill="x", expand=True)
    cat_entry.insert(0, "Category Name")
    
    diff_var = tk.StringVar(value="1")
    tk.OptionMenu(top_row, diff_var, "1", "2", "3", "4").pack(side="right")
    
    # Items
    item_row = tk.Frame(frame)
    item_row.pack(fill="x")
    item_entries = [tk.Entry(item_row, width=15) for _ in range(4)]
    for entry in item_entries: entry.pack(side="left", padx=2)
    
    entries.append({'cat': cat_entry, 'diff': diff_var, 'items': item_entries})

tk.Button(root, text="Save JSON", command=save_json).pack(pady=10)
root.mainloop()