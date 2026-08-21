export function MaveliHeader() {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <svg width="120" height="120" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                {/* Umbrella (Olakkuda) */}
                <path d="M 10 50 Q 50 10 90 50 L 50 50 Z" fill="#D2B48C" stroke="#8B4513" strokeWidth="2" />
                <path d="M 20 50 Q 50 20 80 50" fill="none" stroke="#8B4513" strokeWidth="1" />
                <path d="M 35 50 Q 50 30 65 50" fill="none" stroke="#8B4513" strokeWidth="1" />
                <rect x="48" y="50" width="4" height="40" fill="#8B4513" />
                
                {/* Maveli Face */}
                <circle cx="50" cy="65" r="15" fill="#FFB6C1" />
                {/* Crown */}
                <path d="M 38 55 L 42 40 L 50 45 L 58 40 L 62 55 Z" fill="#FFD700" stroke="#DAA520" strokeWidth="1" />
                {/* Mustache */}
                <path d="M 40 70 Q 50 65 60 70" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" />
                <circle cx="45" cy="62" r="1.5" fill="#000" />
                <circle cx="55" cy="62" r="1.5" fill="#000" />
                
                {/* Body/Dress */}
                <path d="M 35 80 Q 50 100 65 80 L 65 100 L 35 100 Z" fill="#FFF" stroke="#FFD700" strokeWidth="2" />
            </svg>
        </div>
    );
}
