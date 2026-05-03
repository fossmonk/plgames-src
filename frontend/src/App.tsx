import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import './App.css';
import { SimbleQuizComponent } from './SimbleQuiz.tsx'
import { PuzzleComponent } from './Puzzle.tsx'
import { LiveQuizComponent } from './LiveQuiz.tsx'
import Layout from './components/Layout.tsx';
import { SubtypeDescriptions, SubtypeNames } from './SubtypeDescriptions.tsx';

const API_BASE = import.meta.env.VITE_API_URL;
const CRYPTO_KEY_STR = import.meta.env.VITE_PL_CRYPTO_KEY;

// AES-GCM Decryption Utility
const decryptData = async (encryptedBase64: string) => {
  try {
    const keyStr = CRYPTO_KEY_STR;
    const keyBuffer = new TextEncoder().encode(keyStr);
    const hash = await crypto.subtle.digest("SHA-256", keyBuffer);
    const cryptoKey = await crypto.subtle.importKey("raw", hash, "AES-GCM", true, ["decrypt"]);

    const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      cryptoKey,
      ciphertext
    );

    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch (err) {
    console.error("Decryption failed:", err);
    return null;
  }
};

interface Game { id: number; title: string; type: string; category: string; desc: string; subtype: string }

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
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_BASE}/api/play/${gameId}`)
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(async (data) => {
        // Decrypt the AES-GCM data
        if (typeof data.data === 'string') {
          const decrypted = await decryptData(data.data);
          if (decrypted) {
            data.data = decrypted;
          } else {
            throw new Error("Decryption failed");
          }
        }
        setGame(data);
      })
      .catch(err => {
        console.error("Error loading game:", err)
        setError(true);
      });
  }, [gameId]);

  if (error) return <div className='container'><h2>GAME NOT FOUND.</h2></div>
  if (!game) return <LoadingScreen />;

  const backToCategory = () => navigate(`/category/${game.type}`);

  const displayCategory = game.category;

  return (
    <div className="game-page-wrapper">
      <div className="container" style={{ paddingBottom: '0px', marginBottom: '-10px' }}>
        <button onClick={backToCategory} className="back-btn no-capture">
          🔙 Back to {displayCategory}
        </button>
      </div>
      {(() => {
        switch (game.type) {
          case 'simble_quiz':
            return <SimbleQuizComponent game={game} />;
          case 'puzzle':
            return <PuzzleComponent game={game} />;
          case 'live_quiz':
            return <LiveQuizComponent data={game.data} title={game.title} />;
          default:
            return <div className="container"><h2>Unknown game type: {game.type}</h2></div>;
        }
      })()}
    </div>
  );
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
  // UNLESS there is only one subtype, in which case we auto-select it.
  useEffect(() => {
    if (subtypes.length === 1) {
      setSelectedSubtype(subtypes[0]);
    } else {
      setSelectedSubtype(null);
    }
  }, [categoryName, games]); // Added games to dependency to ensure it updates when data loads

  if (!selectedSubtype) {
    if (subtypes.length === 0) {
      return (
        <div className="container">
          <h2>No games found in {categoryName}.</h2>
          <button onClick={() => navigate('/')}>Back Home</button>
        </div>
      );
    }

    const displayCategory = categoryGames[0]?.category || categoryName;

    return (
      <div className="container">
        <h2>Select {displayCategory} Type</h2>
        <div className="game-grid">
          {subtypes.map(s => (
            <div key={s} className="game-card" onClick={() => setSelectedSubtype(s)}>
              <h2 className='force-light'>{SubtypeNames(s) || s}</h2>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const currentCategory = categoryGames[0]?.category || categoryName;

  return (
    <div className="container">
      <header>
        <button onClick={() => setSelectedSubtype(null)} className="back-btn mb-10 no-capture">🔙 Back To {currentCategory}</button>
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

/* --- GAME COMPONENTS --- */
// --- Home Component ---
function HomePage({ games }: { games: Game[] }) {
  const navigate = useNavigate();
  const categories = Array.from(new Set(games.map(g => g.type)));

  return (
    <div className="container">
      <div className="game-grid">
        {categories.map((catType) => {
          const gameOfThisType = games.find(g => g.type === catType);
          const categoryDisplayName = gameOfThisType?.category || catType;
          return (
            <div key={catType} className="game-card" onClick={() => navigate(`/category/${catType}`)}>
              <h3 className='force-light'>{categoryDisplayName}</h3>
              <button>BROWSE</button>
            </div>
          );
        })}
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