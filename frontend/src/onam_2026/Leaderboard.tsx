import { useState, useEffect } from 'react';

export function Leaderboard() {
    const [leaders, setLeaders] = useState<any[]>([]);
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    useEffect(() => {
        fetch(`${API_BASE}/api/onam-2026/leaderboard`)
            .then(r => r.json())
            .then(data => setLeaders(data.leaderboard))
            .catch(e => console.error(e));
    }, []);

    return (
        <div className="onam-leaderboard">
            <h2 className="text-center mb-20">Live Leaderboard</h2>
            <table>
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Player</th>
                        <th>Level</th>
                        <th>Last Reached</th>
                    </tr>
                </thead>
                <tbody>
                    {leaders.map(l => (
                        <tr key={l.rank}>
                            <td>#{l.rank}</td>
                            <td>{l.username}</td>
                            <td>{l.level}</td>
                            <td>{l.reached_at ? new Date(l.reached_at).toLocaleString() : 'N/A'}</td>
                        </tr>
                    ))}
                    {leaders.length === 0 && (
                        <tr><td colSpan={4} className="text-center">No scores yet!</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
