import { useState } from 'react';

export function Level2({ onSubmit }: { onSubmit: (ans: string) => void }) {
    const [ans, setAns] = useState('');
    return (
        <div className="onam-level">
            <h3>Level 2: The Art</h3>
            <p>What is the floral carpet made during Onam called?</p>
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
