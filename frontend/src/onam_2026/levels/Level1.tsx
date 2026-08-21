import { useState } from 'react';

export function Level1({ onSubmit }: { onSubmit: (ans: string) => void }) {
    const [ans, setAns] = useState('');
    return (
        <div className="onam-level">
            <h3>Level 1: The Legend</h3>
            <p>Who is the mythical king associated with Onam?</p>
            <input 
                className="onam-input"
                value={ans} 
                onChange={(e) => setAns(e.target.value)} 
                placeholder="Answer"
            />
            <button className="onam-submit" onClick={() => onSubmit(ans)}>Submit</button>
        </div>
    );
}
