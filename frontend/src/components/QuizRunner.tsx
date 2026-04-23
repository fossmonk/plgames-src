export default function QuizRunner({ title }: { title: string }) {
  return (
    <div className="container">
      <h1>{title}</h1>
      <p>Welcome to the {title} Get ready to answer.</p>
      {/* Add your logic for questions and scoring here */}
      <button onClick={() => alert("Quiz started!")}>Start Quiz</button>
    </div>
  );
}