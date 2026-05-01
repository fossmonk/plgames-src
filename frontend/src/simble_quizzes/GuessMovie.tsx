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
            <div className="text-left">
              {userAnswers.map((q, idx) => (
                <div key={idx} className="game-card review-item" style={{ borderLeftColor: q.scoreAchieved > 0 ? '#4caf50' : '#f44336' }}>
                  <img src={`data:image/jpeg;base64,${q.images_base64["4"]}`} alt="Movie Scene" className="review-img" />
                  <div className="solution-box">
                    <h3>Correct Answer: {q.valid_answers[0]}</h3>
                    <h3 style={{ color: q.scoreAchieved > 0 ? '#4caf50' : '#f44336' }}>
                      Your Guess: {q.userGuess || 'SKIPPED'}
                    </h3>
                    <p className="bold mb-0">
                      Score: {q.scoreAchieved} / 10
                    </p>
                  </div>
                </div>
              ))}
              <button onClick={() => setShowReview(false)}>HIDE SOLUTIONS</button>
            </div>
          ) : (
            <>
              <div className="capture-branding flex-col flex-center">
                <img src={`/logo.png`} alt="Logo" className="brand-logo-ui" />
                <h2 className="brand-result">PINKLUNGI GAMES</h2>
                <h5 className="capture-link">pinklungigames.com</h5>
              </div>
              <div className="no-capture flex-col gap-10">
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
      <h1 className="brand-name mb-20">{title}</h1>

      <div className="flex-between mb-20">
        <div className="progress-indicator bold" style={{ fontSize: '1.2rem', fontFamily: 'Space Grotesk, sans-serif' }}>
          Movie {currentIdx + 1} of {data.questions.length}
        </div>
        <div className="bold" style={{ fontSize: '1.2rem', fontFamily: 'Space Grotesk, sans-serif' }}>
          Unblurs Used: {hintsUsed} / 2
        </div>
      </div>

      <div className={`game-card text-center ${wrongShake ? 'shake' : ''}`}>
        <div className="media-container">
          <img
            src={currentImage}
            alt="Movie Scene"
            onLoad={() => setImageReady(true)}
            className="w-full"
            style={{ display: 'block' }}
          />
          <div className="score-badge">
            Score if correct: {possiblePoints}
          </div>
        </div>

        <div className="flex-center gap-10 mb-20">
          {hintsUsed < 2 && (
            <button onClick={handleShowHint} style={{ backgroundColor: '#ff008a' }}>
              UNBLUR (-2 pts)
            </button>
          )}
        </div>

        {currentQ.hint && (
          <p className="italic mb-10">Hint: {currentQ.hint}</p>
        )}

        <form onSubmit={handleSubmit} className="flex-col gap-10">
          <input
            type="text"
            value={userGuess}
            onChange={(e) => setUserGuess(e.target.value)}
            placeholder="Type movie name..."
            className="w-full"
            style={{
              padding: '12px',
              fontSize: '1.1rem',
              borderRadius: '8px',
              border: '2px solid #ccc',
              caretColor: 'black',
              color: 'black',
              backgroundColor: 'white'
            }}
          />
          <button type="submit" disabled={!userGuess.trim()}>Submit Guess</button>
          <button type="button" onClick={handleSkip} className="mt-10" style={{ backgroundColor: '#ff008a' }}>Skip Movie</button>
        </form>
      </div>
    </div>
  );
}
