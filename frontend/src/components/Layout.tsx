import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import pinklungiLogo from '../assets/pinklungi.svg';
import { FuzzySearchBar } from '../FuzzySearchBar'; // Adjust path if needed

export default function Layout({ children }: { children: ReactNode }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [games, setGames] = useState([]);
  const navigate = useNavigate();

  // Fetch games globally so the search bar has data
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/games`)
      .then(res => res.json())
      .then(data => setGames(data.games))
      .catch(err => console.error("API error:", err));
  }, []);

  return (
    <div className="app-wrapper">
      <header className="main-header">
        <div className="banner-content">
          <Link to="/" className="brand-link">
            <img src={pinklungiLogo} alt="Pinklungi Icon" className="banner-logo" />
            <h1 className="banner-title">PINKLUNGI GAMES</h1>
          </Link>
        </div>
        
        {/* Search Toggle Button */}
        <button className="search-toggle" onClick={() => setIsSearchOpen(true)}>
          🔍
        </button>
      </header>

      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="search-overlay">
          <div className="search-inner">
            <button className="close-btn" onClick={() => setIsSearchOpen(false)}>✕</button>
            <FuzzySearchBar 
              quizzes={games} 
              onSelect={(game: any) => {
                setIsSearchOpen(false);
                navigate(`/play/${game.id}`);
              }} 
            />
          </div>
        </div>
      )}

      <main className="main-content">{children}</main>

      <footer className="main-footer">
        <p>A Product by PinkLungi</p>
      </footer>
    </div>
  );
}