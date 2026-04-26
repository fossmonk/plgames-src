# PinkLungi Games - Architecture & Design Map

## 1. High-Level Architecture
The PinkLungi Games portal is a full-stack web application designed to serve various types of mini-games (Quizzes, Puzzles). 

- **Frontend**: React 19 built with Vite and TypeScript.
- **Backend**: Python-based FastAPI server.
- **Database**: PostgreSQL (managed via SQLAlchemy and Alembic migrations).
- **Admin**: Local Python scripts (some using Tkinter GUIs) used for game content creation and database seeding.

---

## 2. Directory Structure
- **`/frontend`**: The React/Vite application.
- **`/backend`**: The FastAPI application (`app/`) and database migrations (`migrations/`).
- **`/admin`**: Utility scripts to generate game JSON data and push it directly to the database.

---

## 3. Database Schema
The database uses SQLAlchemy, defined in `backend/app/models.py`.

- **`User`**: Stores user authentication data (`email`, `google_id`).
- **`Game`**: The core entity storing game configurations.
  - `category`, `description`: Metadata for browsing.
  - `game_type`: Defines the top-level game engine (`quick_quiz`, `puzzle`, `live_quiz`).
  - `game_subtype`: Used for specific variations (e.g., `connections` under `puzzle`).
  - `content`: A JSON column storing the actual game data (questions, grid items, difficulty levels). This is the core driver of the games.
- **`Score`**: Tracks user performance (`user_id`, `game_id`, `points`).

---

## 4. Frontend Design & Routing
The frontend is primarily driven by React Router, structured in `frontend/src/App.tsx`.

### 4.1 Routing Structure
- **`/` (HomePage)**: Aggregates games by `category` (e.g., Quick Quizzes, Puzzles).
- **`/category/:categoryName` (CategoryPage)**: Displays subtypes within a category (e.g., Connections).
- **`/play/:gameId` (GameRunner)**: The core dynamic gateway. Fetches game JSON from the backend and delegates rendering to the appropriate game engine component.

### 4.2 Game Engines (Switcher Pattern)
The `GameRunner` uses a "Switcher Pattern" to dynamically render game components based on the `game.type` and `game.subtype`:
- **`QuickQuizComponent`**: A sequential multiple-choice engine. Shows memes based on the final score.
- **`PuzzleComponent`**: A sub-router that delegates to specific puzzle subtypes (currently routes to `Connections.tsx`).
- **`LiveQuizComponent`**: (Placeholder for future live multiplayer features).

### 4.3 Notable Frontend Features
- **Data-Driven Dynamic Content**: Games are completely data-driven by the JSON payload received from the backend, meaning no new frontend code is needed to add new levels.
- **Result Sharing**: Uses `html2canvas` to take a snapshot of the user's score/results (along with dynamic memes based on performance) and leverages the Web Share API (`navigator.share`) to let users post their results to social media.
- **Local State Management**: Complex game states (like selection, lives, shuffle, guess history in Connections) are managed cleanly via React hooks (`useState`, `useEffect`).

---

## 5. Backend Design
The backend is a lightweight FastAPI service, defined in `backend/app/main.py`.

### 5.1 API Endpoints
- **`GET /api/games`**: Returns a lightweight list of all games for the library/browsing pages.
- **`GET /api/play/{game_id}`**: Returns the full game object, including the `content` JSON, necessary to initialize a game engine.
- **`GET /`**: Simple health check endpoint.

### 5.2 Server Configuration
- Runs on Uvicorn.
- CORS is configured to allow local Vite development (`localhost:5173`) and production domains (`pinklungigames.com`).

---

## 6. Content Creation Pipeline (Admin)
Instead of a complex web-based CMS, the project uses local Python scripts in the `/admin` folder.
- Scripts like `gen_connections.py` provide a Tkinter GUI to easily input game data manually.
- Data is saved as raw JSON (`connection_data.json`) and then pushed directly to the database via scripts like `connections_to_db.py` and `quickquiz_json_to_db.py`.
- This ensures a strict separation between content creation and the live web server, keeping the backend extremely lightweight and focused solely on serving data.
