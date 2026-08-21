import { useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './onam.css';
import { Login } from './Login';
import { GameManager } from './GameManager';
import { Leaderboard } from './Leaderboard';
import { MaveliHeader } from './MaveliHeader';

// In production, put this in VITE_GOOGLE_CLIENT_ID
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-client-id';

export default function OnamQuizContainer() {
    const [token, setToken] = useState<string | null>(localStorage.getItem('onam_token'));
    const [view, setView] = useState<'game' | 'leaderboard'>('game');

    const handleLogout = () => {
        localStorage.removeItem('onam_token');
        setToken(null);
    };

    return (
        <GoogleOAuthProvider clientId={clientId}>
            <div className="container onam-container">
                <MaveliHeader />
                <h1 className="onam-title">PL Onam Quiz 2026</h1>
                
                <div className="flex-center gap-20 mb-40 no-capture">
                    <button 
                        style={{ background: view === 'game' ? '#ff008a' : '#333', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '20px', cursor: 'pointer'}}
                        onClick={() => setView('game')}
                    >
                        Play
                    </button>
                    <button 
                        style={{ background: view === 'leaderboard' ? '#ff008a' : '#333', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '20px', cursor: 'pointer'}}
                        onClick={() => setView('leaderboard')}
                    >
                        Leaderboard
                    </button>
                </div>

                {view === 'game' && (
                    <>
                        {!token ? (
                            <Login onSuccess={setToken} />
                        ) : (
                            <GameManager token={token} onLogout={handleLogout} />
                        )}
                    </>
                )}

                {view === 'leaderboard' && (
                    <Leaderboard />
                )}
            </div>
        </GoogleOAuthProvider>
    );
}
