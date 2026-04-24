import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import pinklungiLogo from '../assets/pinklungi.svg'; 

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="app-wrapper">
      
      {/* 1. The main infinite-pink banner */}
      <header className="main-banner">
        <div className="banner-content">
          <Link to="/" className="brand-link">
            {/* 2. The simple icon (no box) */}
            <img src={pinklungiLogo} alt="Pinklungi Icon" className="banner-logo" />
            {/* 3. The branding in white block letters */}
            <h1 className="banner-title">PINKLUNGI GAMES</h1>
          </Link>
        </div>
      </header>

      <main className="main-content">
        {children}
      </main>

      <footer className="main-footer">
        <p>A Product by PinkLungi</p>
      </footer>
    </div>
  );
}