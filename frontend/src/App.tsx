import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, Link } from 'react-router-dom';
import './App.css';
import { QuickQuizComponent } from './QuickQuiz.tsx'
import { PuzzleComponent } from './Puzzle.tsx'
import { LiveQuizComponent } from './LiveQuiz.tsx'
import Layout from './components/Layout.tsx';
import { SubtypeDescriptions, SubtypeNames } from './puzzles/SubtypeDescriptions.tsx';

const API_BASE = import.meta.env.VITE_API_URL;

interface Game { id: number; title: string; type: string; desc: string; subtype: string }

const LoadingScreen = () => (
  <div className='loading-screen'>
    <div className='mascot-animation'></div>
    <p style={{ marginTop: '20px', fontWeight: 'bold' }}>Putting on the PinkLungi...</p>
  </div>
);

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

  if (error) return <div className='container'><h2>GAME NOT FOUND.</h2></div>
  if (!game) return <LoadingScreen />;

  // The Switcher Pattern: Routes to the correct UI based on game type
  switch (game.type) {
    case 'quick_quiz':
      return <QuickQuizComponent data={game.data} title={game.title} />;
    case 'puzzle':
      return <PuzzleComponent game={game} />;
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
  
  // Filter games by the main category (e.g., 'puzzle')
  const categoryGames = games.filter(g => g.type === categoryName);
  // Identify unique subtypes within this category
  const subtypes = Array.from(new Set(categoryGames.map(g => g.subtype)));
  // If there's only one subtype, just show the list. 
  // If there are multiple, show a "Select Subtype" screen first.
  const [selectedSubtype, setSelectedSubtype] = useState<string | null>(subtypes.length === 1 ? subtypes[0] : null);
  // RESET logic: Whenever categoryName changes, clear the subtype selection
  useEffect(() => {
    setSelectedSubtype(null);
  }, [categoryName]);

  if (!selectedSubtype) {
    return (
      <div className="container">
        <h2>Select {categoryName} Type</h2>
        <div className="game-grid">
          {subtypes.map(s => (
            <div key={s} className="game-card" onClick={() => setSelectedSubtype(s)}>
              <h2 className='force-light'>{SubtypeNames(s)}</h2>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header>
        <button onClick={() => setSelectedSubtype(null)}>🔙 Back To {categoryName}</button>
        <h1>{SubtypeNames(selectedSubtype)}</h1>
        <p>{SubtypeDescriptions(selectedSubtype)}</p>
      </header>
      <div className="game-grid">
        {categoryGames.filter(g => g.subtype === selectedSubtype).map(game => (
          <div key={game.id} className="game-card">
            <h3>{game.title}</h3>
            <button onClick={() => navigate(`/play/${game.id}`)}>PLAY</button>
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
            <h3 className='force-light'>{cat}</h3>
            <button>BROWSE</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [games, setGames] = useState<Game[] | null>(null);
  useEffect(() => {
    fetch(`${API_BASE}/api/games`)
      .then(res => res.json())
      .then(data => setGames(data.games))
      .catch(err => console.error("API error:", err));
  }, []);

  return (
    <BrowserRouter>
      <Layout>
        {games === null ? (
          <LoadingScreen /> // Shows inside the Layout
        ) : (
          <Routes>
            <Route path="/" element={<HomePage games={games} />} />
            <Route path="/category/:categoryName" element={<CategoryPage games={games} />} />
            <Route path="/play/:gameId" element={<GameRunner />} />
          </Routes>
        )}
      </Layout>
    </BrowserRouter>
  );
}