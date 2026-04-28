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

  const [questionToken, setQuestionToken] = useState<string | null>(null);
  const [finishToken, setFinishToken] = useState<string | null>(null);
  const [imageReady, setImageReady] = useState(false);
  const [currentImageBase64, setCurrentImageBase64] = useState<string | null>(null);

  // Start question
  useEffect(() => {
    if (!gameId || finished) return;
    fetch(`${API_BASE}/api/play/${gameId}/start_question/${currentIdx}`, { method: 'POST' })
      .then(res => res.json())
      .then(d => {
        if (d.token) setQuestionToken(d.token);
        if (d.image_data) setCurrentImageBase64(d.image_data);
      })
      .catch(err => console.error("Start question error:", err));
  }, [gameId, currentIdx, finished]);

  // Finish game
  useEffect(() => {
    if (finished && gameId) {
      setMeme(getGameOverMeme(score, data.questions.length * 10)); // max score is 10 per q
      fetch(`${API_BASE}/api/play/${gameId}/finish`, { method: 'POST' })
        .then(res => res.json())
        .then(d => {
          if (d.token) setFinishToken(d.token);
        })
        .catch(err => console.error("Finish error:", err));
    }
  }, [finished, gameId]);



  // Prefetching logic
  useEffect(() => {
    if (finished) return;

    // Prefetch NEXT question's initial frame
    if (currentIdx + 1 < data.questions.length && gameId) {
      const nextImg = new Image();
      nextImg.src = `${API_BASE}/api/public/game/${gameId}/image/${currentIdx + 1}`;
    }
  }, [finished, currentIdx, gameId, data.questions.length]);

  const handleNextQuestion = (pointsAchieved: number, actualGuess: string) => {
    const q = data.questions[currentIdx];
    setUserAnswers([...userAnswers, { ...q, scoreAchieved: pointsAchieved, userGuess: actualGuess }]);

    if (currentIdx + 1 < data.questions.length) {
      setCurrentIdx(currentIdx + 1);
      setHintsUsed(0);
      setUserGuess("");
      setImageReady(false);
      setCurrentImageBase64(null);
    } else {
      setFinished(true);
    }
  };

  const handleSkip = () => {
    handleNextQuestion(0, "");
  };

  const handleShowHint = () => {
    if (hintsUsed >= 2 || !questionToken) return;
    fetch(`${API_BASE}/api/play/${gameId}/use_hint?token=${questionToken}`, { method: 'POST' })
      .then(res => res.json())
      .then(d => {
        if (d.token) {
          setQuestionToken(d.token);
          setHintsUsed(h => h + 1);
        }
        if (d.image_data) {
          setCurrentImageBase64(d.image_data);
        }
      })
      .catch(err => console.error("Hint error:", err));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userGuess.trim()) return;

    const q = data.questions[currentIdx];
    // fuse.js configuration
    const fuse = new Fuse(q.valid_answers, {
      includeScore: true,
      threshold: 0.3, // 0.0 is exact match, 1.0 is anything goes
    });

    const result = fuse.search(userGuess.trim());

    if (result.length > 0 && result[0].score! < 0.4) {
      // correct guess!
      const points = 10 - (hintsUsed * 2);
      setScore((s) => s + points);
      handleNextQuestion(points, userGuess.trim());
    } else {
      // wrong guess - now we allow it and move on
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
                  <img src={q.image_urls ? q.image_urls[0] : (finishToken ? `${API_BASE}/api/image?token=${finishToken}&idx=${idx}&blur=4` : '')} alt="Movie Scene" style={{ width: '100%', borderRadius: '8px', marginBottom: '10px' }} />
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

  const blurLevels = [15, 8, 4];
  const blurLevel = blurLevels[hintsUsed] !== undefined ? blurLevels[hintsUsed] : 4;
  const possiblePoints = 10 - (hintsUsed * 2);

  let currentImage = "";
  if (currentQ.image_urls) {
    currentImage = currentQ.image_urls[0];
  } else if (currentImageBase64) {
    currentImage = `data:image/jpeg;base64,${currentImageBase64}`;
  } else {
    // Initial public fallback before token/bundled data arrives
    currentImage = `${API_BASE}/api/public/game/${gameId}/image/${currentIdx}`;
  }

  return (
    <div className="container">
      <h1 className="brand-name" style={{ marginBottom: '20px' }}>{title}</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div className="progress-indicator" style={{ fontWeight: 'bold' }}>
          Movie {currentIdx + 1} of {data.questions.length}
        </div>
        <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
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
            fontWeight: 'bold'
          }}>
            Score if correct: {possiblePoints}
          </div>
        </div>

        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
          {hintsUsed < 2 && (
            <button onClick={handleShowHint} style={{ backgroundColor: '#ff008a' }}>
              SHOW HINT (-2 pts)
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
              color: 'black'
            }}
          />
          <button type="submit" disabled={!userGuess.trim()}>Submit Guess</button>
          <button type="button" onClick={handleSkip} style={{ backgroundColor: '#ff008a', marginTop: '5px' }}>Skip Movie</button>
        </form>
      </div>
    </div>
  );
}
