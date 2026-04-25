import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, Link } from 'react-router-dom';
import './App.css';
import { SillyQuizComponent } from './SillyQuiz.tsx'
import { PuzzleComponent } from './Puzzle.tsx'
import { LiveQuizComponent } from './LiveQuiz.tsx'
import Layout from './components/Layout.tsx';

const API_BASE = import.meta.env.VITE_API_URL;

interface Game { id: number; title: string; type: string; desc: string; }

// --- Game Runner (The Dynamic Gateway) ---
function GameRunner() {
  const { gameId } = useParams();
  const [game, setGame] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/play/${gameId}`)
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => setGame(data))
      .catch(err => {
        console.error("Error loading game:", err)
        setError(true);
      });
  }, [gameId]);

  if (error) return <div className='container'><h2>Game not found!</h2></div>
  if (!game) return <div className="container"><h2>Loading Game...</h2></div>;

  // The Switcher Pattern: Routes to the correct UI based on game type
  switch (game.type) {
    case 'silly_quiz':
      return <SillyQuizComponent data={game.data} title={game.title} />;
    case 'puzzle':
      return <PuzzleComponent data={game.data} title={game.title} />;
    case 'live_quiz':
      return <LiveQuizComponent data={game.data} title={game.title} />;
    default:
      return <div className="container"><h2>Unknown game type: {game.type}</h2></div>;
  }
}

// --- Category Page ---
function CategoryPage({ games }: { games: Game[] }) {
  const { categoryName } = useParams();
  const navigate = useNavigate();
  const filtered = games.filter(g => g.type === categoryName);

  return (
    <div className="container">
      <header>
        <Link to="/">← Back</Link>
        <h1 className="brand-name">{categoryName}</h1>
      </header>
      <div className="game-grid">
        {filtered.map(game => (
          <div key={game.id} className="game-card">
            <h3>{game.title}</h3>
            <p>{game.desc}</p>
            <button onClick={() => navigate(`/play/${game.id}`)}>PLAY NOW</button>
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
      <div className="game-grid">
        {categories.map((cat) => (
          <div key={cat} className="game-card" onClick={() => navigate(`/category/${cat}`)}>
            <h3>{cat}</h3>
            <button>Browse</button>
          </div>
        ))}
      </div>
    </div>
  );
}

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
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage games={games} />} />
          <Route path="/category/:categoryName" element={<CategoryPage games={games} />} />
          <Route path="/play/:gameId" element={<GameRunner />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}