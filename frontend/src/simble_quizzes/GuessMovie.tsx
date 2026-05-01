import { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import Fuse from 'fuse.js';

import { getGameOverMeme } from '../utils/memeUtils';

const API_BASE = import.meta.env.VITE_API_URL;

export function GuessMovie({ data, title, gameId }: { data: any; title: string; gameId?: number }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const [userGuess, setUserGuess] = useState("");
  const [wrongShake, setWrongShake] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);

  const [userAnswers, setUserAnswers] = useState<any[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [meme, setMeme] = useState<string>("");
  const sheetRef = useRef<HTMLDivElement>(null);

  const [imageReady, setImageReady] = useState(false);

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
      setHintsUsed(0);
      setUserGuess("");
      setImageReady(false);
    } else {
      setFinished(true);
    }
  };

  const handleSkip = () => {
    handleNextQuestion(0, "");
  };

  const handleShowHint = () => {
    if (hintsUsed < 2) {
      setHintsUsed(h => h + 1);
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
      const points = 10 - (hintsUsed * 2);
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
      const file = new File([blob], 'movie-result.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My Score', text: 'PinkLungi Games!' });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'movie-result.png';
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
                  <img src={`data:image/jpeg;base64,${q.images_base64["4"]}`} alt="Movie Scene" style={{ width: '100%', borderRadius: '8px', marginBottom: '10px' }} />
                  <div style={{ padding: '0 10px' }}>
                    <h3 style={{ margin: '5px 0' }}>Correct Answer: {q.valid_answers[0]}</h3>
                    <h3 style={{ margin: '5px 0', color: q.scoreAchieved > 0 ? '#4caf50' : '#f44336' }}>
                      Your Guess: {q.userGuess || 'SKIPPED'}
                    </h3>
                    <p style={{ margin: '5px 0', fontWeight: 'bold' }}>
                      Score: {q.scoreAchieved} / 10
                    </p>
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
  const possiblePoints = 10 - (hintsUsed * 2);

  let currentImage = "";
  if (currentQ.images_base64) {
    const blurMap: any = { 0: "15", 1: "8", 2: "4" };
    const blurKey = blurMap[hintsUsed] || "4";
    currentImage = `data:image/jpeg;base64,${currentQ.images_base64[blurKey]}`;
  }

  return (
    <div className="container">
      <h1 className="brand-name" style={{ marginBottom: '20px' }}>{title}</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div className="progress-indicator" style={{ fontWeight: 'bold', fontFamily: 'Space Grotesk, sans-serif' }}>
          Movie {currentIdx + 1} of {data.questions.length}
        </div>
        <div style={{ fontWeight: 'bold', fontSize: '1.2rem', fontFamily: 'Space Grotesk, sans-serif' }}>
          Hints Used: {hintsUsed} / 2
        </div>
      </div>

      <div className={`game-card ${wrongShake ? 'shake' : ''}`} style={{ textAlign: 'center' }}>
        <div style={{ position: 'relative', width: '100%', overflow: 'hidden', borderRadius: '12px', marginBottom: '20px' }}>
          <img
            src={currentImage}
            alt="Movie Scene"
            onLoad={() => setImageReady(true)}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block'
            }}
          />
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '20px',
            fontWeight: 'bold',
            fontFamily: 'Space Grotesk, sans-serif'
          }}>
            Score if correct: {possiblePoints}
          </div>
        </div>

        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
          {hintsUsed < 2 && (
            <button onClick={handleShowHint} style={{ backgroundColor: '#ff008a' }}>
              UNBLUR (-2 pts)
            </button>
          )}
        </div>

        {currentQ.hint && (
          <p style={{ fontStyle: 'italic', marginBottom: '15px' }}>Hint: {currentQ.hint}</p>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            type="text"
            value={userGuess}
            onChange={(e) => setUserGuess(e.target.value)}
            placeholder="Type movie name..."
            style={{
              padding: '12px',
              fontSize: '1.1rem',
              borderRadius: '8px',
              border: '2px solid #ccc',
              width: '100%',
              caretColor: 'black',
              color: 'black',
              backgroundColor: 'white'
            }}
          />
          <button type="submit" disabled={!userGuess.trim()}>Submit Guess</button>
          <button type="button" onClick={handleSkip} style={{ backgroundColor: '#ff008a', marginTop: '5px' }}>Skip Movie</button>
        </form>
      </div>
    </div>
  );
}
