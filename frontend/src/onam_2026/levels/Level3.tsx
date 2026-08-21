import { useState } from 'react';

export function Level3({ onSubmit }: { onSubmit: (ans: string) => void }) {
    const [ans, setAns] = useState('');
    return (
        <div className="onam-level">
            <h3>Level 3: The Feast</h3>
            <p>What is the sweet dessert served at the end of the Sadhya?</p>
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
