import { useState, useEffect } from 'react';
import { Level1 } from './levels/Level1';
import { Level2 } from './levels/Level2';
import { Level3 } from './levels/Level3';

export function GameManager({ token, onLogout }: { token: string, onLogout: () => void }) {
    const [level, setLevel] = useState<number | null>(null);
    const [username, setUsername] = useState<string>('');
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [error, setError] = useState<string>('');
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    const fetchState = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/onam-2026/state`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 401) {
                onLogout();
                return;
            }
            const data = await res.json();
            setLevel(data.level);
            setUsername(data.username);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchState();
    }, []);

    const submitAnswer = async (answer: string) => {
        setError('');
        try {
            const res = await fetch(`${API_BASE}/api/onam-2026/submit`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ answer })
            });
            const data = await res.json();
            if (data.correct) {
                setLevel(data.level);
            } else {
                setError(data.message || 'Incorrect Answer!');
            }
        } catch (e) {
            setError('Failed to submit answer.');
        }
    };

    const saveName = async () => {
        if (!editName.trim()) return setIsEditing(false);
        try {
            const res = await fetch(`${API_BASE}/api/onam-2026/update_profile`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ display_name: editName })
            });
            const data = await res.json();
            if (data.success) {
                setUsername(data.username);
            }
        } catch (e) {
            console.error("Failed to update name");
        }
        setIsEditing(false);
    };

    if (level === null) return <div>Loading Level...</div>;

    const renderLevel = () => {
        switch (level) {
            case 1: return <Level1 onSubmit={submitAnswer} />;
            case 2: return <Level2 onSubmit={submitAnswer} />;
            case 3: return <Level3 onSubmit={submitAnswer} />;
            default: return <div><h2>Congratulations!</h2><p>You have finished all available levels. Check the leaderboard.</p></div>;
        }
    };

    return (
        <div className="onam-game" style={{ width: '100%', display: 'block' }}>
            <div className="mb-20" style={{ display: 'flex', alignItems: 'center', width: '100%', borderBottom: '1px solid rgba(255, 215, 0, 0.3)', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>Player:</span>
                    {isEditing ? (
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <input 
                                value={editName} 
                                onChange={e => setEditName(e.target.value)} 
                                style={{ padding: '5px', borderRadius: '4px', border: '1px solid #FFD700', background: 'var(--bg-color)', color: 'var(--text-color)' }}
                                autoFocus
                            />
                            <button onClick={saveName} style={{ background: '#FFD700', border: 'none', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer', color: '#000', margin: 0, minHeight: 'auto', width: 'auto' }}>Save</button>
                        </div>
                    ) : (
                        <strong style={{ fontSize: '1.2rem', color: '#FFD700' }}>
                            {username} 
                            <span style={{ cursor: 'pointer', fontSize: '0.9rem', marginLeft: '8px' }} onClick={() => { setEditName(username); setIsEditing(true); }}>✏️</span>
                        </strong>
                    )}
                </div>
                <div style={{ flexGrow: 1 }}></div>
                <button className="back-btn" onClick={onLogout} style={{ margin: 0, padding: '0 10px', width: 'auto' }}>Logout</button>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                <div style={{ background: '#ff008a', color: '#fff', padding: '10px 20px', borderRadius: '30px', fontWeight: 'bold', border: '2px solid #FFD700', boxShadow: '0 4px 10px rgba(255, 215, 0, 0.2)' }}>
                    LEVEL {level}
                </div>
            </div>

            {renderLevel()}
            {error && <p style={{color: '#ff5252', marginTop: '15px', textAlign: 'center'}}>{error}</p>}
        </div>
    );
}
