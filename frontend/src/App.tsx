import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, Link } from 'react-router-dom';
import './App.css';

const API_BASE = import.meta.env.VITE_API_URL;

interface Game { id: number; title: string; type: string; desc: string; }

// --- Game Runner Component (The actual game screen) ---
function QuizRunner({ games }: { games: Game[] }) {
  const { gameId } = useParams();
  const [quiz, setQuiz] = useState<any>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/quiz/${gameId}`)
      .then(res => res.json())
      .then(data => setQuiz(data));
  }, [gameId]);

  const handleAnswer = (idx: number) => {
    if (idx === quiz.questions[currentIdx].correct) setScore(score + 1);
    
    if (currentIdx + 1 < quiz.questions.length) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setFinished(true);
    }
  };

  if (!quiz) return <div className="container">Loading Quiz...</div>;
  if (finished) return <div className="container"><h1>Game Over!</h1><p>Your Score: {score} / {quiz.questions.length}</p></div>;

  const q = quiz.questions[currentIdx];
  return (
    <div className="container">
      <h1>{quiz.title}</h1>
      <div className="game-card">
        <h3>{q.text}</h3>
        {q.options.map((opt: string, i: number) => (
          <button key={i} onClick={() => handleAnswer(i)} style={{display: 'block', margin: '5px'}}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// --- Category Page Component ---
function CategoryPage({ games }: { games: Game[] }) {
  const { categoryName } = useParams();
  const navigate = useNavigate();
  const filtered = games.filter(g => g.type === categoryName);

  return (
    <div className="container">
      <header>
        <Link to="/">← Back to Home</Link>
        <h1>{categoryName}</h1>
      </header>
      <div className="game-grid">
        {filtered.map(game => (
          <div key={game.id} className="game-card">
            <h3>{game.title}</h3>
            <p>{game.desc}</p>
            <button onClick={() => navigate(`/play/${game.id}`)}>
              Play Now
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Home Component ---
function HomePage({ games }: { games: Game[] }) {
  const navigate = useNavigate();
  const categories = Array.from(new Set(games.map(g => g.type)));

  return (
    <div className="container">
      <header><h1>PINKLUNGI Games</h1></header>
      <section className="hero"><h2>Select a Category</h2></section>
      <div className="game-grid">
        {categories.map((cat) => (
          <div key={cat} className="game-card" onClick={() => navigate(`/category/${cat}`)}>
            <h3>{cat}</h3>
            <button>Browse Games</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Main App Wrapper ---
export default function App() {
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/games`)
      .then(res => res.json())
      .then(data => setGames(data.games))
      .catch(err => console.error("API error:", err));
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage games={games} />} />
        <Route path="/category/:categoryName" element={<CategoryPage games={games} />} />
        <Route path="/play/:gameId" element={<QuizRunner games={games} />} />
      </Routes>
    </BrowserRouter>
  );
}