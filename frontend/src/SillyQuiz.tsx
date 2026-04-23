import { useState } from 'react';

export function SillyQuizComponent({ data, title }: { data: any; title: string }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const handleAnswer = (idx: number) => {
    if (idx === data.questions[currentIdx].correct_idx) setScore(score + 1);
    if (currentIdx + 1 < data.questions.length) setCurrentIdx(currentIdx + 1);
    else setFinished(true);
  };

  if (finished) return <div className="container"><h1>Game Over!</h1><p>Score: {score} / {data.questions.length}</p></div>;

  const q = data.questions[currentIdx];
  return (
    <div className="container">
      <h1 className="brand-name">{title}</h1>
      <div className="game-card">
        <h3>{q.text}</h3>
        {q.options.map((opt: string, i: number) => (
          <button key={i} onClick={() => handleAnswer(i)}>{opt}</button>
        ))}
      </div>
    </div>
  );
}