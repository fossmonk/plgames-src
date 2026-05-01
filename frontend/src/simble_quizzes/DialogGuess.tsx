import { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import Fuse from 'fuse.js';
import { getGameOverMeme } from '../utils/memeUtils';

const API_BASE = import.meta.env.VITE_API_URL;

export function DialogGuess({ data, title, gameId }: { data: any; title: string; gameId?: number }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [userGuess, setUserGuess] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [userAnswers, setUserAnswers] = useState<any[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [meme, setMeme] = useState<string>("");
  const sheetRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Finish game logging
  useEffect(() => {
    if (finished && gameId) {
      setMeme(getGameOverMeme(score, data.questions.length * 10));
      fetch(`${API_BASE}/api/play/${gameId}/finish`, { method: 'POST' })
        .catch(err => console.error("Finish error:", err));
    }
  }, [finished, gameId, data.questions.length, score]);

  const handleNextQuestion = (pointsAchieved: number, actualGuess: string) => {
    const q = data.questions[currentIdx];
    setUserAnswers([...userAnswers, { ...q, scoreAchieved: pointsAchieved, userGuess: actualGuess }]);

    if (currentIdx + 1 < data.questions.length) {
      setCurrentIdx(currentIdx + 1);
      setUserGuess("");
      setIsPlaying(false);
    } else {
      setFinished(true);
    }
  };

  const handleSkip = () => {
    handleNextQuestion(0, "");
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userGuess.trim()) return;

    const q = data.questions[currentIdx];
    const fuse = new Fuse(q.valid_answers, {
      includeScore: true,
      threshold: 0.3,
    });

    const result = fuse.search(userGuess.trim());

    if (result.length > 0 && result[0].score! < 0.4) {
      const points = 10;
      setScore((s) => s + points);
      handleNextQuestion(points, userGuess.trim());
    } else {
      handleNextQuestion(0, userGuess.trim());
    }
  };

  const handleShareImage = async () => {
    const element = sheetRef.current;
    if (!element) return;
    element.classList.add('is-capturing');
    const canvas = await html2canvas(element, { backgroundColor: '#ffffff', scale: 2 });
    element.classList.remove('is-capturing');

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], 'dialog-result.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My Score', text: 'PinkLungi Games!' });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'dialog-result.png';
        link.click();
      }
    });
  };

  if (finished) {
    const maxScore = data.questions.length * 10;
    const isPerfect = score === maxScore;
    return (
      <div className="container">
        <div className="game-over-sheet" ref={sheetRef}>
          <img src={`/memes/${meme}`} alt="Result Meme" className="game-over-meme" />
          {isPerfect && <div className="party-popper-animation">🥳</div>}
          <h3>Your Final Score:</h3>
          <div className="score-text">{score} / {maxScore}</div>

          {showReview ? (
            <div className="results-review" style={{ textAlign: 'left' }}>
              {userAnswers.map((q, idx) => (
                <div key={idx} className="game-card" style={{ marginBottom: '15px', borderLeft: `5px solid ${q.scoreAchieved > 0 ? '#4caf50' : '#f44336'}` }}>
                  <div style={{ padding: '10px' }}>
                    <h3 style={{ margin: '5px 0' }}>Question {idx + 1}</h3>
                    <h4 style={{ margin: '5px 0' }}>Correct Answer: {q.valid_answers[0]}</h4>
                    <h4 style={{ margin: '5px 0', color: q.scoreAchieved > 0 ? '#4caf50' : '#f44336' }}>
                      Your Guess: {q.userGuess || 'SKIPPED'}
                    </h4>
                  </div>
                </div>
              ))}
              <button onClick={() => setShowReview(false)}>HIDE SOLUTIONS</button>
            </div>
          ) : (
            <>
              <div className="capture-branding">
                <img src={`/logo.png`} alt="Logo" style={{ width: '50px', height: '50px' }} />
                <h2 className="brand-result">PINKLUNGI GAMES</h2>
                <h5 className="capture-link">pinklungigames.com</h5>
              </div>
              <div className="no-capture" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button onClick={() => setShowReview(true)}>VIEW SOLUTIONS</button>
                <button onClick={handleShareImage}>SHARE RESULT</button>
                <button onClick={() => window.location.reload()}>PLAY AGAIN</button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  const currentQ = data.questions[currentIdx];

  return (
    <div className="container">
      <h1 className="brand-name" style={{ marginBottom: '20px' }}>{title}</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div className="progress-indicator" style={{ fontWeight: 'bold' }}>
          Dialog {currentIdx + 1} of {data.questions.length}
        </div>
        <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
          Score: {score}
        </div>
      </div>

      <div className="game-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <audio
          ref={audioRef}
          src={`data:audio/mpeg;base64,${currentQ.audio_base64}`}
          onEnded={() => setIsPlaying(false)}
          autoPlay={false}
        />

        {/* Spiced up Play Button */}
        <div style={{ marginBottom: '40px', position: 'relative', display: 'inline-block' }}>
          <button
            onClick={togglePlay}
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '60px',
              background: isPlaying ? 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)' : 'linear-gradient(135deg, #ff008a 0%, #c2185b 100%)',
              border: 'none',
              boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              transform: isPlaying ? 'scale(1.1)' : 'scale(1)',
              padding: 0
            }}
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24" width="50" height="50" fill="white">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="50" height="50" fill="white">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Sound Waves Animation when playing */}
          {isPlaying && (
            <div className="audio-visualizer" style={{
              position: 'absolute',
              bottom: '-30px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '4px',
              alignItems: 'flex-end',
              height: '20px'
            }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="sound-bar" style={{
                  width: '4px',
                  backgroundColor: '#ff008a',
                  borderRadius: '2px',
                  animation: `soundWave 0.5s ease-in-out infinite alternate ${i * 0.1}s`
                }} />
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '400px', margin: '0 auto' }}>
          <input
            type="text"
            value={userGuess}
            onChange={(e) => setUserGuess(e.target.value)}
            placeholder="Guess the movie..."
            style={{
              padding: '15px',
              fontSize: '1.2rem',
              borderRadius: '12px',
              border: '3px solid #eee',
              width: '100%',
              caretColor: 'black',
              color: 'black',
              textAlign: 'center'
            }}
          />
          <button type="submit" disabled={!userGuess.trim()} style={{ padding: '15px', fontSize: '1.1rem' }}>SUBMIT GUESS</button>
          <button type="button" onClick={handleSkip} style={{ backgroundColor: '#ccc', color: '#333', fontSize: '0.9rem' }}>SKIP DIALOG</button>
        </form>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes soundWave {
          from { height: 4px; }
          to { height: 20px; }
        }
      `}} />
    </div>
  );
}
