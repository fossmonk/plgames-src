import { GoogleLogin } from '@react-oauth/google';

interface LoginProps {
    onSuccess: (token: string) => void;
}

export function Login({ onSuccess }: LoginProps) {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    const handleGoogleSuccess = async (credentialResponse: any) => {
        try {
            const res = await fetch(`${API_BASE}/api/onam-2026/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: credentialResponse.credential })
            });
            const data = await res.json();
            if (data.token) {
                localStorage.setItem('onam_token', data.token);
                onSuccess(data.token);
            }
        } catch (error) {
            console.error("Login failed", error);
        }
    };

    return (
        <div className="onam-login-box">
            <h2>Sign in to Play</h2>
            <p>We use Google Sign-In to track your progress and prevent cheating.</p>
            <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => console.error('Login Failed')}
            />
        </div>
    );
}
