import { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import Fuse from 'fuse.js';

import { getGameOverMeme } from '../utils/memeUtils';

const API_BASE = import.meta.env.VITE_API_URL;

export function GuessMovie({ data, title, gameId }: { data: any; title: string; gameId?: number }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const [timeLeft, setTimeLeft] = useState(50);
  const [userGuess, setUserGuess] = useState("");
  const [wrongShake, setWrongShake] = useState(false);

  const [userAnswers, setUserAnswers] = useState<any[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [meme, setMeme] = useState<string>("");
  const sheetRef = useRef<HTMLDivElement>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);

  // Start session
  useEffect(() => {
    if (!gameId) return;
    fetch(`${API_BASE}/api/play/${gameId}/start_session`, { method: 'POST' })
      .then(res => res.json())
      .then(d => {
        if (d.session_id) setSessionId(d.session_id);
      })
      .catch(err => console.error("Session start error:", err));
  }, [gameId]);

  // Start question
  useEffect(() => {
    if (!sessionId || finished) return;
    fetch(`${API_BASE}/api/session/${sessionId}/start_question/${currentIdx}`, { method: 'POST' })
      .catch(err => console.error("Start question error:", err));
  }, [sessionId, currentIdx, finished]);

  useEffect(() => {
    if (finished) {
      setMeme(getGameOverMeme(score, data.questions.length * 10)); // max score is 10 per q
      if (sessionId) {
        fetch(`${API_BASE}/api/session/${sessionId}/finish`, { method: 'POST' });
      }
    }
  }, [finished, sessionId]);

  // Timer logic
  useEffect(() => {
    if (finished || timeLeft <= 0) return;
    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [finished, timeLeft]);

  // Expiration logic
  useEffect(() => {
    if (timeLeft <= 0 && !finished) {
      handleNextQuestion(0);
    }
  }, [timeLeft, finished]);

  const getBlurLevel = (time: number) => {
    if (time > 40) return 20;
    if (time > 30) return 15;
    if (time > 20) return 10;
    if (time > 10) return 5;
    return 0;
  };

  const getPossibleScore = (time: number) => {
    if (time > 40) return 10;
    if (time > 30) return 8;
    if (time > 20) return 6;
    if (time > 10) return 4;
    return 2;
  };

  const handleNextQuestion = (pointsAchieved: number) => {
    const q = data.questions[currentIdx];
    setUserAnswers([...userAnswers, { ...q, scoreAchieved: pointsAchieved }]);

    if (currentIdx + 1 < data.questions.length) {
      setCurrentIdx(currentIdx + 1);
      setTimeLeft(50);
      setUserGuess("");
    } else {
      setFinished(true);
    }
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
      const points = getPossibleScore(timeLeft);
      setScore((s) => s + points);
      handleNextQuestion(points);
    } else {
      // wrong guess
      setWrongShake(true);
      setTimeout(() => setWrongShake(false), 400);
      setUserGuess("");
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
                <div key={idx} className="game-card" style={{ marginBottom: '15px' }}>
                  <h3>{q.valid_answers[0]}</h3>
                  <img src={q.image_urls ? q.image_urls[4] : (sessionId ? `${API_BASE}/api/session/${sessionId}/image/${idx}?blur=0` : '')} alt="Movie Scene" style={{ width: '100%', borderRadius: '8px', marginTop: '10px' }} />
                  <p style={{ marginTop: '10px' }}>
                    <strong>Score achieved:</strong> {q.scoreAchieved} / 10
                  </p>
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

  const getUrlIndex = (time: number) => {
    if (time > 40) return 0; // blur20
    if (time > 30) return 1; // blur15
    if (time > 20) return 2; // blur10
    if (time > 10) return 3; // blur5
    return 4; // clear
  };

  const urlIndex = getUrlIndex(timeLeft);
  const possiblePoints = getPossibleScore(timeLeft);
  const blurLevel = getBlurLevel(timeLeft);

  let currentImage = "";
  if (currentQ.image_urls) {
    currentImage = currentQ.image_urls[urlIndex];
  } else if (sessionId) {
    currentImage = `${API_BASE}/api/session/${sessionId}/image/${currentIdx}?blur=${blurLevel}`;
  }

  return (
    <div className="container">
      <h1 className="brand-name" style={{ marginBottom: '20px' }}>{title}</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div className="progress-indicator" style={{ fontWeight: 'bold' }}>
          Movie {currentIdx + 1} of {data.questions.length}
        </div>
        <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: timeLeft <= 10 ? 'red' : 'inherit' }}>
          ⏱️ {timeLeft}s
        </div>
      </div>

      <div className={`game-card ${wrongShake ? 'shake' : ''}`} style={{ textAlign: 'center' }}>
        <div style={{ position: 'relative', width: '100%', overflow: 'hidden', borderRadius: '12px', marginBottom: '20px' }}>
          <img
            src={currentImage}
            alt="Movie Scene"
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
            Points: {possiblePoints}
          </div>
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
        </form>
      </div>
    </div>
  );
}
